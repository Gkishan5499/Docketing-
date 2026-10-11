const mongoose = require('mongoose');
const { organizationRef, userRef } = require('./common');

const legalNoticeSchema = new mongoose.Schema(
  {
    organizationId: organizationRef,
    noticeNo: { type: String, required: true, index: true },
    direction: { type: String, enum: ['SENT', 'RECEIVED'], default: 'SENT', required: true },
    category: { type: String, required: true },
    subject: { type: String, required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    clientName: String,
    
    // Sender (From)
    senderName: { type: String, required: true },
    senderDesignation: String,
    senderAddress: String,
    senderPhone: String,
    senderEmail: String,
    senderAdvocate: String,
    senderAdvocateDetails: String,

    // Recipient (To)
    recipientName: { type: String, required: true },
    recipientDesignation: String,
    recipientAddress: String,
    recipientPhone: String,
    recipientEmail: String,
    recipientAdvocate: String,

    // Substantive content
    summary: String,
    claimAmount: String,
    demands: String,

    // Dates & Limitation
    noticeDate: { type: Date, required: true },
    dispatchDate: Date,
    serviceDate: Date,
    curePeriodDays: { type: Number, default: 15 },
    replyDueDate: Date,

    // Dispatch & Tracking
    dispatchMode: String,
    trackingNo: String,
    postalStatus: String,
    trackingUrl: String,

    // Lifecycle
    status: {
      type: String,
      enum: [
        'Draft',
        'Dispatched',
        'Delivered / Served',
        'Reply Received',
        'Replied',
        'Settled / Complied',
        'Escalated to Litigation',
        'Expired / Actionable',
        'Closed',
      ],
      default: 'Dispatched',
    },
    priority: { type: String, enum: ['h', 'm', 'l'], default: 'm' },
    attorney: String,

    // Reply details
    replyReceived: { type: Boolean, default: false },
    replyDate: Date,
    replyRefNo: String,
    replySummary: String,

    // Linkage
    connectedMatterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Matter' },
    connectedMatterTitle: String,

    notes: String,
    statusHistory: [{ status: String, date: Date, note: String }],
    createdBy: userRef,
    updatedBy: userRef,
  },
  { timestamps: true }
);

legalNoticeSchema.index({ organizationId: 1, noticeNo: 1 });
legalNoticeSchema.index({ organizationId: 1, direction: 1, status: 1 });

module.exports = mongoose.model('LegalNotice', legalNoticeSchema);
