import mongoose from 'mongoose';

/**
 * One document per refresh token. Rotation chains share a `family`;
 * presenting an already-rotated token burns the whole family (theft signal).
 */
const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    replacedBy: { type: String, default: null },

    userAgent: String,
    ip: String,
    device: String,

    lastUsedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

export const Session = mongoose.model('Session', sessionSchema);
