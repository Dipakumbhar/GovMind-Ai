const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

const router = express.Router();
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please try again later.',
});

function validEmail(email) {
  return typeof email === 'string'
    && email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

// Generate JWT with user ID and role
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register - Citizen registration
router.post('/register', authRateLimit, async (req, res) => {
  try {
    const { name, email, phone, password, ward } = req.body;

    const normalizedEmail = validEmail(email) ? email.trim().toLowerCase() : '';
    const cleanName = cleanText(name, 80);
    const cleanPhone = cleanText(phone, 24);
    if (!cleanName || cleanName.length < 2 || !normalizedEmail || !cleanPhone || !password) {
      return res.status(400).json({ message: 'Please provide name, email, phone, and password' });
    }
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ message: 'Password must be 8 to 72 bytes long' });
    }
    if (!/^[+]?[-\d\s().]{7,24}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Please provide a valid phone number' });
    }

    // Check existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create citizen user (role strictly defaulted to 'citizen' for public registration)
    const user = await User.create({
      name: cleanName,
      email: normalizedEmail,
      phone: cleanPhone,
      passwordHash: password,
      ward: cleanText(ward, 120),
      role: 'citizen',
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check the registration details' });
    }
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login - Client / Citizen Login
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validEmail(email) || typeof password !== 'string' || !password || password.length > 72) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/auth/admin/login - Dedicated Admin Login with strict role enforcement
router.post('/admin/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validEmail(email) || typeof password !== 'string' || !password || password.length > 72) {
      return res.status(400).json({ message: 'Please provide admin email and password' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid administrator credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid administrator credentials' });
    }

    // Role-based validation on the backend
    if (user.role !== 'admin') {
      return res.status(403).json({
        message: 'Access Denied: This portal is restricted to authorized municipal administrators only.',
      });
    }

    const token = generateToken(user);

    res.json({
      message: 'Administrator authentication successful',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, ward, address, city, preferredLanguage, notificationPreferences,
      designation, department, employeeId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) {
      const value = cleanText(name, 80);
      if (value.length < 2) return res.status(400).json({ message: 'Name must be at least 2 characters' });
      user.name = value;
    }
    if (phone !== undefined) {
      const value = cleanText(phone, 24);
      if (!/^[+]?[-\d\s().]{7,24}$/.test(value)) return res.status(400).json({ message: 'Please provide a valid phone number' });
      user.phone = value;
    }
    for (const [field, value] of Object.entries({ ward, address, city })) {
      if (value !== undefined) user.set(field, cleanText(value, field === 'address' ? 240 : 120));
    }
    if ([designation, department, employeeId].some((value) => value !== undefined)) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only administrators can update administrative profile fields' });
      }
      for (const [field, value] of Object.entries({ designation, department, employeeId })) {
        if (value !== undefined) {
          if (typeof value !== 'string' || value.trim().length > 120) {
            return res.status(400).json({ message: `${field} must be text no longer than 120 characters` });
          }
          user.set(field, value.trim());
        }
      }
    }
    if (preferredLanguage !== undefined) {
      if (!['English', 'Marathi', 'Hindi', 'मराठी', 'हिंदी'].includes(preferredLanguage)) {
        return res.status(400).json({ message: 'Please select a supported language' });
      }
      user.set('preferredLanguage', preferredLanguage);
    }
    if (notificationPreferences !== undefined) {
      const allowedPreferences = ['email', 'sms', 'statusUpdates', 'weeklyDigest', 'criticalAlerts', 'newComplaints', 'aiRecommendations', 'emailNotifications'];
      if (!notificationPreferences || typeof notificationPreferences !== 'object' || Array.isArray(notificationPreferences)) {
        return res.status(400).json({ message: 'Notification preferences must be an object' });
      }
      const preferences = { ...(user.notificationPreferences?.toObject?.() || user.notificationPreferences || {}) };
      for (const key of allowedPreferences) {
        if (notificationPreferences[key] !== undefined) {
          if (typeof notificationPreferences[key] !== 'boolean') {
            return res.status(400).json({ message: 'Notification preferences must be boolean values' });
          }
          preferences[key] = notificationPreferences[key];
        }
      }
      user.set('notificationPreferences', preferences);
    }

    await user.save();
    res.json({ message: 'Profile updated', user: user.toJSON() });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: 'Please check the profile details' });
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// PUT /api/auth/password - Change the password for the authenticated account.
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    if (newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
      return res.status(400).json({ message: 'New password must be 8 to 72 bytes long' });
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.passwordHash = newPassword;
    await user.save();
    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    return res.status(500).json({ message: 'Server error updating password' });
  }
});

