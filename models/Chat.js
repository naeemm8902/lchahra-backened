import mongoose from 'mongoose';

const { Schema } = mongoose;

const chatSchema = new Schema(
  {
    chatname: {
      type: String,
      default: '',
    },
    isGroup: {
      type: Boolean,
      required: true,
      default: false, // Private chat by default
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model
        required: true,
      },
    ],
    pendingInvites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Pending invite for users
        default: [],
      },
    ],
    // Optional: For workspace (group) chats, you might want to store a name or description
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Reference to the workspace this chat belongs to
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
    },
    // Reference to the group this chat is associated with (for group chats)
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
  },
  { timestamps: true },
);

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
