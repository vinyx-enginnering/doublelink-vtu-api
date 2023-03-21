import express from "express";
import { data_bundle, get_data_bundles } from "../controller/Internet.js";
const router = express.Router();
import { authenticate } from "../middleware/authenticate.js";

router.route("/data_plans/:serviceId").get(authenticate, get_data_bundles);
router.route("/purchase_data").post(authenticate, data_bundle);

export default router;