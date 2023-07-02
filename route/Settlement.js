import express from 'express';
import { get_settlement, save_settlement_details, validate_account } from '../controller/Settlement.js';
import { authenticate } from '../middleware/authenticate.js';
const router = express.Router();


router.route('/verify').post(validate_account);
router.route('/save').post(authenticate, save_settlement_details);
router.route('/find').get(authenticate, get_settlement);


export default router;