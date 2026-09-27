const { Note } = require('../models');
const { createResourceController } = require('./resource.controller');

module.exports = createResourceController({
  Model: Note,
  name: 'Note',
  searchFields: ['title', 'content', 'matterName'],
  fields: ['matterId', 'matterName', 'title', 'content', 'priority', 'pinned'],
});
