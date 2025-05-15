import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { isValidObjectId } from 'mongoose';

// Create or get a private chat between two users
export const getOrCreatePrivateChat = async (req, res) => {
  try {
    console.log('Reached inside chats creating first time');
    console.log('req.body:', req.body);

    let userId1, userId2;
    const { members, workspaceId, workspace } = req.body;

    if (Array.isArray(members) && members.length > 0) {
      userId1 = members[0];
      userId2 = members.length > 1 ? members[1] : members[0];
    } else {
      userId1 = req.body.userId1;
      userId2 = req.body.userId2;
    }

    console.log('userId1:', userId1);
    console.log('userId2:', userId2);
    console.log('workspace/workspaceId:', workspace || workspaceId);

    if (!userId1) {
      return res.status(400).json({ message: 'At least one user ID is required' });
    }

    if (!userId2) {
      console.log('Self-chat detected (only one user ID provided)');
      userId2 = userId1;
    }

    if (!isValidObjectId(userId1) || !isValidObjectId(userId2)) {
      return res.status(400).json({
        message: 'Invalid user ID format. IDs must be valid MongoDB ObjectIds.',
        isMockData: false
      });
    }

    // Create query object to find existing chat
    const query = {
      isGroup: false,
      members: { $all: [userId1, userId2] },
      workspaceId: workspaceId // Added workspaceId to the query
    };

    console.log("Final query:", query); // Log the query for debugging

    let chat = await Chat.findOne(query);
    let isNewChat = false;

    if (!chat) {
      // Create chat data with both workspaceId and workspace
      const chatData = {
        isGroup: false,
        members: [userId1, userId2],
        workspaceId: workspaceId, // Ensure workspaceId is added
        workspace: workspace // Ensure workspace is added
      };

      chat = await Chat.create(chatData);
      isNewChat = true;
      console.log('New chat created with ID:', chat._id);
    }
    
    // Check if this is a newly created chat and send a welcome message if it is
    if (isNewChat) {
      try {
        // Get message count to confirm it's empty (added safety check)
        const messageCount = await Message.countDocuments({ chat: chat._id });
        
        if (messageCount === 0) {
          console.log('Sending welcome message for new chat');
          
          // Create welcome message directly using the Message model
          const welcomeMessage = {
            chat: chat._id,
            sender: userId1, // Use the first user as sender
            content: 'Welcome to your chat in Lchahra Workspace! This is your space for conversations and notes.'
          };
          
          // Save the welcome message
          const message = await Message.create(welcomeMessage);
          console.log('Welcome message created successfully:', message._id);
        }
      } catch (error) {
        console.error('Error creating welcome message:', error);
        // We don't want to fail the chat creation if welcome message fails
        // So just log the error but proceed with returning the chat
      }
    }

    // Populate members if needed, and return response
    await chat.populate('members', 'name email avatar'); // Optional: Populate member details
    res.json({
      _id: chat._id,
      isGroup: chat.isGroup,
      members: chat.members,
      workspaceId: chat.workspaceId || null, // return workspaceId
      workspace: chat.workspace || null, // return workspace
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Get all chats for a user
export const getUserChats = async (req, res) => {
  try {
    // Use either the userId from params or the authenticated user's ID
    const userId = req.params.userId || req.user._id;
    
    console.log('Getting chats for user:', userId);
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const chats = await Chat.find({ members: userId }).populate('members', 'name email');
    console.log(`Found ${chats.length} chats for user ${userId}`);
    
    res.json(chats);
  } catch (error) {
    console.error('Error in getUserChats:', error);
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