import Group from '../models/Group.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { validationResult } from 'express-validator';

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, members = [], workspaceId } = req.body;
    
    // Create the group
    const group = new Group({
      name,
      description,
      createdBy: req.user._id,
      workspace: workspaceId,
      members: [
        { user: req.user._id, role: 'admin', addedBy: req.user._id },
        ...members.map(memberId => ({
          user: memberId,
          role: 'member',
          addedBy: req.user._id
        }))
      ]
    });

    await group.save();
    const chat = new Chat({
      name: name,
      isGroup: true,
      members: [req.user._id, ...members], // Add all members
      groupId: group._id, // Reference to the group
      workspace: workspaceId
    });
    
    await chat.save();
    
    // Create welcome message
    const welcomeMessage = new Message({
      content: `Group "${name}" has been created`,
      sender: req.user._id,
      chat: chat._id,
      messageType: 'group', // Add required messageType field
      isSystemMessage: true
    });
    
    await welcomeMessage.save();
    
    // Populate the created group with user details
    const populatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email');

      res.status(201).json({
        success: true,
        data: {
          group: populatedGroup,
          chat: chat 
        }
      });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's groups
// @route   GET /api/groups
// @access  Private
export const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id,
      isArchived: false
    })
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get group details
// @route   GET /api/groups/:groupId
// @access  Private
export const getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.groupId,
      'members.user': req.user._id,
      isArchived: false
    })
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('pinnedMessages.message')
      .populate('pinnedMessages.pinnedBy', 'name');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error fetching group details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Add members to group
