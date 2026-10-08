const jwt = require('jsonwebtoken');
const env = require('../config/env');

const crypto = require('node:crypto');

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.nodeEnv === 'production',
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
};

const signAccess = (user) => jwt.sign({ sub: user._id.toString(), ...(user.organizationId ? { organizationId: user.organizationId.toString() } : {}), role: user.role }, env.accessSecret, { expiresIn: env.accessExpires });
const signRefresh = (user, tokenId) => jwt.sign({ sub: user._id.toString(), tokenId }, env.refreshSecret, { expiresIn: env.refreshExpires });

function setAuthCookies(res, user) {
  res.cookie('accessToken', signAccess(user), { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 }); // 1 day
  res.cookie('refreshToken', signRefresh(user, crypto.randomUUID()), { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
}

function clearAuthCookies(res) {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
}

const parsePagination = (query) => { const page = Math.max(1, Number(query.page) || 1); const limit = Math.min(100, Math.max(1, Number(query.limit) || 20)); return { page, limit, skip: (page - 1) * limit }; };
const ok = (res, data, message = 'Success', pagination) => res.json({ success: true, message, data, ...(pagination ? { pagination } : {}) });
const fail = (message, status = 400, code = 'BAD_REQUEST') => { const error = new Error(message); error.status = status; error.code = code; return error; };

module.exports = { signAccess, signRefresh, cookieOptions, setAuthCookies, clearAuthCookies, parsePagination, ok, fail };

