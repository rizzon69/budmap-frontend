const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT Token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    // Always read role and organizationId from the live DB user,
    // not from the JWT payload — so role changes take effect immediately
    req.user = {
      userId: user._id.toString(),
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ? user.organizationId.toString() : null
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

// Check if user is Admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Check if user is Finance Officer or Admin
const isFinanceOfficerOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'finance_officer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Finance Officer or Admin privileges required.'
    });
  }
  next();
};

// Check if user is Department Head or higher
const isDepartmentHeadOrHigher = (req, res, next) => {
  const allowedRoles = ['admin', 'finance_officer', 'department_head'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient privileges.'
    });
  }
  next();
};

// Role-based access control
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  isAdmin,
  isFinanceOfficerOrAdmin,
  isDepartmentHeadOrHigher,
  checkRole
};
