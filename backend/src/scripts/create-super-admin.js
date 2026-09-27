const bcrypt = require('bcryptjs');
const { connectDb } = require('../config/db');
const { User } = require('../models');

async function createSuperAdmin() {
  const name = process.env.SUPER_ADMIN_NAME;
  const email = String(process.env.SUPER_ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!name || !email || !password || password.startsWith('replace-') || password.length < 12) {
    throw new Error('Set SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, and a strong SUPER_ADMIN_PASSWORD (minimum 12 characters) in backend/.env');
  }

  await connectDb();
  const existing = await User.findOne({ email }).select('+passwordHash');
  if (existing) {
    existing.name = name;
    existing.role = 'SUPER_ADMIN';
    existing.isActive = true;
    existing.passwordHash = await bcrypt.hash(password, 12);
    existing.mustChangePassword = false;
    await existing.save();
    console.log(`Super Admin updated: ${email}`);
    return;
  }

  await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'SUPER_ADMIN',
    // Platform administrators are not tenant members; their organization is assigned when platform administration is expanded.
    organizationId: undefined,
    mustChangePassword: false,
  });
  console.log(`Super Admin created: ${email}`);
}

createSuperAdmin().catch((error) => {
  console.error(`Unable to create Super Admin: ${error.message}`);
  process.exitCode = 1;
});