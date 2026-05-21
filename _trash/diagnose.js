/**
 * BudMap Login Diagnostics
 * Run: node diagnose.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function diagnose() {
  console.log('\n🔍 BudMap Login Diagnostics\n');

  // Step 1: Check env vars
  console.log('1. Environment variables:');
  console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ MISSING');
  console.log('   JWT_SECRET: ', process.env.JWT_SECRET  ? '✅ Set' : '❌ MISSING');
  console.log('   PORT:       ', process.env.PORT || '5000 (default)');

  // Step 2: Connect to MongoDB
  console.log('\n2. Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ Connected successfully');
  } catch (err) {
    console.log('   ❌ CONNECTION FAILED:', err.message);
    console.log('\n   → This is why login fails. Check your internet/Atlas whitelist.');
    process.exit(1);
  }

  // Step 3: Check users
  const User = require('./models/User');
  console.log('\n3. Users in database:');
  const users = await User.find({}).select('email isEmailVerified isActive role password').lean();

  if (users.length === 0) {
    console.log('   ❌ NO USERS FOUND — database is empty!');
    console.log('   → Run: node seed.js');
  } else {
    users.forEach(u => {
      const hasPass = u.password ? '✅' : '❌ no password';
      const verified = u.isEmailVerified ? '✅ verified' : '❌ NOT verified';
      const active   = u.isActive        ? '✅ active'   : '❌ inactive';
      console.log(`   ${u.email}`);
      console.log(`     password: ${hasPass} | ${verified} | ${active} | role: ${u.role}`);
    });
  }

  // Step 4: Test password for admin
  console.log('\n4. Testing admin@budmap.com / admin123...');
  const admin = await User.findOne({ email: 'admin@budmap.com' });
  if (!admin) {
    console.log('   ❌ admin@budmap.com not found — run: node seed.js');
  } else if (!admin.password) {
    console.log('   ❌ Admin has no password (Google-only account?)');
  } else {
    const match = await bcrypt.compare('admin123', admin.password);
    console.log('   Password match:', match ? '✅ CORRECT' : '❌ WRONG HASH — re-run seed.js');
    console.log('   isEmailVerified:', admin.isEmailVerified ? '✅' : '❌ NEEDS FIX');
    console.log('   isActive:       ', admin.isActive        ? '✅' : '❌ NEEDS FIX');
  }

  // Step 5: Fix any unverified users automatically
  const unverified = await User.countDocuments({ isEmailVerified: false });
  if (unverified > 0) {
    console.log(`\n5. ⚠️  Found ${unverified} unverified user(s) — fixing now...`);
    await User.updateMany({ isEmailVerified: false }, { $set: { isEmailVerified: true, isActive: true } });
    console.log('   ✅ All users are now verified and active');
  } else {
    console.log('\n5. ✅ All users already verified');
  }

  console.log('\n✅ Diagnostics complete. Try logging in again.\n');
  await mongoose.disconnect();
}

diagnose().catch(err => {
  console.error('Diagnostic error:', err.message);
  process.exit(1);
});
