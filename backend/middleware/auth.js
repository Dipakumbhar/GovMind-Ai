const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) {
    return res.status(401).json({ message: 'Not authorized, no token', code: 'AUTH_TOKEN_MISSING', requestId: req.requestId || null });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ message: 'Authentication is not configured', code: 'AUTH_NOT_CONFIGURED', requestId: req.requestId || null });
  }

  try {
    const decoded = jwt.verify(match[1], process.env.JWT_SECRET);
    if (!decoded.id) {
      return res.status(401).json({ message: 'Not authorized, token invalid', code: 'AUTH_TOKEN_INVALID', requestId: req.requestId || null });
    }
    req.user = await User.findById(decoded.id).select('-passwordHash -password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found', code: 'AUTH_USER_NOT_FOUND', requestId: req.requestId || null });
    }
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Not authorized, token invalid', code: 'AUTH_TOKEN_INVALID', requestId: req.requestId || null });
    }
    return next(error);
  }
};

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.', code: 'ADMIN_ROLE_REQUIRED', requestId: req.requestId || null });
  }
};

module.exports = { protect, adminOnly };
