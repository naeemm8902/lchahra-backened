import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const columnSchema = new Schema(
  {
    name: { type: String, required: true },
    color:{type:String},
    badgeText:{type:String},
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    cardOrder: [{ type: Schema.Types.ObjectId, ref: 'Card' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);
 
const Column = model('Column', columnSchema);
export default Column;
