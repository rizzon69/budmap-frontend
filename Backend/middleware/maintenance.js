const SiteSettings = require('../models/SiteSettings');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Maintenance mode middleware.
 * When maintenance is ON:
 *  - Public routes (no token) are blocked with 503
 *  - Non-admin authenticated users are blocked with 503
 *  - Admin users pass through normally
 *
 * Excluded paths (always allowed):
 *  - POST /api/auth/login          (so admin can still log in)
 *  - GET  /api/auth/maintenance    (public status check)
 *  - GET  /api/health
 *  - PUT  /api/admin/maintenance   (so admin can turn it off)
 */
const EXCLUDED_PATHS = [
  { method: 'POST', path: '/auth/login' },
  { method: 'GET',  path: '/auth/maintenance' },
  { method: 'GET',  path: '/health' },
  { method: 'GET',  path: '/admin/maintenance' },
  { method: 'PUT',  path: '/admin/maintenance' },
  { method: 'GET',  path: '/admin/settings' },
  { method: 'GET',  path: '/auth/google' },
  { method: 'GET',  path: '/auth/google/callback' },
];

const checkMaintenance = async (req, res, next) => {
  try {
    // Always allow excluded paths (req.path is relative to the mount point /api)
    const isExcluded = EXCLUDED_PATHS.some(
      (ep) => req.method === ep.method && req.path === ep.path
    );
    if (isExcluded) return next();

    const settings = await SiteSettings.get();
    if (!settings.maintenanceMode) return next();

    // Maintenance is ON — check if user is admin
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('role');
        if (user && user.role === 'admin') {
          return next(); // Admin can access everything
        }
      } catch {
        // Invalid token — fall through to block
      }
    }

    // Block non-admin users
    return res.status(503).json({
      success: false,
      maintenance: true,
      message: settings.maintenanceMessage || 'The system is currently under maintenance. Please try again later.',
    });
  } catch (error) {
    // If settings check fails, don't block the user
    console.error('Maintenance check error:', error.message);
    next();
  }
};

module.exports = checkMaintenance;
