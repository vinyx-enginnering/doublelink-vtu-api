import express from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { campaign_history, campaign_list, campaign_report, send_bulk_messages } from '../../controller/bulksms/InstantCampaign.js';
const router = express.Router();


router.post('/send_bulk_sms', authenticate, send_bulk_messages);

router.get('/campaigns', authenticate, campaign_list);

router.post('/reports', campaign_report);
router.get('/history/:message_id', campaign_history);

export default router;