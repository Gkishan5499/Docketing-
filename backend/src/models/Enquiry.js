const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    firm: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    plan: { type: String, default: 'General' },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'],
      default: 'NEW',
    },
    emailSentToAdmin: { type: Boolean, default: false },
    emailSentToUser: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Enquiry', enquirySchema);
