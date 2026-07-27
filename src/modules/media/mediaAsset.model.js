import mongoose from 'mongoose';
import { MEDIA_KINDS } from '../../config/constants.js';

const mediaAssetSchema = new mongoose.Schema(
  {
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaFolder', default: null, index: true },
    kind: { type: String, enum: MEDIA_KINDS, required: true, index: true },

    provider: { type: String, default: 'cloudinary' },
    publicId: { type: String, required: true, unique: true },
    resourceType: { type: String, default: 'image' }, // cloudinary resource_type — needed for destroy/replace
    url: String,
    secureUrl: { type: String, required: true },
    format: String,
    width: Number,
    height: Number,
    bytes: Number,
    duration: Number,

    title: { type: String, trim: true },
    alt: { type: Map, of: String, default: undefined },
    caption: { type: Map, of: String, default: undefined },
    tags: { type: [String], index: true, default: [] },
    focalPoint: { x: Number, y: Number },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

mediaAssetSchema.index({ folder: 1, kind: 1, createdAt: -1 });
mediaAssetSchema.index({ title: 'text', tags: 'text' });

export const MediaAsset = mongoose.model('MediaAsset', mediaAssetSchema);
