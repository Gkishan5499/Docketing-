const express = require('express');
const { auth, allow } = require('../middleware/auth');
const controller = require('../controllers/owner.controller');

const router = express.Router();

router.use(auth, allow('SUPER_ADMIN'));
router.get('/firms', controller.listFirms);
router.post('/firms', controller.createFirm);

module.exports = router;