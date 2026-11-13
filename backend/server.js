// Resolve local configuration relative to this backend file, not the caller's
// current working directory (for example, `node backend/server.js` at root).
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  ...(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const error = new Error('Origin is not allowed by CORS');
    error.status = 403;
    return callback(error);
  },
  credentials: true,
  exposedHeaders: ['X-Request-Id'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'ok' : 'unavailable',
    message: 'GovMind AI Backend is running',
    database: isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large', code: 'REQUEST_TOO_LARGE', requestId: req.requestId || null });
  }
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ message: err.message, code: err.code || 'REQUEST_REJECTED', requestId: req.requestId || null });
  }
  console.error('Server request failed', { requestId: req.requestId || null, route: req.path, status: 500 });
  return res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR', requestId: req.requestId || null });
});

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured before the API can start');
  }
  await connectDB();
  return app.listen(PORT, () => {
    console.log(`GovMind AI Backend Server running on http://localhost:${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/api/health`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(`Backend startup failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
