import express from "express";
import { get_uinsure_motor_plans, purchase_uisure_plan } from "../../controller/Insurance/ThirdPartyMotor.js";
import { authenticate } from "../../middleware/authenticate.js";
const router = express.Router();


router.route("/plans").get(get_uinsure_motor_plans);
router.route("/purchase").post(authenticate, purchase_uisure_plan);

export default router;