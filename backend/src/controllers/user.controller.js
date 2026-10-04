const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const { User, Organization } = require('../models');
const { fail, ok } = require('../utils');

const roles = ['ATTORNEY', 'PARALEGAL', 'STAFF', 'VIEWER'];

async function listUsers(req, res, next) {
  try {
    const [users, org] = await Promise.all([
      User.find({ organizationId: req.organizationId }).select('-passwordHash').sort({ createdAt: -1 }),
      Organization.findById(req.organizationId),
    ]);
    const activeSeats = users.filter((u) => u.isActive).length;
    if (org && org.seatsUsed !== activeSeats) {
      org.seatsUsed = activeSeats;
      await org.save().catch(() => {});
    }
    ok(res, {
      users,
      seatInfo: {
        seatsUsed: activeSeats,
        seatsTotal: org?.seatsTotal || 1,
        plan: org?.plan || 'Solo Counsel',
        subscription: org?.subscription || 'active',
      },
    }, 'Team members fetched successfully');
  } catch (error) { next(error); }
}

async function inviteUser(req, res, next) {
  try {
    const { name, email, role = 'ATTORNEY', googleCalendarEmail } = req.body;
    if (!name?.trim() || !email?.trim()) throw fail('Name and email are required');
    if (!roles.includes(role)) throw fail('Invalid team role', 400, 'INVALID_ROLE');

    const org = await Organization.findById(req.organizationId);
    if (!org) throw fail('Firm organization not found', 404, 'ORG_NOT_FOUND');

    const activeSeats = await User.countDocuments({ organizationId: req.organizationId, isActive: true });
    if (activeSeats >= org.seatsTotal) {
      throw fail(
        `Seat quota reached (${activeSeats}/${org.seatsTotal} seats used). Contact your platform administrator to upgrade your subscription before adding more lawyers.`,
        403,
        'SEAT_LIMIT_REACHED',
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ organizationId: req.organizationId, email: normalizedEmail });
    const temporaryPassword = `${crypto.randomBytes(4).toString('hex')}-${crypto.randomBytes(2).toString('hex')}`;
    const cleanGcalEmail = googleCalendarEmail ? String(googleCalendarEmail).toLowerCase().trim() : (normalizedEmail.includes('@gmail.com') ? normalizedEmail : undefined);

    let user;
    if (existing) {
      if (existing.isActive) {
        throw fail('A team member with this email already exists in your firm', 409, 'USER_EXISTS');
      }
      existing.name = name.trim();
      existing.role = role;
      existing.isActive = true;
      existing.passwordHash = await bcrypt.hash(temporaryPassword, 12);
      existing.mustChangePassword = true;
      if (cleanGcalEmail) {
        existing.googleCalendarEmail = cleanGcalEmail;
        existing.googleCalendarSync = true;
        if (!existing.calendarToken) existing.calendarToken = crypto.randomBytes(16).toString('hex');
      }
      user = await existing.save();
    } else {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        role,
        organizationId: req.organizationId,
        passwordHash: await bcrypt.hash(temporaryPassword, 12),
        mustChangePassword: true,
        createdBy: req.user._id,
        googleCalendarEmail: cleanGcalEmail,
        googleCalendarSync: Boolean(cleanGcalEmail),
        calendarToken: crypto.randomBytes(16).toString('hex'),
      });
    }

    // Keep organization seat usage up-to-date
    org.seatsUsed = Math.min(org.seatsTotal, activeSeats + 1);
    await org.save().catch(() => {});

    ok(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        isActive: user.isActive,
      },
      temporaryPassword,
      instruction: 'Share these credentials securely. The lawyer must change their password on first sign-in before accessing practice data.',
    }, 'Lawyer account created successfully');
  } catch (error) { next(error); }
}

async function deactivateUser(req, res, next) {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      throw fail('You cannot revoke your own account', 400, 'CANNOT_REVOKE_SELF');
    }
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      { isActive: false },
      { new: true },
    ).select('-passwordHash');
    if (!user) throw fail('Team member not found', 404, 'USER_NOT_FOUND');

    const activeCount = await User.countDocuments({ organizationId: req.organizationId, isActive: true });
    await Organization.findByIdAndUpdate(req.organizationId, { seatsUsed: Math.max(1, activeCount) }).catch(() => {});

    ok(res, user, 'Team member access revoked successfully');
  } catch (error) { next(error); }
}

module.exports = { listUsers, inviteUser, deactivateUser };