const cron = require('node-cron');
const { Deadline, Notification } = require('../models');

function startReminderJob() {
  cron.schedule('0 8 * * *', async () => {
    const now = new Date();
    const horizon = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const deadlines = await Deadline.find({ status: 'OPEN', deadlineDate: { $gte: now, $lte: horizon }, assignedTo: { $ne: null } }).lean();
    for (const deadline of deadlines) {
      await Notification.updateOne({ userId: deadline.assignedTo, entityType: 'Deadline', entityId: deadline._id, type: 'DEADLINE_REMINDER' }, { $setOnInsert: { organizationId: deadline.organizationId, userId: deadline.assignedTo, type: 'DEADLINE_REMINDER', title: 'Upcoming deadline', message: deadline.title, entityType: 'Deadline', entityId: deadline._id } }, { upsert: true });
    }
  }, { timezone: 'UTC' });
}

module.exports = { startReminderJob };