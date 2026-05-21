const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Public endpoint — returns minimal org list for registration dropdown (no auth required)
router.get('/public', async (req, res) => {
  try {
    const organizations = await Organization.find({ isActive: true })
      .select('_id name type')
      .sort({ name: 1 })
      .lean();
    res.json({ success: true, data: { organizations } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch organisations' });
  }
});

// Get all organizations (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { type, isActive, search, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = new RegExp(search, 'i');

    const total = await Organization.countDocuments(filter);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const organizations = await Organization.find(filter).skip(skip).limit(parseInt(limit)).lean();

    const orgsWithStats = await Promise.all(
      organizations.map(async (org) => {
        const userCount = await User.countDocuments({ organizationId: org._id });
        return { ...org, userCount };
      })
    );

    res.json({
      success: true,
      data: {
        organizations: orgsWithStats,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch organizations', error: error.message });
  }
});

// Get organization types — MUST be before /:id
router.get('/meta/types', (req, res) => {
  res.json({
    success: true,
    data: {
      types: [
        { value: 'ngo', label: 'Non-Governmental Organization (NGO)' },
        { value: 'sme', label: 'Small & Medium Enterprise (SME)' },
        { value: 'educational', label: 'Educational Institution' },
        { value: 'government', label: 'Government Agency' },
        { value: 'other', label: 'Other' }
      ]
    }
  });
});

// Get organization by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id).lean();
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

    const orgUsers = await User.find({ organizationId: org._id }).lean();
    const orgWithStats = {
      ...org,
      stats: {
        totalUsers: orgUsers.length,
        activeUsers: orgUsers.filter(u => u.isActive).length,
        adminCount: orgUsers.filter(u => u.role === 'admin').length,
        financeOfficerCount: orgUsers.filter(u => u.role === 'finance_officer').length,
        departmentHeadCount: orgUsers.filter(u => u.role === 'department_head').length,
        viewerCount: orgUsers.filter(u => u.role === 'viewer').length
      }
    };

    res.json({ success: true, data: { organization: orgWithStats } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch organization', error: error.message });
  }
});

// Create organization (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, type, email, phone, address, website, fiscalYearStart, currency } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Please provide name and type' });
    }

    const validTypes = ['ngo', 'sme', 'educational', 'government', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }

    const existing = await Organization.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Organization with this name already exists' });
    }

    const newOrg = await Organization.create({
      name, type,
      email: email || null, phone: phone || null, address: address || null,
      website: website || null, fiscalYearStart: fiscalYearStart || 'July',
      currency: currency || 'NPR', logo: null, isActive: true
    });

    res.status(201).json({ success: true, message: 'Organization created successfully', data: { organization: newOrg } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create organization', error: error.message });
  }
});

// Update organization
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

    const { name, type, email, phone, address, website, fiscalYearStart, currency, logo, isActive } = req.body;

    if (name) {
      const duplicate = await Organization.findOne({ name: new RegExp(`^${name}$`, 'i'), _id: { $ne: req.params.id } });
      if (duplicate) return res.status(400).json({ success: false, message: 'Organization with this name already exists' });
      org.name = name;
    }
    if (type) org.type = type;
    if (email !== undefined) org.email = email;
    if (phone !== undefined) org.phone = phone;
    if (address !== undefined) org.address = address;
    if (website !== undefined) org.website = website;
    if (fiscalYearStart) org.fiscalYearStart = fiscalYearStart;
    if (currency) org.currency = currency;
    if (logo !== undefined) org.logo = logo;
    if (isActive !== undefined) org.isActive = isActive;

    await org.save();

    res.json({ success: true, message: 'Organization updated successfully', data: { organization: org } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update organization', error: error.message });
  }
});

// Delete organization (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

    const userCount = await User.countDocuments({ organizationId: req.params.id });
    if (userCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete organization. ${userCount} users are associated with it.` });
    }

    org.isActive = false;
    await org.save();

    res.json({ success: true, message: 'Organization deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete organization', error: error.message });
  }
});

module.exports = router;
