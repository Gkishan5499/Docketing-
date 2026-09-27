const fs = require('node:fs');
const path = require('node:path');
const { Document } = require('../models');
const { fail, ok } = require('../utils');
const env = require('../config/env');

async function upload(req, res, next) {
  try {
    if (!req.file) throw fail('A file is required', 400, 'FILE_REQUIRED');
    const document = await Document.create({
      organizationId: req.organizationId,
      matterId: req.body.matterId || undefined,
      clientId: req.body.clientId || undefined,
      name: req.body.name || req.file.originalname,
      originalName: req.file.originalname,
      fileType: path.extname(req.file.originalname).slice(1),
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      storageKey: req.file.filename,
      storageProvider: 'local',
      documentType: req.body.documentType,
      uploadedBy: req.user._id,
      tags: req.body.tags ? String(req.body.tags).split(',').map((tag) => tag.trim()) : [],
    });
    ok(res, document, 'Document uploaded successfully');
  } catch (error) {
    next(error);
  }
}

async function download(req, res, next) {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
      isArchived: { $ne: true },
    });
    if (!document) throw fail('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    const filePath = path.join(env.uploadDir, path.basename(document.storageKey));
    if (!fs.existsSync(filePath)) throw fail('Document file not found', 404, 'FILE_NOT_FOUND');
    res.download(filePath, document.originalName || document.name);
  } catch (error) {
    next(error);
  }
}

module.exports = { upload, download };
