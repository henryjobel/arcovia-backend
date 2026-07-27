import mongoose from 'mongoose';
import { sectionSchema } from './page.model.js';

/** Snapshot of what WAS published, taken right before it gets overwritten — powers "restore". */
const pageRevisionSchema = new mongoose.Schema(
  {
    page: { type: mongoose.Schema.Types.ObjectId, ref: 'Page', required: true, index: true },
    version: Number,
    title: String,
    sections: [sectionSchema],
    seo: mongoose.Schema.Types.Mixed,
    publishedAt: Date,
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

pageRevisionSchema.index({ page: 1, createdAt: -1 });

export const PageRevision = mongoose.model('PageRevision', pageRevisionSchema);
