const mongoose = require('mongoose');
const { organizationRef, userRef } = require('./common');

const documentSchema = new mongoose.Schema({
  organizationId: organizationRef,
  matterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Matter' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  name: { type: String, required: true },
  originalName: String,
  fileType: String,
  mimeType: String,
  fileSize: Number,
  storageKey: { type: String, required: true },
  storageProvider: { type: String, default: 'local' },
  uploadedBy: userRef,
  documentType: String,
  folderPath: { type: String, default: '/LawyersDiary' },
  version: { type: Number, default: 1 },
  tags: [String],
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
