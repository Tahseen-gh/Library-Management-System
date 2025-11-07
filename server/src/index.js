import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import pico from 'picocolors';

import library_items_routes from './routes/library_items.js';
import item_copies_routes from './routes/library_item_copies.js';
import patrons_routes from './routes/patrons.js';
import transactions_routes from './routes/transactions.js';
import reservations_routes from './routes/reservations.js';
import branches_routes from './routes/library_branches.js';
import videos_routes from './routes/videos.js';
import books_routes from './routes/books.js';
import audiobooks_routes from './routes/audiobooks.js';
import reports_routes from './routes/reports.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const api_base = process.env.API_BASE_URL || '/api/v1';

const cors_origin = process.env.CORS_ORIGIN || 'http://localhost:5173';

const is_dev =
  process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV !== 'production' ||
  !process.env.NODE_ENV;

const url = is_dev ? '127.0.0.1' : '0.0.0.0';

// CORS configuration
app.use(
  cors({
    origin: cors_origin,
    referredPolicy: 'no-referrer',
    credentials: false,
  })
);

// Middleware
app.use(
  helmet({
    referrerPolicy: {
      policy: ['unsafe-url'],
    },
  })
); // Security headers with referrer policy
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Rate limiting
const limiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW_MS || '9000') || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '9000') || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Default route
app.get('/', function (_req, res) {
  res.json({
    message: 'Library Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      library_items: api_base + '/library-items',
      patrons: api_base + '/patrons',
      transactions: api_base + '/transactions',
      reservations: api_base + '/reservations',
      branches: api_base + '/branches',
      item_copies: api_base + '/item-copies',
    },
  });
});

app.get('/health', function (req, res) {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use(api_base + '/library-items', library_items_routes);
app.use(api_base + '/patrons', patrons_routes);
app.use(api_base + '/transactions', transactions_routes);
app.use(api_base + '/reservations', reservations_routes);
app.use(api_base + '/branches', branches_routes);
app.use(api_base + '/item-copies', item_copies_routes);
app.use(api_base + '/videos', videos_routes);
app.use(api_base + '/books', books_routes);
app.use(api_base + '/audiobooks', audiobooks_routes);
app.use(api_base + '/reports', reports_routes);

// 404 handler (must come after routes)
app.use(function (req, res) {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handler
app.use(function (err, req, res, next) {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Something went wrong',
  });
});

// Start server
const server = app.listen(PORT, url, function () {
  console.log(
    pico.bgGreen(
      pico.bold(
        `🚀 Server running on http://${url}:${PORT} | 💻 Environment: ${!is_dev ? 'PROD' : 'DEV'} | CORS: ${cors_origin}`
      )
    )
  );
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

export default app;
