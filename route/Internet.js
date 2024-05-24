import express from "express";
import { buy_data_instant, data_bundle, get_data_bundles } from "../controller/Internet.js";
const router = express.Router();
import { authenticate } from "../middleware/authenticate.js";

router.route("/data_plans/:serviceId").get( get_data_bundles);
router.route("/purchase_data").post(authenticate, data_bundle);
router.route('/purchase_instant_data').post(buy_data_instant);

export default router;