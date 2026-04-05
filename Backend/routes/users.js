const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Department = require('../models/Department');
const { verifyToken, isAdmin, checkRole } = require('../middleware/auth');

// Get colleagues in same organization (any logged-in user — used by messaging)
router.get('/colleagues', verifyToken, async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) {
      return res.json({ success: true, data: { users: [] } });
    }

    const users = await User.find({
      organizationId: orgId,
      isActive: true,
      _id: { $ne: req.user.userId } // exclude self
    })
      .select('firstName lastName email role avatar phone')
      .lean();

    res.json({ success: true, data: { users } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch colleagues', error: error.message });
  }
});

// Get all users (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { organizationId, role, isActive, search, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (organizationId) filter.organizationId = organizationId;
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ];
    }

    const total = await User.countDocuments(filter);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('organizationId')
      .populate('departmentId')
      .lean();

    const usersWithDetails = users.map(user => ({
      ...user,
      organization: user.organizationId || null,
      department: user.departmentId || null,
      organizationId: user.organizationId?._id || user.organizationId,
      departmentId: user.departmentId?._id || user.departmentId
    }));

    res.json({
      success: true,
      data: {
        users: usersWithDetails,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
});

// Get user by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.user.role !== 'admin' && req.user.userId !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const organization = user.organizationId ? await Organization.findById(user.organizationId).lean() : null;
    const department = user.departmentId ? await Department.findById(user.departmentId).lean() : null;

    res.json({
      success: true,
      data: { user: { ...user, organization, department } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
  }
});

// Update user
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.user.role !== 'admin' && req.user.userId !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { firstName, lastName, phone, avatar, departmentId, role, isActive } = req.body;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    if (req.user.role === 'admin') {
      if (departmentId !== undefined) {
        if (departmentId) {
          const dept = await Department.findById(departmentId);
          if (!dept) {
            return res.status(400).json({ success: false, message: 'Invalid department ID' });
          }
        }
        user.departmentId = departmentId || null;
      }
      if (role && ['admin', 'finance_officer', 'department_head', 'viewer'].includes(role)) {
        user.role = role;
      }
      if (isActive !== undefined) user.isActive = isActive;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, message: 'User updated successfully', data: { user: userObj } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.user.userId === req.params.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    user.isActive = false;
    await user.save();

    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
});

// Get users by organization
router.get('/organization/:orgId', verifyToken, async (req, res) => {
  try {
    const orgUsers = await User.find({
      organizationId: req.params.orgId,
      isActive: true
    }).select('-password').lean();

    res.json({ success: true, data: { users: orgUsers } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch organization users', error: error.message });
  }
});

module.exports = router;
