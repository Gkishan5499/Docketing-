// Central model registry. Domain schemas live in their own files so imports
// make ownership explicit and Mongoose model names remain consistent.
module.exports = {
  Organization: require('./Organization'),
  User: require('./User'),
  Client: require('./Client'),
  Matter: require('./Matter'),
  DocketEvent: require('./DocketEvent'),
  Deadline: require('./Deadline'),
  Hearing: require('./Hearing'),
  Task: require('./Task'),
  Document: require('./Document'),
  Notification: require('./Notification'),
  AuditLog: require('./AuditLog'),
  Note: require('./Note'),
  WorkLog: require('./WorkLog'),
};
