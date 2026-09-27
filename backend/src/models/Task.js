const mongoose = require('mongoose');
const { organizationRef, userRef } = require('./common');

const taskSchema = new mongoose.Schema({
  organizationId: organizationRef,
  title: { type: String, required: true },
  description: String,
  matterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Matter' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  assignedTo: userRef,
  priority: String,
  status: { type: String, default: 'OPEN' },
  dueDate: Date,
  completedAt: Date,
  createdBy: userRef,
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
