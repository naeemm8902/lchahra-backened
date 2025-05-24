import express from 'express';
import * as groupController from '../controllers/groupController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new group
router.post('/', isAuthenticated, groupController.createGroup);

// Get user's groups
router.get('/', isAuthenticated, groupController.getUserGroups);

// Get group details
router.get('/:groupId', isAuthenticated, groupController.getGroupDetails);

// Add members to group
router.post('/:groupId/members', isAuthenticated, groupController.addGroupMembers);

// Remove member from group
router.delete('/:groupId/members/:userId', isAuthenticated, groupController.removeGroupMember);

// Send message to group
router.post('/:groupId/messages', isAuthenticated, groupController.sendGroupMessage);

// Get group messages
router.get('/:groupId/messages', isAuthenticated, groupController.getGroupMessages);

export default router;