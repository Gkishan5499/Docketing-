const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signAccess = (user) => jwt.sign({ sub: user._id.toString(), ...(user.organizationId ? { organizationId: user.organizationId.toString() } : {}), role: user.role }, env.accessSecret, { expiresIn: env.accessExpires });
const signRefresh = (user, tokenId) => jwt.sign({ sub: user._id.toString(), tokenId }, env.refreshSecret, { expiresIn: env.refreshExpires });
const parsePagination = (query) => { const page = Math.max(1, Number(query.page) || 1); const limit = Math.min(100, Math.max(1, Number(query.limit) || 20)); return { page, limit, skip: (page - 1) * limit }; };
const ok = (res, data, message = 'Success', pagination) => res.json({ success: true, message, data, ...(pagination ? { pagination } : {}) });
const fail = (message, status = 400, code = 'BAD_REQUEST') => { const error = new Error(message); error.status = status; error.code = code; return error; };
module.exports = { signAccess, signRefresh, parsePagination, ok, fail };
