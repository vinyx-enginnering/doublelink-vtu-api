import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { editUserPassword, saveProfile, getProfile } from '../controller/Profile.js';
const router = express.Router();


router.post("/edit", authenticate, saveProfile);
router.put("/password", authenticate, editUserPassword);
router.get('/profile', authenticate, getProfile);


export default router;