import express from "express";
const router = express.Router();
import { get_my_sender_ids, request_sender_id } from "../../controller/bulksms/SenderId.js";
import { authenticate } from "../../middleware/authenticate.js";

router.post("/request", authenticate, request_sender_id);
router.get("/list", authenticate, get_my_sender_ids);


export default router;
