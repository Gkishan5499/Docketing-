const express = require('express');
const { auth, allow } = require('../middleware/auth');
const controller = require('../controllers/system.controller');

const router = express.Router();

router.get('/notifications', auth, controller.listNotifications);
router.patch('/notifications/:id/read', auth, controller.markNotificationRead);
router.patch('/notifications/read-all', auth, controller.markAllNotificationsRead);
router.get('/dashboard/summary', auth, controller.getDashboardSummary);
router.get('/users', auth, allow('FIRM_ADMIN', 'SUPER_ADMIN'), controller.listUsers);
router.get('/organizations/me', auth, controller.getOrganization);
router.get('/audit-logs', auth, allow('FIRM_ADMIN', 'SUPER_ADMIN'), controller.listAuditLogs);

module.exports = router;
