const mongoose = require('mongoose');
const { organizationRef, userRef } = require('./common');

const noteSchema = new mongoose.Schema({
  organizationId: organizationRef,
  matterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Matter', required: true },
  matterName: String,
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: String,
  pinned: { type: Boolean, default: false },
  createdBy: userRef,
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
