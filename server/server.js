const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import routes
const catalog_items_routes = require('./routes/catalog_items');
const patrons_routes = require('./routes/patrons');
const transactions_routes = require('./routes/transactions');
const reservations_routes = require('./routes/reservations');
const branches_routes = require('./routes/branches');
const item_copies_routes = require('./routes/item_copies');

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('combined')); // Logging

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
const api_base = process.env.API_BASE_URL || '/api/v1';
app.use(`${api_base}/catalog-items`, catalog_items_routes);
app.use(`${api_base}/patrons`, patrons_routes);
app.use(`${api_base}/transactions`, transactions_routes);
app.use(`${api_base}/reservations`, reservations_routes);
app.use(`${api_base}/branches`, branches_routes);
app.use(`${api_base}/item-copies`, item_copies_routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Library Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api_base: api_base,
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`API Base URL: ${api_base}`);
});

module.exports = app;
