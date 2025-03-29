import express from 'express';
import {
    createWorkspace,
    getWorkspaces,
    getWorkspaceById,
    updateWorkspace,
    deleteWorkspace,
    addMemberToWorkspace,
    removeMemberFromWorkspace
} from '../controllers/workspaceController.js';
const workspaceRouter = express.Router();

// Routes for workspaces
workspaceRouter.post('/', createWorkspace); // Create a new workspace
workspaceRouter.get('/', getWorkspaces); // Get all workspaces
workspaceRouter.get('/:id', getWorkspaceById); // Get a workspace by ID
workspaceRouter.put('/:id', updateWorkspace); // Update a workspace
workspaceRouter.delete('/:id', deleteWorkspace); // Delete a workspace
workspaceRouter.post('/:id/members', addMemberToWorkspace); // Add a member to a workspace
workspaceRouter.delete('/:id/members/:memberId', removeMemberFromWorkspace); // Remove a member from a workspace




export default workspaceRouter;
