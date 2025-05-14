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
