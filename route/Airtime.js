import express from "express";
import { airtime_topup } from "../controller/Airtime.js";
const router = express.Router();
import { authenticate } from "../middleware/authenticate.js";

router.route("/topup").post(authenticate, airtime_topup);


export default router;