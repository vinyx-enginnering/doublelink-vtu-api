import express from "express";
import { get_showmax_plans, purchase_showmax_plan } from "../controller/Showmax.js";
import { authenticate } from "../middleware/authenticate.js"
const router = express.Router();


router.route("/showmax_plans").get(authenticate, get_showmax_plans)
router.route("/purchase_showmax").post(authenticate, purchase_showmax_plan);

export default router;