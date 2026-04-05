const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
// Load environment variables
dotenv.config();

const connectDB = require('./database/mongodb');
require('./config/passport'); // Google OAuth passport config
const { testEmailConnection } = require('./services/emailService');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded message attachments
app.use('/uploads', require('express').static(require('path').join(__dirname, 'uploads')));

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'budmap_session_secret_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const organizationRoutes = require('./routes/organizations');
const budgetRoutes = require('./routes/budgets');
const transactionRoutes = require('./routes/transactions');
const departmentRoutes = require('./routes/departments');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

// NEW ENHANCED ROUTES
const registrationRoutes = require('./routes/registration');
const messagesRoutes = require('./routes/messages');
const analyticsRoutes = require('./routes/analytics');
const budgetApprovalsRoutes = require('./routes/budgetApprovals');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// NEW ENHANCED ROUTES
app.use('/api/registration', registrationRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/budget-approvals', budgetApprovalsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to BudMap API - Enhanced Edition',
    version: '2.0.0',
    description: 'Budget Allocation Application for SMEs, NGOs, and Educational Institutions in Nepal',
    newFeatures: [
      'User Registration & Email Verification',
      'Password Reset & Recovery',
      'Internal Messaging System',
      'Advanced Analytics & Forecasting',
      'Budget Predictions with AI',
      'Enhanced Security Features'
    ]
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    version: '2.0.0',
    timestamp: new Date().toISOString() 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Auto-seed if database is empty
const autoSeed = async () => {
  try {
    const Organization = require('./models/Organization');
    const count = await Organization.countDocuments();
    if (count === 0) {
      console.log('\n⚡ Empty database detected — running auto-seed...');
      require('child_process').execSync('node database/seed.js', {
        cwd: __dirname,
        stdio: 'inherit',
      });
      console.log('✅ Auto-seed complete\n');
    }
  } catch (e) {
    console.log('⚠️  Auto-seed skipped:', e.message);
  }
};

// Connect to MongoDB then start server
connectDB().then(async () => {
  await autoSeed();
  app.listen(PORT, async () => {
    // Test email connection on startup
    await testEmailConnection();
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🌟 BudMap Backend Server Started Successfully! 🌟          ║
║   ✨ Enhanced Edition v2.0.0 ✨                               ║
║                                                              ║
║   📍 Server: http://localhost:${PORT}                          ║
║   📊 Health: http://localhost:${PORT}/api/health               ║
║                                                              ║
║   🆕 NEW FEATURES AVAILABLE:                                 ║
║   ✅ User Registration & Email Verification                  ║
║   ✅ Password Reset & Recovery                               ║
║   ✅ Internal Messaging System                               ║
║   ✅ Advanced Analytics Dashboard                            ║
║   ✅ Budget Forecasting & Predictions                        ║
║   ✅ Spending Pattern Analysis                               ║
║                                                              ║
║   Empowering SMEs, NGOs & Educational Institutions           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
  });
});

module.exports = app;
