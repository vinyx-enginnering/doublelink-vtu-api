import express from 'express';
const router = express.Router();
import { create_phonebook, get_phonebooks, get_phonebook, update_phonebook, delete_phonebook } from '../../controller/bulksms/Phonebook.js';
import { authenticate } from '../../middleware/authenticate.js';

// Create a new phonebook (Authenticated route)
router.post('/create', authenticate, create_phonebook);

// Get all phonebooks (Authenticated route)
router.get('/list', authenticate, get_phonebooks);

// Get a single phonebook (Authenticated route)
router.get('/:id', authenticate, get_phonebook);

// Update a phonebook (Authenticated route)
router.put('/:id', authenticate, update_phonebook);

// Delete a phonebook (Authenticated route)
router.delete('/:id', authenticate, delete_phonebook);

export default router;
