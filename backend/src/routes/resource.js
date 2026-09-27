const express = require('express');
const { auth, allow } = require('../middleware/auth');

function resourceRoutes({ controller, roles = ['FIRM_ADMIN', 'ATTORNEY', 'PARALEGAL', 'STAFF', 'VIEWER'] }) {
  const router = express.Router();
  router.use(auth);
  router.get('/', controller.list);
  router.post('/', allow(...roles.filter((role) => role !== 'VIEWER')), controller.create);
  router.get('/:id', controller.getById);
  router.patch('/:id', allow(...roles.filter((role) => role !== 'VIEWER')), controller.update);
  router.delete('/:id', allow('FIRM_ADMIN', 'ATTORNEY'), controller.archive);
  return router;
}
module.exports = { resourceRoutes };
