import Transaction from "../models/Transaction.js";
import asyncHandler from "../utils/asyncHandler.js";
import { buildFilter, getSummary, buildCsv } from "../services/transactionService.js";

export const createTransaction = asyncHandler(async (req, res) => {
  const { type, category, amount, notes, date } = req.body ?? {};
  const transaction = await Transaction.create({
    user: req.user._id,
    type,
    category,
    amount,
    notes,
    date,
  });
  res.status(201).json(transaction);
});

export const getTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const filter = buildFilter(req.user._id, req.query);

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  res.json({ transactions, page, pages: Math.max(Math.ceil(total / limit), 1), total });
});

export const getTransactionSummary = asyncHandler(async (req, res) => {
  res.json(await getSummary(req.user._id, req.query));
});

export const exportTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find(buildFilter(req.user._id, req.query)).sort({
    date: -1,
  });
  res.attachment("transactions.csv");
  res.type("text/csv").send(buildCsv(transactions));
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found");
  }
  res.json({ message: "Transaction deleted", id: req.params.id });
});
