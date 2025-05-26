import express from 'express';
import path from 'path';
import fs from 'fs';
import {
  getOrCreatePrivateChat,
  getUserChats,
  sendInvitation,
  getJoinRequest,
  acceptInvitation,
  rejectInvitation,
} from '../controllers/chatController.js';
import { getChatMessages, sendMessage } from '../controllers/messageController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

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

// Send a message with optional file attachment
chatRouter.post('/:chatId/messages', isAuthenticated, upload.single('document'), sendMessage);

// Download a file attachment
// Using the path format that matches what we set in messageController.js
chatRouter.get('/download/:filename', isAuthenticated, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Send the file
    res.download(filePath);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// // DM messages - Direct Message routes
// router.post('/dm/:chatId', isAuthenticated, sendDirectMessage);
// router.get('/dm/:chatId', isAuthenticated, getDirectMessages);

export default chatRouter;
  