const { Deadline } = require('../models');
const { createResourceController } = require('./resource.controller');

module.exports = createResourceController({
  Model: Deadline,
  name: 'Deadline',
  searchFields: ['title', 'description', 'deadlineType'],
  fields: ['matterId', 'title', 'description', 'deadlineDate', 'deadlineTime', 'deadlineType', 'priority', 'status', 'assignedTo', 'reminderSettings'],
});
