const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken: auth } = require('../middleware/auth');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Department = require('../models/Department');
const { generateBudgetAnalysis, generateOrganizationInsights } = require('../services/aiService');

// ── Helper: safe ObjectId cast ────────────────────────────────────────────────
const toObjId = (id) => {
  try { return new mongoose.Types.ObjectId(id); } catch (_) { return null; }
};

// GET /api/analytics/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = req.user;
    const { fiscalYear, departmentId, startDate, endDate } = req.query;

    const budgetFilter = { organizationId: user.organizationId };
    const txFilter     = { organizationId: user.organizationId };

    if (fiscalYear) budgetFilter.fiscalYear = fiscalYear;

    if (departmentId && user.role !== 'admin') {
      budgetFilter.$or = [{ departmentId }, { departmentId: null }];
      txFilter.$or     = [{ departmentId }, { departmentId: null }];
    }

    if (startDate && endDate) {
      txFilter.date = { $gte: startDate, $lte: endDate };
    }

    const filteredBudgets      = await Budget.find(budgetFilter).lean();
    const filteredTransactions = await Transaction.find(txFilter).lean();

    const totalBudget  = filteredBudgets.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalSpent   = filteredBudgets.reduce((sum, b) => sum + b.spentAmount,  0);
    const completedTx  = filteredTransactions.filter(t => t.status === 'completed');
    const totalIncome  = completedTx.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
    const totalExpense = completedTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    // Department-wise breakdown
    const departments     = await Department.find({ organizationId: user.organizationId }).lean();
    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        const deptBudgets    = filteredBudgets.filter(b => b.departmentId?.toString() === dept._id.toString());
        const deptTx         = filteredTransactions.filter(t => t.departmentId?.toString() === dept._id.toString());
        const deptTotalBudget = deptBudgets.reduce((s, b) => s + b.totalAmount, 0);
        const deptTotalSpent  = deptBudgets.reduce((s, b) => s + b.spentAmount,  0);
        return {
          id: dept._id, name: dept.name, code: dept.code,
          totalBudget: deptTotalBudget, totalSpent: deptTotalSpent,
          transactionCount: deptTx.length,
          utilization: deptTotalBudget > 0 ? (deptTotalSpent / deptTotalBudget) * 100 : 0
        };
      })
    );

    // Monthly spending trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date       = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd   = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthTx = filteredTransactions.filter(t => {
        const d = new Date(t.date);
        return d >= monthStart && d <= monthEnd && t.status === 'completed';
      });

      const income  = monthTx.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
      const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      monthlyTrend.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        income, expense, net: income - expense
      });
    }

    const budgetStatusCount = {
      active:    filteredBudgets.filter(b => b.status === 'active').length,
      draft:     filteredBudgets.filter(b => b.status === 'draft').length,
      completed: filteredBudgets.filter(b => b.status === 'completed').length,
      expired:   filteredBudgets.filter(b => b.status === 'expired').length
    };

    const transactionStatusCount = {
      completed: filteredTransactions.filter(t => t.status === 'completed').length,
      pending:   filteredTransactions.filter(t => t.status === 'pending').length,
      rejected:  filteredTransactions.filter(t => t.status === 'rejected').length
    };

    const overBudgetCount = filteredBudgets.filter(b => b.spentAmount > b.totalAmount).length;
    const nearLimitCount  = filteredBudgets.filter(b => {
      const u = b.totalAmount > 0 ? (b.spentAmount / b.totalAmount) * 100 : 0;
      return u > 80 && u <= 100;
    }).length;

    res.json({
      success: true,
      data: {
        summary: {
          totalBudget, totalSpent, totalIncome, totalExpense,
          netIncome: totalIncome - totalExpense,
          budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
          remaining: totalBudget - totalSpent
        },
        departments: departmentStats,
        trends: { monthly: monthlyTrend },
        distribution: { budgetStatus: budgetStatusCount, transactionStatus: transactionStatusCount },
        alerts: { overBudget: overBudgetCount, nearLimit: nearLimitCount }
      }
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/forecast
// FIX BUG 3: replaced Math.random() with deterministic linear regression
router.get('/forecast', auth, async (req, res) => {
  try {
    const { budgetId, months = 3 } = req.query;
    if (!budgetId) return res.status(400).json({ success: false, message: 'Budget ID is required' });

    const budget = await Budget.findById(budgetId).lean();
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });

    const budgetTx = await Transaction.find({
      budgetId, type: 'expense', status: 'completed'
    }).sort({ date: 1 }).lean();

    if (budgetTx.length < 3) {
      return res.json({ success: true, message: 'Insufficient data for forecasting (need at least 3 completed expense transactions).', data: null });
    }

    // ── Deterministic linear regression on monthly spending ──────────────────
    // Group transactions into monthly buckets
    const monthlyMap = {};
    budgetTx.forEach(t => {
      const key = t.date.substring(0, 7); // 'YYYY-MM'
      monthlyMap[key] = (monthlyMap[key] || 0) + t.amount;
    });

    const monthlyValues = Object.values(monthlyMap).sort();
    const n = monthlyValues.length;

    // Simple linear regression: y = a + b*x (x = month index, y = spending)
    const xMean = (n - 1) / 2;
    const yMean = monthlyValues.reduce((s, v) => s + v, 0) / n;

    let numerator   = 0;
    let denominator = 0;
    monthlyValues.forEach((y, x) => {
      numerator   += (x - xMean) * (y - yMean);
      denominator += (x - xMean) * (x - xMean);
    });

    const slope     = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Project future months (next index after last known month)
    const forecast     = [];
    const currentDate  = new Date();
    const confidence   = budgetTx.length > 10 ? 'high' : budgetTx.length > 5 ? 'medium' : 'low';

    for (let i = 1; i <= parseInt(months); i++) {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);

      // Predicted spending using regression line (deterministic — no randomness)
      const xNext    = n - 1 + i;
      const predicted = Math.max(0, Math.round(intercept + slope * xNext));
      const cumulative = budget.spentAmount + monthlyValues.slice(n - 1).reduce((s) => s, 0) + (predicted * i);

      forecast.push({
        month:                forecastDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
        predictedSpending:    predicted,
        cumulativeSpent:      Math.round(budget.spentAmount + predicted * i),
        projectedUtilization: budget.totalAmount > 0
          ? Math.round(((budget.spentAmount + predicted * i) / budget.totalAmount) * 10000) / 100
          : 0,
        willExceed: (budget.spentAmount + predicted * i) > budget.totalAmount,
        confidence
      });
    }

    // Exhaustion date: based on average monthly spending (deterministic)
    const avgMonthlySpending = yMean;
    let exhaustionDate = null;
    if (avgMonthlySpending > 0) {
      const remaining  = budget.totalAmount - budget.spentAmount;
      const monthsLeft = remaining / avgMonthlySpending;
      if (monthsLeft > 0) {
        exhaustionDate = new Date();
        exhaustionDate.setMonth(exhaustionDate.getMonth() + Math.ceil(monthsLeft));
      }
    }

    const firstTx   = new Date(budgetTx[0].date);
    const lastTx    = new Date(budgetTx[budgetTx.length - 1].date);
    const monthsDiff = Math.max(1, (lastTx - firstTx) / (1000 * 60 * 60 * 24 * 30));

    res.json({
      success: true,
      data: {
        budget: {
          id: budget._id, name: budget.name,
          totalAmount: budget.totalAmount, spentAmount: budget.spentAmount,
          currentUtilization: budget.totalAmount > 0 ? (budget.spentAmount / budget.totalAmount) * 100 : 0
        },
        historicalData: {
          transactionCount:  budgetTx.length,
          avgMonthlySpending: Math.round(avgMonthlySpending),
          totalPeriodMonths:  Math.round(monthsDiff * 10) / 10,
          trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable'
        },
        forecast,
        predictions: {
          exhaustionDate:     exhaustionDate ? exhaustionDate.toISOString().split('T')[0] : null,
          monthsRemaining:    exhaustionDate ? Math.ceil((exhaustionDate - currentDate) / (1000 * 60 * 60 * 24 * 30)) : null,
          recommendedAction:  avgMonthlySpending * 3 > budget.totalAmount - budget.spentAmount
            ? 'Consider budget reallocation or additional funds'
            : 'Budget is on track'
        }
      }
    });
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate forecast' });
  }
});

