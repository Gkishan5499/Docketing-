const { Matter } = require('../models');
const { createResourceController } = require('./resource.controller');

module.exports = createResourceController({
  Model: Matter,
  name: 'Matter',
  searchFields: ['mark', 'caseTitle', 'caseNo', 'appNo', 'clientName'],
  fields: ['type', 'clientId', 'clientName', 'appNo', 'mark', 'typeOfMark', 'markImage', 'markFileName', 'classes', 'inventors', 'nature', 'designClass', 'goods', 'area', 'caseNo', 'caseTitle', 'court', 'courtNo', 'judgeName', 'vcLink', 'bench', 'filingDate', 'nextDate', 'status', 'stage', 'priority', 'attorney', 'assignedAttorneyId', 'assignedStaffIds', 'notes', 'tags', 'statusHistory'],
});
