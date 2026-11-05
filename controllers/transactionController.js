import { query } from "../config/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import { buildFilterClause, getSummary, buildCsv } from "../services/transactionService.js";

const formatTransaction = (t) => ({
  _id: t.id,
  id: t.id,
  user: t.user_id,
  type: t.type,
  category: t.category,
  amount: parseFloat(t.amount),
  notes: t.notes || "",
  date: t.date,
  createdAt: t.created_at,
  updatedAt: t.updated_at,
});

export const createTransaction = asyncHandler(async (req, res) => {
  const { type, category, amount, notes, date } = req.body ?? {};

  const txDate = date ? new Date(date) : new Date();
  const { rows } = await query(
    `INSERT INTO public.transactions (user_id, type, category, amount, notes, date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [req.user._id, type, category, parseFloat(amount), notes || "", txDate]
  );

  res.status(201).json(formatTransaction(rows[0]));
});

export const getTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = (page - 1) * limit;

  const { whereClause, params, nextParamIdx } = buildFilterClause(req.user._id, req.query);

  const countRes = await query(
    `SELECT COUNT(*) as count FROM public.transactions ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const dataParams = [...params, limit, offset];
  const dataRes = await query(
    `SELECT * FROM public.transactions 
     ${whereClause} 
     ORDER BY date DESC, created_at DESC 
     LIMIT $${nextParamIdx} OFFSET $${nextParamIdx + 1}`,
    dataParams
  );

  const transactions = dataRes.rows.map(formatTransaction);

  res.json({
    transactions,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
    total,
  });
});

export const getTransactionSummary = asyncHandler(async (req, res) => {
  res.json(await getSummary(req.user._id, req.query));
});

export const exportTransactions = asyncHandler(async (req, res) => {
  const { whereClause, params } = buildFilterClause(req.user._id, req.query);
  const { rows } = await query(
    `SELECT * FROM public.transactions ${whereClause} ORDER BY date DESC`,
    params
  );

  const transactions = rows.map(formatTransaction);
  res.attachment("transactions.csv");
  res.type("text/csv").send(buildCsv(transactions));
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `DELETE FROM public.transactions WHERE id = $1 AND user_id = $2 RETURNING id`,
    [req.params.id, req.user._id]
  );

  if (rows.length === 0) {
    res.status(404);
    throw new Error("Transaction not found");
  }

  res.json({ message: "Transaction deleted", id: req.params.id });
});
