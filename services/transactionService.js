import Transaction from "../models/Transaction.js";

export const buildFilter = (userId, { type, category, startDate, endDate } = {}) => {
  const filter = { user: userId };
  if (type) filter.type = String(type);
  if (category) filter.category = String(category);

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }
  return filter;
};

export const getSummary = async (userId, query) => {
  const [result] = await Transaction.aggregate([
    { $match: buildFilter(userId, query) },
    {
      $facet: {
        totals: [{ $group: { _id: "$type", total: { $sum: "$amount" } } }],
        byCategory: [
          { $match: { type: "expense" } },
          { $group: { _id: "$category", total: { $sum: "$amount" } } },
          { $sort: { total: -1 } },
        ],
        byMonth: [
          {
            $group: {
              _id: {
                month: { $dateToString: { format: "%Y-%m", date: "$date" } },
                type: "$type",
              },
              total: { $sum: "$amount" },
            },
          },
          { $sort: { "_id.month": 1 } },
        ],
      },
    },
  ]);

  const income = result.totals.find((t) => t._id === "income")?.total || 0;
  const expense = result.totals.find((t) => t._id === "expense")?.total || 0;

  const monthMap = {};
  result.byMonth.forEach(({ _id, total }) => {
    monthMap[_id.month] ??= { month: _id.month, income: 0, expense: 0 };
    monthMap[_id.month][_id.type] = total;
  });

  return {
    income,
    expense,
    balance: income - expense,
    byCategory: result.byCategory.map((c) => ({ category: c._id, total: c.total })),
    monthly: Object.values(monthMap),
  };
};

// Spreadsheet apps run text starting with = + - @ as formulas, so neutralise those.
const csvCell = (value) => {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const buildCsv = (transactions) => {
  const rows = [["Date", "Type", "Category", "Amount", "Notes"].map(csvCell).join(",")];
  transactions.forEach((t) =>
    rows.push(
      [t.date.toISOString().slice(0, 10), t.type, t.category, t.amount, t.notes]
        .map(csvCell)
        .join(",")
    )
  );
  return rows.join("\n");
};
