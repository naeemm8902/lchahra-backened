import express from 'express';
import {
  getChatMessages,
  sendMessage
} from '../controllers/messageController.js';

const router = express.Router();

// Get all messages in a chat
router.route('/:chatId').get(getChatMessages);

// Send a message
router.route('/').post(sendMessage);

export default router;
