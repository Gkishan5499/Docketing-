const mongoose = require('mongoose');
const { organizationRef, userRef } = require('./common');

const auditLogSchema = new mongoose.Schema({
  organizationId: organizationRef,
  userId: userRef,
  action: String,
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  metadata: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
