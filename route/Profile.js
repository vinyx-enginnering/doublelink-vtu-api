import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { saveProfile } from '../controller/Profile.js';
const router = express.Router();


router.post("/edit", authenticate, saveProfile);

export default router;