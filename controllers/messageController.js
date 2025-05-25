import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import path from 'path';
import fs from 'fs';

// Get all messages in a chat
export const getChatMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId }).populate('sender', 'name');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    console.log('Received message request with files:', req.file ? 'HAS FILE' : 'NO FILE');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    const { chatId, senderId, content, chatname } = req.body;
    
    // Create message object
    const messageData = { 
      chat: chatId, 
      sender: senderId, 
      content, 
      chatname,
      messageType: 'direct' // Explicitly set message type for direct messages
    };
    
    // ===== HANDLING FILE ATTACHMENTS =====
    if (req.file) {
      // Get just the filename from the path
      const filename = path.basename(req.file.path);
      console.log(`Handling file upload: ${filename}`);
      
      // Create complete attachment object
      const attachmentData = {
        filename: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        downloadUrl: `/chat/download/${filename}`,
        uploadDate: new Date()
      };
      
      // Add to message data
      messageData.attachment = attachmentData;
      
      console.log('ATTACHMENT DATA:', JSON.stringify(attachmentData, null, 2));
    }
    
    // ===== CREATE THE MESSAGE =====
    console.log('Creating message with data:', JSON.stringify(messageData, null, 2));
    const message = await Message.create(messageData);
    
    // ===== PREPARE RESPONSE =====
    // First populate the sender
    let populated = await message.populate('sender', 'name');
    
    // Convert to plain object for response
    const responseObj = populated.toObject();
    
    // Check if attachment needs to be fixed
    if (req.file && (!responseObj.attachment || !responseObj.attachment.downloadUrl)) {
      console.log('Fixing attachment in response');
      responseObj.attachment = messageData.attachment;
    }
    
    console.log('FINAL RESPONSE:', JSON.stringify(responseObj, null, 2));
    
    // ===== EMIT SOCKET EVENT =====
    const io = req.app.get('io');
    if (io) {
      io.to(chatId).emit('new-message', responseObj);
      console.log(`Emitted new-message event to chat: ${chatId}`);
    }
    
    // ===== SEND RESPONSE =====
    return res.status(200).json(responseObj);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a message
export const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    
    // Find the message
    const message = await Message.findById(messageId);
    
    // Check if message exists
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is the sender (authorization)
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }
    
    // Update the message
    message.content = content;
    message.isEdited = true;
    message.updatedAt = Date.now();
    
    await message.save();
    const updatedMessage = await Message.findById(messageId).populate('sender', 'name');
    
    // Get Socket.io instance
    const io = req.app.get('io');
    
    // Emit to all users in the chat room
    if (io) {
      io.to(message.chat.toString()).emit('updated-message', updatedMessage);
      console.log(`Emitted updated-message event to chat: ${message.chat}`);
    }
    
    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Find the message
    const message = await Message.findById(messageId);
    
    // Check if message exists
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is the sender (authorization)
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }
    
    // Store the chat ID before deletion for socket emission
    const chatId = message.chat.toString();
    
    // Delete the message
    await Message.findByIdAndDelete(messageId);
    
    // Get Socket.io instance
    const io = req.app.get('io');
    
    // Emit to all users in the chat room
    if (io) {
      io.to(chatId).emit('deleted-message', { messageId });
      console.log(`Emitted deleted-message event to chat: ${chatId}`);
    }
    
    res.json({ message: 'Message deleted successfully', messageId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Channel messages
// export const sendChannelMessage = async (req, res) => {
//   req.body.chatId = req.params.channelId;
//   return sendMessage(req, res);
// };

// export const getChannelMessages = async (req, res) => {
//   req.params.chatId = req.params.channelId;
//   return getChatMessages(req, res);
// };

// // Direct messages
// export const sendDirectMessage = async (req, res) => {
//   req.body.chatId = req.params.chatId;
//   return sendMessage(req, res);
// };

// export const getDirectMessages = async (req, res) => {
//   return getChatMessages(req, res);
// };
