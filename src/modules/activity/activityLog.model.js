import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true }, // 'create' | 'update' | 'delete' | 'login' …
    module: { type: String, required: true, index: true },
    targetType: String,
    targetId: mongoose.Schema.Types.ObjectId,
    summary: String,
    diff: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
// auto-purge after 180 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
