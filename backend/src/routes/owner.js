const express = require('express');
const { auth, allow } = require('../middleware/auth');
const controller = require('../controllers/owner.controller');

const router = express.Router();

router.use(auth, allow('SUPER_ADMIN'));
router.get('/firms', controller.listFirms);
router.post('/firms', controller.createFirm);
router.patch('/firms/:id', controller.updateFirm);
router.delete('/firms/:id', controller.archiveFirm);
router.post('/firms/:id/resend-invite', controller.resendFirmInvite);
router.get('/firms/:id/users', controller.listFirmUsers);
router.post('/firms/:id/users', controller.createFirmUser);
router.delete('/firms/:id/users/:userId', controller.revokeFirmUser);
router.get('/test-smtp', controller.testSmtp);

// Finance & Billing Management
router.get('/billing-overview', controller.getBillingOverview);
router.get('/payments', controller.listPayments);
router.get('/firms/:id/payments', controller.listPayments);
router.post('/firms/:id/payments', controller.recordPayment);

module.exports = router;