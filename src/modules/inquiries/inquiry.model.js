import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
    projectType: { type: String, trim: true, maxlength: 120 },
    budget: { type: String, trim: true, maxlength: 120 },
    message: { type: String, trim: true, maxlength: 3000 },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'contacted', 'closed', 'spam'],
      default: 'new',
      index: true,
    },
    adminNotes: { type: String, trim: true, maxlength: 5000 },
    source: { type: String, default: 'website-contact', index: true },
    ip: String,
    userAgent: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

inquirySchema.index({ createdAt: -1, status: 1 });
inquirySchema.index({ name: 'text', email: 'text', phone: 'text', message: 'text' });

export const Inquiry = mongoose.model('Inquiry', inquirySchema);
