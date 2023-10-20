import express from 'express';
const router = express.Router();

// Import individual route files
import Phonebook from './Phonebook.js';
import SenderId from './SenderId.js';

// Use the individual routes
router.use('/phonebook', Phonebook);
router.use('/sender-id', SenderId);

export default router;
