const { Client } = require('../models');
const { createResourceController } = require('./resource.controller');

module.exports = createResourceController({
  Model: Client,
  name: 'Client',
  searchFields: ['name', 'email', 'contact', 'country', 'type'],
  fields: ['name', 'type', 'country', 'contact', 'email', 'phone', 'attorney'],
});
