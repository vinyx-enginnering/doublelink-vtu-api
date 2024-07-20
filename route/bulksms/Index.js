import express from 'express';
const router = express.Router();

// Import individual route files
import Phonebook from './Phonebook.js';
import SenderId from './SenderId.js';
import InstantCampaign from './InstantCampaign.js'

// Use the individual routes
router.use('/phonebook', Phonebook);
router.use('/sender-id', SenderId);
router.use('/sms', InstantCampaign)

export default router;
