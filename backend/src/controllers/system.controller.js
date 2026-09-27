const { AuditLog, Deadline, Hearing, Matter, Notification, Organization, Task, User } = require('../models');
const { fail, ok, parsePagination } = require('../utils');

async function listNotifications(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { organizationId: req.organizationId, userId: req.user._id };
    const [data, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
    ]);
    ok(res, data, 'Notifications fetched successfully', { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
}

async function markNotificationRead(req, res, next) {
  try {
    const data = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, organizationId: req.organizationId },
      { isRead: true, readAt: new Date() },
      { new: true },
    );
    if (!data) throw fail('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    ok(res, data, 'Notification marked as read');
  } catch (error) { next(error); }
}

async function markAllNotificationsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { userId: req.user._id, organizationId: req.organizationId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    ok(res, null, 'Notifications marked as read');
  } catch (error) { next(error); }
}

async function getDashboardSummary(req, res, next) {
  try {
    const now = new Date();
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const scope = { organizationId: req.organizationId, isArchived: { $ne: true } };
    const [activeCases, pendingCases, upcomingDeadlines, overdueDeadlines, upcomingHearings, pendingTasks] = await Promise.all([
      Matter.countDocuments(scope),
      Matter.countDocuments({ ...scope, status: { $nin: ['Closed', 'Archived'] } }),
      Deadline.countDocuments({ organizationId: req.organizationId, status: 'OPEN', deadlineDate: { $gte: now, $lte: inThirtyDays } }),
      Deadline.countDocuments({ organizationId: req.organizationId, status: 'OPEN', deadlineDate: { $lt: now } }),
      Hearing.countDocuments({ organizationId: req.organizationId, hearingDate: { $gte: now, $lte: inThirtyDays } }),
      Task.countDocuments({ organizationId: req.organizationId, status: { $nin: ['COMPLETED', 'CLOSED'] } }),
    ]);
    ok(res, { activeCases, pendingCases, upcomingDeadlines, overdueDeadlines, upcomingHearings, pendingTasks }, 'Dashboard summary fetched successfully');
  } catch (error) { next(error); }
}

async function listUsers(req, res, next) {
  try { ok(res, await User.find({ organizationId: req.organizationId }).select('-passwordHash').sort({ name: 1 }), 'Users fetched successfully'); } catch (error) { next(error); }
}

async function getOrganization(req, res, next) {
  try { ok(res, await Organization.findById(req.organizationId), 'Organization fetched successfully'); } catch (error) { next(error); }
}

async function listAuditLogs(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { organizationId: req.organizationId };
    const [data, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);
    ok(res, data, 'Audit logs fetched successfully', { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
}

module.exports = { listNotifications, markNotificationRead, markAllNotificationsRead, getDashboardSummary, listUsers, getOrganization, listAuditLogs };
