function notFound(req, res) { res.status(404).json({ success: false, message: 'Route not found', error: { code: 'NOT_FOUND' } }); }
function errorHandler(error, req, res, next) { const status = error.status || (error.name === 'ValidationError' ? 400 : error.code === 11000 ? 409 : 500); const code = error.code || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'); if (status >= 500) console.error(error); res.status(status).json({ success: false, message: status >= 500 ? 'Internal server error' : error.message, error: { code } }); }
module.exports = { notFound, errorHandler };
