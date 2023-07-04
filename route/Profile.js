import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { editUserPassword, saveProfile } from '../controller/Profile.js';
const router = express.Router();


router.post("/edit", authenticate, saveProfile);
router.put("/password", authenticate, editUserPassword);


export default router;