// GET /api/analytics/spending-patterns
// FIX BUG 4: cast departmentId and categoryId to ObjectId for correct matching
router.get('/spending-patterns', auth, async (req, res) => {
  try {
    const user = req.user;
    const { departmentId, categoryId, startDate, endDate } = req.query;

    const filter = { organizationId: user.organizationId, type: 'expense', status: 'completed' };

    // FIX BUG 4: proper ObjectId casting avoids silent query mismatches
    if (departmentId) {
      const id = toObjId(departmentId);
      if (id) filter.departmentId = id;
    }
    if (categoryId) {
      const id = toObjId(categoryId);
      if (id) filter.categoryId = id;
    }
    if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };

    const filteredTx = await Transaction.find(filter).lean();

    const dayOfWeekSpending = Array(7).fill(null).map((_, i) => ({
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
      amount: 0, count: 0
    }));

    const timeOfMonthSpending = {
      beginning: { amount: 0, count: 0 },
      middle:    { amount: 0, count: 0 },
      end:       { amount: 0, count: 0 }
    };

    const amountRanges = {
      small:     { range: '0-10,000',       amount: 0, count: 0 },
      medium:    { range: '10,000-50,000',   amount: 0, count: 0 },
      large:     { range: '50,000-100,000',  amount: 0, count: 0 },
      veryLarge: { range: '100,000+',        amount: 0, count: 0 }
    };

    filteredTx.forEach(t => {
      const d   = new Date(t.date);
      const day = d.getDay();
      dayOfWeekSpending[day].amount += t.amount;
      dayOfWeekSpending[day].count++;

      const dom = d.getDate();
      if (dom <= 10)       { timeOfMonthSpending.beginning.amount += t.amount; timeOfMonthSpending.beginning.count++; }
      else if (dom <= 20)  { timeOfMonthSpending.middle.amount    += t.amount; timeOfMonthSpending.middle.count++;    }
      else                 { timeOfMonthSpending.end.amount        += t.amount; timeOfMonthSpending.end.count++;       }

      if      (t.amount < 10000)  { amountRanges.small.amount     += t.amount; amountRanges.small.count++;     }
      else if (t.amount < 50000)  { amountRanges.medium.amount    += t.amount; amountRanges.medium.count++;    }
      else if (t.amount < 100000) { amountRanges.large.amount     += t.amount; amountRanges.large.count++;     }
      else                        { amountRanges.veryLarge.amount += t.amount; amountRanges.veryLarge.count++; }
    });

    res.json({
      success: true,
      data: {
        totalTransactions:     filteredTx.length,
        totalAmount:           filteredTx.reduce((s, t) => s + t.amount, 0),
        avgTransactionAmount:  filteredTx.length > 0
          ? filteredTx.reduce((s, t) => s + t.amount, 0) / filteredTx.length : 0,
        dayOfWeek:             dayOfWeekSpending,
        timeOfMonth:           timeOfMonthSpending,
        amountDistribution:    amountRanges,
        insights: [
          filteredTx.length > 10 && dayOfWeekSpending[0].amount > dayOfWeekSpending[1].amount
            ? 'Higher spending on weekends' : null,
          timeOfMonthSpending.end.amount > timeOfMonthSpending.beginning.amount
            ? 'Spending increases towards month-end' : null,
          amountRanges.veryLarge.count > filteredTx.length * 0.2
            ? 'High frequency of large transactions' : null
        ].filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Spending patterns error:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze spending patterns' });
  }
});

// GET /api/analytics/comparison
// FIX BUG 4: cast departmentId strings to ObjectId
router.get('/comparison', auth, async (req, res) => {
  try {
    const { type, ids } = req.query;
    if (!type || !ids) return res.status(400).json({ success: false, message: 'Type and IDs are required' });

    const idArray    = ids.split(',').map(id => id.trim());
    const comparison = [];

    if (type === 'department') {
      for (const deptId of idArray) {
        const objId = toObjId(deptId);
        if (!objId) continue;

        const dept = await Department.findById(objId).lean();
        if (!dept) continue;

        // FIX BUG 4: use ObjectId in queries
        const deptBudgets = await Budget.find({ departmentId: objId }).lean();
        const deptTx      = await Transaction.find({ departmentId: objId, status: 'completed' }).lean();

        comparison.push({
          id:               deptId,
          name:             dept.name,
          totalBudget:      deptBudgets.reduce((s, b) => s + b.totalAmount, 0),
          totalSpent:       deptBudgets.reduce((s, b) => s + b.spentAmount,  0),
          transactionCount: deptTx.length,
          income:           deptTx.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0),
          expense:          deptTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        });
      }
    }

    res.json({ success: true, data: { type, comparison } });
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate comparison' });
  }
});

// POST /api/analytics/ai-budget-analysis
router.post('/ai-budget-analysis', auth, async (req, res) => {
  try {
    const { budgetId, forecastMonths = 3 } = req.body;
    if (!budgetId) return res.status(400).json({ success: false, message: 'budgetId is required' });

    const budget = await Budget.findById(budgetId).lean();
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });

    const transactions = await Transaction.find({ budgetId }).sort({ date: -1 }).lean();
    const analysis = await generateBudgetAnalysis({ budget, transactions, forecastMonths });

    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('AI budget analysis error:', error.message);
    if (error.message.includes('GEMINI_API_KEY') || error.message.includes('ANTHROPIC_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Add GEMINI_API_KEY to your .env file.',
        code: 'AI_NOT_CONFIGURED'
      });
    }
    res.status(500).json({ success: false, message: 'AI analysis failed: ' + error.message });
  }
});

// POST /api/analytics/ai-organization-insights
router.post('/ai-organization-insights', auth, async (req, res) => {
  try {
    const { summary, departments, monthlyTrend } = req.body;
    if (!summary) return res.status(400).json({ success: false, message: 'summary data is required' });

    const insights = await generateOrganizationInsights({
      summary,
      departments:  departments  || [],
      monthlyTrend: monthlyTrend || []
    });

    res.json({ success: true, data: insights });
  } catch (error) {
    console.error('AI organization insights error:', error.message);
    if (error.message.includes('GEMINI_API_KEY') || error.message.includes('ANTHROPIC_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Add GEMINI_API_KEY to your .env file.',
        code: 'AI_NOT_CONFIGURED'
      });
    }
    res.status(500).json({ success: false, message: 'AI insights failed: ' + error.message });
  }
});

module.exports = router;
