import express from 'express';
import {
  getChatMessages,
  sendMessage,
  updateMessage,
  deleteMessage
} from '../controllers/messageController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all messages in a chat
router.route('/:chatId').get(getChatMessages);

// Send a message
router.route('/').post(sendMessage);

// Update a message - requires authentication
router.route('/:messageId').put(isAuthenticated, updateMessage);

// Delete a message - requires authentication
router.route('/:messageId').delete(isAuthenticated, deleteMessage);

export default router;
