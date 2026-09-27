const mongoose = require('mongoose');
const { organizationRef } = require('./common');

const notificationSchema = new mongoose.Schema({
  organizationId: organizationRef,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: String,
  title: String,
  message: String,
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  isRead: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', notificationSchema);
