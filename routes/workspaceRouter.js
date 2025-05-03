import express from 'express';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import {
    createWorkspace,
    getUserWorkspaces,
    getWorkspaces,
    getWorkspaceById,
    updateWorkspace,
    deleteWorkspace,
    addMemberToWorkspace,
    removeMemberFromWorkspace
} from '../controllers/workspaceController.js';
const workspaceRouter = express.Router();

// Routes for workspaces
workspaceRouter.post('/', isAuthenticated,createWorkspace); // Create a new workspace
workspaceRouter.get('/my-workspaces', isAuthenticated, getUserWorkspaces); // Get workspaces for the authenticated user
workspaceRouter.get('my-workspces/:id',isAuthenticated ,getWorkspaceById); // Get a workspace by ID



// not used yet
workspaceRouter.get('/', getWorkspaces); // Get all workspaces
workspaceRouter.put('/:id', updateWorkspace); // Update a workspace
workspaceRouter.delete('/:id', deleteWorkspace); // Delete a workspace
workspaceRouter.post('/:id/members', addMemberToWorkspace); // Add a member to a workspace
workspaceRouter.delete('/:id/members/:memberId', removeMemberFromWorkspace); // Remove a member from a workspace




export default workspaceRouter;
