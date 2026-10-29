// server/server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const professionalRoutes = require('./routes/professionalRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const savedRoutes = require('./routes/savedRoutes');
const addressRoutes = require('./routes/addressRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const supportRoutes = require('./routes/supportRoutes');
const userRoutes = require('./routes/userRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const DIST_DIR = path.join(__dirname, '..', 'dist');
const CLIENT_PUBLIC_DIR = path.join(__dirname, '..', 'client', 'public');
// Prefer compiled production dist if available, otherwise serve client/public
const PUBLIC_DIR = (fs.existsSync(DIST_DIR) && fs.existsSync(path.join(DIST_DIR, 'index.html')))
  ? DIST_DIR
  : CLIENT_PUBLIC_DIR;

// Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging for API calls
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'MAI Service Marketplace',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/users', userRoutes);

// Compatibility aliases for legacy endpoints
app.use('/api/saved-profiles', savedRoutes);

// Serve static frontend assets
app.use(express.static(PUBLIC_DIR, { dotfiles: 'allow' }));

// 404 for unhandled API routes
app.use('/api', notFoundHandler);

// SPA fallback: return index.html for any other non-API route
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath, { dotfiles: 'allow' });
  } else {
    res.status(404).send('MAI Service frontend not found.');
  }
});

// Centralized error handler
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  MAI SERVICE MARKETPLACE BACKEND IS RUNNING`);
    console.log(`  Server: http://localhost:${PORT}`);
    console.log(`  Health: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

module.exports = app;
