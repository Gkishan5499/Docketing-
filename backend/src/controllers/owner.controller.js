const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const { Organization, User } = require('../models');
const { fail, ok } = require('../utils');

const plans = {
  'Solo Counsel': { seatsTotal: 1, monthlyValue: 9990 },
  Chambers: { seatsTotal: 5, monthlyValue: 24980 },
  'Firm Office': { seatsTotal: 15, monthlyValue: 49990 },
};

const publicFirm = (organization) => ({
  id: organization._id,
  name: organization.name,
  owner: organization.ownerName,
  email: organization.ownerEmail,
  plan: organization.plan,
  seatsUsed: organization.seatsUsed,
  seatsTotal: organization.seatsTotal,
  status: organization.subscription === 'trial' ? 'Trial' : 'Active',
  renewal: organization.subscription === 'trial'
    ? `Trial ends ${organization.renewalDate ? organization.renewalDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'soon'}`
    : organization.renewalDate
      ? organization.renewalDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Not scheduled',
  monthlyValue: organization.monthlyValue,
});

async function listFirms(req, res, next) {
  try {
    const firms = await Organization.find({ isActive: true, ownerEmail: { $exists: true, $ne: '' } }).sort({ createdAt: -1 });
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

module.exports = { listFirms, createFirm };