import express from 'express';
import {
  getOrCreatePrivateChat,
  getUserChats,
  sendInvitation,
  getJoinRequest,
  acceptInvitation,
  rejectInvitation,
} from '../controllers/chatController.js';
import { getChatMessages } from '../controllers/messageController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const chatRouter = express.Router();

// Get all chats for the authenticated user
chatRouter.get('/', isAuthenticated, getUserChats);

// Get all chats for a specific user by ID
chatRouter.get('/user/:userId', isAuthenticated, getUserChats);

// Create or get a private chat between two users
chatRouter.post('/private', isAuthenticated, getOrCreatePrivateChat);

// Send an invitation to join a workspace/group
chatRouter.post('/invite', isAuthenticated, sendInvitation);

// Get join requests for the authenticated user
chatRouter.get('/join-requests', isAuthenticated, getJoinRequest);

// Accept a join invitation
chatRouter.put('/invite/:id/accept', isAuthenticated, acceptInvitation);

// Reject a join invitation
chatRouter.put('/invite/:id/reject', isAuthenticated, rejectInvitation);

// Get all messages for a specific chat (matches frontend expected endpoint)
chatRouter.get('/:chatId/messages', isAuthenticated, getChatMessages);

// // DM messages - Direct Message routes
// router.post('/dm/:chatId', isAuthenticated, sendDirectMessage);
// router.get('/dm/:chatId', isAuthenticated, getDirectMessages);

export default chatRouter;
  