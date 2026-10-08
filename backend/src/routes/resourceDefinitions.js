const { resourceRoutes } = require('./resource');
const controllers = {
  client: require('../controllers/client.controller'),
  matter: require('../controllers/matter.controller'),
  docket: require('../controllers/docket.controller'),
  deadline: require('../controllers/deadline.controller'),
  hearing: require('../controllers/hearing.controller'),
  task: require('../controllers/task.controller'),
  document: require('../controllers/document.controller'),
  note: require('../controllers/note.controller'),
  workLog: require('../controllers/workLog.controller'),
};

const matterFields = [
  'type', 'clientId', 'clientName', 'appNo', 'mark', 'classes', 'inventors',
  'nature', 'designClass', 'goods', 'area', 'caseNo', 'caseTitle', 'court',
  'bench', 'filingDate', 'nextDate', 'status', 'stage', 'priority', 'attorney',
  'assignedAttorneyId', 'assignedStaffIds', 'notes', 'tags', 'statusHistory',
];

const definitions = [
  { path: '/clients', controller: controllers.client },
  { path: '/matters', controller: controllers.matter },
  { path: '/dockets', controller: controllers.docket },
  { path: '/deadlines', controller: controllers.deadline },
  { path: '/hearings', controller: controllers.hearing },
  { path: '/tasks', controller: controllers.task },
  { path: '/notes', controller: controllers.note },
  { path: '/work-logs', controller: controllers.workLog },
];

function registerResourceRoutes(router) {
  for (const definition of definitions) {
    router.use(definition.path, resourceRoutes({ controller: definition.controller }));
  }
}

module.exports = { registerResourceRoutes };
