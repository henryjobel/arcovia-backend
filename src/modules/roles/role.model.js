import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    /** Permission keys ('pages.create'), module wildcards ('pages.*') or global '*'. */
    permissions: { type: [String], default: [] },
    /** Seeded roles: cannot be deleted; super-admin cannot be modified at all. */
    isSystem: { type: Boolean, default: false },
    /** Lower number = higher rank. Actors only manage levels strictly greater than their own. */
    level: { type: Number, required: true, default: 50 },
  },
  { timestamps: true }
);

export const Role = mongoose.model('Role', roleSchema);
