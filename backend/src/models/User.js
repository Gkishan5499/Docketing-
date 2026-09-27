const mongoose = require('mongoose');
const { organizationRef } = require('./common');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  phone: String,
  avatar: String,
  role: { type: String, enum: ['SUPER_ADMIN', 'FIRM_ADMIN', 'ATTORNEY', 'PARALEGAL', 'STAFF', 'VIEWER'], default: 'ATTORNEY' },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date,
  emailVerified: { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: true },
  permissions: [String],
}, { timestamps: true });

userSchema.index({ organizationId: 1, email: 1 }, { unique: true });
module.exports = mongoose.model('User', userSchema);
