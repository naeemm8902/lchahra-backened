import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { isValidObjectId } from 'mongoose';

// Create or get a private chat between two users
export const getOrCreatePrivateChat = async (req, res) => {
  try {


    let userId1, userId2;
    const { members, workspaceId, workspace } = req.body;

    if (Array.isArray(members) && members.length > 0) {
      userId1 = members[0];
      userId2 = members.length > 1 ? members[1] : members[0];
    } else {
      userId1 = req.body.userId1;
      userId2 = req.body.userId2;
    }

    if (!userId1 || !userId2) {
      return res.status(400).json({ message: 'Two user IDs are required to fetch private chat' });
    }

    if (!isValidObjectId(userId1) || !isValidObjectId(userId2)) {
      return res.status(400).json({
        message: 'Invalid user ID format. IDs must be valid MongoDB ObjectIds.',
      });
    }

    const effectiveWorkspaceId = workspaceId || (workspace && workspace._id);
    const workspaceIdString = effectiveWorkspaceId ? effectiveWorkspaceId.toString() : null;


    const userChats = await Chat.find({
      isGroup: false,
      members: { $all: [userId1, userId2], $size: 2 }, // Ensures both users are in the chat
    });

    let chat = null;

    for (const existingChat of userChats) {
      if (
        (existingChat.workspaceId && existingChat.workspaceId.toString() === workspaceIdString) ||
        (existingChat.workspace && existingChat.workspace._id?.toString() === workspaceIdString)
      ) {
        chat = existingChat;
        break;
      }
    }

    if (chat) {
      await chat.populate('members', 'name email avatar');
      return res.json({
        _id: chat._id,
        isGroup: chat.isGroup,
        members: chat.members,
        workspaceId: chat.workspaceId || null,
        workspace: chat.workspace || null,
        chatname: chat.chatname,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      });
    } else {
      return res.status(404).json({ message: 'No private chat found for the given users in this workspace' });
    }

  } catch (error) {
    console.error('Error fetching private chat:', error);
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