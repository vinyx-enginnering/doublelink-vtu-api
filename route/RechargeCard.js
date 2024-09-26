import express from "express";
import { buy_pin, buy_pins, create_pin, get_vouchers, upload_pins_from_excel } from "../controller/RechargeCard.js";
const router = express.Router();
import { authenticate } from "../middleware/authenticate.js";
import { get_rechargecards_stock } from "../controller/tracking/RechargeCard.js";
import { delete_pins } from "../utility/deleteData.js";

router.route("/purchase_bulk").post(authenticate, buy_pins);
router.route("/purchase_single").post(authenticate, buy_pin)
router.route("/create").post(authenticate, create_pin);
router.route("/upload_epins").post(authenticate, upload_pins_from_excel);
router.route("/list").get(authenticate, get_vouchers)
router.get("/stock", get_rechargecards_stock);
router.delete("/delete", delete_pins);


export default router;