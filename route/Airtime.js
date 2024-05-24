import express from "express";
import { airtime_instant_topup, airtime_topup } from "../controller/Airtime.js";
const router = express.Router();
import { authenticate } from "../middleware/authenticate.js";

router.route("/topup").post(authenticate, airtime_topup);
router.route('/instant_topup').post(airtime_instant_topup);


export default router;