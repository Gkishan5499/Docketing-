const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { Document } = require('../models');
const { fail, ok } = require('../utils');
const env = require('../config/env');

async function findDocumentAndFile(req) {
  const param = decodeURIComponent(req.params.id || '');
  const orgId = req.organizationId;
  let document = null;

  // 1. Try finding by MongoDB ObjectId
  if (mongoose.isValidObjectId(param)) {
    document = await Document.findOne({
      _id: param,
      organizationId: orgId,
      isArchived: { $ne: true },
    });
  }

  // 2. Try finding by storageKey, originalName, or name
  if (!document) {
    document = await Document.findOne({
      organizationId: orgId,
      isArchived: { $ne: true },
      $or: [
        { storageKey: param },
        { name: param },
        { originalName: param },
      ],
    }).sort({ createdAt: -1 });
  }

  // 3. Try finding loosely by name substring
  if (!document) {
    const escapedParam = param.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    document = await Document.findOne({
      organizationId: orgId,
      isArchived: { $ne: true },
      name: { $regex: escapedParam, $options: 'i' },
    }).sort({ createdAt: -1 });
  }

  // If document found, check physical file
  if (document && document.storageKey) {
    const filePath = path.join(env.uploadDir, path.basename(document.storageKey));
    if (fs.existsSync(filePath)) {
      return { document, filePath };
    }
  }

  // 4. Direct disk fallback if file is in uploadDir
  if (fs.existsSync(env.uploadDir)) {
    const files = fs.readdirSync(env.uploadDir);
    const directMatch = files.find(
      (f) => f === param || f.endsWith(param) || f.toLowerCase().includes(param.toLowerCase())
    );
    if (directMatch) {
      const filePath = path.join(env.uploadDir, directMatch);
      const ext = path.extname(directMatch).slice(1);
      const docFallback = document || {
        _id: param,
        name: directMatch.split('-').slice(2).join('-') || directMatch,
        originalName: directMatch.split('-').slice(2).join('-') || directMatch,
        mimeType: ext === 'pdf' ? 'application/pdf' : 'application/octet-stream',
        fileType: ext,
      };
      return { document: docFallback, filePath };
    }
  }

  return { document, filePath: null };
}

async function upload(req, res, next) {
  try {
    if (!req.file) throw fail('A file is required', 400, 'FILE_REQUIRED');
    const folderPath = req.body.folder || req.body.folderPath || '/LawyersDiary';
    const document = await Document.create({
      organizationId: req.organizationId,
      matterId: req.body.matterId || undefined,
      clientId: req.body.clientId || undefined,
      name: req.body.name || req.file.originalname,
      originalName: req.file.originalname,
      fileType: path.extname(req.file.originalname).slice(1).toLowerCase(),
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      storageKey: req.file.filename,
      storageProvider: 'local',
      documentType: req.body.documentType,
      folderPath,
      uploadedBy: req.user._id,
      tags: req.body.tags ? String(req.body.tags).split(',').map((tag) => tag.trim()) : [],
    });

    const responseData = {
      ...document.toObject(),
      downloadUrl: `/api/v1/documents/${document._id}/download`,
      viewUrl: `/api/v1/documents/${document._id}/view`,
    };

    ok(res, responseData, 'Document uploaded successfully');
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const docs = await Document.find({
      organizationId: req.organizationId,
      isArchived: { $ne: true },
    }).sort({ createdAt: -1 }).lean();

    const formatted = docs.map((d) => ({
      ...d,
      downloadUrl: `/api/v1/documents/${d._id}/download`,
      viewUrl: `/api/v1/documents/${d._id}/view`,
    }));

    ok(res, formatted, 'Documents fetched successfully');
  } catch (error) {
    next(error);
  }
}

async function download(req, res, next) {
  try {
    const { document, filePath } = await findDocumentAndFile(req);
    if (!filePath || !fs.existsSync(filePath)) {
      throw fail('Document file not found on disk', 404, 'FILE_NOT_FOUND');
    }
    const downloadName = (document && (document.originalName || document.name)) || path.basename(filePath);
    res.download(filePath, downloadName);
  } catch (error) {
    next(error);
  }
}

async function view(req, res, next) {
  try {
    const { document, filePath } = await findDocumentAndFile(req);
    if (!filePath || !fs.existsSync(filePath)) {
      throw fail('Document file not found on disk', 404, 'FILE_NOT_FOUND');
    }

    const ext = path.extname(filePath).toLowerCase();
    let mimeType = (document && document.mimeType) || 'application/octet-stream';
    if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.txt') mimeType = 'text/plain';

    const displayName = (document && (document.originalName || document.name)) || path.basename(filePath);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(displayName)}"`);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const param = decodeURIComponent(req.params.id || '');
    let doc = null;
    if (mongoose.isValidObjectId(param)) {
      doc = await Document.findOneAndUpdate(
        { _id: param, organizationId: req.organizationId },
        { isArchived: true },
        { new: true }
      );
    }
    if (!doc) {
      doc = await Document.findOneAndUpdate(
        { organizationId: req.organizationId, $or: [{ name: param }, { storageKey: param }] },
        { isArchived: true },
        { new: true }
      );
    }
    ok(res, doc, 'Document removed successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = { upload, list, download, view, remove };
