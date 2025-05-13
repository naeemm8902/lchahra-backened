import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const cardSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    attachments: [
      {
        fileUrl: String,
        fileName: String,
        fileType: String
      }
    ],
    comments: [
      {
        commentId: { type: Schema.Types.ObjectId, default: () => new Types.ObjectId() },
        text: String,
        commentedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        commentedAt: { type: Date, default: Date.now }
      }
    ],
    isArchive: { type: Boolean, default: false },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    columnId: { type: Schema.Types.ObjectId, ref: 'Column', required: true },
    dueDate: { type: Date },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

const Card = model('Card', cardSchema);
export default Card;
