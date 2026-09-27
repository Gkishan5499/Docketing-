const { Document } = require('../models');
const { createResourceController } = require('./resource.controller');

module.exports = createResourceController({
  Model: Document,
  name: 'Document',
  searchFields: ['name', 'originalName', 'documentType'],
  fields: ['matterId', 'clientId', 'name', 'originalName', 'fileType', 'mimeType', 'fileSize', 'storageKey', 'storageProvider', 'documentType', 'version', 'tags'],
});
