import express from 'express';
import { enableAirtimePrinting, get_user_setting, updateVoucherName } from '../controller/Setting.js';
const router = express.Router();
import { authenticate } from '../middleware/authenticate.js';

router.route('/enable-airtime').put(authenticate, enableAirtimePrinting);
router.route('/update-voucher').put(authenticate, updateVoucherName);
router.route('/me').get(authenticate, get_user_setting)



export default router;