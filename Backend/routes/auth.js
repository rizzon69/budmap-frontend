const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { verifyToken } = require('../middleware/auth');
const {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendGoogleLoginEmail
} = require('../services/emailService');
const EmailToken = require('../models/EmailToken');

const makeToken = () => crypto.randomBytes(32).toString('hex');
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── Helper: generate JWT ───────────────────────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, organizationId, departmentId, role = 'viewer' } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: email, password, firstName, lastName'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    if (organizationId) {
      const org = await Organization.findById(organizationId);
      if (!org) return res.status(400).json({ success: false, message: 'Invalid organization ID' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (departmentId) {
      const dept = await require('../models/Department').findById(departmentId);
      if (!dept) return res.status(400).json({ success: false, message: 'Invalid department ID' });
    }

    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role: ['admin', 'finance_officer', 'department_head', 'viewer'].includes(role) ? role : 'viewer',
      organizationId: organizationId || null,
      departmentId: departmentId || null,
      phone: phone || null,
      avatar: null,
      isActive: true,
      isEmailVerified: false,
      authProvider: 'local',
      lastLogin: null
    });

    const token = generateToken(newUser);
    const userObj = newUser.toObject();
    delete userObj.password;

    // Issue email verification token
    await EmailToken.deleteMany({ userId: newUser._id, type: 'email_verification' });
    const verifyTokenValue = makeToken();
    await EmailToken.create({
      userId: newUser._id, email: newUser.email, token: verifyTokenValue,
      type: 'email_verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const verifyLink = `${BASE_URL}/verify-email/${verifyTokenValue}`;
    sendVerificationEmail(newUser.email, newUser.firstName, verifyLink).catch(() => {});
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n📧 VERIFY LINK (dev): ${verifyLink}\n`);
    }

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email to verify your address before logging in.',
      data: {
        user: userObj, token,
        verificationLink: process.env.NODE_ENV === 'development' ? verifyLink : undefined,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Please contact administrator.' });
    }

    if (!user.password) {
      return res.status(401).json({ success: false, message: 'This account uses Google Sign-In. Please use the "Sign in with Google" button.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
        email: user.email
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    const organization = user.organizationId
      ? await Organization.findById(user.organizationId)
      : null;

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userObj,
        organization: organization ? { id: organization.id, name: organization.name, type: organization.type } : null,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

// ── Forgot Password ───────────────────────────────────────────────────────────
// FIX BUG 2: store reset token in MongoDB instead of in-memory object
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user || !user.isActive || !user.password) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // FIX: delete any existing reset token, create new one in MongoDB (survives restarts)
    await EmailToken.deleteMany({ userId: user._id, type: 'password_reset' });
    const resetToken = makeToken();
    await EmailToken.create({
      userId:    user._id,
      email:     user.email,
      token:     resetToken,
      type:      'password_reset',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    await sendPasswordResetEmail(user.email, user.firstName, resetToken);

    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔑 PASSWORD RESET LINK (dev): ${BASE_URL}/reset-password?token=${resetToken}\n`);
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request', error: error.message });
  }
});

// ── Reset Password ────────────────────────────────────────────────────────────
// FIX BUG 2: look up token from MongoDB instead of in-memory object
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // FIX: look up from MongoDB — works even after server restart
    const tokenRecord = await EmailToken.findOne({ token, type: 'password_reset' });

    if (!tokenRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    if (tokenRecord.expiresAt < new Date()) {
      await EmailToken.deleteOne({ _id: tokenRecord._id });
      return res.status(400).json({ success: false, message: 'Reset token has expired. Please request a new one.' });
    }

    const user = await User.findById(tokenRecord.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Invalidate the token after use
    await EmailToken.deleteOne({ _id: tokenRecord._id });

    res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
  }
});

// ── Get current user profile ──────────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const organization = user.organizationId
      ? await Organization.findById(user.organizationId)
      : null;

    res.json({
      success: true,
      data: {
        user,
        organization: organization ? { id: organization.id, name: organization.name, type: organization.type } : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
});

// ── Update Password ───────────────────────────────────────────────────────────
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current password and new password' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.password) {
      return res.status(400).json({ success: false, message: 'This account uses Google Sign-In and has no password to update.' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update password', error: error.message });
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post('/logout', verifyToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ── Verify token ──────────────────────────────────────────────────────────────
router.get('/verify', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: { userId: req.user.userId, email: req.user.email, role: req.user.role }
  });
});

// ── Google OAuth: Redirect to Google ─────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// ── Google OAuth: Callback ────────────────────────────────────────────────────
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_failed`,
    session: false
  }),
  async (req, res) => {
    try {
      const user = req.user;
      const token = generateToken(user);

      sendGoogleLoginEmail(user.email, user.firstName).catch(() => {});

      const userData = encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        organizationId: user.organizationId
      }));

      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/google/success?token=${token}&user=${userData}`
      );
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_failed`);
    }
  }
);

module.exports = router;
