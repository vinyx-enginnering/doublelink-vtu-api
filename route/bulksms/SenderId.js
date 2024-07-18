import express from "express";
const router = express.Router();
import { get_all_my_sender_ids, get_my_verified_sender_ids, request_sender_id } from "../../controller/bulksms/SenderId.js";
import { authenticate } from "../../middleware/authenticate.js";
import { update_sender_ids } from "../../service/updateSenderId.js";

router.post("/request", authenticate, request_sender_id);
router.get("/verified", authenticate, get_my_verified_sender_ids);
router.get("/list", authenticate, get_all_my_sender_ids);
router.put('/update_sender_ids', update_sender_ids);


export default router;
