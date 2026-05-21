const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const BudgetAllocation = require('../models/BudgetAllocation');
const BudgetCategory = require('../models/BudgetCategory');
const Department = require('../models/Department');
const Transaction = require('../models/Transaction');
const { verifyToken, isFinanceOfficerOrAdmin, isDepartmentHeadOrHigher } = require('../middleware/auth');

// Get budget categories — MUST be before /:id to avoid 'meta' being matched as an ID
router.get('/meta/categories', verifyToken, async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;
    const categories = await BudgetCategory.find(filter).lean();
    res.json({ success: true, data: { categories } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
  }
});

// Get budget summary/statistics — MUST be before /:id
router.get('/stats/summary', verifyToken, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const rawId = req.query.organizationId || req.user.organizationId;
    const orgId = rawId ? new mongoose.Types.ObjectId(rawId) : null;
    if (!orgId) return res.json({ success: true, data: { summary: {}, categorySpending: [] } });
    const orgBudgets = await Budget.find({ organizationId: orgId }).lean();
    const activeBudgets = orgBudgets.filter(b => b.status === 'active');

    const totalBudgeted = activeBudgets.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalSpent = activeBudgets.reduce((sum, b) => sum + b.spentAmount, 0);

    const categories = await BudgetCategory.find().lean();
    const categorySpending = await Promise.all(
      categories.map(async (cat) => {
        const allocs = await BudgetAllocation.find({ categoryId: cat._id }).lean();
        const totalAllocated = allocs.reduce((sum, a) => sum + a.allocatedAmount, 0);
        const totalSpentCat = allocs.reduce((sum, a) => sum + a.spentAmount, 0);
        return { ...cat, allocated: totalAllocated, spent: totalSpentCat, remaining: totalAllocated - totalSpentCat };
      })
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalBudgets: orgBudgets.length, activeBudgets: activeBudgets.length,
          totalBudgeted, totalSpent, totalRemaining: totalBudgeted - totalSpent,
          utilizationPercentage: totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0
        },
        categorySpending: categorySpending.filter(c => c.allocated > 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch budget summary', error: error.message });
  }
});

// Get all budgets
router.get('/', verifyToken, async (req, res) => {
  try {
    const { organizationId, departmentId, fiscalYear, status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (organizationId) {
      filter.organizationId = organizationId;
    } else if (req.user.organizationId) {
      filter.organizationId = req.user.organizationId;
    }
    if (departmentId) filter.departmentId = departmentId;
    if (fiscalYear) filter.fiscalYear = fiscalYear;
    if (status) filter.status = status;

    const total = await Budget.countDocuments(filter);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const budgets = await Budget.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const budgetsWithDetails = await Promise.all(
      budgets.map(async (budget) => {
        const allocations = await BudgetAllocation.find({ budgetId: budget._id })
          .populate('categoryId')
          .lean();
        const department = budget.departmentId
          ? await Department.findById(budget.departmentId).select('name code').lean()
          : null;

        return {
          ...budget,
          department: department ? { id: department._id, name: department.name, code: department.code } : null,
          allocations: allocations.map(a => ({
            ...a,
            category: a.categoryId || null,
            categoryId: a.categoryId?._id || a.categoryId
          })),
          utilizationPercentage: budget.totalAmount > 0
            ? Math.round((budget.spentAmount / budget.totalAmount) * 100) : 0
        };
      })
    );

    res.json({
      success: true,
      data: {
        budgets: budgetsWithDetails,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch budgets', error: error.message });
  }
});

// Get budget by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id).lean();
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });

    const allocations = await BudgetAllocation.find({ budgetId: budget._id }).populate('categoryId').lean();
    const department = budget.departmentId
      ? await Department.findById(budget.departmentId).select('name code').lean() : null;
    const budgetTransactions = await Transaction.find({ budgetId: budget._id }).sort({ createdAt: -1 }).lean();

    const totalIncome = budgetTransactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = budgetTransactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);

    const budgetWithDetails = {
      ...budget,
      department: department ? { id: department._id, name: department.name, code: department.code } : null,
      allocations: allocations.map(a => ({
        ...a,
        category: a.categoryId || null,
        categoryId: a.categoryId?._id || a.categoryId,
        utilizationPercentage: a.allocatedAmount > 0 ? Math.round((a.spentAmount / a.allocatedAmount) * 100) : 0
      })),
      statistics: {
        totalIncome, totalExpense,
        netAmount: totalIncome - totalExpense,
        utilizationPercentage: budget.totalAmount > 0 ? Math.round((budget.spentAmount / budget.totalAmount) * 100) : 0,
        remainingAmount: budget.totalAmount - budget.spentAmount,
        transactionCount: budgetTransactions.length
      },
      recentTransactions: budgetTransactions.slice(0, 5)
    };

    res.json({ success: true, data: { budget: budgetWithDetails } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch budget', error: error.message });
  }
});

