import express from "express";
import { get_result_checker_plans, purchase_result_checker } from "../../controller/education/WaecResultApi.js";
import { authenticate } from "../../middleware/authenticate.js";
const router = express.Router();


router.route("/plans").get(get_result_checker_plans);
router.route("/purchase").post(authenticate, purchase_result_checker);

export default router;