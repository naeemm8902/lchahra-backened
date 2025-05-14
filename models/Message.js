import mongoose from 'mongoose';

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat', // Reference to the Chat model
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Assuming you have a User model
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true, // Trim whitespace from content
    },
    // Optional: Attachments (images, files, etc.)
    attachment: {
      type: String, // URL or file path to the attachment
    },
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;
