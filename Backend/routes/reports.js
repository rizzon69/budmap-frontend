const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const BudgetCategory = require('../models/BudgetCategory');
const Department = require('../models/Department');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// ── helper ────────────────────────────────────────────────────────────────────
const toObjId = (id) => {
  try { return new mongoose.Types.ObjectId(id); } catch (e) { return null; }
};

// Resolve orgId: admins with no org see all data, others must have an org
const resolveOrgFilter = (req, queryOrgId) => {
  // If a specific orgId was requested use it
  if (queryOrgId) {
    const id = toObjId(queryOrgId);
    return { orgId: id, filter: id ? { organizationId: id } : null };
  }
  // Admin with no org assigned → no org filter (sees all)
  if (req.user.role === 'admin' && !req.user.organizationId) {
    return { orgId: null, filter: {} };
  }
  // All other roles must have an org
  if (!req.user.organizationId) {
    return { orgId: null, filter: null }; // null filter = deny
  }
  const id = toObjId(req.user.organizationId);
  return { orgId: id, filter: id ? { organizationId: id } : null };
};

// ── Financial Report ──────────────────────────────────────────────────────────
router.get('/financial', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, organizationId, departmentId } = req.query;
    const { orgId, filter: orgFilter } = resolveOrgFilter(req, organizationId);
    if (orgFilter === null) {
      return res.status(400).json({ success: false, message: 'Your account has no organisation assigned. Ask an admin to assign one.' });
    }

    const filter = { ...orgFilter, status: 'completed' };
    if (departmentId) filter.departmentId = toObjId(departmentId);
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate)   filter.date.$lte = endDate;
    }

    const [filteredTx, categories, departments] = await Promise.all([
      Transaction.find(filter).lean(),
      BudgetCategory.find().lean(),
      Department.find({ organizationId: orgId }).lean(),
    ]);

    const catMap  = Object.fromEntries(categories.map(c  => [c._id.toString(), c]));
    const deptMap = Object.fromEntries(departments.map(d => [d._id.toString(), d]));

    const totalIncome  = filteredTx.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
    const totalExpense = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const categoryBreakdown = {};
    filteredTx.forEach(t => {
      const cat     = catMap[t.categoryId?.toString()];
      const catName = cat ? cat.name : 'Uncategorized';
      if (!categoryBreakdown[catName]) {
        categoryBreakdown[catName] = { name: catName, type: cat?.type || 'expense', amount: 0, count: 0 };
      }
      categoryBreakdown[catName].amount += t.amount;
      categoryBreakdown[catName].count  += 1;
    });

    const departmentBreakdown = {};
    filteredTx.forEach(t => {
      const dept     = deptMap[t.departmentId?.toString()];
      const deptName = dept ? dept.name : 'General';
      if (!departmentBreakdown[deptName]) {
        departmentBreakdown[deptName] = { name: deptName, income: 0, expense: 0, count: 0 };
      }
      departmentBreakdown[deptName][t.type] += t.amount;
      departmentBreakdown[deptName].count   += 1;
    });

    const monthlyTrend = {};
    filteredTx.forEach(t => {
      const month = t.date.substring(0, 7);
      if (!monthlyTrend[month]) monthlyTrend[month] = { month, income: 0, expense: 0 };
      monthlyTrend[month][t.type] += t.amount;
    });

    res.json({
      success: true,
      data: {
        reportType: 'financial',
        period: { startDate, endDate },
        summary: {
          totalIncome, totalExpense,
          netAmount: totalIncome - totalExpense,
          profitMargin: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(2) : 0,
          transactionCount: filteredTx.length,
        },
        categoryBreakdown:    Object.values(categoryBreakdown).sort((a, b) => b.amount - a.amount),
        departmentBreakdown:  Object.values(departmentBreakdown),
        monthlyTrend:         Object.values(monthlyTrend).sort((a, b) => a.month.localeCompare(b.month)),
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Financial report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate financial report', error: error.message });
  }
});

