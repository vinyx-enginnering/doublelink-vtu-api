import express from "express";
import { set_transaction_pin, update_transaction_pin, validate_pin } from "../controller/TransactionPin.js";
import { authenticate } from "../middleware/authenticate.js";
const router = express.Router();

router.route("/set").post(authenticate, set_transaction_pin);
router.route("/update").post(authenticate, update_transaction_pin);
router.route("/validate").post(authenticate, validate_pin);


export default router;