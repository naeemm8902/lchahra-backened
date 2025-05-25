import mongoose from 'mongoose';

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    // For one-on-one chats (mutual exclusion with group)
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: function() { return !this.group; },
    },
    // For group chats (mutual exclusion with chat)
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: function() { return !this.chat; },
    },
    // Message type to distinguish between chat types
    messageType: {
      type: String,
      enum: ['direct', 'group'],
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // Attachments (documents, images, etc.)
    attachment: {
      filename: String,        // Original filename
      path: String,            // Server path where file is stored
      mimetype: String,        // MIME type of the file
      size: Number,            // File size in bytes
      downloadUrl: String,     // URL for downloading the file
      uploadDate: {
        type: Date,
        default: Date.now
      }
    },
    // Track if message has been edited
    isEdited: {
      type: Boolean,
      default: false
    },
    // Track read receipts
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
    // For message replies
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    // For message reactions
    reactions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      emoji: {
        type: String,
        required: true
      }
    }],
    // For system messages (e.g., "User joined the group")
    isSystemMessage: {
      type: Boolean,
      default: false
    },
    // For message deletion (soft delete)
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedAt: {
      type: Date,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

// Virtual for message URL
messageSchema.virtual('url').get(function() {
  return `/messages/${this._id}`;
});

// Pre-save hook to set messageType
messageSchema.pre('save', function(next) {
  if (this.isNew) {
    this.messageType = this.group ? 'group' : 'direct';
  }
  next();
});

// Static method to mark messages as read
messageSchema.statics.markAsRead = async function(messageId, userId) {
  return this.findByIdAndUpdate(
    messageId,
    { 
      $addToSet: { 
        readBy: { 
          user: userId,
          readAt: new Date()
        } 
      } 
    },
    { new: true }
  );
};

const Message = mongoose.model('Message', messageSchema);

export default Message;
