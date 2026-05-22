const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Department = require('../models/Department');
const EmailToken = require('../models/EmailToken');
const {
  sendWelcomeEmail,
  sendVerificationEmail,
} = require('../services/emailService');

const BASE_URL = process.env.FRONTEND_URL;

// ── helpers ──────────────────────────────────────────────────────────────────
const makeToken = () => crypto.randomBytes(32).toString('hex');

const issueVerificationToken = async (userId, email) => {
  // Remove any existing token for this user
  await EmailToken.deleteMany({ userId, type: 'email_verification' });
  const token = makeToken();
  await EmailToken.create({
    userId,
    email,
    token,
    type: 'email_verification',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 h
  });
  return token;
};

// ── POST /api/registration/organization ──────────────────────────────────────
router.post('/organization', async (req, res) => {
  try {
    const {
      orgName, orgType, orgEmail, orgPhone, orgAddress, orgWebsite,
      fiscalYearStart, currency,
      firstName, lastName, email, password, phone,
    } = req.body;

    if (!orgName || !orgType || !orgEmail || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (await Organization.findOne({ email: orgEmail })) {
      return res.status(400).json({ success: false, message: 'Organization with this email already exists' });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const newOrg = await Organization.create({
      name: orgName, type: orgType, email: orgEmail,
      phone: orgPhone || '', address: orgAddress || '',
      website: orgWebsite || '', fiscalYearStart: fiscalYearStart || 'July',
      currency: currency || 'NPR', logo: null, isActive: true,
    });

    const newUser = await User.create({
      email, password: await bcrypt.hash(password, 10),
      firstName, lastName, role: 'admin',
      organizationId: newOrg._id, phone: phone || '',
      isActive: true, isEmailVerified: false, authProvider: 'local',
    });

    const token = await issueVerificationToken(newUser._id, email);
    const link  = `${BASE_URL}/verify-email/${token}`;

    // Try real email first, fall back to console log
    const sent = await sendVerificationEmail(email, firstName, link).catch(() => null);
    if (!sent?.success) {
      console.log(`\n📧 VERIFY EMAIL\nTo: ${email}\nLink: ${link}\n`);
    }

    res.status(201).json({
      success: true,
      message: 'Organisation created! Please check your email to verify your account before logging in.',
      data: {
        organization: { id: newOrg._id, name: newOrg.name, type: newOrg.type },
        user: { id: newUser._id, email: newUser.email, firstName: newUser.firstName, role: newUser.role },
      },
    });
  } catch (err) {
    console.error('Org registration error:', err);
    res.status(500).json({ success: false, message: 'Failed to register organisation' });
  }
});

// ── POST /api/registration/user ───────────────────────────────────────────────
router.post('/user', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, role, organizationId, departmentId } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    if (organizationId && !await Organization.findById(organizationId)) {
      return res.status(404).json({ success: false, message: 'Organisation not found' });
    }

    const newUser = await User.create({
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 10),
      firstName, lastName,
      role: ['admin','finance_officer','department_head','viewer'].includes(role) ? role : 'viewer',
      organizationId: organizationId || null,
      departmentId: departmentId || null,
      phone: phone || '',
      isActive: false,
      isEmailVerified: false,
      authProvider: 'local',
    });

    const token = await issueVerificationToken(newUser._id, email.toLowerCase());
    const link  = `${BASE_URL}/verify-email/${token}`;

    const sent = await sendVerificationEmail(email, firstName, link).catch(() => null);
    if (!sent?.success) {
      console.log(`\n📧 VERIFY EMAIL\nTo: ${email}\nLink: ${link}\n`);
    }

    res.status(201).json({
      success: true,
      message: 'Account created! Please verify your email before logging in.',
      data: { id: newUser._id, email: newUser.email, firstName: newUser.firstName, role: newUser.role },
    });
  } catch (err) {
    console.error('User registration error:', err);
    res.status(500).json({ success: false, message: 'Failed to register user' });
  }
});

// ── GET /api/registration/verify-email/:token ─────────────────────────────────
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    console.log(`[Verify] Looking up token: ${token.substring(0, 16)}...`);

    const record = await EmailToken.findOne({ token, type: 'email_verification' });
    console.log(`[Verify] Token record found:`, record ? 'YES' : 'NO');

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification link. Please request a new one.',
      });
    }

    if (record.expiresAt < new Date()) {
      await EmailToken.deleteOne({ _id: record._id });
      return res.status(400).json({
        success: false,
        message: 'Verification link has expired (24h limit). Please request a new one.',
      });
    }

    // Use findByIdAndUpdate to avoid version conflicts
    const user = await User.findByIdAndUpdate(
      record.userId,
      { $set: { isEmailVerified: true, isActive: true } },
      { new: true }
    );
    console.log(`[Verify] User updated:`, user ? user.email : 'NOT FOUND');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Delete the token AFTER user is updated
    await EmailToken.deleteOne({ _id: record._id });

    // Send welcome email (non-blocking, never throws)
    sendWelcomeEmail(user.email, user.firstName).catch(() => {});

    console.log(`[Verify] ✅ Email verified for: ${user.email}`);
    return res.json({ success: true, message: 'Email verified successfully! You can now log in.' });

  } catch (err) {
    console.error('[Verify] ❌ Error:', err);
    return res.status(500).json({ success: false, message: `Verification error: ${err.message}` });
  }
});

// ── POST /api/registration/resend-verification ────────────────────────────────
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent enumeration
    if (!user || user.isEmailVerified) {
      return res.json({ success: true, message: 'If that email exists and is unverified, a new link has been sent.' });
    }

    const token = await issueVerificationToken(user._id, user.email);
    const link  = `${BASE_URL}/verify-email/${token}`;

    const sent = await sendVerificationEmail(user.email, user.firstName, link).catch(() => null);
    if (!sent?.success) {
      console.log(`\n📧 RESEND VERIFY\nTo: ${user.email}\nLink: ${link}\n`);
    }

    res.json({
      success: true,
      message: 'Verification email sent! Please check your inbox.',
    });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ success: false, message: 'Failed to resend verification email' });
  }
});

module.exports = router;
