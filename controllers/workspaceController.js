import Workspace from "../models/workspaceModel.js";

// Create a new workspace
export const createWorkspace = async (req, res) => {
    try {
        const { name, description, members, owner } = req.body;
        const workspace = new Workspace({ name, description, members, owner });
        await workspace.save();
        res.status(201).json({ success: true, workspace });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all workspaces
export const getWorkspaces = async (req, res) => {
    try {
        const workspaces = await Workspace.find().populate('owner').populate('members.userId');
        res.status(200).json({ success: true, workspaces });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a single workspace by ID
export const getWorkspaceById = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id).populate('owner').populate('members.userId');
        if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
        res.status(200).json({ success: true, workspace });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a workspace
export const updateWorkspace = async (req, res) => {
    try {
        const workspace = await Workspace.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
        res.status(200).json({ success: true, workspace });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a workspace
export const deleteWorkspace = async (req, res) => {
    try {
        const workspace = await Workspace.findByIdAndDelete(req.params.id);
        if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
        res.status(200).json({ success: true, message: 'Workspace deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add a member to a workspace
export const addMemberToWorkspace = async (req, res) => {
    try {
        const { userId, role } = req.body;
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
        
        // Check if user is already a member
        if (workspace.members.some(member => member.userId.toString() === userId)) {
            return res.status(400).json({ success: false, message: 'User is already a member' });
        }

        workspace.members.push({ userId, role });
        await workspace.save();
        res.status(200).json({ success: true, message: 'Member added successfully', workspace });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Remove a member from a workspace
export const removeMemberFromWorkspace = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const workspace = await Workspace.findById(id);
        if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
        
        workspace.members = workspace.members.filter(member => member.userId.toString() !== memberId);
        await workspace.save();
        res.status(200).json({ success: true, message: 'Member removed successfully', workspace });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};