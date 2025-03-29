import mongoose from 'mongoose';

const verificationCodeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false },
});

const VerificationCodeModel = mongoose.model(
  'VerificationCode',
  verificationCodeSchema,
);

export default VerificationCodeModel;
