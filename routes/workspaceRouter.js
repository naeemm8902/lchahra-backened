import express from 'express';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import {
    createWorkspace,
    getUserWorkspaces,
    getWorkspaceById,
    deleteWorkspace,
    changeMemberRole,
    removeMemberFromWorkspace,
} from '../controllers/workspaceController.js';
const workspaceRouter = express.Router();

// Routes for workspaces
workspaceRouter.post('/', isAuthenticated,createWorkspace); // Create a new workspace
workspaceRouter.get('/my-workspaces', isAuthenticated, getUserWorkspaces); // Get workspaces for the authenticated user
workspaceRouter.get('my-workspces/:id',isAuthenticated ,getWorkspaceById); // Get a workspace by ID
workspaceRouter.delete('/:id',isAuthenticated ,deleteWorkspace); 
workspaceRouter.post('/change-role/:workspaceId/:memberId',isAuthenticated, changeMemberRole); // Remove a member from a workspace
workspaceRouter.delete('/remove-member/:workspaceId/:memberId',isAuthenticated, removeMemberFromWorkspace); // Remove a member from a workspace



export default workspaceRouter;
