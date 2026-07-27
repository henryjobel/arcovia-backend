import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true }, // 'system' | 'order.placed' | 'form.submitted' | 'stock.low' …
    title: { type: String, required: true },
    body: String,
    /** Admin-panel deep link, e.g. '/admin/orders/123'. */
    link: String,
    readAt: { type: Date, default: null, index: true },
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });
// auto-purge after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Notification = mongoose.model('Notification', notificationSchema);
