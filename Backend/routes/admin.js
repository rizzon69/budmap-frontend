const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Organization = require('../models/Organization');
const Department = require('../models/Department');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');
const BudgetCategory = require('../models/BudgetCategory');
const { verifyToken, isAdmin } = require('../middleware/auth');
const SiteSettings = require('../models/SiteSettings');

// Admin Dashboard Statistics
router.get('/dashboard', verifyToken, isAdmin, async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    const usersByRole = {
      admin: await User.countDocuments({ role: 'admin' }),
      finance_officer: await User.countDocuments({ role: 'finance_officer' }),
      department_head: await User.countDocuments({ role: 'department_head' }),
      viewer: await User.countDocuments({ role: 'viewer' })
    };

    const recentlyJoined = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Organization statistics
    const totalOrgs = await Organization.countDocuments();
    const activeOrgs = await Organization.countDocuments({ isActive: true });
    const orgsByType = {
      ngo: await Organization.countDocuments({ type: 'ngo' }),
      sme: await Organization.countDocuments({ type: 'sme' }),
      educational: await Organization.countDocuments({ type: 'educational' }),
      government: await Organization.countDocuments({ type: 'government' }),
      other: await Organization.countDocuments({ type: 'other' })
    };

    // Budget statistics
    const allBudgets = await Budget.find().lean();
    const budgetStats = {
      total: allBudgets.length,
      byStatus: {
        draft: allBudgets.filter(b => b.status === 'draft').length,
        active: allBudgets.filter(b => b.status === 'active').length,
        closed: allBudgets.filter(b => b.status === 'closed').length,
        archived: allBudgets.filter(b => b.status === 'archived').length
      },
      totalBudgeted: allBudgets.reduce((sum, b) => sum + b.totalAmount, 0),
      totalSpent: allBudgets.reduce((sum, b) => sum + b.spentAmount, 0)
    };
    budgetStats.utilizationRate = budgetStats.totalBudgeted > 0
      ? ((budgetStats.totalSpent / budgetStats.totalBudgeted) * 100).toFixed(2) : 0;

    // Transaction statistics
    const allTransactions = await Transaction.find().lean();
    const completed = allTransactions.filter(t => t.status === 'completed');
    const transactionStats = {
      total: allTransactions.length,
      byStatus: {
        pending: allTransactions.filter(t => t.status === 'pending').length,
        completed: completed.length,
        cancelled: allTransactions.filter(t => t.status === 'cancelled').length
      },
      totalIncome: completed.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      totalExpense: completed.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    };

    // Department statistics
    const totalDepts = await Department.countDocuments();
    const activeDepts = await Department.countDocuments({ isActive: true });

    // Recent activity
    const recentLogs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const recentActivity = await Promise.all(
      recentLogs.map(async (log) => {
        const user = await User.findById(log.userId).select('firstName lastName').lean();
        return { ...log, userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown' };
      })
    );

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers, byRole: usersByRole, recentlyJoined },
        organizations: { total: totalOrgs, active: activeOrgs, byType: orgsByType },
        budgets: budgetStats,
        transactions: transactionStats,
        departments: { total: totalDepts, active: activeDepts },
        recentActivity,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin dashboard', error: error.message });
  }
});

