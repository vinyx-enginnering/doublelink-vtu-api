import express from "express";
import { get_uinsure_motor_plans } from "../../controller/Insurance/ThirdPartyMotor.js";
import { authenticate } from "../../middleware/authenticate.js";
const router = express.Router();


router.route("/plans").get(get_uinsure_motor_plans);

export default router;