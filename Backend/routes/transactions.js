const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const BudgetAllocation = require('../models/BudgetAllocation');
const BudgetCategory = require('../models/BudgetCategory');
const Department = require('../models/Department');
const mongoose = require('mongoose');
const { verifyToken, isFinanceOfficerOrAdmin, isDepartmentHeadOrHigher } = require('../middleware/auth');
const User = require('../models/User');
const { sendTransactionApproved, sendTransactionRejected, sendBudgetAlert } = require('../services/emailService');

// ── IMPORTANT: specific routes MUST come before /:id ─────────────────────────

// Get transaction statistics  (must be before /:id)
router.get('/stats/summary', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, organizationId } = req.query;
    const orgId = organizationId || req.user.organizationId;
    if (!orgId) return res.json({ success: true, data: { summary: { totalIncome: 0, totalExpense: 0, netAmount: 0, totalTransactions: 0, pendingCount: 0, completedCount: 0 }, monthlyBreakdown: [], categoryBreakdown: [] } });

    const filter = { organizationId: new mongoose.Types.ObjectId(orgId) };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const allTransactions = await Transaction.find(filter).lean();
    const completed = allTransactions.filter(t => t.status === 'completed');

    const monthlyData = {};
    completed.forEach(t => {
      const month = t.date.substring(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
      monthlyData[month][t.type] += t.amount;
    });

    const categories = await BudgetCategory.find().lean();
    const catMap = {};
    categories.forEach(c => { catMap[c._id.toString()] = c; });

    const categoryData = {};
    completed.forEach(t => {
      const cat = catMap[t.categoryId?.toString()];
      const catName = cat ? cat.name : 'Unknown';
      if (!categoryData[catName]) categoryData[catName] = { amount: 0, count: 0, type: cat?.type };
      categoryData[catName].amount += t.amount;
      categoryData[catName].count += 1;
    });

    const totalIncome  = completed.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = completed.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalIncome, totalExpense, netAmount: totalIncome - totalExpense,
          totalTransactions: allTransactions.length,
          pendingCount: allTransactions.filter(t => t.status === 'pending').length,
          completedCount: completed.length
        },
        monthlyBreakdown: Object.entries(monthlyData)
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        categoryBreakdown: Object.entries(categoryData)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.amount - a.amount)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transaction statistics', error: error.message });
  }
});

