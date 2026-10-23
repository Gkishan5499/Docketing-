const express = require('express');
const { auth } = require('../middleware/auth');
const { ok } = require('../utils');
const controller = require('../controllers/auth.controller');
const router = express.Router();
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/send-otp', controller.sendOtp);
router.post('/verify-otp', controller.verifyOtp);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.post('/setup-password', controller.setupPassword);
router.get('/verify-setup-token', controller.verifySetupToken);
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await controller.buildPublicUser(req.user);
    ok(res, user, 'Current user fetched successfully');
  } catch (err) {
    next(err);
  }
});
router.post('/change-password', auth, controller.changePassword);
module.exports = router;
