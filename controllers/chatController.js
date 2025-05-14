import Chat from '../models/Chat.js';

// Create or get a private chat between two users
export const getOrCreatePrivateChat = async (req, res) => {
  try {
    console.log('req.body:', req.body);
    
    // Extract user IDs from members array or use provided userId1/userId2
    let userId1, userId2;
    const { members, workspace, workspaceId } = req.body;
    
    // Handle data coming from frontend (members array)
    if (Array.isArray(members) && members.length > 0) {
      userId1 = members[0];
      userId2 = members.length > 1 ? members[1] : members[0]; // Self-chat if only one member
    } else {
      // Handle direct userId1/userId2 format for backward compatibility
      userId1 = req.body.userId1;
      userId2 = req.body.userId2;
    }
    
    console.log('userId1:', userId1);
    console.log('userId2:', userId2);
    console.log('workspace/workspaceId:', workspace || workspaceId);

    if (!userId1) {
      return res.status(400).json({ message: 'At least one user ID is required' });
    }
    
    // Handle self-chat case (when userId2 is not provided or same as userId1)
    if (!userId2) {
      console.log('Self-chat detected (only one user ID provided)');
      userId2 = userId1; 
    }
    
    // Validate that the user IDs are valid MongoDB ObjectIds
    if (!isValidObjectId(userId1) || !isValidObjectId(userId2)) {
      return res.status(400).json({ 
        message: 'Invalid user ID format. IDs must be valid MongoDB ObjectIds.',
        isMockData: false
      });
    }

    // Create query object to find existing chat
    const query = {
      isGroup: false,
      members: { $all: [userId1, userId2] }
    };
    
    // Add workspace filter if provided
    // Support both workspace and workspaceId for flexibility
    const workspaceIdentifier = workspace || workspaceId;
    if (workspaceIdentifier) {
      query.workspace = workspaceIdentifier;
    }

    let chat = await Chat.findOne(query);

    if (!chat) {
      // Create chat data with optional workspace
      const chatData = { 
        isGroup: false, 
        members: [userId1, userId2]
      };
      
      // Add workspace if provided (support both workspace and workspaceId)
      const workspaceIdentifier = workspace || workspaceId;
      if (workspaceIdentifier) {
        chatData.workspace = workspaceIdentifier;
      }
      
      chat = await Chat.create(chatData);
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all chats for a user
export const getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await Chat.find({ members: userId }).populate('members', 'name email');
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Send an invitation to join a workspace/group
export const sendInvitation = async (req, res) => {
  try {
    const { chatId, userIdToInvite } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: 'Group chat not found' });
    }

    if (chat.pendingInvites?.includes(userIdToInvite)) {
      return res.status(400).json({ message: 'User already invited' });
    }

    chat.pendingInvites = [...(chat.pendingInvites || []), userIdToInvite];
    await chat.save();

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Get join requests for the authenticated user
export const getJoinRequest = async (req, res) => {
  try {
    const userId = req.user._id;

    const invites = await Chat.find({ pendingInvites: userId }).populate('members', 'name');
    res.json(invites);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Accept a join invitation
export const acceptInvitation = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    const userId = req.user._id.toString();

    if (!chat?.pendingInvites.includes(userId)) {
      return res.status(404).json({ message: 'No invitation found' });
    }

    chat.members.push(userId);
    chat.pendingInvites = chat.pendingInvites.filter(id => id.toString() !== userId);
    await chat.save();

    res.json({ message: 'Invitation accepted', chat });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Reject a join invitation
export const rejectInvitation = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    const userId = req.user._id.toString();

    if (!chat?.pendingInvites.includes(userId)) {
      return res.status(404).json({ message: 'No invitation found' });
    }

    chat.pendingInvites = chat.pendingInvites.filter(id => id.toString() !== userId);
    await chat.save();

    res.json({ message: 'Invitation rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};