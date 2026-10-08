const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const { Organization, User } = require('../models');
const { signAccess, signRefresh, cookieOptions, setAuthCookies, clearAuthCookies, ok, fail } = require('../utils');
const env = require('../config/env');


function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    mustChangePassword: Boolean(user.mustChangePassword),
    googleCalendarEmail: user.googleCalendarEmail || '',
    googleCalendarSync: Boolean(user.googleCalendarSync),
    calendarToken: user.calendarToken || '',
  };
}

async function register(req, res, next) {
  try {
    const { name, email, password, organizationName } = req.body;
    if (!name || !email || !password || !organizationName || password.length < 8) throw fail('Name, organization name, email and an 8-character password are required');
    const organization = await Organization.create({ name: organizationName, email });
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: 'FIRM_ADMIN', organizationId: organization._id, mustChangePassword: false });
    setAuthCookies(res, user);
    ok(res, { user: publicUser(user) }, 'Registration successful');
  } catch (error) { next(error); }
}

async function login(req, res, next) {
  try {
    const user = await User.findOne({ email: String(req.body.email || '').toLowerCase() }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) throw fail('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    if (!user.isActive) throw fail('This account is currently deactivated. Contact your administrator.', 403, 'ACCOUNT_DEACTIVATED');

    if (user.organizationId && user.role !== 'SUPER_ADMIN') {
      const org = await Organization.findById(user.organizationId);
      if (org && (!org.isActive || org.subscription === 'suspended')) {
        throw fail('Your firm subscription is currently suspended. Please contact platform administration.', 403, 'SUBSCRIPTION_SUSPENDED');
      }
    }

    user.lastLoginAt = new Date();
    await user.save();
    setAuthCookies(res, user);
    ok(res, {
      user: publicUser(user),
      mustChangePassword: Boolean(user.mustChangePassword),
    }, 'Login successful');
  } catch (error) { next(error); }
}

function logout(req, res) {
  clearAuthCookies(res);
  ok(res, null, 'Logged out successfully');
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) throw fail('Refresh token required', 401, 'AUTH_REQUIRED');
    const payload = jwt.verify(token, env.refreshSecret);
    const user = await User.findOne({ _id: payload.sub, isActive: true });
    if (!user) throw fail('Invalid refresh token', 401, 'INVALID_TOKEN');
    setAuthCookies(res, user);
    ok(res, { accessToken: signAccess(user), user: publicUser(user) }, 'Token refreshed');
  } catch (error) { next(Object.assign(error, { status: 401, code: 'INVALID_REFRESH_TOKEN' })); }
}

async function changePassword(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) throw fail('User not found', 404, 'USER_NOT_FOUND');
    if (!await bcrypt.compare(req.body.currentPassword || '', user.passwordHash)) {
      throw fail('Current password is incorrect', 400, 'INVALID_PASSWORD');
    }
    if (!req.body.newPassword || req.body.newPassword.length < 8) {
      throw fail('New password must be at least 8 characters');
    }
    user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
    user.mustChangePassword = false;
    await user.save();
    ok(res, { user: publicUser(user) }, 'Password changed successfully');
  } catch (error) { next(error); }
}

module.exports = { register, login, logout, refresh, changePassword, publicUser, setAuthCookies };
