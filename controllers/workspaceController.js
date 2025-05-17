import Workspace from "../models/workspaceModel.js";
import Chat from "../models/Chat.js";
import Message from '../models/Message.js';

// Create a new workspace
export const createWorkspace = async (req, res) => {
    try {
        console.log(req.user)
        const { name, description} = req.body;
        // const workspace = new Workspace({ name, description, owner:req.user._id });
        const workspace = new Workspace({
            name,
            description,
            owner: req.user._id,
            members: [
              {
                userId: req.user._id,
                role: 'owner', 
              },
            ],
          });
        await workspace.save();

        // Automatically create a self-chat for this workspace
        const selfChat = new Chat({
            chatname: req.user.name || 'Self Chat',
            isGroup: false,
            members: [req.user._id, req.user._id], // Self-chat with same user twice
            workspace: workspace._id,
        });
        
        await selfChat.save();
        
        // Create welcome message using the Message model imported at the top
        
        // Create welcome message in the self-chat
        const welcomeMessage = new Message({
            chat: selfChat._id,
            sender: req.user._id,
            content: `Welcome to ${workspace.name}! This is your personal chat in this workspace.`,
        });
        
        await welcomeMessage.save();
        
        res.status(201).json({ success: true, workspace });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserWorkspaces = async (req, res) => {
    try {
        const userId = req.user._id;
        const myWorkspaces = await Workspace.find({ owner: userId })
            .populate('owner', 'name email')
            .populate('members.userId', 'name email')
       
        const guestWorkSpace = await Workspace.find({ members: { $elemMatch: { userId } } })
        .populate('owner', 'name email')
        .populate('members.userId', 'name email')
            res.status(200).json({ success: true, myWorkspaces ,guestWorkSpace });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

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

// In workspaceController.js (create this function)
export const getMembersByWorkspaceId = async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user._id;
  
    try {
      // Get the workspace with populated member information
      const workspace = await Workspace.findById(id).populate({
        path: 'members.userId',
        select: 'name email avatar' // Select only fields you need
      });
      
      if (!workspace) {
        return res.status(404).json({ message: 'Workspace not found' });
      }

      // Find all chats for this workspace
      const workspaceChats = await Chat.find({ workspace: id })
        .populate('members', 'name email avatar')
        .lean();

      // Transform the members data to include chat details
      const membersWithChats = workspace.members.map(member => {
        // Get basic member info
        const memberInfo = {
          _id: member.userId._id,
          name: member.userId.name,
          email: member.userId.email,
          avatar: member.userId.avatar,
          role: member.role
        };
        
        // Find chat between current user and this member in this workspace
        const memberChat = workspaceChats.find(chat => {
          return (
            !chat.isGroup && 
            chat.members.some(m => m._id.toString() === member.userId._id.toString()) && 
            chat.members.some(m => m._id.toString() === currentUserId.toString())
          );
        });
        
        // Include chat information if available
        if (memberChat) {
          memberInfo.chat = {
            _id: memberChat._id,
            chatname: memberChat.chatname || `Chat with ${memberInfo.name}`
          };
        }
        
        return memberInfo;
      });
      
      console.log(`Found ${membersWithChats.length} members with their chat details in workspace ${id}`);
      res.json(membersWithChats);
    } catch (error) {
      console.error('Error fetching workspace members with chats:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };