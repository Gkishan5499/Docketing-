const jwt = require('jsonwebtoken');
const { User, Organization } = require('../models');
const env = require('../config/env');
const { setAuthCookies } = require('../utils');

async function auth(req, res, next) {
  try {
    const header = req.get('authorization');
    const token = header?.startsWith('Bearer ')
      ? header.slice(7)
      : (req.cookies?.accessToken || req.query?.token);
    let payload = null;

    if (token) {
      try {
        payload = jwt.verify(token, env.accessSecret);
      } catch {
        payload = null;
      }
    }

    // Silent recovery: If accessToken is missing or expired, attempt validation via refreshToken cookie
    if (!payload && req.cookies?.refreshToken) {
      try {
        const refreshPayload = jwt.verify(req.cookies.refreshToken, env.refreshSecret);
        const refreshUser = await User.findOne({ _id: refreshPayload.sub, isActive: true }).select('-passwordHash');
        if (refreshUser) {
          if (refreshUser.organizationId && refreshUser.role !== 'SUPER_ADMIN') {
            const org = await Organization.findById(refreshUser.organizationId);
            if (!org || !org.isActive || org.subscription === 'suspended') {
              return res.status(403).json({
                success: false,
                message: 'Your firm subscription is currently suspended. Please contact platform administration.',
                error: { code: 'SUBSCRIPTION_SUSPENDED' },
              });
            }
          }
          // Transparently re-issue fresh 1-day session cookies
          setAuthCookies(res, refreshUser);
          req.user = refreshUser;
          req.organizationId = refreshUser.organizationId;
          return next();
        }
      } catch {
        // Refresh token also invalid or expired
      }
    }

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: { code: 'AUTH_REQUIRED' },
      });
    }

    const scope = payload.organizationId ? { organizationId: payload.organizationId } : {};
    const user = await User.findOne({ _id: payload.sub, ...scope, isActive: true }).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session or account deactivated',
        error: { code: 'INVALID_SESSION' },
      });
    }

    // Tenant / Organization Subscription Status Guard
    if (user.organizationId && user.role !== 'SUPER_ADMIN') {
      const org = await Organization.findById(user.organizationId);
      if (org && (!org.isActive || org.subscription === 'suspended')) {
        return res.status(403).json({
          success: false,
          message: 'Your firm subscription is currently suspended. Please contact platform administration.',
          error: { code: 'SUBSCRIPTION_SUSPENDED' },
        });
      }
    }

    req.user = user;
    req.organizationId = user.organizationId;
    next();
  } catch (error) {
    next(Object.assign(new Error('Invalid or expired access token'), { status: 401, code: 'INVALID_TOKEN' }));
  }
}

const allow = (...roles) => (req, res, next) => (
  roles.includes(req.user.role)
    ? next()
    : next(Object.assign(new Error('Insufficient permissions'), { status: 403, code: 'FORBIDDEN' }))
);

module.exports = { auth, allow };
