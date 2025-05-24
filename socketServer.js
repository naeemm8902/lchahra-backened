import { Server } from 'socket.io';

// Track user's active status
const onlineUsers = new Map();

const setupSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Allow all origins (change this in production)
      methods: ['GET', 'POST'],
      allowedHeaders: ['Authorization', 'Content-Type'],
      credentials: true
    }
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // User identifies themselves (with their user ID)
    socket.on('user-connected', ({ userId, userName }) => {
      if (userId) {
        console.log(`User identified ONLINE : ${userName} (${userId})`);
        // Store user information
        onlineUsers.set(userId, {
          socketId: socket.id,
          userName: userName,
          status: 'online',
          lastActive: new Date()
        });
        
        // Broadcast to all clients that a user is online
        io.emit('user-status-change', {
          userId,
          status: 'online',
          timestamp: new Date()
        });
      }
    });

    // User joins a specific chat room
    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat: ${chatId}`);
      
      // Let other users in this chat know someone joined
      socket.to(chatId).emit('user-joined-chat', {
        chatId,
        socketId: socket.id,
        timestamp: new Date()
      });
    });
    
    // User joins a group chat room
    socket.on('join-group', (groupId) => {
      socket.join(`group_${groupId}`);
      console.log(`User ${socket.id} joined group: ${groupId}`);
      
      // Let other users in this group know someone joined
      socket.to(`group_${groupId}`).emit('user-joined-group', {
        groupId,
        socketId: socket.id,
        timestamp: new Date()
      });
    });

    // User leaves a specific chat room
    socket.on('leave-chat', (chatId) => {
      socket.leave(chatId);
      console.log(`User ${socket.id} left chat: ${chatId}`);
      
      // Let other users in this chat know someone left
      socket.to(chatId).emit('user-left-chat', {
        chatId,
        socketId: socket.id,
        timestamp: new Date()
      });
    });
    
    // User leaves a group chat room
    socket.on('leave-group', (groupId) => {
      socket.leave(`group_${groupId}`);
      console.log(`User ${socket.id} left group: ${groupId}`);
      
      // Let other users in this group know someone left
      socket.to(`group_${groupId}`).emit('user-left-group', {
        groupId,
        socketId: socket.id,
        timestamp: new Date()
      });
    });
    
    // User typing indicator
    socket.on('typing-start', ({ chatId, userId, userName }) => {
      console.log(`User ${userName} started typing in chat ${chatId}`);
      // Broadcast to everyone else in the chat
      socket.to(chatId).emit('user-typing', {
        chatId,
        userId,
        userName,
        isTyping: true
      });
    });
    
    // User typing indicator in group
    socket.on('typing-start-group', ({ groupId, userId, userName }) => {
      console.log(`User ${userName} started typing in group ${groupId}`);
      // Broadcast to everyone else in the group
      socket.to(`group_${groupId}`).emit('user-typing-group', {
        groupId,
        userId,
        userName,
        isTyping: true
      });
    });
    
    // User stopped typing
    socket.on('typing-stop', ({ chatId, userId, userName }) => {
      console.log(`User ${userName} stopped typing in chat ${chatId}`);
      // Broadcast to everyone else in the chat
      socket.to(chatId).emit('user-typing', {
        chatId,
        userId,
        userName,
        isTyping: false
      });
    });
    
    // User stopped typing in group
    socket.on('typing-stop-group', ({ groupId, userId, userName }) => {
      console.log(`User ${userName} stopped typing in group ${groupId}`);
      // Broadcast to everyone else in the group
      socket.to(`group_${groupId}`).emit('user-typing-group', {
        groupId,
        userId,
        userName,
        isTyping: false
      });
    });
    
    // Handle sending messages via socket
    socket.on('send-message', async ({ content, chatId, sender }) => {
      try {
        console.log(`Received message via socket: ${content} in chat ${chatId} from ${sender}`);
        
        // Import message model directly to avoid circular dependencies
        const Message = (await import('./models/Message.js')).default;
        
        // Create the message in database
        const message = await Message.create({ 
          chat: chatId, 
          sender: sender, 
          content: content,
          messageType: 'direct'
        });
        
        // Populate sender details
        const populatedMessage = await message.populate('sender', 'name');
        
        // Broadcast to everyone in the chat room including sender (for confirmation)
        io.to(chatId).emit('new-message', populatedMessage);
        
        console.log(`Stored and broadcast message: ${message._id}`);
      } catch (error) {
        console.error('Error storing message from socket:', error);
        // Send error back to sender
        socket.emit('message-error', {
          error: error.message,
          originalMessage: { content, chatId, sender }
        });
      }
    });
    
    // Handle sending group messages via socket
    socket.on('send-group-message', async ({ content, groupId, sender }) => {
      try {
        console.log(`Received group message via socket: ${content} in group ${groupId} from ${sender}`);
        
        // Import models directly to avoid circular dependencies
        const Message = (await import('./models/Message.js')).default;
        const Group = (await import('./models/Group.js')).default;
        
        // Check if user is a member of the group
        const isMember = await Group.isMember(groupId, sender);
        if (!isMember) {
          throw new Error('You are not a member of this group');
        }
        
        // Check group settings if needed
        const group = await Group.findById(groupId);
        if (group.settings.sendMessages === 'admins') {
          const isAdmin = await Group.isAdmin(groupId, sender);
          if (!isAdmin) {
            throw new Error('Only admins can send messages to this group');
          }
        }
        
        // Create the message in database
        const message = await Message.create({ 
          group: groupId, 
          sender: sender, 
          content: content,
          messageType: 'group'
        });
        
        // Populate sender details
        const populatedMessage = await message.populate('sender', 'name email avatar');
        
        // Update group's updatedAt timestamp
        await Group.findByIdAndUpdate(groupId, { updatedAt: new Date() });
        
        // Broadcast to everyone in the group room including sender
        io.to(`group_${groupId}`).emit('group-new-message', populatedMessage);
        
        console.log(`Stored and broadcast group message: ${message._id}`);
      } catch (error) {
        console.error('Error storing group message from socket:', error);
        // Send error back to sender
        socket.emit('message-error', {
          error: error.message,
          originalMessage: { content, groupId, sender }
        });
      }
    });
    
    // Handle editing messages via socket
    socket.on('edit-message', async ({ messageId, content, userId }) => {
      try {
        console.log(`Editing message ${messageId} with content: ${content} by user ${userId}`);
        
        // Import models
        const Message = (await import('./models/Message.js')).default;
        
        // Find the message
        const message = await Message.findById(messageId);
        
        // Check if message exists
        if (!message) {
          throw new Error('Message not found');
        }
        
        // Check if user is the sender (authorization)
        if (message.sender.toString() !== userId) {
          throw new Error('You can only edit your own messages');
        }
        
        // Update the message
        message.content = content;
        message.isEdited = true;
        message.updatedAt = Date.now();
        
        await message.save();
        const updatedMessage = await Message.findById(messageId).populate('sender', 'name');
        
        // Get the chat ID to broadcast to the right room
        const chatId = message.chat.toString();
        
        // Broadcast to everyone in the chat room
        io.to(chatId).emit('updated-message', updatedMessage);
        
        console.log(`Message ${messageId} updated and broadcast to chat ${chatId}`);
        
        // Send success response to sender
        socket.emit('edit-message-success', { messageId });
      } catch (error) {
        console.error('Error editing message via socket:', error);
        // Send error back to sender
        socket.emit('edit-message-error', {
          error: error.message,
          messageId
        });
      }
    });
    
    // Handle deleting messages via socket
    socket.on('delete-message', async ({ messageId, userId }) => {
      try {
        console.log(`Deleting message ${messageId} by user ${userId}`);
        
        // Import models
        const Message = (await import('./models/Message.js')).default;
        
        // Find the message
        const message = await Message.findById(messageId);
        
        // Check if message exists
        if (!message) {
          throw new Error('Message not found');
        }
        
        // Check if user is the sender (authorization)
        if (message.sender.toString() !== userId) {
          throw new Error('You can only delete your own messages');
        }
        
        // Store the chat ID before deletion for socket emission
        const chatId = message.chat.toString();
        
        // Delete the message
        await Message.findByIdAndDelete(messageId);
        
        // Broadcast to everyone in the chat room
        io.to(chatId).emit('deleted-message', { messageId });
        
        console.log(`Message ${messageId} deleted and broadcast to chat ${chatId}`);
        
        // Send success response to sender
        socket.emit('delete-message-success', { messageId });
      } catch (error) {
        console.error('Error deleting message via socket:', error);
        // Send error back to sender
        socket.emit('delete-message-error', {
          error: error.message,
          messageId
        });
      }
    });
    
    // Handle fetching chat messages via socket
    socket.on('fetch-messages', async ({ chatId }) => {
      try {
        console.log(`Fetching messages for chat ${chatId} via socket`);
        
        // Import models
        const Message = (await import('./models/Message.js')).default;
        
        // Fetch messages for the chat
        const messages = await Message.find({ chat: chatId }).populate('sender', 'name');
        
        // Send messages directly to the requesting client
        socket.emit('chat-messages', { chatId, messages });
        
        console.log(`Sent ${messages.length} messages for chat ${chatId}`);
      } catch (error) {
        console.error('Error fetching messages via socket:', error);
        // Send error back to sender
        socket.emit('fetch-messages-error', {
          error: error.message,
          chatId
        });
      }
    });
    
    // User changes status (online, away, offline)
    socket.on('status-change', ({ userId, status }) => {
      if (userId && onlineUsers.has(userId)) {
        // Update user status
        const userData = onlineUsers.get(userId);
        userData.status = status;
        userData.lastActive = new Date();
        onlineUsers.set(userId, userData);
        
        // Broadcast status change to all clients
        io.emit('user-status-change', {
          userId,
          status,
          timestamp: new Date()
        });
      }
    });

    // User requests all user statuses
    socket.on('get-user-statuses', () => {
      // Convert the map to a regular object
      const statusesObj = {};
      for (const [userId, userData] of onlineUsers.entries()) {
        statusesObj[userId] = userData.status;
      }
      
      // Send only to the requesting client
      socket.emit('user-statuses', statusesObj);
      console.log('Sent user statuses to client:', Object.keys(statusesObj).length, 'users');
    });

    // Handle editing group messages via socket
    socket.on('edit-group-message', async ({ messageId, content, userId, groupId }) => {
      try {
        console.log(`Editing group message ${messageId} with content: ${content} by user ${userId}`);
        
        // Import models
        const Message = (await import('./models/Message.js')).default;
        const Group = (await import('./models/Group.js')).default;
        
        // Check if user is a member of the group
        const isMember = await Group.isMember(groupId, userId);
        if (!isMember) {
          throw new Error('You are not a member of this group');
        }
        
        // Find the message
        const message = await Message.findById(messageId);
        
        // Check if message exists
        if (!message) {
          throw new Error('Message not found');
        }
        
        // Check if user is the sender (authorization)
        if (message.sender.toString() !== userId) {
          throw new Error('You can only edit your own messages');
        }
        
        // Update the message
        message.content = content;
        message.isEdited = true;
        message.updatedAt = Date.now();
        
        await message.save();
        const updatedMessage = await Message.findById(messageId).populate('sender', 'name email avatar');
        
        // Broadcast to everyone in the group room
        io.to(`group_${groupId}`).emit('group-updated-message', updatedMessage);
        
        console.log(`Group message ${messageId} updated and broadcast to group ${groupId}`);
        
        // Send success response to sender
        socket.emit('edit-group-message-success', { messageId });
      } catch (error) {
        console.error('Error editing group message via socket:', error);
        // Send error back to sender
        socket.emit('edit-group-message-error', {
          error: error.message,
          messageId
        });
      }
    });
    
    // Handle deleting group messages via socket
    socket.on('delete-group-message', async ({ messageId, userId, groupId }) => {
      try {
        console.log(`Deleting group message ${messageId} by user ${userId}`);
        
        // Import models
        const Message = (await import('./models/Message.js')).default;
        const Group = (await import('./models/Group.js')).default;
        
        // Check if user is a member of the group
        const isMember = await Group.isMember(groupId, userId);
        if (!isMember) {
          throw new Error('You are not a member of this group');
        }
        
        // Find the message
        const message = await Message.findById(messageId);
        
        // Check if message exists
        if (!message) {
          throw new Error('Message not found');
        }
        
        // Check if user is the sender (authorization)
        if (message.sender.toString() !== userId) {
          throw new Error('You can only delete your own messages');
        }
        
        // Delete the message
        await Message.findByIdAndDelete(messageId);
        
        // Broadcast to everyone in the group room
        io.to(`group_${groupId}`).emit('group-deleted-message', { messageId });
        
        console.log(`Group message ${messageId} deleted and broadcast to group ${groupId}`);
        
        // Send success response to sender
        socket.emit('delete-group-message-success', { messageId });
      } catch (error) {
        console.error('Error deleting group message via socket:', error);
        // Send error back to sender
        socket.emit('delete-group-message-error', {
          error: error.message,
          messageId
        });
      }
    });
    
    // Disconnect handler
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Find the user who disconnected
      let disconnectedUserId = null;
      for (const [userId, userData] of onlineUsers.entries()) {
        if (userData.socketId === socket.id) {
          disconnectedUserId = userId;
          // Update user status
          onlineUsers.set(userId, {
            ...userData,
            status: 'offline',
            lastActive: new Date()
          });
          break;
        }
      }
      
      // Broadcast disconnect to all users if we found who it was
      if (disconnectedUserId) {
        io.emit('user-status-change', {
          userId: disconnectedUserId,
          status: 'offline',
          timestamp: new Date()
        });
      }
    });
  });

  return io;
};

export default setupSocketServer;
