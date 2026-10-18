const express = require('express');
const { auth, allow } = require('../middleware/auth');
const controller = require('../controllers/enquiry.controller');

const router = express.Router();

// Public endpoint for prospective subscribers on landing page
router.post('/', controller.submitEnquiry);

// Protected endpoint for platform owner to review incoming enquiries
router.get('/', auth, allow('SUPER_ADMIN'), controller.listEnquiries);

module.exports = router;
