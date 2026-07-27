import mongoose from 'mongoose';

/**
 * Flat (non-nested) category vocabulary, scoped by `taxonomy` so one collection
 * serves portfolio categories now and blog categories in M5 — matches the
 * "one collection, scoped by taxonomy" pattern from docs/02 §9.1, simplified
 * (no parent/path nesting: this project's categories don't need it).
 */
const categorySchema = new mongoose.Schema(
  {
    taxonomy: { type: String, required: true, index: true }, // 'project' | 'blog'
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    order: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

categorySchema.index({ taxonomy: 1, slug: 1 }, { unique: true });

export const Category = mongoose.model('Category', categorySchema);
