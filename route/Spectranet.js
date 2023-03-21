import express from "express";
import { get_spectranet_bundle, spectranet_data } from "../controller/Spectranet.js";
const router = express.Router();
import { authenticate } from "../middleware/authenticate.js";

router.route("/spectranet_plans").get(authenticate, get_spectranet_bundle)
router.route("purchase_spectranet").post(authenticate, spectranet_data);

export default router;