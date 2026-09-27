const mongoose = require('mongoose');
const { organizationRef, userRef } = require('./common');

const docketEventSchema = new mongoose.Schema({
  organizationId: organizationRef,
  matterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Matter', required: true, index: true },
  type: String,
  matterName: String,
  date: { type: Date, required: true, index: true },
  time: String,
  venue: String,
  priority: { type: String, enum: ['ug', 'wa', 'ok'], default: 'ok' },
  attorney: String,
  notes: String,
  createdBy: userRef,
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('DocketEvent', docketEventSchema);
