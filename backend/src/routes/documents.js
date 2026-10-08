const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const env = require('../config/env');
const controller = require('../controllers/documents.controller');

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: env.uploadDir,
    filename: (req, file, callback) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      callback(null, `${req.user._id}-${Date.now()}-${safeName}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.post('/upload', auth, upload.single('file'), controller.upload);
router.get('/list', auth, controller.list);
router.get('/:id/download', auth, controller.download);
router.get('/:id/view', auth, controller.view);
router.delete('/:id', auth, controller.remove);

module.exports = router;
