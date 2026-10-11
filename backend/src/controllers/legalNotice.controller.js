const { LegalNotice } = require('../models');
const { createResourceController } = require('./resource.controller');

module.exports = createResourceController({
  Model: LegalNotice,
  name: 'LegalNotice',
  searchFields: ['noticeNo', 'subject', 'senderName', 'recipientName', 'clientName', 'category', 'trackingNo'],
  fields: [
    'noticeNo', 'direction', 'category', 'subject', 'clientId', 'clientName',
    'senderName', 'senderDesignation', 'senderAddress', 'senderPhone', 'senderEmail', 'senderAdvocate', 'senderAdvocateDetails',
    'recipientName', 'recipientDesignation', 'recipientAddress', 'recipientPhone', 'recipientEmail', 'recipientAdvocate',
    'summary', 'claimAmount', 'demands',
    'noticeDate', 'dispatchDate', 'serviceDate', 'curePeriodDays', 'replyDueDate',
    'dispatchMode', 'trackingNo', 'postalStatus', 'trackingUrl',
    'status', 'priority', 'attorney',
    'replyReceived', 'replyDate', 'replyRefNo', 'replySummary',
    'connectedMatterId', 'connectedMatterTitle',
    'notes', 'statusHistory',
  ],
});