// Get all activity logs
router.get('/activity-logs', verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId, action, entity, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (entity) filter.entity = entity;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const total = await ActivityLog.countDocuments(filter);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const logsWithUsers = await Promise.all(
      logs.map(async (log) => {
        const user = await User.findById(log.userId).select('firstName lastName email').lean();
        return {
          ...log,
          user: user ? { id: user._id, name: `${user.firstName} ${user.lastName}`, email: user.email } : null
        };
      })
    );

    res.json({
      success: true,
      data: {
        logs: logsWithUsers,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch activity logs', error: error.message });
  }
});

// System-wide financial summary
router.get('/financial-summary', verifyToken, isAdmin, async (req, res) => {
  try {
    const { fiscalYear } = req.query;

    const budgetFilter = {};
    if (fiscalYear) budgetFilter.fiscalYear = fiscalYear;

    const allBudgets = await Budget.find(budgetFilter).lean();
    const completedTx = await Transaction.find({ status: 'completed' }).lean();
    const organizations = await Organization.find().lean();
    const categories = await BudgetCategory.find().lean();

    // Organization-wise summary
    const orgSummary = organizations.map(org => {
      const orgBudgets = allBudgets.filter(b => b.organizationId?.toString() === org._id.toString());
      const orgTx = completedTx.filter(t => t.organizationId?.toString() === org._id.toString());

      return {
        id: org._id, name: org.name, type: org.type,
        budgetCount: orgBudgets.length,
        totalBudgeted: orgBudgets.reduce((s, b) => s + b.totalAmount, 0),
        totalSpent: orgBudgets.reduce((s, b) => s + b.spentAmount, 0),
        income: orgTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: orgTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        transactionCount: orgTx.length
      };
    });

    // Category-wise spending
    const categorySummary = categories.map(cat => {
      const catTx = completedTx.filter(t => t.categoryId?.toString() === cat._id.toString());
      return {
        id: cat._id, name: cat.name, type: cat.type, color: cat.color,
        totalAmount: catTx.reduce((s, t) => s + t.amount, 0),
        transactionCount: catTx.length
      };
    }).filter(c => c.totalAmount > 0);

    const totalBudgeted = allBudgets.reduce((s, b) => s + b.totalAmount, 0);
    const totalSpent = allBudgets.reduce((s, b) => s + b.spentAmount, 0);
    const totalIncome = completedTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = completedTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalBudgeted, totalSpent, totalRemaining: totalBudgeted - totalSpent,
          systemUtilization: totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(2) : 0,
          totalIncome, totalExpense, netAmount: totalIncome - totalExpense
        },
        organizationSummary: orgSummary,
        categorySummary: categorySummary.sort((a, b) => b.totalAmount - a.totalAmount),
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch financial summary', error: error.message });
  }
});

// Get system settings (placeholder)
router.get('/settings', verifyToken, isAdmin, (req, res) => {
  res.json({
    success: true,
    data: {
      settings: {
        defaultCurrency: 'NPR', defaultFiscalYearStart: 'July',
        emailNotifications: true, budgetAlertThreshold: 80,
        autoApproveSmallTransactions: false, smallTransactionLimit: 10000,
        sessionTimeout: 30, maxLoginAttempts: 5
      }
    }
  });
});

// Update system settings (placeholder)
router.put('/settings', verifyToken, isAdmin, (req, res) => {
  res.json({ success: true, message: 'Settings updated successfully', data: { settings: req.body } });
});

// ── Maintenance Mode ────────────────────────────────────────────────────────

// GET /api/admin/maintenance — get maintenance status (admin only)
router.get('/maintenance', verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await SiteSettings.get();
    res.json({
      success: true,
      data: {
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch maintenance status', error: error.message });
  }
});

// PUT /api/admin/maintenance — toggle maintenance mode (admin only)
router.put('/maintenance', verifyToken, isAdmin, async (req, res) => {
  try {
    const { maintenanceMode, maintenanceMessage } = req.body;
    const settings = await SiteSettings.get();

    if (typeof maintenanceMode === 'boolean') {
      settings.maintenanceMode = maintenanceMode;
    }
    if (maintenanceMessage !== undefined) {
      settings.maintenanceMessage = maintenanceMessage;
    }
    settings.updatedBy = req.user.userId;
    await settings.save();

    // Log the action
    await ActivityLog.create({
      userId: req.user.userId,
      action: maintenanceMode ? 'ENABLE' : 'DISABLE',
      entity: 'Maintenance Mode',
      entityId: settings._id.toString(),
      details: `Maintenance mode ${settings.maintenanceMode ? 'enabled' : 'disabled'}`,
    });

    res.json({
      success: true,
      message: `Maintenance mode ${settings.maintenanceMode ? 'enabled' : 'disabled'} successfully`,
      data: {
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update maintenance mode', error: error.message });
  }
});

module.exports = router;
