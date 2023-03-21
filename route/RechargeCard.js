import express from "express";
import { buy_pin, buy_pins, create_pin } from "../controller/RechargeCard.js";
const router = express.Router();
import { authenticate } from "../middleware/authenticate.js";


router.route("/purchase_bulk").post(authenticate, buy_pins);
router.route("/purchase_single").post(authenticate, buy_pin)
router.route("/create").post(authenticate, create_pin);


export default router;