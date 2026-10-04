const express = require('express');
const { auth } = require('../middleware/auth');
const calendarController = require('../controllers/calendar.controller');

const router = express.Router();

// Public subscription endpoint accessed by Google Calendar servers
router.get('/feed/:token', calendarController.getFeed);

// Protected endpoints for authenticated lawyers
router.get('/settings', auth, calendarController.getSettings);
router.post('/settings', auth, calendarController.updateSettings);
router.post('/rotate-token', auth, calendarController.rotateToken);

module.exports = router;
