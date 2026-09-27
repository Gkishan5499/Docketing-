const mongoose = require('mongoose');
const { organizationRef, userRef } = require('./common');

const hearingSchema = new mongoose.Schema({
  organizationId: organizationRef,
  matterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Matter', required: true },
  title: String,
  hearingType: String,
  court: String,
  judge: String,
  location: String,
  hearingDate: { type: Date, required: true, index: true },
  hearingTime: String,
  duration: Number,
  status: String,
  notes: String,
  createdBy: userRef,
}, { timestamps: true });

module.exports = mongoose.model('Hearing', hearingSchema);
