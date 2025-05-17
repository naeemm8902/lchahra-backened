import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            require:true
        },
        role: {
            type: String,
            enum: ['member', 'collaborator', 'owner'],
            default: 'member',
            required: true
          }
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

const Workspace = mongoose.model('Workspace', workspaceSchema);
export default Workspace;
