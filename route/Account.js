import express from "express";
const router = express.Router();
import { authenticate } from "../middleware/authenticate.js";
import { my_accounts, confirm_bank_transfer, settlement_payment } from "../controller/Account.js";


router.route("/list").get(authenticate, my_accounts);
router.route("/confirm").post(confirm_bank_transfer);
router.route("/settlement/payment").post(authenticate, settlement_payment);


export default router;