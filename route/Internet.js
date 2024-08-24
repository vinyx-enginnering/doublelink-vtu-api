import express from "express";
import { buy_data_instant, data_bundle, fetch_data_plans, get_data_bundles, topup_data } from "../controller/Internet.js";
const router = express.Router();
import { authenticate } from "../middleware/authenticate.js";

router.route("/data_plans/:serviceId").get( get_data_bundles);
router.route("/purchase_data").post(authenticate, data_bundle);
router.route('/purchase_instant_data').post(buy_data_instant);
router.route('/sme_data_plans/:network').get(fetch_data_plans);
router.route('/sme_data').post(authenticate, topup_data);

export default router;