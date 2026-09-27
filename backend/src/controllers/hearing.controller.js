const { Hearing } = require('../models');
const { createResourceController } = require('./resource.controller');

module.exports = createResourceController({
  Model: Hearing,
  name: 'Hearing',
  searchFields: ['title', 'court', 'judge', 'location'],
  fields: ['matterId', 'title', 'hearingType', 'court', 'judge', 'location', 'hearingDate', 'hearingTime', 'duration', 'status', 'notes'],
});
