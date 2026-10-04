const express = require('express');
const authRoutes = require('./auth');
const documentRoutes = require('./documents');
const systemRoutes = require('./system');
const ownerRoutes = require('./owner');
const calendarRoutes = require('./calendar');
const { auth, allow } = require('../middleware/auth');
const userController = require('../controllers/user.controller');
const { registerResourceRoutes } = require('./resourceDefinitions');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/owner', ownerRoutes);
router.use('/calendar', calendarRoutes);
registerResourceRoutes(router);
router.use('/documents', documentRoutes);
router.get('/users', auth, allow('FIRM_ADMIN', 'SUPER_ADMIN'), userController.listUsers);
router.post('/users', auth, allow('FIRM_ADMIN', 'SUPER_ADMIN'), userController.inviteUser);
router.patch('/users/:id/deactivate', auth, allow('FIRM_ADMIN', 'SUPER_ADMIN'), userController.deactivateUser);
router.delete('/users/:id', auth, allow('FIRM_ADMIN', 'SUPER_ADMIN'), userController.deactivateUser);
router.use(systemRoutes);

module.exports = router;
