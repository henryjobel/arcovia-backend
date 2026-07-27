import mongoose from 'mongoose';
import { seoMongooseSchema } from '../../core/schemas/seo.schema.js';
import { sectionSchema } from '../pages/page.model.js';

/** Generic entry for every content type in contentTypes.registry.js — one collection, `typeKey` scoped. */
const entrySchema = new mongoose.Schema(
  {
    typeKey: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, index: true, sparse: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },
    seo: seoMongooseSchema,
    sections: { type: [sectionSchema], default: [] }, // optional builder tree for hasDetailPage types
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

// `sparse` alone doesn't help on a compound index: since `typeKey` is always
// present, Mongo still indexes slug-less docs as slug:null and collides them.
// A partial index scoped to "slug is actually a string" is the correct fix.
entrySchema.index({ typeKey: 1, slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: 'string' } } });
entrySchema.index({ typeKey: 1, status: 1, order: 1 });
entrySchema.index({ title: 'text' });

export const Entry = mongoose.model('Entry', entrySchema);
