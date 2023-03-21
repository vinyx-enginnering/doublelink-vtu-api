import express from "express";
import { validate_user_details, user_wallet, user_settlement_account } from "../controller/Wallet.js";
const router = express.Router();
import { authenticate } from "../middleware/authenticate.js";

router.route("/").get(authenticate, user_wallet);
router.route("/verify_bank/:accountNumber/:bankCode").get(authenticate, validate_user_details);
router.route("/settlement").get(authenticate, user_settlement_account);

export default router;