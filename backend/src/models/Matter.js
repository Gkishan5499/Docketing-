const mongoose = require('mongoose');
const { organizationRef, userRef } = require('./common');

const matterSchema = new mongoose.Schema({
  organizationId: organizationRef,
  type: { type: String, required: true, uppercase: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  clientName: String,
  appNo: String,
  mark: String,
  classes: String,
  inventors: String,
  nature: String,
  designClass: String,
  goods: String,
  area: String,
  caseNo: String,
  caseTitle: String,
  court: String,
  bench: String,
  filingDate: Date,
  nextDate: Date,
  status: String,
  stage: String,
  priority: { type: String, enum: ['h', 'm', 'l'], default: 'm' },
  attorney: String,
  assignedAttorneyId: userRef,
  assignedStaffIds: [userRef],
  notes: String,
  tags: [String],
  statusHistory: [{ status: String, date: Date, note: String }],
  createdBy: userRef,
  updatedBy: userRef,
  isArchived: { type: Boolean, default: false },
  archivedAt: Date,
  archivedBy: userRef,
}, { timestamps: true });

matterSchema.index({ organizationId: 1, type: 1, isArchived: 1 });
matterSchema.index({ organizationId: 1, caseNo: 1 });
module.exports = mongoose.model('Matter', matterSchema);
