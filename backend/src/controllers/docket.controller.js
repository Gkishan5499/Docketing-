const { DocketEvent } = require('../models');
const { createResourceController } = require('./resource.controller');

module.exports = createResourceController({
  Model: DocketEvent,
  name: 'Docket event',
  searchFields: ['type', 'matterName', 'venue'],
  fields: ['matterId', 'type', 'matterName', 'date', 'time', 'venue', 'priority', 'attorney', 'notes'],
});