// @route   POST /api/groups/:groupId/members
// @access  Private
export const addGroupMembers = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user IDs to add to the group'
      });
    }

    const group = await Group.findOne({
      _id: req.params.groupId,
      'members.user': req.user._id,
      'members.role': 'admin',
      isArchived: false
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or you do not have permission to add members'
      });
    }

    // Filter out users who are already members
    const existingMemberIds = group.members.map(member => member.user.toString());
    const newMemberIds = userIds.filter(id => !existingMemberIds.includes(id));

    if (newMemberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All provided users are already members of the group'
      });
    }

    // Add new members
    const newMembers = newMemberIds.map(userId => ({
      user: userId,
      role: 'member',
      addedBy: req.user._id
    }));

    group.members.push(...newMembers);
    await group.save();
    
    // Also update the associated chat document with new members
    const chat = await Chat.findOne({ groupId: group._id });
    if (chat) {
      // Add the new member IDs to the chat members array
      chat.members = [...chat.members, ...newMemberIds];
      await chat.save();
      
      // Create system message about new members
      const welcomeMessage = new Message({
        content: `${newMemberIds.length} new member(s) added to the group`,
        sender: req.user._id,
        chat: chat._id,
        messageType: 'group',
        isSystemMessage: true
      });
      
      await welcomeMessage.save();
    }

    // Populate the updated group with user details
    const updatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email');

    // Emit socket event for new members
    req.app.get('io').to(`group_${group._id}`).emit('group:members_added', {
      groupId: group._id,
      addedBy: req.user._id,
      members: newMemberIds
    });

    res.status(200).json({
      success: true,
      data: updatedGroup
    });
  } catch (error) {
    console.error('Error adding group members:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:groupId/members/:userId
// @access  Private
export const removeGroupMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    
    // Check if the requester is an admin
    const group = await Group.findOne({
      _id: groupId,
      'members.user': req.user._id,
      'members.role': 'admin',
      isArchived: false
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or you do not have permission to remove members'
      });
    }

    // Check if the target user is a member
    const memberIndex = group.members.findIndex(
      member => member.user.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this group'
      });
    }

    // Prevent removing the last admin
    const adminCount = group.members.filter(m => m.role === 'admin').length;
    const isLastAdmin = adminCount <= 1 && 
      group.members[memberIndex].role === 'admin';

    if (isLastAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the last admin of the group'
      });
    }

    // Remove the member from the group
    group.members.splice(memberIndex, 1);
    await group.save();
    
    // Also remove the user from the associated chat
    const associatedChat = await Chat.findOne({ groupId: groupId });
    if (associatedChat) {
      console.log(`Removing user ${userId} from chat ${associatedChat._id} associated with group ${groupId}`);
      
      // Pull the user from the chat members array
      await Chat.updateOne(
        { _id: associatedChat._id },
        { $pull: { members: userId } }
      );
      
      // Add a system message that the user was removed
      const systemMessage = new Message({
        content: `User was removed from the group`,
        sender: req.user._id,
        chat: associatedChat._id,
        messageType: 'system',
        isSystemMessage: true
      });
      
      await systemMessage.save();
    } else {
      console.log(`No chat found associated with group ${groupId}`);
    }

    // Emit socket event for member removal
    req.app.get('io').to(`group_${groupId}`).emit('group:member_removed', {
      groupId,
      removedUserId: userId,
      removedBy: req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing group member:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Send message to group
// @route   POST /api/groups/:groupId/messages
// @access  Private
export const sendGroupMessage = async (req, res) => {
  try {
    const { content, replyTo } = req.body;
    const { groupId } = req.params;

    // Check if user is a member of the group
    const isMember = await Group.isMember(groupId, req.user._id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Check group settings if needed
    const group = await Group.findById(groupId);
    if (group.settings.sendMessages === 'admins') {
      const isAdmin = await Group.isAdmin(groupId, req.user._id);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only admins can send messages to this group'
        });
      }
    }

    // Create the message
    const message = new Message({
      content,
      group: groupId,
      sender: req.user._id,
      replyTo,
      messageType: 'group'
    });

    await message.save();

    // Populate the message with sender details
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('replyTo');

    // Update group's updatedAt timestamp
    await Group.findByIdAndUpdate(groupId, { updatedAt: new Date() });

    // Emit socket event
    req.app.get('io').to(`group_${groupId}`).emit('group:message', {
      groupId,
      message: populatedMessage
    });

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get group messages
// @route   GET /api/groups/:groupId/messages
// @access  Private
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if user is a member of the group
    const isMember = await Group.isMember(groupId, req.user._id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Get messages with pagination
    const messages = await Message.find({
      group: groupId,
      isDeleted: { $ne: true }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email avatar')
      .populate('replyTo');

    // Get total count for pagination
    const total = await Message.countDocuments({
      group: groupId,
      isDeleted: { $ne: true }
    });

    // Mark messages as read for this user
    await Message.updateMany(
      {
        group: groupId,
        'readBy.user': { $ne: req.user._id },
        sender: { $ne: req.user._id }
      },
      {
        $addToSet: {
          readBy: {
            user: req.user._id,
            readAt: new Date()
          }
        }
      }
    );

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: messages.reverse() // Return oldest first
    });
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update group info
// @route   PUT /api/groups/:groupId
// @access  Private
export const updateGroupInfo = async (req, res) => {
  try {
    const { name, description, settings } = req.body;
    const { groupId } = req.params;

    // Check if user is an admin of the group
    const isAdmin = await Group.isAdmin(groupId, req.user._id);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this group'
      });
    }

    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (settings) updates.settings = { ...settings };

    const group = await Group.findByIdAndUpdate(
      groupId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Emit socket event for group update
    req.app.get('io').to(`group_${groupId}`).emit('group:updated', {
      groupId,
      updatedBy: req.user._id,
      updates
    });

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error updating group info:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Leave group
// @route   POST /api/groups/:groupId/leave
// @access  Private
export const leaveGroup = async (req, res) => {
  try {
    console.log("leaveGroup valounter by user itself")
    const { groupId } = req.params;
    console.log(groupId)
    const userId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      'members.user': userId,
      isArchived: false
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or you are not a member'
      });
    }


    // Check if user is the last admin
    const adminCount = group.members.filter(m => m.role === 'admin').length;
    const isLastAdmin = adminCount <= 1 && 
      group.members.some(m => 
        m.user.toString() === userId.toString() && m.role === 'admin'
      );

    // If the last admin is leaving, transfer admin role to another member
    if (isLastAdmin) {
      // If there are other members, transfer admin to the first one
      if (group.members.length > 1) {
        // Find the first non-admin member
        const newAdminIndex = group.members.findIndex(m => 
          m.user.toString() !== userId.toString()
        );
        
        if (newAdminIndex !== -1) {
          console.log(`Last admin is leaving - transferring admin role to ${group.members[newAdminIndex].user}`);
          group.members[newAdminIndex].role = 'admin';
        } else {
          return res.status(400).json({
            success: false,
            message: 'You are the last admin. Please assign another admin before leaving or delete the group.'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'You are the last admin and member. Please delete the group instead of leaving it.'
        });
      }
    }

    // Remove user from group
    group.members = group.members.filter(
      member => member.user.toString() !== userId.toString()
    );

    await group.save();
    
    // Also remove the user from the associated chat
    const associatedChat = await Chat.findOne({ groupId: groupId });
    if (associatedChat) {
      console.log(`User ${userId} is leaving chat ${associatedChat._id} associated with group ${groupId}`);
      
      // Pull the user from the chat members array
      await Chat.updateOne(
        { _id: associatedChat._id },
        { $pull: { members: userId } }
      );
      
      // Add a system message that the user left
      const userName = req.user.name || 'A user';
      const systemMessage = new Message({
        content: `${userName} has left the group`,
        sender: userId,
        chat: associatedChat._id,
        messageType: 'group',
        isSystemMessage: true
      });
      
      await systemMessage.save();
    } else {
      console.log(`No chat found associated with group ${groupId} when user tried to leave`);
    }

    // Emit socket event using the existing socket infrastructure
    req.app.get('io').to(`group_${groupId}`).emit('user-left-group', {
      groupId,
      userId,
      socketId: req.socket?.id, // Include socketId if available
      timestamp: new Date(),
      isLeaving: true, // Add flag to indicate permanent leave (not just socket disconnect)
      userName: req.user.name || 'A user' // Include user name for better UI messages
    });

    res.status(200).json({
      success: true,
      message: 'Successfully left the group'
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
