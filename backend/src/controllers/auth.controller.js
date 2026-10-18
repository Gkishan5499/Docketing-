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

async function setupPassword(req, res, next) {
  try {
    const { email, token, currentPassword, newPassword } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();
    if (!normalizedEmail) throw fail('Email is required');
    if (!newPassword || newPassword.length < 8) {
      throw fail('New password must be at least 8 characters long');
    }

    const user = await User.findOne({ email: normalizedEmail, isActive: true }).select('+passwordHash');
    if (!user) throw fail('Account not found', 404, 'USER_NOT_FOUND');

    let isAuthorized = false;

    // Check by token if provided
    if (token && user.setupPasswordToken === token) {
      if (user.setupPasswordExpires && user.setupPasswordExpires < new Date()) {
        throw fail('Setup link has expired. Please use your temporary password or request a new link.', 400, 'TOKEN_EXPIRED');
      }
      isAuthorized = true;
    } else if (currentPassword) {
      // Check by temporary / current password
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) throw fail('Invalid temporary or current password', 400, 'INVALID_PASSWORD');
      isAuthorized = true;
    }

    if (!isAuthorized) {
      throw fail('Invalid or expired setup token / credentials', 400, 'INVALID_AUTH');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    user.setupPasswordToken = undefined;
    user.setupPasswordExpires = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    setAuthCookies(res, user);
    ok(res, { user: publicUser(user) }, 'Password created successfully! You are now logged in.');
  } catch (error) { next(error); }
}

async function verifySetupToken(req, res, next) {
  try {
    const { token, email } = req.query;
    const normalizedEmail = String(email || '').toLowerCase().trim();
    if (!token || !normalizedEmail) throw fail('Token and email required');

    const user = await User.findOne({ email: normalizedEmail, setupPasswordToken: token, isActive: true });
    if (!user) throw fail('Invalid setup token or email', 404, 'INVALID_TOKEN');

    if (user.setupPasswordExpires && user.setupPasswordExpires < new Date()) {
      throw fail('Setup link has expired', 410, 'TOKEN_EXPIRED');
    }

    const org = user.organizationId ? await Organization.findById(user.organizationId) : null;

    ok(res, {
      name: user.name,
      email: user.email,
      firmName: org?.name || 'DexFora Chambers',
      plan: org?.plan || 'Solo Counsel',
    }, 'Token is valid');
  } catch (error) { next(error); }
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

module.exports = {
  register,
  login,
  logout,
  refresh,
  changePassword,
  setupPassword,
  verifySetupToken,
  publicUser,
  setAuthCookies,
};
