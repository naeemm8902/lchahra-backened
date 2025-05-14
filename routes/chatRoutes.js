import express from 'express';
import {
  getOrCreatePrivateChat,
  getUserChats,
  sendInvitation,
  getJoinRequest,
  acceptInvitation,
  rejectInvitation,
} from '../controllers/chatController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const chateRouter = express.Router();


// Get all chats for a user
chateRouter.get('/user/:userId', isAuthenticated, getUserChats);

// Create or get a private chat between two users
chateRouter.post('/private', isAuthenticated, getOrCreatePrivateChat);


// Send an invitation to join a workspace/group
chateRouter.post('/invite', isAuthenticated, sendInvitation);

// Get join requests for the authenticated user
chateRouter.get('/join-requests', isAuthenticated, getJoinRequest);

// Accept a join invitation
chateRouter.put('/invite/:id/accept', isAuthenticated, acceptInvitation);

// Reject a join invitation
chateRouter.put('/invite/:id/reject', isAuthenticated, rejectInvitation);

// // DM messages - Direct Message routes
// router.post('/dm/:chatId', isAuthenticated, sendDirectMessage);
// router.get('/dm/:chatId', isAuthenticated, getDirectMessages);

export default chateRouter;
  