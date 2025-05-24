import mongoose from 'mongoose';

const { Schema } = mongoose;

const groupMemberSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
});

const groupSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  coverPhoto: {
    type: String,
    default: ''
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workspace: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  members: [groupMemberSchema],
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    sendMessages: {
      type: String,
      enum: ['all', 'admins'],
      default: 'all'
    },
    addMembers: {
      type: String,
      enum: ['all', 'admins'],
      default: 'all'
    },
    changeGroupInfo: {
      type: String,
      enum: ['all', 'admins'],
      default: 'admins'
    },
    pinMessages: {
      type: String,
      enum: ['all', 'admins'],
      default: 'admins'
    }
  },
  pinnedMessages: [{
    message: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    pinnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
groupSchema.index({ name: 'text', description: 'text' });
groupSchema.index({ workspace: 1, isArchived: 1 });
groupSchema.index({ 'members.user': 1 });

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for unread message count (to be populated per user)
groupSchema.virtual('unreadCount', {
  ref: 'GroupMemberUnread',
  localField: '_id',
  foreignField: 'group',
  justOne: true
});

// Pre-save hook to ensure creator is an admin
groupSchema.pre('save', function(next) {
  if (this.isNew) {
    const creator = this.members.find(member => 
      member.user.toString() === this.createdBy.toString()
    );
    
    if (creator) {
      creator.role = 'admin';
    } else {
      this.members.push({
        user: this.createdBy,
        role: 'admin',
        addedBy: this.createdBy
      });
    }
  }
  next();
});

// Static method to check if user is a member of the group
groupSchema.statics.isMember = async function(groupId, userId) {
  const count = await this.countDocuments({
    _id: groupId,
    'members.user': userId,
    'members.isActive': true
  });
  return count > 0;
};

// Static method to check if user is an admin of the group
groupSchema.statics.isAdmin = async function(groupId, userId) {
  const count = await this.countDocuments({
    _id: groupId,
    'members.user': userId,
    'members.role': 'admin',
    'members.isActive': true
  });
  return count > 0;
};

// Instance method to add a member to the group
groupSchema.methods.addMember = async function(userId, addedById, role = 'member') {
  const memberExists = this.members.some(member => 
    member.user.toString() === userId.toString()
  );

  if (memberExists) {
    throw new Error('User is already a member of this group');
  }

  this.members.push({
    user: userId,
    role,
    addedBy: addedById
  });

  return this.save();
};

// Instance method to remove a member from the group
groupSchema.methods.removeMember = async function(userId, removedById) {
  const memberIndex = this.members.findIndex(member => 
    member.user.toString() === userId.toString()
  );

  if (memberIndex === -1) {
    throw new Error('User is not a member of this group');
  }

  // Prevent removing the last admin
  const isLastAdmin = this.members.filter(m => m.role === 'admin').length === 1 &&
    this.members[memberIndex].role === 'admin';

  if (isLastAdmin) {
    throw new Error('Cannot remove the last admin of the group');
  }

  this.members.splice(memberIndex, 1);
  return this.save();
};

// Instance method to update member role
groupSchema.methods.updateMemberRole = async function(userId, newRole, updatedById) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  
  if (!member) {
    throw new Error('User is not a member of this group');
  }

  // Prevent changing role of the last admin
  if (member.role === 'admin' && newRole !== 'admin') {
    const adminCount = this.members.filter(m => m.role === 'admin').length;
    if (adminCount <= 1) {
      throw new Error('Cannot remove the last admin of the group');
    }
  }

  member.role = newRole;
  return this.save();
};

// Instance method to pin a message
groupSchema.methods.pinMessage = async function(messageId, userId) {
  const isPinned = this.pinnedMessages.some(pm => 
    pm.message.toString() === messageId.toString()
  );

  if (isPinned) {
    throw new Error('Message is already pinned');
  }

  this.pinnedMessages.push({
    message: messageId,
    pinnedBy: userId
  });

  // Keep only the last 10 pinned messages
  if (this.pinnedMessages.length > 10) {
    this.pinnedMessages.shift();
  }

  return this.save();
};

// Instance method to unpin a message
groupSchema.methods.unpinMessage = async function(messageId) {
  const initialLength = this.pinnedMessages.length;
  this.pinnedMessages = this.pinnedMessages.filter(
    pm => pm.message.toString() !== messageId.toString()
  );

  if (this.pinnedMessages.length === initialLength) {
    throw new Error('Message is not pinned');
  }

  return this.save();
};

// Instance method to archive the group
groupSchema.methods.archive = async function(userId) {
  if (this.isArchived) {
    throw new Error('Group is already archived');
  }

  this.isArchived = true;
  this.archivedAt = new Date();
  this.archivedBy = userId;

  return this.save();
};

// Instance method to unarchive the group
groupSchema.methods.unarchive = async function() {
  if (!this.isArchived) {
    throw new Error('Group is not archived');
  }

  this.isArchived = false;
  this.archivedAt = undefined;
  this.archivedBy = undefined;

  return this.save();
};

const Group = mongoose.model('Group', groupSchema);

export default Group;