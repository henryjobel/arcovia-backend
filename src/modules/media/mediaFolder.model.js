import mongoose from 'mongoose';

const mediaFolderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaFolder', default: null, index: true },
    /** Materialized path, e.g. '/products/2026' — mirrors the Cloudinary folder. */
    path: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const MediaFolder = mongoose.model('MediaFolder', mediaFolderSchema);
