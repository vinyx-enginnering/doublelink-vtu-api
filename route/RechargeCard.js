import express from "express";
import { buy_pin, buy_pins, create_pin, get_vouchers } from "../controller/RechargeCard.js";
const router = express.Router();
import { authenticate } from "../middleware/authenticate.js";
import { get_rechargecards_stock } from "../controller/tracking/RechargeCard.js";

router.route("/purchase_bulk").post(authenticate, buy_pins);
router.route("/purchase_single").post(authenticate, buy_pin)
router.route("/create").post(authenticate, create_pin);
router.route("/list").get(authenticate, get_vouchers)
router.get("/stock", get_rechargecards_stock);


export default router;