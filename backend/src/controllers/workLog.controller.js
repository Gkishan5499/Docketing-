const { WorkLog } = require('../models');
const { createResourceController } = require('./resource.controller');

module.exports = createResourceController({
  Model: WorkLog,
  name: 'Work log',
  searchFields: ['task', 'matterName', 'attorney'],
  fields: ['matterId', 'matterName', 'task', 'hours', 'date', 'attorney', 'notes', 'billable'],
});
