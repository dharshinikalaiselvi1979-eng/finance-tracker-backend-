import express from "express";
import {
  createTransaction,
  getTransactions,
  getTransactionSummary,
  exportTransactions,
  deleteTransaction,
} from "../controllers/transactionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.route("/").get(getTransactions).post(createTransaction);
router.get("/summary", getTransactionSummary);
router.get("/export", exportTransactions);
router.delete("/:id", deleteTransaction);

export default router;
