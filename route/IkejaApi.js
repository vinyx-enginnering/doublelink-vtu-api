import express from "express";
import { purchase_ikeja, verify_meter } from "../controller/IkejaApi.js";
import { authenticate } from "../middleware/authenticate.js";
const router = express.Router();

router.route("/verify-meter").post(verify_meter);
router.route("/purchase").post(authenticate, purchase_ikeja);


export default router;