// Create budget
router.post('/', verifyToken, isDepartmentHeadOrHigher, async (req, res) => {
  try {
    const { name, organizationId, departmentId, fiscalYear, startDate, endDate, totalAmount, description, allocations: allocationData } = req.body;

    if (!name || !fiscalYear || !startDate || !endDate || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields: name, fiscalYear, startDate, endDate, totalAmount' });
    }
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    const newBudget = await Budget.create({
      name, organizationId: organizationId || req.user.organizationId,
      departmentId: departmentId || null, fiscalYear, startDate, endDate,
      totalAmount: parseFloat(totalAmount), allocatedAmount: 0, spentAmount: 0,
      status: 'draft', description: description || null,
      createdBy: req.user.userId, approvedBy: null, approvedAt: null
    });

    if (allocationData && Array.isArray(allocationData)) {
      let totalAllocated = 0;
      for (const alloc of allocationData) {
        if (alloc.categoryId && alloc.allocatedAmount) {
          await BudgetAllocation.create({
            budgetId: newBudget._id, categoryId: alloc.categoryId,
            allocatedAmount: parseFloat(alloc.allocatedAmount), spentAmount: 0, notes: alloc.notes || null
          });
          totalAllocated += parseFloat(alloc.allocatedAmount);
        }
      }
      newBudget.allocatedAmount = totalAllocated;
      await newBudget.save();
    }

    res.status(201).json({ success: true, message: 'Budget created successfully', data: { budget: newBudget } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create budget', error: error.message });
  }
});

// Update budget
router.put('/:id', verifyToken, isDepartmentHeadOrHigher, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });

    if (!['draft', 'active'].includes(budget.status)) {
      return res.status(400).json({ success: false, message: 'Cannot modify a closed or archived budget' });
    }

    const { name, startDate, endDate, totalAmount, description, status } = req.body;
    if (name) budget.name = name;
    if (startDate) budget.startDate = startDate;
    if (endDate) budget.endDate = endDate;
    if (totalAmount) budget.totalAmount = parseFloat(totalAmount);
    if (description !== undefined) budget.description = description;
    if (status && ['draft', 'active', 'closed', 'archived'].includes(status)) budget.status = status;

    await budget.save();
    res.json({ success: true, message: 'Budget updated successfully', data: { budget } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update budget', error: error.message });
  }
});

// Approve budget
router.post('/:id/approve', verifyToken, isFinanceOfficerOrAdmin, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
    if (budget.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft budgets can be approved' });

    budget.status = 'active';
    budget.approvedBy = req.user.userId;
    budget.approvedAt = new Date();
    await budget.save();

    res.json({ success: true, message: 'Budget approved successfully', data: { budget } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve budget', error: error.message });
  }
});

// Delete budget
router.delete('/:id', verifyToken, isFinanceOfficerOrAdmin, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });

    const txCount = await Transaction.countDocuments({ budgetId: budget._id });
    if (txCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete budget with existing transactions. Archive it instead.' });
    }

    await BudgetAllocation.deleteMany({ budgetId: budget._id });
    await Budget.findByIdAndDelete(budget._id);

    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete budget', error: error.message });
  }
});

module.exports = router;
