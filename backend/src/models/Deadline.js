const mongoose = require('mongoose');
const { organizationRef, userRef } = require('./common');

const deadlineSchema = new mongoose.Schema({
  organizationId: organizationRef,
  matterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Matter', required: true },
  title: { type: String, required: true },
  description: String,
  deadlineDate: { type: Date, required: true, index: true },
  deadlineTime: String,
  deadlineType: String,
  priority: String,
  status: { type: String, enum: ['OPEN', 'COMPLETED', 'CANCELLED'], default: 'OPEN' },
  assignedTo: userRef,
  completedAt: Date,
  reminderSettings: mongoose.Schema.Types.Mixed,
  createdBy: userRef,
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

deadlineSchema.index({ organizationId: 1, deadlineDate: 1, status: 1 });
module.exports = mongoose.model('Deadline', deadlineSchema);
