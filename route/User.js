import express from "express";
import { get_user, login, register } from "../controller/User.js";
const router = express.Router();
import { authenticate } from "../middleware/authenticate.js";

router.post("/register", register);
router.post("/login", login);
router.route("/me").get(authenticate, get_user)


export default router;