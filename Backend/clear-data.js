/**
 * BudMap - Clear All Data Script
 * 
 * Wipes ALL data from the database (users, budgets, transactions, etc.)
 * and recreates ONLY the 4 default login accounts + budget categories.
 * 
 * Run with: node clear-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User             = require('./models/User');
const Organization     = require('./models/Organization');
const Department       = require('./models/Department');
const Budget           = require('./models/Budget');
const BudgetCategory   = require('./models/BudgetCategory');
const BudgetAllocation = require('./models/BudgetAllocation');
const Transaction      = require('./models/Transaction');
const Notification     = require('./models/Notification');
const ActivityLog      = require('./models/ActivityLog');
const Message          = require('./models/Message');

const connectDB = require('./database/mongodb');

async function clearData() {
  await connectDB();
  console.log('\n🗑️  Clearing all BudMap data...\n');

  // ── Wipe everything ────────────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Organization.deleteMany({}),
    Department.deleteMany({}),
    Budget.deleteMany({}),
    BudgetCategory.deleteMany({}),
    BudgetAllocation.deleteMany({}),
    Transaction.deleteMany({}),
    Notification.deleteMany({}),
    ActivityLog.deleteMany({}),
    Message.deleteMany({}),
  ]);
  console.log('✅  All data cleared');

  // ── Create default organization ────────────────────────────────────────────
  const org = await Organization.create({
    name: 'My Organization',
    type: 'ngo',
    email: 'admin@budmap.com',
    phone: '',
    address: 'Kathmandu, Nepal',
    fiscalYearStart: 'July',
    currency: 'NPR',
    isActive: true,
  });
  console.log('✅  Created default organization');

  // ── Create 4 default accounts ──────────────────────────────────────────────
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  await User.insertMany([
    {
      email: 'admin@budmap.com', password: hash('admin123'),
      firstName: 'System', lastName: 'Administrator',
      role: 'admin', organizationId: org._id,
      isActive: true, isEmailVerified: true,
    },
    {
      email: 'finance@budmap.com', password: hash('finance123'),
      firstName: 'Finance', lastName: 'Officer',
      role: 'finance_officer', organizationId: org._id,
      isActive: true, isEmailVerified: true,
    },
    {
      email: 'department@budmap.com', password: hash('dept123'),
      firstName: 'Department', lastName: 'Head',
      role: 'department_head', organizationId: org._id,
      isActive: true, isEmailVerified: true,
    },
    {
      email: 'viewer@budmap.com', password: hash('viewer123'),
      firstName: 'Viewer', lastName: 'User',
      role: 'viewer', organizationId: org._id,
      isActive: true, isEmailVerified: true,
    },
  ]);
  console.log('✅  Created 4 default accounts');

  // ── Create budget categories (needed for transactions to work) ─────────────
  await BudgetCategory.insertMany([
    { name: 'Salaries & Wages',        type: 'expense', color: '#4F46E5' },
    { name: 'Office Supplies',          type: 'expense', color: '#10B981' },
    { name: 'Utilities',                type: 'expense', color: '#F59E0B' },
    { name: 'Travel & Transportation',  type: 'expense', color: '#EF4444' },
    { name: 'Training & Development',   type: 'expense', color: '#8B5CF6' },
    { name: 'Equipment & Machinery',    type: 'expense', color: '#06B6D4' },
    { name: 'Marketing & Advertising',  type: 'expense', color: '#EC4899' },
    { name: 'Rent & Lease',             type: 'expense', color: '#84CC16' },
    { name: 'Maintenance & Repairs',    type: 'expense', color: '#F97316' },
    { name: 'Other Expenses',           type: 'expense', color: '#6B7280' },
    { name: 'Donations & Grants',       type: 'income',  color: '#14B8A6' },
    { name: 'Service Revenue',          type: 'income',  color: '#22C55E' },
    { name: 'Interest Income',          type: 'income',  color: '#3B82F6' },
    { name: 'Membership Fees',          type: 'income',  color: '#A855F7' },
    { name: 'Other Income',             type: 'income',  color: '#F59E0B' },
  ]);
  console.log('✅  Created 15 budget categories');

  console.log('\n══════════════════════════════════════════════════');
  console.log('  ✅  Database reset complete — fresh start!');
  console.log('══════════════════════════════════════════════════');
  console.log('\n  Default login credentials (unchanged):');
  console.log('  admin@budmap.com       →  admin123');
  console.log('  finance@budmap.com     →  finance123');
  console.log('  department@budmap.com  →  dept123');
  console.log('  viewer@budmap.com      →  viewer123');
  console.log('\n  ℹ️  No budgets, transactions, or departments exist.');
  console.log('  Add your real data through the app.\n');

  await mongoose.disconnect();
  process.exit(0);
}

clearData().catch(err => {
  console.error('❌ Clear failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
