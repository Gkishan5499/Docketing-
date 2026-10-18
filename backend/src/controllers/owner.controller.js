const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const { Organization, User, PaymentRecord, Enquiry } = require('../models');
const { fail, ok } = require('../utils');
const mailer = require('../utils/mailer');

const plans = {
  'Solo Counsel': { seatsTotal: 1, monthlyValue: 759 },
  Chambers: { seatsTotal: 5, monthlyValue: 1599 },
  'Firm Office': { seatsTotal: 15, monthlyValue: 2999 },
  Custom: { seatsTotal: 20, monthlyValue: 4999 },
};

const normalizeMonthlyValue = (val) => {
  if (val === 7590) return 759;
  if (val === 15990) return 1599;
  if (val === 29990) return 2999;
  return Number(val) || 0;
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
    rawRenewalDate: organization.renewalDate ? organization.renewalDate.toISOString().split('T')[0] : '',
    monthlyValue: normalizeMonthlyValue(organization.monthlyValue),
    lastPaymentDate: organization.lastPaymentDate ? organization.lastPaymentDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
    lastPaymentAmount: organization.lastPaymentAmount ? normalizeMonthlyValue(organization.lastPaymentAmount) : null,
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
    const { name, owner, email, plan = 'Solo Counsel', monthlyValue, seatsTotal } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();
    if (!name?.trim() || !owner?.trim() || !normalizedEmail) throw fail('Firm name, owner name, and email are required');
    if (!plans[plan]) throw fail('Invalid subscription plan', 400, 'INVALID_PLAN');
    if (await User.findOne({ email: normalizedEmail, isActive: true })) throw fail('A user with this email already exists', 409, 'EMAIL_EXISTS');

    const planDetails = plans[plan];
    const customMonthly = monthlyValue !== undefined && monthlyValue !== '' ? Math.max(0, Number(monthlyValue)) : planDetails.monthlyValue;
    const customSeats = seatsTotal !== undefined && seatsTotal !== '' ? Math.max(1, Number(seatsTotal)) : planDetails.seatsTotal;

    const temporaryPassword = `${crypto.randomBytes(5).toString('hex')}-${crypto.randomBytes(2).toString('hex')}`;
    const setupPasswordToken = crypto.randomBytes(32).toString('hex');
    const setupPasswordExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + 30);
    const organization = await Organization.create({
      name: name.trim(),
      email: normalizedEmail,
      ownerName: owner.trim(),
      ownerEmail: normalizedEmail,
      plan,
      subscription: 'active',
      seatsTotal: customSeats,
      seatsUsed: 1,
      monthlyValue: customMonthly,
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
        setupPasswordToken,
        setupPasswordExpires,
      });
    } catch (error) {
      await Organization.deleteOne({ _id: organization._id });
      throw error;
    }

    // Dispatch welcome credentials and setup link via Gmail SMTP
    const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : undefined);
    const emailDelivery = await mailer.sendSubscriptionWelcomeEmail({
      to: normalizedEmail,
      name: owner.trim(),
      firmName: name.trim(),
      plan,
      seats: planDetails.seatsTotal,
      temporaryPassword,
      setupToken: setupPasswordToken,
      clientUrl: origin,
    });

    ok(res, {
      firm: publicFirm(organization),
      temporaryPassword,
      setupPasswordToken,
      emailDelivery,
    }, 'Firm and owner account created successfully');
  } catch (error) { next(error); }
}

