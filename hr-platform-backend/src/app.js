const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');

const app = express();

// Security headers on every response
app.use(helmet());

// Allow the frontend (running on a different port) to call this API
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Parse incoming JSON request bodies into req.body
app.use(express.json());

// Log every incoming request
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint — used later by Docker/Kubernetes to verify the app is alive
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/departments', require('./routes/department.routes'));
app.use('/api/leave-requests', require('./routes/leave.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/salaries', require('./routes/salary.routes'));
app.use('/api/documents', require('./routes/document.routes'));
app.use('/api/audit-logs', require('./routes/audit.routes'));

// 404 handler — runs if no route matched
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler — must be defined LAST, with 4 arguments
app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
  });
});

module.exports = app;