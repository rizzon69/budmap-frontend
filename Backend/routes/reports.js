const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
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

const resolveOrgFilter = (req, queryOrgId) => {
  if (queryOrgId) {
    const id = toObjId(queryOrgId);
    return { orgId: id, filter: id ? { organizationId: id } : null };
  }
  if (req.user.role === 'admin' && !req.user.organizationId) {
    return { orgId: null, filter: {} };
  }
  if (!req.user.organizationId) {
    return { orgId: null, filter: null };
  }
  const id = toObjId(req.user.organizationId);
  return { orgId: id, filter: id ? { organizationId: id } : null };
};

const fmtNPR = (v) => `NPR ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

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

// ═══════════════════════════════════════════════════════════════════════════════
// PDF EXPORT  —  POST /api/reports/export-pdf
// Body: { reportType, organizationId?, startDate?, endDate?, fiscalYear?, months? }
// Returns: application/pdf stream (downloads as a file)
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/export-pdf', verifyToken, async (req, res) => {
  try {
    const { reportType, organizationId, startDate, endDate, fiscalYear, months = 6 } = req.body;
    const { orgId, filter: orgFilter } = resolveOrgFilter(req, organizationId);
    if (orgFilter === null) {
      return res.status(400).json({ success: false, message: 'No organisation assigned to your account.' });
    }

    // ── Gather data ──────────────────────────────────────────────────────────
    let reportData = {};

    if (reportType === 'financial') {
      const filter = { ...orgFilter, status: 'completed' };
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = startDate;
        if (endDate)   filter.date.$lte = endDate;
      }
      const [txs, cats, depts] = await Promise.all([
        Transaction.find(filter).lean(),
        BudgetCategory.find().lean(),
        Department.find(orgId ? { organizationId: orgId } : {}).lean(),
      ]);
      const catMap  = Object.fromEntries(cats.map(c  => [c._id.toString(), c]));
      const deptMap = Object.fromEntries(depts.map(d => [d._id.toString(), d]));
      const totalIncome  = txs.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
      const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const catBreak = {}; const deptBreak = {}; const monthly = {};
      txs.forEach(t => {
        const cn = catMap[t.categoryId?.toString()]?.name || 'Uncategorized';
        if (!catBreak[cn]) catBreak[cn] = { name: cn, type: catMap[t.categoryId?.toString()]?.type || 'expense', amount: 0, count: 0 };
        catBreak[cn].amount += t.amount; catBreak[cn].count += 1;
        const dn = deptMap[t.departmentId?.toString()]?.name || 'General';
        if (!deptBreak[dn]) deptBreak[dn] = { name: dn, income: 0, expense: 0, count: 0 };
        deptBreak[dn][t.type] += t.amount; deptBreak[dn].count += 1;
        const m = t.date.substring(0, 7);
        if (!monthly[m]) monthly[m] = { month: m, income: 0, expense: 0 };
        monthly[m][t.type] += t.amount;
      });
      reportData = {
        summary: { totalIncome, totalExpense, netAmount: totalIncome - totalExpense, transactionCount: txs.length },
        categoryBreakdown:   Object.values(catBreak).sort((a, b) => b.amount - a.amount),
        departmentBreakdown: Object.values(deptBreak),
        monthlyTrend:        Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)),
        period: { startDate, endDate },
      };

    } else if (reportType === 'budget') {
      const filter = { ...orgFilter };
      if (fiscalYear) filter.fiscalYear = fiscalYear;
      const [budgets, depts] = await Promise.all([
        Budget.find(filter).lean(),
        Department.find(orgId ? { organizationId: orgId } : {}).lean(),
      ]);
      const deptMap = Object.fromEntries(depts.map(d => [d._id.toString(), d]));
      const rows = budgets.map(b => {
        const util = b.totalAmount > 0 ? parseFloat((b.spentAmount / b.totalAmount * 100).toFixed(2)) : 0;
        return {
          name: b.name,
          department: deptMap[b.departmentId?.toString()]?.name || 'Org-wide',
          totalAmount: b.totalAmount, spentAmount: b.spentAmount,
          remainingAmount: b.totalAmount - b.spentAmount,
          utilizationRate: util,
          status: util > 100 ? 'overspent' : util > 80 ? 'warning' : 'healthy',
        };
      });
      const totalBudgeted = budgets.reduce((s, b) => s + b.totalAmount, 0);
      const totalSpent    = budgets.reduce((s, b) => s + b.spentAmount,  0);
      reportData = {
        summary: { totalBudgets: budgets.length, totalBudgeted, totalSpent,
          averageUtilization: totalBudgeted > 0 ? parseFloat((totalSpent / totalBudgeted * 100).toFixed(2)) : 0 },
        budgets: rows,
      };

    } else if (reportType === 'department') {
      const depts = await Department.find(orgId ? { organizationId: orgId } : {}).lean();
      const rows = await Promise.all(depts.map(async (dept) => {
        const [deptBudgets, deptTx] = await Promise.all([
          Budget.find({ departmentId: dept._id }).lean(),
          Transaction.find({ departmentId: dept._id, status: 'completed' }).lean(),
        ]);
        const totalBudgeted = deptBudgets.reduce((s, b) => s + b.totalAmount, 0);
        const totalSpent    = deptBudgets.reduce((s, b) => s + b.spentAmount,  0);
        const income  = deptTx.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
        const expense = deptTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const head = dept.headId ? await User.findById(dept.headId).select('firstName lastName').lean() : null;
        return {
          name: dept.name, head: head ? `${head.firstName} ${head.lastName}` : 'Not Assigned',
          totalBudgeted, totalSpent, remainingBudget: totalBudgeted - totalSpent,
          utilizationRate: totalBudgeted > 0 ? parseFloat((totalSpent / totalBudgeted * 100).toFixed(2)) : 0,
          income, expense, transactionCount: deptTx.length,
        };
      }));
      reportData = {
        summary: { totalDepartments: rows.length,
          totalBudgeted: rows.reduce((s, d) => s + d.totalBudgeted, 0),
          totalSpent:    rows.reduce((s, d) => s + d.totalSpent, 0),
          totalTransactions: rows.reduce((s, d) => s + d.transactionCount, 0) },
        departments: rows,
      };

    } else if (reportType === 'trends') {
      const end = new Date(); const start = new Date();
      start.setMonth(start.getMonth() - parseInt(months));
      const [txs, cats] = await Promise.all([
        Transaction.find({ ...orgFilter, status: 'completed',
          date: { $gte: start.toISOString().split('T')[0], $lte: end.toISOString().split('T')[0] } }).lean(),
        BudgetCategory.find().lean(),
      ]);
      const catMap = Object.fromEntries(cats.map(c => [c._id.toString(), c]));
      const monthly = {}; const catExp = {};
      txs.forEach(t => {
        const m = t.date.substring(0, 7);
        if (!monthly[m]) monthly[m] = { month: m, income: 0, expense: 0, transactions: 0 };
        monthly[m][t.type] += t.amount; monthly[m].transactions += 1;
        if (t.type === 'expense') {
          const cn = catMap[t.categoryId?.toString()]?.name || 'Uncategorized';
          if (!catExp[cn]) catExp[cn] = { name: cn, amount: 0, count: 0 };
          catExp[cn].amount += t.amount; catExp[cn].count += 1;
        }
      });
      const sortedMonths = Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
      let trend = 'stable';
      if (sortedMonths.length >= 2) {
        const last = sortedMonths[sortedMonths.length - 1]; const prev = sortedMonths[sortedMonths.length - 2];
        const ch = prev.expense > 0 ? ((last.expense - prev.expense) / prev.expense * 100) : 0;
        if (ch > 10) trend = 'increasing'; else if (ch < -10) trend = 'decreasing';
      }
      const totalIncome  = txs.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
      const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      reportData = {
        summary: { totalIncome, totalExpense,
          avgMonthlyExpense: sortedMonths.length > 0
            ? parseFloat((sortedMonths.reduce((s, m) => s + m.expense, 0) / sortedMonths.length).toFixed(2)) : 0 },
        monthlyData: sortedMonths,
        topCategories: Object.values(catExp).sort((a, b) => b.amount - a.amount).slice(0, 5),
        trend, period: { months: parseInt(months) },
      };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid reportType. Use: financial, budget, department, trends' });
    }

    // ── User & org metadata for header ──────────────────────────────────────
    const Organization = require('../models/Organization');
    const [userDoc, orgDoc] = await Promise.all([
      User.findById(req.user.id).select('firstName lastName').lean(),
      orgId ? Organization.findById(orgId).select('name').lean() : Promise.resolve(null),
    ]);
    const generatedBy = userDoc ? `${userDoc.firstName} ${userDoc.lastName}` : 'System';
    const orgName     = orgDoc?.name || 'BudMap Organization';
    const now         = new Date();
    const dateStr     = now.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr     = now.toLocaleTimeString();
    const titles = {
      financial : 'Financial Report',
      budget    : 'Budget Performance Report',
      trends    : 'Expense Trends Report',
      department: 'Department-wise Report',
    };

    // ── Build PDF ────────────────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    const filename = `BudMap_${(titles[reportType] || 'Report').replace(/ /g, '_')}_${now.toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const PW    = doc.page.width;
    const ML    = 40;
    const CW    = PW - ML * 2;
    const GREEN = '#16a34a';
    const RED   = '#dc2626';
    const BLUE  = '#2563eb';
    const DARK  = '#0f172a';
    const GRAY  = '#64748b';
    const LGRAY = '#f8fafc';
    const WHITE = '#ffffff';

    // Header banner
    doc.rect(0, 0, PW, 65).fill(GREEN);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(20).text('BudMap', ML, 14);
    doc.font('Helvetica').fontSize(9).text('Budget Management Application — Nepal', ML, 36);
    doc.font('Helvetica-Bold').fontSize(11).text(titles[reportType] || 'Report', ML, 14, { align: 'right', width: CW });
    doc.font('Helvetica').fontSize(8).fillColor('#d1fae5').text(`${orgName}  |  ${dateStr}`, ML, 32, { align: 'right', width: CW });

    // Sub-header band
    doc.rect(0, 65, PW, 22).fill('#f0fdf4');
    doc.fillColor(GRAY).font('Helvetica').fontSize(8)
      .text(`Generated by: ${generatedBy}   |   ${timeStr}`, ML, 73)
      .text('CONFIDENTIAL', ML, 73, { align: 'right', width: CW });

    let y = 100;

    // ── Helper: section title ────────────────────────────────────────────────
    const sectionTitle = (title) => {
      if (y > 720) { doc.addPage(); y = 40; }
      doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK).text(title, ML, y);
      doc.moveTo(ML, y + 15).lineTo(ML + CW, y + 15).strokeColor(GREEN).lineWidth(0.8).stroke();
      y += 24;
    };

    // ── Helper: 4-box summary row ────────────────────────────────────────────
    const summaryBoxRow = (boxes) => {
      if (y > 710) { doc.addPage(); y = 40; }
      const bw = (CW - (boxes.length - 1) * 8) / boxes.length;
      boxes.forEach((b, i) => {
        const x = ML + i * (bw + 8);
        doc.rect(x, y, bw, 44).fill(LGRAY);
        doc.rect(x, y, 3, 44).fill(b.color || GREEN);
        doc.font('Helvetica').fontSize(7.5).fillColor(GRAY).text(b.label, x + 8, y + 9, { width: bw - 14 });
        doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK).text(String(b.value), x + 8, y + 24, { width: bw - 14 });
      });
      y += 54;
    };

    // ── Helper: table ────────────────────────────────────────────────────────
    const drawTable = (headers, rows, colWidths) => {
      const totalW = colWidths.reduce((s, w) => s + w, 0);
      const rowH   = 18;
      // header row
      if (y + rowH > 750) { doc.addPage(); y = 40; }
      doc.rect(ML, y, totalW, rowH).fill('#1e5128');
      let cx = ML;
      headers.forEach((h, i) => {
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(WHITE)
          .text(h, cx + 4, y + 5, { width: colWidths[i] - 8, ellipsis: true });
        cx += colWidths[i];
      });
      y += rowH;
      rows.forEach((row, ri) => {
        if (y + rowH > 750) { doc.addPage(); y = 40; }
        doc.rect(ML, y, totalW, rowH).fill(ri % 2 === 0 ? WHITE : LGRAY);
        doc.moveTo(ML, y + rowH).lineTo(ML + totalW, y + rowH).strokeColor('#e2e8f0').lineWidth(0.2).stroke();
        cx = ML;
        row.forEach((cell, ci) => {
          doc.font('Helvetica').fontSize(7.5).fillColor(DARK)
            .text(String(cell ?? ''), cx + 4, y + 5, { width: colWidths[ci] - 8, ellipsis: true });
          cx += colWidths[ci];
        });
        y += rowH;
      });
      y += 12;
    };

    // ── Render report sections ───────────────────────────────────────────────
    if (reportType === 'financial') {
      const { summary, categoryBreakdown = [], departmentBreakdown = [], monthlyTrend = [] } = reportData;
      sectionTitle('Financial Summary');
      summaryBoxRow([
        { label: 'Total Income',  value: fmtNPR(summary.totalIncome),   color: GREEN },
        { label: 'Total Expense', value: fmtNPR(summary.totalExpense),  color: RED   },
        { label: 'Net Amount',    value: fmtNPR(summary.netAmount),     color: BLUE  },
        { label: 'Transactions',  value: summary.transactionCount || 0, color: GRAY  },
      ]);
      if (monthlyTrend.length > 0) {
        sectionTitle('Monthly Trend');
        drawTable(
          ['Month', 'Income (NPR)', 'Expense (NPR)', 'Net (NPR)'],
          monthlyTrend.map(m => [m.month, fmtNPR(m.income), fmtNPR(m.expense), fmtNPR(m.income - m.expense)]),
          [60, 150, 150, 152]
        );
      }
      if (categoryBreakdown.length > 0) {
        sectionTitle('Category Breakdown');
        drawTable(
          ['Category', 'Type', 'Amount (NPR)', 'Transactions'],
          categoryBreakdown.map(c => [c.name, c.type, fmtNPR(c.amount), c.count]),
          [160, 80, 170, 102]
        );
      }
      if (departmentBreakdown.length > 0) {
        sectionTitle('Department Breakdown');
        drawTable(
          ['Department', 'Income (NPR)', 'Expense (NPR)', 'Transactions'],
          departmentBreakdown.map(d => [d.name, fmtNPR(d.income), fmtNPR(d.expense), d.count]),
          [130, 140, 140, 102]
        );
      }

    } else if (reportType === 'budget') {
      const { summary, budgets = [] } = reportData;
      sectionTitle('Budget Performance Summary');
      summaryBoxRow([
        { label: 'Total Budgets',   value: summary.totalBudgets,             color: BLUE  },
        { label: 'Total Budgeted',  value: fmtNPR(summary.totalBudgeted),    color: GREEN },
        { label: 'Total Spent',     value: fmtNPR(summary.totalSpent),       color: RED   },
        { label: 'Avg Utilization', value: `${summary.averageUtilization}%`, color: GRAY  },
      ]);
      if (budgets.length > 0) {
        sectionTitle('Budget Details');
        drawTable(
          ['Budget', 'Department', 'Total (NPR)', 'Spent (NPR)', 'Remaining (NPR)', 'Utilization', 'Status'],
          budgets.map(b => [b.name, b.department, fmtNPR(b.totalAmount), fmtNPR(b.spentAmount), fmtNPR(b.remainingAmount), `${b.utilizationRate}%`, b.status]),
          [80, 75, 80, 80, 85, 58, 54]
        );
      }

    } else if (reportType === 'department') {
      const { summary, departments = [] } = reportData;
      sectionTitle('Department Overview');
      summaryBoxRow([
        { label: 'Departments',    value: summary.totalDepartments,        color: BLUE  },
        { label: 'Total Budgeted', value: fmtNPR(summary.totalBudgeted),  color: GREEN },
        { label: 'Total Spent',    value: fmtNPR(summary.totalSpent),     color: RED   },
        { label: 'Transactions',   value: summary.totalTransactions,      color: GRAY  },
      ]);
      if (departments.length > 0) {
        sectionTitle('Department Details');
        drawTable(
          ['Department', 'Head', 'Budgeted (NPR)', 'Spent (NPR)', 'Remaining (NPR)', 'Utilization', 'Transactions'],
          departments.map(d => [d.name, d.head, fmtNPR(d.totalBudgeted), fmtNPR(d.totalSpent), fmtNPR(d.remainingBudget), `${d.utilizationRate}%`, d.transactionCount]),
          [80, 75, 80, 80, 85, 58, 54]
        );
      }

    } else if (reportType === 'trends') {
      const { summary, monthlyData = [], topCategories = [], trend } = reportData;
      sectionTitle('Expense Trends Summary');
      summaryBoxRow([
        { label: 'Total Expense', value: fmtNPR(summary.totalExpense),      color: RED   },
        { label: 'Avg Monthly',   value: fmtNPR(summary.avgMonthlyExpense), color: BLUE  },
        { label: 'Total Income',  value: fmtNPR(summary.totalIncome),       color: GREEN },
        { label: 'Trend',         value: trend || 'stable',                 color: GRAY  },
      ]);
      if (monthlyData.length > 0) {
        sectionTitle('Monthly Breakdown');
        drawTable(
          ['Month', 'Income (NPR)', 'Expense (NPR)', 'Transactions'],
          monthlyData.map(m => [m.month, fmtNPR(m.income), fmtNPR(m.expense), m.transactions]),
          [70, 160, 160, 122]
        );
      }
      if (topCategories.length > 0) {
        sectionTitle('Top Expense Categories');
        drawTable(
          ['Rank', 'Category', 'Amount (NPR)', 'Transactions'],
          topCategories.map((c, i) => [`#${i + 1}`, c.name, fmtNPR(c.amount), c.count]),
          [40, 200, 200, 72]
        );
      }
    }

    // ── Footer on every page ─────────────────────────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const PH = doc.page.height;
      doc.rect(0, PH - 20, PW, 20).fill('#f0fdf4');
      doc.font('Helvetica').fontSize(7.5).fillColor(GRAY)
        .text('BudMap — Confidential Financial Report', ML, PH - 13)
        .text(`Page ${i + 1} of ${range.count}`, ML, PH - 13, { align: 'right', width: CW });
    }

    doc.end();

  } catch (error) {
    console.error('PDF export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF', error: error.message });
    }
  }
});

module.exports = router;
