const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const { Organization, User } = require('../models');
const { fail, ok } = require('../utils');

const plans = {
  'Solo Counsel': { seatsTotal: 1, monthlyValue: 9990 },
  Chambers: { seatsTotal: 5, monthlyValue: 24980 },
  'Firm Office': { seatsTotal: 15, monthlyValue: 49990 },
};

const publicFirm = (organization) => {
  let status = 'Active';
  if (organization.subscription === 'suspended' || !organization.isActive) {
    status = 'Suspended';
  } else if (organization.subscription === 'trial') {
    status = 'Trial';
  }

  return {
    id: organization._id,
    name: organization.name,
    owner: organization.ownerName,
    email: organization.ownerEmail,
    plan: organization.plan,
    seatsUsed: organization.seatsUsed,
    seatsTotal: organization.seatsTotal,
    status,
    subscription: organization.subscription,
    isActive: organization.isActive,
    renewal: organization.subscription === 'trial'
      ? `Trial ends ${organization.renewalDate ? organization.renewalDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'soon'}`
      : organization.renewalDate
        ? organization.renewalDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Not scheduled',
    monthlyValue: organization.monthlyValue,
  };
};

async function listFirms(req, res, next) {
  try {
    const firms = await Organization.find({ ownerEmail: { $exists: true, $ne: '' } }).sort({ createdAt: -1 });
    ok(res, firms.map(publicFirm), 'Subscribed firms fetched successfully');
  } catch (error) { next(error); }
}

async function createFirm(req, res, next) {
  try {
    const { name, owner, email, plan = 'Solo Counsel' } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();
    if (!name?.trim() || !owner?.trim() || !normalizedEmail) throw fail('Firm name, owner name, and email are required');
    if (!plans[plan]) throw fail('Invalid subscription plan', 400, 'INVALID_PLAN');
    if (await User.findOne({ email: normalizedEmail, isActive: true })) throw fail('A user with this email already exists', 409, 'EMAIL_EXISTS');

    const planDetails = plans[plan];
    const temporaryPassword = `${crypto.randomBytes(5).toString('hex')}-${crypto.randomBytes(2).toString('hex')}`;
    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + 30);
    const organization = await Organization.create({
      name: name.trim(),
      email: normalizedEmail,
      ownerName: owner.trim(),
      ownerEmail: normalizedEmail,
      plan,
      subscription: 'active',
      seatsTotal: planDetails.seatsTotal,
      seatsUsed: 1,
      monthlyValue: planDetails.monthlyValue,
      renewalDate,
      country: 'India',
    });

    try {
      await User.create({
        name: owner.trim(),
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(temporaryPassword, 12),
        role: 'FIRM_ADMIN',
        organizationId: organization._id,
        mustChangePassword: true,
      });
    } catch (error) {
      await Organization.deleteOne({ _id: organization._id });
      throw error;
    }

    ok(res, { firm: publicFirm(organization), temporaryPassword }, 'Firm and owner account created successfully');
  } catch (error) { next(error); }
}

async function updateFirm(req, res, next) {
  try {
    const { id } = req.params;
    const { status, plan, renewMonthly } = req.body;
    const organization = await Organization.findById(id);
    if (!organization) throw fail('Firm organization not found', 404, 'ORG_NOT_FOUND');

    if (plan && plans[plan]) {
      organization.plan = plan;
      organization.seatsTotal = plans[plan].seatsTotal;
      organization.monthlyValue = plans[plan].monthlyValue;
    }

    if (status) {
      const normalizedStatus = String(status).toLowerCase();
      if (normalizedStatus === 'suspended') {
        organization.subscription = 'suspended';
      } else if (normalizedStatus === 'active') {
        organization.subscription = 'active';
        organization.isActive = true;
      } else if (normalizedStatus === 'trial') {
        organization.subscription = 'trial';
        organization.isActive = true;
      }
    }

    if (renewMonthly) {
      const baseDate = organization.renewalDate && organization.renewalDate > new Date()
        ? new Date(organization.renewalDate)
        : new Date();
      baseDate.setDate(baseDate.getDate() + 30);
      organization.renewalDate = baseDate;
      organization.subscription = 'active';
      organization.isActive = true;
    }

    await organization.save();
    ok(res, publicFirm(organization), 'Firm updated successfully');
  } catch (error) { next(error); }
}

async function archiveFirm(req, res, next) {
  try {
    const { id } = req.params;
    const organization = await Organization.findByIdAndUpdate(
      id,
      { subscription: 'suspended', isActive: false },
      { new: true },
    );
    const activeCount = await User.countDocuments({ organizationId: id, isActive: true });
    await Organization.findByIdAndUpdate(id, { seatsUsed: Math.max(1, activeCount) }).catch(() => {});
    ok(res, publicFirm(organization), 'Firm suspended and access revoked');
  } catch (error) { next(error); }
}

async function listFirmUsers(req, res, next) {
  try {
    const { id } = req.params;
    const users = await User.find({ organizationId: id }).select('-passwordHash').sort({ createdAt: -1 });
    ok(res, users, 'Firm lawyers fetched successfully');
  } catch (error) { next(error); }
}

async function createFirmUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, role = 'ATTORNEY' } = req.body;
    if (!name?.trim() || !email?.trim()) throw fail('Name and email are required');

    const org = await Organization.findById(id);
    if (!org) throw fail('Firm organization not found', 404, 'ORG_NOT_FOUND');

    const activeSeats = await User.countDocuments({ organizationId: id, isActive: true });
    if (activeSeats >= org.seatsTotal) {
      throw fail(`Seat quota reached (${activeSeats}/${org.seatsTotal} seats used). Upgrade the firm plan before provisioning more lawyers.`, 403, 'SEAT_LIMIT_REACHED');
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ organizationId: id, email: normalizedEmail });
    const temporaryPassword = `${crypto.randomBytes(4).toString('hex')}-${crypto.randomBytes(2).toString('hex')}`;

    let user;
    if (existing) {
      if (existing.isActive) throw fail('A user with this email already exists in this firm', 409, 'USER_EXISTS');
      existing.name = name.trim();
      existing.role = role;
      existing.isActive = true;
      existing.passwordHash = await bcrypt.hash(temporaryPassword, 12);
      existing.mustChangePassword = true;
      user = await existing.save();
    } else {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        role,
        organizationId: id,
        passwordHash: await bcrypt.hash(temporaryPassword, 12),
        mustChangePassword: true,
        createdBy: req.user._id,
      });
    }

    org.seatsUsed = Math.min(org.seatsTotal, activeSeats + 1);
    await org.save().catch(() => {});

    ok(res, {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: 'Pending' },
      temporaryPassword,
      seatsUsed: org.seatsUsed,
      seatsTotal: org.seatsTotal,
    }, 'Lawyer provisioned successfully');
  } catch (error) { next(error); }
}

async function revokeFirmUser(req, res, next) {
  try {
    const { id, userId } = req.params;
    const user = await User.findOneAndUpdate(
      { _id: userId, organizationId: id },
      { isActive: false },
      { new: true },
    );
    if (!user) throw fail('User not found', 404, 'USER_NOT_FOUND');

    const activeCount = await User.countDocuments({ organizationId: id, isActive: true });
    const org = await Organization.findByIdAndUpdate(id, { seatsUsed: Math.max(1, activeCount) }, { new: true });

    ok(res, { user, seatsUsed: org?.seatsUsed || 1 }, 'Lawyer access revoked');
  } catch (error) { next(error); }
}

module.exports = { listFirms, createFirm, updateFirm, archiveFirm, listFirmUsers, createFirmUser, revokeFirmUser };