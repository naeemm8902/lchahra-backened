import Message from '../models/Message.js';

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
    const { chatId, senderId, content } = req.body;
    const message = await Message.create({ chat: chatId, sender: senderId, content });
    const populated = await message.populate('sender', 'name');
    res.json(populated);
  } catch (error) {
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
    
    // Delete the message
    await Message.findByIdAndDelete(messageId);
    
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
