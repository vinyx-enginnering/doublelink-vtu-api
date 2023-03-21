import express from "express";
import { get_registration_plans, purchase_waec } from "../../controller/education/WaecApi.js";
import { authenticate } from "../../middleware/authenticate.js";
const router = express.Router();


router.route("/plans").get(get_registration_plans);
router.route("/purchase").post(authenticate, purchase_waec);

export default router;