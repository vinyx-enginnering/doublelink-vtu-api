import express from "express";
import { get_smile_bundle, verify_smile_number, smile_data } from "../controller/Smile.js";
const router = express.Router();
import { authenticate } from "../middleware/authenticate.js";

router.route("/smile_plans").get(authenticate, get_smile_bundle);
router.route("/smile_verify").post(authenticate, verify_smile_number)
router.route("/purchase_smile").post(authenticate, smile_data);

export default router;