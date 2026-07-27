import mongoose from 'mongoose';
import { seoMongooseSchema } from '../../core/schemas/seo.schema.js';

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: String,
    contentHtml: String,
    featuredImage: { assetId: mongoose.Schema.Types.Mixed, url: String, alt: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    tags: { type: [String], index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    readingTimeMinutes: Number,
    views: { type: Number, default: 0 },
    seo: seoMongooseSchema,

    status: { type: String, enum: ['draft', 'scheduled', 'published'], default: 'draft', index: true },
    publishedAt: Date,
    scheduledAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ isFeatured: 1, publishedAt: -1 });
postSchema.index({ title: 'text', excerpt: 'text' });

export const Post = mongoose.model('Post', postSchema);
