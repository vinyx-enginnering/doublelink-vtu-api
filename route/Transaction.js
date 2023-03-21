import express from "express";
import { current_week_transactions, get_transaction_by_query, my_transactions, transaction_chart } from "../controller/Transaction.js";
import { authenticate } from "../middleware/authenticate.js";
const router = express.Router();


router.route("/list").get(authenticate, my_transactions);
router.route("/charts/month").get(transaction_chart);
router.route("/charts/week").get(current_week_transactions);
router.route("/:searchStr").get(authenticate, get_transaction_by_query)

export default router;