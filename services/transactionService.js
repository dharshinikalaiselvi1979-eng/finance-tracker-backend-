import { query } from "../config/db.js";

export const buildFilterClause = (userId, { type, category, startDate, endDate } = {}) => {
  const conditions = ["user_id = $1"];
  const params = [userId];
  let paramIdx = 2;

  if (type) {
    conditions.push(`type = $${paramIdx++}`);
    params.push(String(type));
  }

  if (category) {
    conditions.push(`category = $${paramIdx++}`);
    params.push(String(category));
  }

  if (startDate) {
    conditions.push(`date >= $${paramIdx++}`);
    params.push(new Date(startDate));
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    conditions.push(`date <= $${paramIdx++}`);
    params.push(end);
  }

  return {
    whereClause: `WHERE ${conditions.join(" AND ")}`,
    params,
    nextParamIdx: paramIdx,
  };
};

export const getSummary = async (userId, queryParams) => {
  const { whereClause, params } = buildFilterClause(userId, queryParams);

  // 1. Totals by type (income vs expense)
  const totalsRes = await query(
    `SELECT type, COALESCE(SUM(amount), 0) as total 
     FROM public.transactions 
     ${whereClause} 
     GROUP BY type`,
    params
  );

  let income = 0;
  let expense = 0;
  totalsRes.rows.forEach((row) => {
    if (row.type === "income") income = parseFloat(row.total);
    if (row.type === "expense") expense = parseFloat(row.total);
  });

  // 2. Breakdown by category for expenses
  const categoryClause = whereClause
    ? `${whereClause} AND type = 'expense'`
    : "WHERE type = 'expense'";
  const categoryRes = await query(
    `SELECT category, COALESCE(SUM(amount), 0) as total 
     FROM public.transactions 
     ${categoryClause} 
     GROUP BY category 
     ORDER BY total DESC`,
    params
  );

  const byCategory = categoryRes.rows.map((r) => ({
    category: r.category,
    total: parseFloat(r.total),
  }));

  // 3. Monthly cashflow
  const monthlyRes = await query(
    `SELECT TO_CHAR(date, 'YYYY-MM') as month, type, COALESCE(SUM(amount), 0) as total 
     FROM public.transactions 
     ${whereClause} 
     GROUP BY TO_CHAR(date, 'YYYY-MM'), type 
     ORDER BY month ASC`,
    params
  );

  const monthMap = {};
  monthlyRes.rows.forEach(({ month, type, total }) => {
    monthMap[month] ??= { month, income: 0, expense: 0 };
    monthMap[month][type] = parseFloat(total);
  });

  return {
    income,
    expense,
    balance: income - expense,
    byCategory,
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
  transactions.forEach((t) => {
    const dateStr = t.date instanceof Date ? t.date.toISOString().slice(0, 10) : String(t.date).slice(0, 10);
    rows.push(
      [dateStr, t.type, t.category, t.amount, t.notes].map(csvCell).join(",")
    );
  });
  return rows.join("\n");
};
