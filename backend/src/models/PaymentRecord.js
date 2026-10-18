const mongoose = require('mongoose');

const paymentRecordSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  firmName: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, default: 'UPI' },
  referenceNumber: { type: String, trim: true },
  periodMonths: { type: Number, default: 1 },
  notes: { type: String, trim: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('PaymentRecord', paymentRecordSchema);
