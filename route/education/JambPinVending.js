import express from "express";
import { get_jamb_vending_plans, purchase_jamb_pin, verify_jamb_profile } from "../../controller/education/JambPinVending.js";
import { authenticate } from "../../middleware/authenticate.js";
const router = express.Router();


router.route("/plans").get(get_jamb_vending_plans);
router.route("/verify").post(verify_jamb_profile);
router.route("/purchase").post(authenticate, purchase_jamb_pin);

export default router;