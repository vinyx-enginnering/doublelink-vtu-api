import express from "express";
import { get_user, login, register, verify_email } from "../controller/User.js";
const router = express.Router();
import { authenticate } from "../middleware/authenticate.js";
import { googleOAuth } from "../controller/GoogleAuth.js";

router.post("/register", register);
router.post("/login", login);
router.get('/verify/:token', verify_email);
router.route("/me").get(authenticate, get_user);
router.route("/google-oauth").post(googleOAuth);



export default router;