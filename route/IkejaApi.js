import express from "express";
import { purchase_ikeja, verify_meter } from "../controller/IkejaApi.js";
import { authenticate } from "../middleware/authenticate.js";
import { my_previous_tokens_list } from "../controller/FindElectricityToken.js";
const router = express.Router();

router.route("/verify-meter").post(verify_meter);
router.route("/purchase").post(authenticate, purchase_ikeja);
router.route("/find_token").post(authenticate, my_previous_tokens_list);


export default router;