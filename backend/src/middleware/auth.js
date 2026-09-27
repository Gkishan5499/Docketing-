const jwt = require('jsonwebtoken');
const { User } = require('../models');
const env = require('../config/env');

async function auth(req, res, next) { try { const header = req.get('authorization'); const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken; if (!token) return res.status(401).json({ success: false, message: 'Authentication required', error: { code: 'AUTH_REQUIRED' } }); const payload = jwt.verify(token, env.accessSecret); const scope = payload.organizationId ? { organizationId: payload.organizationId } : {}; const user = await User.findOne({ _id: payload.sub, ...scope, isActive: true }).select('-passwordHash'); if (!user) return res.status(401).json({ success: false, message: 'Invalid session', error: { code: 'INVALID_SESSION' } }); req.user = user; req.organizationId = user.organizationId; next(); } catch (error) { next(Object.assign(new Error('Invalid or expired access token'), { status: 401, code: 'INVALID_TOKEN' })); } }
const allow = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : next(Object.assign(new Error('Insufficient permissions'), { status: 403, code: 'FORBIDDEN' }));
module.exports = { auth, allow };
