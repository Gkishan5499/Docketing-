const { Task } = require('../models');
const { createResourceController } = require('./resource.controller');

module.exports = createResourceController({
  Model: Task,
  name: 'Task',
  searchFields: ['title', 'description', 'status'],
  fields: ['title', 'description', 'matterId', 'clientId', 'assignedTo', 'priority', 'status', 'dueDate'],
});