async function updateFirm(req, res, next) {
  try {
    const { id } = req.params;
    const { status, plan, renewMonthly, monthlyValue, seatsTotal, renewalDate } = req.body;
    const organization = await Organization.findById(id);
    if (!organization) throw fail('Firm organization not found', 404, 'ORG_NOT_FOUND');

    if (plan && plans[plan]) {
      organization.plan = plan;
      if (seatsTotal === undefined) organization.seatsTotal = plans[plan].seatsTotal;
      if (monthlyValue === undefined) organization.monthlyValue = plans[plan].monthlyValue;
    }

    if (monthlyValue !== undefined && monthlyValue !== '') {
      organization.monthlyValue = Math.max(0, Number(monthlyValue));
    }

    if (seatsTotal !== undefined && seatsTotal !== '') {
      organization.seatsTotal = Math.max(1, Number(seatsTotal));
    }

    if (renewalDate) {
      organization.renewalDate = new Date(renewalDate);
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

async function resendFirmInvite(req, res, next) {
  try {
    const { id } = req.params;
    const org = await Organization.findById(id);
    if (!org) throw fail('Firm organization not found', 404, 'ORG_NOT_FOUND');

    const user = await User.findOne({ organizationId: id, email: org.ownerEmail });
    if (!user) throw fail('Firm owner account not found', 404, 'USER_NOT_FOUND');

    const temporaryPassword = `${crypto.randomBytes(5).toString('hex')}-${crypto.randomBytes(2).toString('hex')}`;
    const setupPasswordToken = crypto.randomBytes(32).toString('hex');
    const setupPasswordExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    user.passwordHash = await bcrypt.hash(temporaryPassword, 12);
    user.mustChangePassword = true;
    user.setupPasswordToken = setupPasswordToken;
    user.setupPasswordExpires = setupPasswordExpires;
    await user.save();

    const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : undefined);
    const emailDelivery = await mailer.sendSubscriptionWelcomeEmail({
      to: user.email,
      name: user.name,
      firmName: org.name,
      plan: org.plan,
      seats: org.seatsTotal,
      temporaryPassword,
      setupToken: setupPasswordToken,
      clientUrl: origin,
    });

    ok(res, {
      temporaryPassword,
      setupPasswordToken,
      emailDelivery,
    }, 'Welcome credentials and setup link dispatched');
  } catch (error) { next(error); }
}

async function testSmtp(req, res, next) {
  try {
    const result = await mailer.verifySmtp();
    ok(res, result, result.message);
  } catch (error) { next(error); }
}

async function recordPayment(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, paymentDate, paymentMethod = 'UPI', referenceNumber, periodMonths = 1, notes } = req.body;
    if (amount === undefined || amount === '' || Number(amount) < 0) {
      throw fail('Valid payment amount is required');
    }

    const organization = await Organization.findById(id);
    if (!organization) throw fail('Firm organization not found', 404, 'ORG_NOT_FOUND');

    const paymentAmount = Number(amount);
    const months = Math.max(1, Number(periodMonths) || 1);
    const pDate = paymentDate ? new Date(paymentDate) : new Date();

    const payment = await PaymentRecord.create({
      organizationId: organization._id,
      firmName: organization.name,
      amount: paymentAmount,
      paymentDate: pDate,
      paymentMethod,
      referenceNumber: referenceNumber?.trim(),
      periodMonths: months,
      notes: notes?.trim(),
      recordedBy: req.user?._id,
    });

    // Update organization renewal date and status
    const baseDate = organization.renewalDate && organization.renewalDate > new Date()
      ? new Date(organization.renewalDate)
      : new Date();
    baseDate.setDate(baseDate.getDate() + (months * 30));

    organization.renewalDate = baseDate;
    organization.lastPaymentDate = pDate;
    organization.lastPaymentAmount = paymentAmount;
    organization.subscription = 'active';
    organization.isActive = true;
    await organization.save();

    ok(res, {
      payment,
      firm: publicFirm(organization),
    }, 'Payment recorded and subscription renewed successfully');
  } catch (error) { next(error); }
}

async function listPayments(req, res, next) {
  try {
    const filter = req.params.id ? { organizationId: req.params.id } : {};
    const payments = await PaymentRecord.find(filter).sort({ paymentDate: -1, createdAt: -1 }).limit(100);
    ok(res, payments, 'Payment history fetched successfully');
  } catch (error) { next(error); }
}

async function getBillingOverview(req, res, next) {
  try {
    const firms = await Organization.find({ ownerEmail: { $exists: true, $ne: '' } }).sort({ createdAt: -1 });
    const payments = await PaymentRecord.find().sort({ paymentDate: -1, createdAt: -1 }).limit(50);
    const enquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(50);

    const activeFirms = firms.filter((f) => f.subscription === 'active' && f.isActive);
    const totalMRR = activeFirms.reduce((sum, f) => sum + normalizeMonthlyValue(f.monthlyValue), 0);
    const totalCollected = await PaymentRecord.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const now = new Date();
    const renewalsNext7Days = firms.filter((f) => {
      if (!f.renewalDate) return false;
      const diffDays = Math.ceil((new Date(f.renewalDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    ok(res, {
      totalMRR,
      annualRunRate: totalMRR * 12,
      totalCollected: totalCollected[0]?.total || 0,
      activeFirmsCount: activeFirms.length,
      renewalsNext7Days,
      enquiriesCount: enquiries.length,
      firms: firms.map(publicFirm),
      recentPayments: payments,
      recentEnquiries: enquiries,
    }, 'Billing overview fetched successfully');
  } catch (error) { next(error); }
}

module.exports = {
  listFirms,
  createFirm,
  updateFirm,
  archiveFirm,
  listFirmUsers,
  createFirmUser,
  revokeFirmUser,
  resendFirmInvite,
  testSmtp,
  recordPayment,
  listPayments,
  getBillingOverview,
};