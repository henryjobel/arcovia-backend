import mongoose from 'mongoose';

/**
 * One document per settings group ('general', 'branding', 'smtp'…).
 * Group saves are atomic and each group is one cache entry.
 * Values are Mixed but ALWAYS pass the group's Zod schema before write.
 */
const settingSchema = new mongoose.Schema(
  {
    group: { type: String, required: true, unique: true },
    values: { type: mongoose.Schema.Types.Mixed, default: {} },
    /** Public groups are exposed (merged) on GET /public/settings. */
    isPublic: { type: Boolean, default: false },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, minimize: false }
);

export const Setting = mongoose.model('Setting', settingSchema);
