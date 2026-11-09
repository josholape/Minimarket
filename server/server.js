const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();
const pool = require('./db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const categoryRoutes = require('./routes/categories');
const uploadRoutes = require('./routes/upload');
const addressRoutes = require('./routes/addresses');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const {
  apiLimiter, loginLimiter, registerLimiter, forgotLimiter, resetLimiter,
} = require('./middleware/rateLimiters');

const app = express();
const PORT = process.env.PORT || 5000;

// On Vercel, Express sits behind the platform proxy.
// Revisit this hop count if you deploy behind another proxy architecture.
if (process.env.VERCEL) app.set('trust proxy', 1);

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
if (isProduction && !process.env.CLIENT_URL) {
  throw new Error('CLIENT_URL must be set in production.');
}
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// Allow product images from this API to appear on the separate frontend origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: clientUrl }));
app.use(express.json({ limit: '100kb' }));

// Rate limits run before the corresponding routes.
app.use('/api', apiLimiter);
app.post('/api/auth/login', loginLimiter);
app.post('/api/auth/register', registerLimiter);
app.post('/api/auth/forgot-password', forgotLimiter);
app.post('/api/auth/reset-password', resetLimiter);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'MiniMarket API is running' });
});

// Test DB connection route
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth routes
app.use('/api/auth', authRoutes);

// Product routes
app.use('/api/products', productRoutes);

// Cart routes
app.use('/api/cart', cartRoutes);

// Order routes
app.use('/api/orders', orderRoutes);

// Category routes
app.use('/api/categories', categoryRoutes);

// Upload route
app.use('/api/upload', uploadRoutes);

// Saved address routes
app.use('/api/addresses', addressRoutes);

// Admin routes (dashboard)
app.use('/api/admin', adminRoutes);

// Review routes added
app.use('/api/reviews', reviewRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;