router.get('/admin/settings', protect, adminOnly, async (req, res) => {
  return res.json({
    department: req.user.departmentSettings || {},
    notifications: req.user.notificationPreferences || {},
  });
});

router.put('/admin/settings', protect, adminOnly, async (req, res) => {
  try {
    const body = req.body?.department;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ message: 'Department settings must be an object' });
    }
    const fields = ['name', 'code', 'city', 'state', 'headName', 'headDesignation', 'phone', 'email'];
    const department = {};
    for (const field of fields) {
      if (body[field] === undefined) continue;
      if (typeof body[field] !== 'string' || body[field].trim().length > 160) {
        return res.status(400).json({ message: `${field} must be text no longer than 160 characters` });
      }
      department[field] = body[field].trim();
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Administrator not found' });
    user.set('departmentSettings', department);
    await user.save();
    return res.json({ message: 'Department settings saved', department });
  } catch (error) {
    console.error('Admin settings update error:', error.message);
    return res.status(500).json({ message: 'Server error saving department settings' });
  }
});

router.get('/admin/teams', protect, adminOnly, async (req, res) => {
  return res.json({ fieldTeams: Array.isArray(req.user.fieldTeams) ? req.user.fieldTeams : [] });
});

router.post('/admin/teams', protect, adminOnly, async (req, res) => {
  try {
    const body = req.body || {};
    const name = cleanText(body.name, 120);
    if (name.length < 2) return res.status(400).json({ message: 'Team name must be at least 2 characters' });
    const allowedFields = ['supervisor', 'zone', 'specialization', 'availability', 'contact'];
    const team = { id: `TEAM-${crypto.randomBytes(5).toString('hex').toUpperCase()}`, name };
    for (const field of allowedFields) {
      if (body[field] === undefined) continue;
      if (typeof body[field] !== 'string' || body[field].trim().length > 160) {
        return res.status(400).json({ message: `${field} must be valid text` });
      }
      team[field] = body[field].trim();
    }
    if (body.members !== undefined) {
      const members = Number(body.members);
      if (!Number.isInteger(members) || members < 1 || members > 1000) return res.status(400).json({ message: 'Team member count must be a positive whole number' });
      team.members = members;
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Administrator not found' });
    const teams = Array.isArray(user.fieldTeams) ? [...user.fieldTeams] : [];
    if (teams.some((existing) => existing.name?.toLowerCase() === name.toLowerCase())) {
      return res.status(409).json({ message: 'A field team with this name already exists' });
    }
    teams.push(team);
    user.set('fieldTeams', teams);
    await user.save();
    return res.status(201).json({ fieldTeam: team, fieldTeams: teams });
  } catch (error) {
    console.error('Create field team error:', error.message);
    return res.status(500).json({ message: 'Server error creating field team' });
  }
});

router.put('/admin/teams/:teamId', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Administrator not found' });
    const teams = Array.isArray(user.fieldTeams) ? [...user.fieldTeams] : [];
    const index = teams.findIndex((team) => team.id === req.params.teamId);
    if (index < 0) return res.status(404).json({ message: 'Field team not found' });
    const updates = req.body || {};
    for (const field of ['name', 'supervisor', 'zone', 'specialization', 'availability', 'contact']) {
      if (updates[field] === undefined) continue;
      if (typeof updates[field] !== 'string' || updates[field].trim().length > 160 || (field === 'name' && updates[field].trim().length < 2)) {
        return res.status(400).json({ message: `${field} must be valid text` });
      }
      teams[index][field] = updates[field].trim();
    }
    if (updates.members !== undefined) {
      const members = Number(updates.members);
      if (!Number.isInteger(members) || members < 1 || members > 1000) return res.status(400).json({ message: 'Team member count must be a positive whole number' });
      teams[index].members = members;
    }
    user.set('fieldTeams', teams);
    await user.save();
    return res.json({ fieldTeam: teams[index], fieldTeams: teams });
  } catch (error) {
    console.error('Update field team error:', error.message);
    return res.status(500).json({ message: 'Server error updating field team' });
  }
});

module.exports = router;
