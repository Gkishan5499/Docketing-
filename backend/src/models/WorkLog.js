const mongoose = require('mongoose');
const { organizationRef, userRef } = require('./common');

const workLogSchema = new mongoose.Schema({
  organizationId: organizationRef,
  matterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Matter', required: true },
  matterName: String,
  task: { type: String, required: true },
  hours: { type: Number, min: 0, required: true },
  date: { type: Date, required: true },
  attorney: String,
  notes: String,
  billable: { type: Boolean, default: true },
  createdBy: userRef,
}, { timestamps: true });

module.exports = mongoose.model('WorkLog', workLogSchema);
