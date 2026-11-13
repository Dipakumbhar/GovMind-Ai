/**
 * Provision one administrator in the configured GovMind database.
 * Requires MONGO_URI and SEED_ADMIN_NAME, SEED_ADMIN_EMAIL,
 * SEED_ADMIN_PHONE, and SEED_ADMIN_PASSWORD in backend/.env.
 * This script never creates sample citizens or complaints.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

function requireValue(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be configured before provisioning an administrator`);
  return value;
}

async function seedAdmin() {
  try {
    const mongoUri = requireValue('MONGO_URI');
    const name = requireValue('SEED_ADMIN_NAME');
    const email = requireValue('SEED_ADMIN_EMAIL').toLowerCase();
    const phone = requireValue('SEED_ADMIN_PHONE');
    const password = requireValue('SEED_ADMIN_PASSWORD');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('SEED_ADMIN_EMAIL must be a valid email address');
    }
    if (name.length < 2 || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
      throw new Error('Admin name must be at least 2 characters and password must be 12–72 bytes');
    }

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000, autoIndex: false });
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.role !== 'admin') {
        throw new Error('That email already belongs to a non-admin account; no account was changed');
      }
      console.log('Administrator already exists; no account was changed');
      return;
    }

    await User.create({ name, email, phone, passwordHash: password, role: 'admin' });
    console.log('Administrator created in the configured GovMind database');
  } catch (error) {
    console.error(`Admin provisioning failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
