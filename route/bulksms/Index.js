import express from 'express';
const router = express.Router();

// Import individual route files
import Phonebook from './Phonebook.js';

// Use the individual routes
router.use('/phonebook', Phonebook);

export default router;
