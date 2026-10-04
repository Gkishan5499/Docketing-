const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  legalName: String,
  email: { type: String, lowercase: true, trim: true },
  phone: String,
  address: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
  website: String,
  logo: String,
  timezone: { type: String, default: 'UTC' },
  dateFormat: { type: String, default: 'yyyy-MM-dd' },
  subscription: { type: String, enum: ['active', 'trial', 'suspended', 'cancelled'], default: 'trial' },
  plan: { type: String, enum: ['Solo Counsel', 'Chambers', 'Firm Office'], default: 'Solo Counsel' },
  seatsTotal: { type: Number, default: 1, min: 1 },
  seatsUsed: { type: Number, default: 1, min: 0 },
  monthlyValue: { type: Number, default: 0, min: 0 },
  renewalDate: Date,
  ownerName: String,
  ownerEmail: { type: String, lowercase: true, trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
