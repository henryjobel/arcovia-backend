import mongoose from 'mongoose';
import { seoMongooseSchema } from '../../core/schemas/seo.schema.js';

/**
 * A section is one instance of a registry component type (Backend/src/modules/components/registry.js) —
 * deliberately flat (no blocks/columns nesting), matching the approved section-list editor.
 */
export const sectionSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },
    type: { type: String, required: true },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    props: { type: mongoose.Schema.Types.Mixed, default: {} },
    dynamicSource: {
      kind: { type: String, enum: ['entries', 'posts', 'none'], default: 'none' },
      contentType: String, // e.g. 'service', 'project' — only when kind='entries'
      filters: mongoose.Schema.Types.Mixed,
      sort: String,
      limit: Number,
    },
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['standard', 'home', 'system'], default: 'standard', index: true },
    systemKey: { type: String, sparse: true, unique: true }, // seeded pages: undeletable
    template: { type: String, default: 'default' },

    draft: { sections: { type: [sectionSchema], default: [] } },
    published: {
      sections: { type: [sectionSchema], default: [] },
      version: { type: Number, default: 0 },
      at: Date,
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    hasUnpublishedChanges: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published', 'unpublished'], default: 'draft', index: true },

    seo: seoMongooseSchema,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

pageSchema.index({ title: 'text', slug: 'text' });

export const Page = mongoose.model('Page', pageSchema);
