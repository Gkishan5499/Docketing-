const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const { Organization, User, Otp } = require('../models');
const { sendVerificationOtpEmail } = require('../utils/mailer');
const { signAccess, signRefresh, cookieOptions, setAuthCookies, clearAuthCookies, ok, fail } = require('../utils');
const env = require('../config/env');


async function buildPublicUser(user) {
  let trialInfo = null;
  let firmName = 'DexFora Chambers';
  if (user.organizationId) {
    const org = await Organization.findById(user.organizationId);
    if (org) {
      firmName = org.name;
      const now = new Date();
      const renewal = org.renewalDate ? new Date(org.renewalDate) : null;
      const daysLeft = renewal ? Math.max(0, Math.ceil((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
      trialInfo = {
        firmName: org.name,
        plan: org.plan || 'Solo Counsel',
        subscription: org.subscription || 'trial',
        renewalDate: org.renewalDate,
        daysLeft,
        isTrial: org.subscription === 'trial',
        isExpired: org.subscription === 'trial' && daysLeft <= 0,
      };
    }
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    firmName,
    mustChangePassword: Boolean(user.mustChangePassword),
    googleCalendarEmail: user.googleCalendarEmail || '',
    googleCalendarSync: Boolean(user.googleCalendarSync),
    calendarToken: user.calendarToken || '',
    trial: trialInfo,
  };
}

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

async function sendOtp(req, res, next) {
  try {
    const { email, name, purpose = 'REGISTRATION' } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw fail('Valid email address is required', 400, 'INVALID_EMAIL');
    }

    const validPurposes = ['REGISTRATION', 'LOGIN', 'PASSWORD_RESET'];
    const otpPurpose = validPurposes.includes(purpose) ? purpose : 'REGISTRATION';

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (otpPurpose === 'REGISTRATION' && existingUser) {
      throw fail('An account with this email already exists. Please sign in.', 409, 'EMAIL_EXISTS');
    }
    if (otpPurpose === 'LOGIN' && !existingUser) {
      throw fail('No account found with this email. Please register for a free trial.', 404, 'USER_NOT_FOUND');
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.findOneAndUpdate(
      { email: normalizedEmail, purpose: otpPurpose },
      { otp, verified: false, expiresAt },
      { upsert: true, new: true }
    );

    const displayName = name || existingUser?.name || 'Advocate';
    const emailResult = await sendVerificationOtpEmail({
      to: normalizedEmail,
      name: displayName,
      otp,
      purpose: otpPurpose,
    });

    ok(res, {
      email: normalizedEmail,
      purpose: otpPurpose,
      emailSent: emailResult.sent,
      ...(env.nodeEnv !== 'production' ? { debugOtp: otp } : {}),
    }, 'A 6-digit verification code has been dispatched to your email.');
  } catch (error) { next(error); }
}

async function verifyOtp(req, res, next) {
  try {
    const { email, otp, purpose = 'REGISTRATION' } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();
    if (!normalizedEmail || !otp) {
      throw fail('Email and verification code are required', 400, 'VALIDATION_ERROR');
    }

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      purpose: purpose || 'REGISTRATION',
    });

    if (!otpRecord || otpRecord.otp !== String(otp).trim()) {
      throw fail('Invalid verification code. Please check and try again.', 400, 'INVALID_OTP');
    }
    if (otpRecord.expiresAt < new Date()) {
      throw fail('Verification code has expired. Please request a new code.', 400, 'OTP_EXPIRED');
    }

    otpRecord.verified = true;
    await otpRecord.save();

    if (purpose === 'LOGIN') {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) throw fail('User not found', 404, 'USER_NOT_FOUND');
      if (!user.isActive) throw fail('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');

      user.lastLoginAt = new Date();
      await user.save();
      setAuthCookies(res, user);
      await Otp.deleteMany({ email: normalizedEmail, purpose: 'LOGIN' });
      const userData = await buildPublicUser(user);
      return ok(res, { user: userData, verified: true }, 'Signed in successfully via email verification');
    }

    ok(res, { email: normalizedEmail, verified: true }, 'Email verified successfully');
  } catch (error) { next(error); }
}

async function register(req, res, next) {
  try {
    const { name, email, password, organizationName, phone, otp } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();
    if (!name?.trim() || !normalizedEmail || !password || password.length < 6) {
      throw fail('Name, email, and a minimum 6-character password are required', 400, 'VALIDATION_ERROR');
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw fail('An account with this email already exists. Please sign in.', 409, 'EMAIL_EXISTS');
    }

    // Require and verify OTP
    if (!otp) {
      throw fail('Verification code is required. Please verify your email first.', 400, 'OTP_REQUIRED');
    }

    const otpRecord = await Otp.findOne({ email: normalizedEmail, purpose: 'REGISTRATION' });
    if (!otpRecord || (otpRecord.otp !== String(otp).trim() && !otpRecord.verified)) {
      throw fail('Invalid verification code. Please check your email or request a new code.', 400, 'INVALID_OTP');
    }
    if (otpRecord.expiresAt < new Date()) {
      throw fail('Verification code has expired. Please request a new code.', 400, 'OTP_EXPIRED');
    }

    // Delete used OTP record
    await Otp.deleteMany({ email: normalizedEmail, purpose: 'REGISTRATION' });

    const firmName = organizationName?.trim() || `${name.trim()}'s Chambers`;

    // 30 Days (1 Month) Free Trial
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 30);

    const organization = await Organization.create({
      name: firmName,
      email: normalizedEmail,
      ownerName: name.trim(),
      ownerEmail: normalizedEmail,
      phone: phone ? String(phone).trim() : undefined,
      plan: 'Solo Counsel',
      subscription: 'trial',
      seatsTotal: 1,
      seatsUsed: 1,
      monthlyValue: 0,
      renewalDate: trialEnds,
      country: 'India',
      isActive: true,
    });

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'FIRM_ADMIN',
      organizationId: organization._id,
      mustChangePassword: false,
      isActive: true,
      googleCalendarEmail: normalizedEmail.includes('@gmail.com') ? normalizedEmail : undefined,
      googleCalendarSync: normalizedEmail.includes('@gmail.com'),
      calendarToken: crypto.randomBytes(16).toString('hex'),
    });

    setAuthCookies(res, user);
    const userData = await buildPublicUser(user);
    ok(res, {
      user: userData,
      message: 'Welcome to DexFora! Your 1-Month Free Trial has started.',
    }, 'Account created successfully! Your 1-Month Free Trial is active.');
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
    const userData = await buildPublicUser(user);
    ok(res, {
      user: userData,
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
    const userData = await buildPublicUser(user);
    ok(res, { accessToken: signAccess(user), user: userData }, 'Token refreshed');
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
  sendOtp,
  verifyOtp,
  changePassword,
  setupPassword,
  verifySetupToken,
  publicUser,
  buildPublicUser,
  setAuthCookies,
};
