import mongoose from 'mongoose';

const invitationToWorkSpaceSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Assuming `User` is the collection name
      required: true,
    },
    invitedWorkspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace', // Assuming `Workspace` is the collection name
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'rejected', 'accepted'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const InvitationToWorkspace = mongoose.model('InvitationToWorkspace', invitationToWorkSpaceSchema);

export default InvitationToWorkspace;