// Get all transactions
router.get('/', verifyToken, async (req, res) => {
  try {
    const { organizationId, budgetId, departmentId, categoryId, type, status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (req.user.role === 'viewer') {
      if (!req.user.organizationId) {
        return res.json({
          success: true,
          data: {
            transactions: [],
            summary: { totalIncome: 0, totalExpense: 0, netAmount: 0, transactionCount: 0 },
            pagination: { total: 0, page: 1, limit: parseInt(limit), pages: 0 }
          }
        });
      }
      filter.organizationId = new mongoose.Types.ObjectId(req.user.organizationId);
      filter.status = 'completed';
    } else {
      if (organizationId) filter.organizationId = new mongoose.Types.ObjectId(organizationId);
      else if (req.user.organizationId) filter.organizationId = new mongoose.Types.ObjectId(req.user.organizationId);
      if (status) filter.status = status;
    }

    if (budgetId) filter.budgetId = new mongoose.Types.ObjectId(budgetId);
    if (departmentId) filter.departmentId = new mongoose.Types.ObjectId(departmentId);
    if (categoryId) filter.categoryId = new mongoose.Types.ObjectId(categoryId);
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const total = await Transaction.countDocuments(filter);
    const skip  = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('budgetId',     'name totalAmount spentAmount status')
      .populate('categoryId',   'name type color icon')
      .populate('departmentId', 'name code')
      .lean();

    const mapped = transactions.map(t => ({
      ...t,
      id:           t._id.toString(),
      budget:       t.budgetId     || null,
      category:     t.categoryId   || null,
      department:   t.departmentId || null,
      budgetId:     t.budgetId?._id     || t.budgetId,
      categoryId:   t.categoryId?._id   || t.categoryId,
      departmentId: t.departmentId?._id || t.departmentId,
    }));

    const allFiltered  = await Transaction.find(filter).lean();
    const totalIncome  = allFiltered.filter(t => t.type === 'income'  && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
    const totalExpense = allFiltered.filter(t => t.type === 'expense' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);

    res.json({
      success: true,
      data: {
        transactions: mapped,
        summary: { totalIncome, totalExpense, netAmount: totalIncome - totalExpense, transactionCount: total },
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
  }
});

// Get transaction by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction ID' });
    }

    const transaction = await Transaction.findById(req.params.id)
      .populate('budgetId',     'name totalAmount spentAmount status')
      .populate('categoryId',   'name type color icon')
      .populate('departmentId', 'name code')
      .lean();

    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

    if (req.user.role === 'viewer') {
      if (transaction.status !== 'completed') {
        return res.status(403).json({ success: false, message: 'Access denied. Viewers can only view approved transactions.' });
      }
      if (req.user.organizationId && transaction.organizationId?.toString() !== req.user.organizationId.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only view transactions within your organization.' });
      }
    }

    res.json({
      success: true,
      data: {
        transaction: {
          ...transaction,
          id:         transaction._id.toString(),
          budget:     transaction.budgetId     || null,
          category:   transaction.categoryId   || null,
          department: transaction.departmentId || null,
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transaction', error: error.message });
  }
});

// Create transaction
router.post('/', verifyToken, isDepartmentHeadOrHigher, async (req, res) => {
  try {
    const { budgetId, categoryId, departmentId, type, amount, description, date, payee, reference } = req.body;

    if (!budgetId || !categoryId || !type || !amount || !description || !date) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields: budgetId, categoryId, type, amount, description, date' });
    }

    const budget = await Budget.findById(budgetId);
    if (!budget) return res.status(400).json({ success: false, message: 'Invalid budget ID' });
    if (budget.status !== 'active') return res.status(400).json({ success: false, message: 'Cannot add transactions to inactive budget' });

    const category = await BudgetCategory.findById(categoryId);
    if (!category) return res.status(400).json({ success: false, message: 'Invalid category ID' });
    if (category.type !== type) {
      return res.status(400).json({ success: false, message: `Category "${category.name}" is for ${category.type}, not ${type}` });
    }

    const newTransaction = await Transaction.create({
      organizationId: budget.organizationId,
      budgetId, categoryId,
      departmentId: departmentId || null,
      type, amount: parseFloat(amount),
      description, date,
      payee:     payee     || null,
      reference: reference || null,
      status: 'pending',
      createdBy:  req.user.userId,
      approvedBy: null
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction: { ...newTransaction.toObject(), id: newTransaction._id.toString() } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create transaction', error: error.message });
  }
});

// Update transaction
router.put('/:id', verifyToken, isDepartmentHeadOrHigher, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction ID' });
    }
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (transaction.status !== 'pending') return res.status(400).json({ success: false, message: 'Cannot modify completed or cancelled transactions' });

    const { categoryId, departmentId, amount, description, date, payee, reference } = req.body;
    if (categoryId)             transaction.categoryId   = categoryId;
    if (departmentId !== undefined) transaction.departmentId = departmentId;
    if (amount)                 transaction.amount       = parseFloat(amount);
    if (description)            transaction.description  = description;
    if (date)                   transaction.date         = date;
    if (payee !== undefined)    transaction.payee        = payee;
    if (reference !== undefined) transaction.reference   = reference;
    await transaction.save();

    res.json({ success: true, message: 'Transaction updated successfully', data: { transaction } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update transaction', error: error.message });
  }
});

// Approve transaction
router.post('/:id/approve', verifyToken, isFinanceOfficerOrAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction ID' });
    }
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (transaction.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending transactions can be approved' });

    transaction.status     = 'completed';
    transaction.approvedBy = req.user.userId;
    await transaction.save();

    if (transaction.type === 'expense') {
      await Budget.findByIdAndUpdate(transaction.budgetId, { $inc: { spentAmount: transaction.amount } });
      await BudgetAllocation.findOneAndUpdate(
        { budgetId: transaction.budgetId, categoryId: transaction.categoryId },
        { $inc: { spentAmount: transaction.amount } }
      );

      // Check budget utilization and send alert if over 80% or 100%
      const updatedBudget = await Budget.findById(transaction.budgetId).lean();
      if (updatedBudget && updatedBudget.totalAmount > 0) {
        const utilPct = (updatedBudget.spentAmount / updatedBudget.totalAmount) * 100;
        if (utilPct >= 80) {
          // Notify the budget creator
          const creator = updatedBudget.createdBy
            ? await User.findById(updatedBudget.createdBy).select('email firstName').lean()
            : null;
          if (creator) {
            sendBudgetAlert(creator.email, creator.firstName, updatedBudget, utilPct).catch(() => {});
          }
        }
      }
    }

    // Notify the transaction creator that it was approved
    const creator = transaction.createdBy
      ? await User.findById(transaction.createdBy).select('email firstName').lean()
      : null;
    if (creator) {
      sendTransactionApproved(creator.email, creator.firstName, transaction).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Transaction approved successfully',
      data: { transaction: { ...transaction.toObject(), id: transaction._id.toString() } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve transaction', error: error.message });
  }
});

// Reject/Cancel transaction
router.post('/:id/reject', verifyToken, isFinanceOfficerOrAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction ID' });
    }
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (transaction.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending transactions can be rejected' });

    transaction.status = 'cancelled';
    await transaction.save();

    // Notify the transaction creator that it was rejected
    const creator = transaction.createdBy
      ? await User.findById(transaction.createdBy).select('email firstName').lean()
      : null;
    if (creator) {
      sendTransactionRejected(creator.email, creator.firstName, transaction).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Transaction rejected successfully',
      data: { transaction: { ...transaction.toObject(), id: transaction._id.toString() } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject transaction', error: error.message });
  }
});

// Delete transaction
router.delete('/:id', verifyToken, isFinanceOfficerOrAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction ID' });
    }
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (transaction.status === 'completed') return res.status(400).json({ success: false, message: 'Cannot delete completed transactions' });

    await Transaction.findByIdAndDelete(transaction._id);
    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete transaction', error: error.message });
  }
});

module.exports = router;
