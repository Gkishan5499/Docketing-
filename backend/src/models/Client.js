const mongoose = require('mongoose');
const { organizationRef, userRef } = require('./common');

const clientSchema = new mongoose.Schema({
  organizationId: organizationRef,
  name: { type: String, required: true, trim: true },
  type: String,
  country: String,
  contact: String,
  email: String,
  phone: String,
  attorney: String,
  createdBy: userRef,
  isArchived: { type: Boolean, default: false },
  archivedAt: Date,
  archivedBy: userRef,
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
