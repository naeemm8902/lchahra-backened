import Workspace from "../models/workspaceModel.js";
import Chat from "../models/Chat.js";
import Message from '../models/Message.js';

// Create a new workspace
export const createWorkspace = async (req, res) => {
    try {
      const { name, description } = req.body;
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
        messageType: 'direct',
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
       
        const guestWorkSpace = await Workspace.find({ members: { $elemMatch: { userId:userId, role: { $ne: 'owner' }  } } })
        .populate('owner', 'name email')
        .populate('members.userId', 'name email')
            res.status(200).json({ success: true, myWorkspaces ,guestWorkSpace });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}


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


// Remove a member from a workspace
export const removeMemberFromWorkspace = async (req, res) => {
    try {
        const { workspaceId, memberId } = req.params;
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
        
        workspace.members = workspace.members.filter(member => member._id.toString() !== memberId);
        console.log(`Removing member ${memberId} from workspace ${workspaceId}`);
        console.log(workspace)
        await workspace.save();
        res.status(200).json({ success: true, message: 'Member removed successfully', workspace });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


  export const changeMemberRole = async (req, res) => {
    const { workspaceId, memberId } = req.params;
    const { role } = req.body; // Expecting new role in request body

    try {
      if (!['collaborator', 'member'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role specified' });
      }
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ success: false, message: 'Workspace not found' });
        }
        const member = workspace.members.find(m => m._id.toString() === memberId);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found in this workspace' });
        }
        // Update the member's role
        member.role = role;
        await workspace.save();
        res.status(200).json({ success: true, message: 'Member role updated successfully', workspace });
    }
    catch (error) {
        console.error('Error changing member role:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}