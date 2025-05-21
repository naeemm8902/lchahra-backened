import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const projectSchema = new Schema(
  {

    projectName: { type: String, required: true },
    projectWorkspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
    columnOrder: [{ type: Schema.Types.ObjectId, ref: 'Column' }],
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

const Project = model('Project', projectSchema);
export default Project;