// ── Budget Performance ────────────────────────────────────────────────────────
router.get('/budget-performance', verifyToken, async (req, res) => {
  try {
    const { fiscalYear, organizationId, departmentId } = req.query;
    const { orgId, filter: orgFilter } = resolveOrgFilter(req, organizationId);
    if (orgFilter === null) {
      return res.status(400).json({ success: false, message: 'Your account has no organisation assigned. Ask an admin to assign one.' });
    }
    const filter = { ...orgFilter };
    if (fiscalYear)   filter.fiscalYear   = fiscalYear;
    if (departmentId) filter.departmentId = toObjId(departmentId);

    const [filteredBudgets, departments] = await Promise.all([
      Budget.find(filter).lean(),
      Department.find({ organizationId: orgId }).lean(),
    ]);

    const deptMap = Object.fromEntries(departments.map(d => [d._id.toString(), d]));

    const budgetPerformance = filteredBudgets.map(budget => {
      const dept            = deptMap[budget.departmentId?.toString()];
      const utilizationRate = budget.totalAmount > 0
        ? parseFloat((budget.spentAmount / budget.totalAmount * 100).toFixed(2))
        : 0;
      let status = 'healthy';
      if (utilizationRate > 100)    status = 'overspent';
      else if (utilizationRate > 80) status = 'warning';
      else if (utilizationRate < 30) status = 'underutilized';

      return {
        id:               budget._id.toString(),
        name:             budget.name,
        department:       dept ? dept.name : 'Organisation-wide',
        fiscalYear:       budget.fiscalYear,
        totalAmount:      budget.totalAmount,
        allocatedAmount:  budget.allocatedAmount,
        spentAmount:      budget.spentAmount,
        remainingAmount:  budget.totalAmount - budget.spentAmount,
        utilizationRate,
        status,
        budgetStatus: budget.status,
      };
    });

    const totalBudgeted = filteredBudgets.reduce((s, b) => s + b.totalAmount, 0);
    const totalSpent    = filteredBudgets.reduce((s, b) => s + b.spentAmount,  0);

    res.json({
      success: true,
      data: {
        reportType: 'budget-performance',
        summary: {
          totalBudgets:        filteredBudgets.length,
          activeBudgets:       filteredBudgets.filter(b => b.status === 'active').length,
          totalBudgeted, totalSpent,
          totalRemaining:      totalBudgeted - totalSpent,
          averageUtilization:  totalBudgeted > 0 ? parseFloat((totalSpent / totalBudgeted * 100).toFixed(2)) : 0,
          overspentCount:      budgetPerformance.filter(b => b.status === 'overspent').length,
          warningCount:        budgetPerformance.filter(b => b.status === 'warning').length,
          healthyCount:        budgetPerformance.filter(b => b.status === 'healthy').length,
        },
        budgets:     budgetPerformance,
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Budget performance report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate budget performance report', error: error.message });
  }
});

// ── Department-wise Report ────────────────────────────────────────────────────
router.get('/department-wise', verifyToken, async (req, res) => {
  try {
    const { organizationId, startDate, endDate } = req.query;
    const { orgId, filter: orgFilter } = resolveOrgFilter(req, organizationId);
    if (orgFilter === null) {
      return res.status(400).json({ success: false, message: 'Your account has no organisation assigned. Ask an admin to assign one.' });
    }
    const deptQuery = orgId ? { organizationId: orgId } : {};
    const orgDepts = await Department.find(deptQuery).lean();

    const departmentReports = await Promise.all(
      orgDepts.map(async (dept) => {
        const deptBudgets = await Budget.find({ departmentId: dept._id }).lean();
        const txFilter    = { departmentId: dept._id, status: 'completed' };
        if (startDate || endDate) {
          txFilter.date = {};
          if (startDate) txFilter.date.$gte = startDate;
          if (endDate)   txFilter.date.$lte = endDate;
        }
        const deptTx = await Transaction.find(txFilter).lean();

        const totalBudgeted = deptBudgets.reduce((s, b) => s + b.totalAmount, 0);
        const totalSpent    = deptBudgets.reduce((s, b) => s + b.spentAmount,  0);
        const income  = deptTx.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
        const expense = deptTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        const head = dept.headId
          ? await User.findById(dept.headId).select('firstName lastName').lean()
          : null;

        return {
          id: dept._id.toString(), name: dept.name, code: dept.code,
          head:             head ? `${head.firstName} ${head.lastName}` : 'Not Assigned',
          budgetCount:      deptBudgets.length,
          totalBudgeted,    totalSpent,
          remainingBudget:  totalBudgeted - totalSpent,
          utilizationRate:  totalBudgeted > 0
            ? parseFloat((totalSpent / totalBudgeted * 100).toFixed(2))
            : 0,
          transactionCount: deptTx.length,
          income, expense,
          netAmount: income - expense,
        };
      })
    );

    res.json({
      success: true,
      data: {
        reportType: 'department-wise',
        period: { startDate, endDate },
        departments: departmentReports,
        summary: {
          totalDepartments:  departmentReports.length,
          totalBudgeted:     departmentReports.reduce((s, d) => s + d.totalBudgeted, 0),
          totalSpent:        departmentReports.reduce((s, d) => s + d.totalSpent,    0),
          totalTransactions: departmentReports.reduce((s, d) => s + d.transactionCount, 0),
        },
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Department report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate department report', error: error.message });
  }
});

// ── Expense Trends ────────────────────────────────────────────────────────────
router.get('/expense-trends', verifyToken, async (req, res) => {
  try {
    const { organizationId, months = 6 } = req.query;
    const { orgId, filter: orgFilter } = resolveOrgFilter(req, organizationId);
    if (orgFilter === null) {
      return res.status(400).json({ success: false, message: 'Your account has no organisation assigned. Ask an admin to assign one.' });
    }

    const end   = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - parseInt(months));

    const [filteredTx, categories] = await Promise.all([
      Transaction.find({
        ...orgFilter,
        status: 'completed',
        date: {
          $gte: start.toISOString().split('T')[0],
          $lte: end.toISOString().split('T')[0],
        },
      }).lean(),
      BudgetCategory.find().lean(),
    ]);

    const catMap = Object.fromEntries(categories.map(c => [c._id.toString(), c]));

    const monthlyData = {};
    filteredTx.forEach(t => {
      const month = t.date.substring(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { month, income: 0, expense: 0, transactions: 0 };
      monthlyData[month][t.type]        += t.amount;
      monthlyData[month].transactions   += 1;
    });

    const sortedMonths = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    let expenseTrend = 'stable';
    if (sortedMonths.length >= 2) {
      const last   = sortedMonths[sortedMonths.length - 1];
      const prev   = sortedMonths[sortedMonths.length - 2];
      const change = prev.expense > 0 ? ((last.expense - prev.expense) / prev.expense * 100) : 0;
      if (change > 10)       expenseTrend = 'increasing';
      else if (change < -10) expenseTrend = 'decreasing';
    }

    const categoryExpenses = {};
    filteredTx.filter(t => t.type === 'expense').forEach(t => {
      const cat     = catMap[t.categoryId?.toString()];
      const catName = cat ? cat.name : 'Uncategorized';
      if (!categoryExpenses[catName]) categoryExpenses[catName] = { name: catName, amount: 0, count: 0 };
      categoryExpenses[catName].amount += t.amount;
      categoryExpenses[catName].count  += 1;
    });

    const totalIncome  = filteredTx.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
    const totalExpense = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const avgMonthly   = sortedMonths.length > 0
      ? (sortedMonths.reduce((s, m) => s + m.expense, 0) / sortedMonths.length).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        reportType: 'expense-trends',
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate:   end.toISOString().split('T')[0],
          months:    parseInt(months),
        },
        monthlyData:    sortedMonths,
        trend:          expenseTrend,
        topCategories:  Object.values(categoryExpenses).sort((a, b) => b.amount - a.amount).slice(0, 5),
        summary:        { totalIncome, totalExpense, avgMonthlyExpense: parseFloat(avgMonthly) },
        generatedAt:    new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Expense trends report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate expense trends report', error: error.message });
  }
});

module.exports = router;
