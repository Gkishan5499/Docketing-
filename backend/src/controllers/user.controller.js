const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const { User } = require('../models');
const { fail, ok } = require('../utils');

const roles = ['ATTORNEY', 'PARALEGAL', 'STAFF', 'VIEWER'];

async function listUsers(req, res, next) {
  try {
    const users = await User.find({ organizationId: req.organizationId }).select('-passwordHash').sort({ name: 1 });
    ok(res, users, 'Team members fetched successfully');
  } catch (error) { next(error); }
}

async function inviteUser(req, res, next) {
  try {
    const { name, email, role = 'ATTORNEY' } = req.body;
    if (!name || !email) throw fail('Name and email are required');
    if (!roles.includes(role)) throw fail('Invalid team role', 400, 'INVALID_ROLE');

    const temporaryPassword = `${crypto.randomBytes(4).toString('hex')}-${crypto.randomBytes(2).toString('hex')}`;
    const user = await User.create({
      name,
      email: String(email).toLowerCase().trim(),
      role,
      organizationId: req.organizationId,
      passwordHash: await bcrypt.hash(temporaryPassword, 12),
      mustChangePassword: true,
      createdBy: req.user._id,
    });

    // Return the temporary password only in this creation response. It is never stored in plain text.
    ok(res, {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      temporaryPassword,
      instruction: 'Share these credentials securely and ask the lawyer to change the password after first login.',
    }, 'Lawyer account created successfully');
  } catch (error) { next(error); }
}

async function deactivateUser(req, res, next) {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId, _id: { $ne: req.user._id } },
      { isActive: false },
      { new: true },
    ).select('-passwordHash');
    if (!user) throw fail('Team member not found', 404, 'USER_NOT_FOUND');
    ok(res, user, 'Team member access revoked');
  } catch (error) { next(error); }
}

module.exports = { listUsers, inviteUser, deactivateUser };