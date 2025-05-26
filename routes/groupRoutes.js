import express from 'express';
import {createGroup, getUserGroups, getGroupDetails, addGroupMembers, removeGroupMember, leaveGroup, sendGroupMessage, getGroupMessages} from '../controllers/groupController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new group
router.post('/', isAuthenticated, createGroup);

// Get user's groups
router.get('/', isAuthenticated, getUserGroups);

// Get group details
router.get('/:groupId', isAuthenticated, getGroupDetails);

// Add members to group
router.post('/:groupId/members', isAuthenticated, addGroupMembers);

// Remove member from group
router.delete('/:groupId/members/:userId', isAuthenticated, removeGroupMember);


// Send message to group
router.post('/:groupId/messages', isAuthenticated, sendGroupMessage);

// Get group messages
router.get('/:groupId/messages', isAuthenticated, getGroupMessages);

// Leave group
router.post('/:groupId/leave', isAuthenticated, leaveGroup);

export default router;