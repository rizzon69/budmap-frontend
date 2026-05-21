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

// Maintenance mode middleware
const checkMaintenance = require('./middleware/maintenance');

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

// Apply maintenance mode check to all API routes
app.use('/api', checkMaintenance);

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

// Root route — show HTML landing or maintenance page
app.get('/', async (req, res) => {
  const SiteSettings = require('./models/SiteSettings');
  let isMaintenance = false;
  let maintenanceMsg = '';
  try {
    const settings = await SiteSettings.get();
    isMaintenance = settings.maintenanceMode;
    maintenanceMsg = settings.maintenanceMessage || 'The system is currently under maintenance.';
  } catch {}

  if (isMaintenance) {
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>BudMap - Maintenance</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#f0fdf4,#f8fafb,#ecfdf5);font-family:'Inter',sans-serif;padding:24px}
    .logo{display:flex;align-items:center;gap:10px;margin-bottom:36px}
    .logo-icon{width:40px;height:40px;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(16,185,129,.3)}
    .logo-icon svg{color:#fff}
    .logo span{font-size:1.4rem;font-weight:800;color:#111827;letter-spacing:-.4px}
    .card{text-align:center;max-width:460px;width:100%;background:#fff;border-radius:24px;padding:48px 40px;box-shadow:0 1px 3px rgba(0,0,0,.04),0 25px 65px -15px rgba(16,185,129,.1);border:1px solid #e5e7eb}
    .icon-wrap{width:80px;height:80px;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 28px;position:relative}
    .badge{position:absolute;top:-4px;right:-4px;width:24px;height:24px;background:#ef4444;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700}
    h1{font-size:1.6rem;font-weight:800;color:#111827;margin-bottom:8px;letter-spacing:-.4px}
    .desc{font-size:.95rem;color:#6b7280;line-height:1.7;margin-bottom:28px;max-width:360px;margin-left:auto;margin-right:auto}
    .status{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;background:#fefce8;border:1px solid #fde68a;border-radius:12px;margin-bottom:24px}
    .status span{font-size:.85rem;font-weight:600;color:#92400e}
    .divider{height:1px;background:#f3f4f6;margin:0 -8px 20px}
    .admin-link{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;font-size:.84rem;font-weight:600;color:#166534;text-decoration:none}
    .admin-link:hover{background:#dcfce7}
    .footer{margin-top:32px;font-size:.78rem;color:#9ca3af}
    @keyframes dots{0%,80%{opacity:0}40%{opacity:1}}
    .dot{animation:dots 1.4s infinite;font-weight:800}
    .dot:nth-child(2){animation-delay:.2s}
    .dot:nth-child(3){animation-delay:.4s}
  </style>
</head>
<body>
  <div class="logo">
    <div class="logo-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
    </div>
    <span>BudMap</span>
  </div>
  <div class="card">
    <div class="icon-wrap">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      <div class="badge">!</div>
    </div>
    <h1>We'll Be Right Back</h1>
    <p class="desc">${maintenanceMsg}</p>
    <div class="status">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span>Maintenance in progress<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></span>
    </div>
    <div class="divider"></div>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="admin-link">
      Admin Sign In
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
    </a>
  </div>
  <p class="footer">BudMap &mdash; Budget Management Platform</p>
</body>
</html>`);
  }

  res.json({
    message: 'Welcome to BudMap API - Enhanced Edition',
    version: '2.0.0',
    description: 'Budget Allocation Application for SMEs, NGOs, and Educational Institutions in Nepal',
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
