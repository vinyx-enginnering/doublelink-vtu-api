import express from "express";
import { get_user, login, register, resend_verification_token, verification } from "../controller/User.js";
const router = express.Router();
import { authenticate } from "../middleware/authenticate.js";
import { googleOAuth } from "../controller/GoogleAuth.js";
import { PasswordReset, PasswordResetRequest } from "../service/PasswordResetRequest.js";

router.post("/register", register);
router.post("/login", login);
router.post('/verification', verification);
router.post("/new-token", resend_verification_token);
router.post("/password-reset-request", PasswordResetRequest);
router.post("/password-reset", PasswordReset)
router.route("/me").get(authenticate, get_user);
router.route("/google-oauth").post(googleOAuth);



export default router;