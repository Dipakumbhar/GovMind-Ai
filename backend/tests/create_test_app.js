/**
 * GovMind AI - Test App Factory
 * Creates Express app bound to the mock database for automated test suites.
 */
const express = require('express');
const cors = require('cors');

function createTestApp(mockDB) {
  // Override require cache for models
  const userModelPath = require.resolve('../models/User');
  const complaintModelPath = require.resolve('../models/Complaint');

  require.cache[userModelPath] = {
    id: userModelPath,
    filename: userModelPath,
    loaded: true,
    exports: mockDB.getUserModel(),
  };

  require.cache[complaintModelPath] = {
    id: complaintModelPath,
    filename: complaintModelPath,
    loaded: true,
    exports: mockDB.getComplaintModel(),
  };

  // Clear routes and middleware from cache so they pick up our mock models
  delete require.cache[require.resolve('../middleware/auth')];
  delete require.cache[require.resolve('../middleware/rateLimit')];
  delete require.cache[require.resolve('../routes/auth')];
  delete require.cache[require.resolve('../routes/complaints')];
  delete require.cache[require.resolve('../routes/stats')];

  const authRoutes = require('../routes/auth');
  const complaintRoutes = require('../routes/complaints');
  const statsRoutes = require('../routes/stats');

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/stats', statsRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'GovMind AI Backend is running',
      database: 'connected (in-memory test engine)',
      timestamp: new Date().toISOString(),
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  // Error handler
  app.use((err, req, res, next) => {
    res.status(500).json({ message: 'Internal server error', error: err.message });
  });

  return app;
}

module.exports = { createTestApp };
