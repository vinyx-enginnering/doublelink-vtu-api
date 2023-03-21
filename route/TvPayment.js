import express from "express";
import { get_tv_plans, verify_tv_details, purchase_tv_plan, purchase_showmax_plan } from "../controller/TvPayment.js";

const router = express.Router();
import { authenticate } from "../middleware/authenticate.js";

router.route("/tv_plans/:biller").get(authenticate, get_tv_plans);
router.route("/tv_verify").post(authenticate, verify_tv_details);
router.route("/tv_purchase").post(authenticate, purchase_tv_plan);
router.route("/showmax_purchase").post(authenticate, purchase_showmax_plan);

export default router;