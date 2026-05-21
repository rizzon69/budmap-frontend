const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');
const Budget = require('../models/Budget');
const { verifyToken, isAdmin, isFinanceOfficerOrAdmin } = require('../middleware/auth');

// Public endpoint — returns departments for a given org (used on register page, no auth required)
router.get('/public', async (req, res) => {
  try {
    const { organizationId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'organizationId is required' });
    }
    const departments = await Department.find({ organizationId, isActive: true })
      .select('_id name code')
      .sort({ name: 1 })
      .lean();
    res.json({ success: true, data: { departments } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
});

// Get all departments
router.get('/', verifyToken, async (req, res) => {
  try {
    const { organizationId, isActive, search } = req.query;

    const filter = {};

    // Filter by organization
    if (organizationId) {
      filter.organizationId = new mongoose.Types.ObjectId(organizationId);
    } else if (req.user.organizationId) {
      filter.organizationId = new mongoose.Types.ObjectId(req.user.organizationId);
    }

    // Filter by active status
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Search by name or code
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex }
      ];
    }

    const departments = await Department.find(filter).lean();

    // Add head info and stats
    const deptsWithDetails = await Promise.all(
      departments.map(async (dept) => {
        const head = dept.headId ? await User.findById(dept.headId).select('firstName lastName email').lean() : null;
        const deptBudgets = await Budget.find({ departmentId: dept._id }).lean();
        const userCount = await User.countDocuments({ departmentId: dept._id });

        return {
          ...dept,
          head: head ? {
            id: head._id,
            name: `${head.firstName} ${head.lastName}`,
            email: head.email
          } : null,
          stats: {
            budgetCount: deptBudgets.length,
            userCount,
            totalBudgeted: deptBudgets.reduce((sum, b) => sum + b.totalAmount, 0),
            totalSpent: deptBudgets.reduce((sum, b) => sum + b.spentAmount, 0)
          }
        };
      })
    );

    res.json({
      success: true,
      data: { departments: deptsWithDetails }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
});

// Get department by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id).lean();

    if (!dept) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const head = dept.headId ? await User.findById(dept.headId).select('firstName lastName email phone').lean() : null;
    const deptBudgets = await Budget.find({ departmentId: dept._id }).lean();
    const deptUsers = await User.find({ departmentId: dept._id }).select('firstName lastName email role').lean();

    const deptWithDetails = {
      ...dept,
      head: head ? {
        id: head._id,
        name: `${head.firstName} ${head.lastName}`,
        email: head.email,
        phone: head.phone
      } : null,
      budgets: deptBudgets.map(b => ({
        id: b._id,
        name: b.name,
        totalAmount: b.totalAmount,
        spentAmount: b.spentAmount,
        status: b.status
      })),
      users: deptUsers.map(u => ({
        id: u._id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role
      })),
      stats: {
        budgetCount: deptBudgets.length,
        userCount: deptUsers.length,
        activeBudgets: deptBudgets.filter(b => b.status === 'active').length,
        totalBudgeted: deptBudgets.reduce((sum, b) => sum + b.totalAmount, 0),
        totalSpent: deptBudgets.reduce((sum, b) => sum + b.spentAmount, 0)
      }
    };

    res.json({
      success: true,
      data: { department: deptWithDetails }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department',
      error: error.message
    });
  }
});

// Create department
router.post('/', verifyToken, isFinanceOfficerOrAdmin, async (req, res) => {
  try {
    const { name, code, organizationId, headId, description } = req.body;

    // Validation
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and code'
      });
    }

    const orgId = organizationId || req.user.organizationId;

    // Check for duplicate code in organization
    const duplicate = await Department.findOne({
      organizationId: orgId,
      code: new RegExp(`^${code}$`, 'i')
    });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'Department with this code already exists'
      });
    }

    // Validate head if provided
    if (headId) {
      const head = await User.findById(headId);
      if (!head) {
        return res.status(400).json({
          success: false,
          message: 'Invalid head user ID'
        });
      }
    }

    const newDept = await Department.create({
      name,
      code: code.toUpperCase(),
      organizationId: orgId,
      headId: headId || null,
      description: description || null,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: { department: newDept }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create department',
      error: error.message
    });
  }
});

// Update department
router.put('/:id', verifyToken, isFinanceOfficerOrAdmin, async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);

    if (!dept) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const { name, code, headId, description, isActive } = req.body;

    if (name) dept.name = name;
    if (code) {
      // Check for duplicate code
      const duplicate = await Department.findOne({
        organizationId: dept.organizationId,
        code: new RegExp(`^${code}$`, 'i'),
        _id: { $ne: dept._id }
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Department with this code already exists'
        });
      }
      dept.code = code.toUpperCase();
    }
    if (headId !== undefined) dept.headId = headId || null;
    if (description !== undefined) dept.description = description;
    if (isActive !== undefined) dept.isActive = isActive;

    await dept.save();

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: { department: dept }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update department',
      error: error.message
    });
  }
});

// Delete department
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);

    if (!dept) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has users
    const userCount = await User.countDocuments({ departmentId: dept._id });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. ${userCount} users are associated with it.`
      });
    }

    // Check if department has budgets
    const budgetCount = await Budget.countDocuments({ departmentId: dept._id });
    if (budgetCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. ${budgetCount} budgets are associated with it.`
      });
    }

    // Soft delete
    dept.isActive = false;
    await dept.save();

    res.json({
      success: true,
      message: 'Department deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: error.message
    });
  }
});

module.exports = router;
