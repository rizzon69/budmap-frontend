/**
 * BudMap Database Seed Script
 * Run with: node seed.js
 * Seeds MongoDB with organizations, users, departments, budgets, categories, and transactions
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User             = require('./models/User');
const Organization     = require('./models/Organization');
const Department       = require('./models/Department');
const Budget           = require('./models/Budget');
const BudgetCategory   = require('./models/BudgetCategory');
const BudgetAllocation = require('./models/BudgetAllocation');
const Transaction      = require('./models/Transaction');
const Notification     = require('./models/Notification');
const ActivityLog      = require('./models/ActivityLog');

const connectDB = require('./database/mongodb');

async function seed() {
  await connectDB();
  console.log('\n🌱 Starting BudMap database seed...\n');

  // ── Wipe existing data ─────────────────────────────────────────────────────
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
  ]);
  console.log('✅  Cleared existing data');

  // ── Organizations ──────────────────────────────────────────────────────────
  const org = await Organization.create({
    name: 'Nepal Education Foundation',
    type: 'ngo',
    email: 'contact@nef.org.np',
    phone: '+977-1-4444444',
    address: 'Kathmandu, Nepal',
    website: 'https://nef.org.np',
    fiscalYearStart: 'July',
    currency: 'NPR',
    isActive: true,
  });
  console.log('✅  Created organisation:', org.name);

  const org2 = await Organization.create({
    name: 'Himalayan Tech Solutions',
    type: 'sme',
    email: 'info@himalayan-tech.com',
    phone: '+977-1-5555555',
    address: 'Lalitpur, Nepal',
    fiscalYearStart: 'July',
    currency: 'NPR',
    isActive: true,
  });

  // ── Departments ────────────────────────────────────────────────────────────
  const deptFinance = await Department.create({
    name: 'Finance Department', code: 'FIN',
    organizationId: org._id,
    description: 'Handles all financial operations and budgeting',
    isActive: true,
  });
  const deptOps = await Department.create({
    name: 'Operations Department', code: 'OPS',
    organizationId: org._id,
    description: 'Manages day-to-day operations',
    isActive: true,
  });
  const deptHR = await Department.create({
    name: 'Human Resources', code: 'HR',
    organizationId: org._id,
    description: 'Employee management and welfare',
    isActive: true,
  });
  const deptMkt = await Department.create({
    name: 'Marketing', code: 'MKT',
    organizationId: org._id,
    description: 'Marketing and communications',
    isActive: true,
  });
  console.log('✅  Created 4 departments');

  // ── Users ──────────────────────────────────────────────────────────────────
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const admin = await User.create({
    email: 'admin@budmap.com', password: hash('admin123'),
    firstName: 'System', lastName: 'Administrator',
    role: 'admin', organizationId: org._id,
    isActive: true, isEmailVerified: true,
  });
  const finance = await User.create({
    email: 'finance@budmap.com', password: hash('finance123'),
    firstName: 'Ram', lastName: 'Sharma',
    role: 'finance_officer', organizationId: org._id, departmentId: deptFinance._id,
    phone: '+977-9841000002', isActive: true, isEmailVerified: true,
  });
  const deptHead = await User.create({
    email: 'department@budmap.com', password: hash('dept123'),
    firstName: 'Sita', lastName: 'Thapa',
    role: 'department_head', organizationId: org._id, departmentId: deptOps._id,
    phone: '+977-9841000003', isActive: true, isEmailVerified: true,
  });
  const viewer = await User.create({
    email: 'viewer@budmap.com', password: hash('viewer123'),
    firstName: 'Hari', lastName: 'Prasad',
    role: 'viewer', organizationId: org._id, departmentId: deptOps._id,
    phone: '+977-9841000004', isActive: true, isEmailVerified: true,
  });

  // Set department heads
  await Department.findByIdAndUpdate(deptFinance._id, { headId: finance._id });
  await Department.findByIdAndUpdate(deptOps._id,     { headId: deptHead._id });

  console.log('✅  Created 4 users:');
  console.log('     admin@budmap.com        / admin123');
  console.log('     finance@budmap.com      / finance123');
  console.log('     department@budmap.com   / dept123');
  console.log('     viewer@budmap.com       / viewer123');

  // ── Budget Categories ──────────────────────────────────────────────────────
  const catSalary = await BudgetCategory.create({ name: 'Salaries & Wages',       type: 'expense', color: '#4F46E5' });
  const catSupply = await BudgetCategory.create({ name: 'Office Supplies',         type: 'expense', color: '#10B981' });
  const catUtil   = await BudgetCategory.create({ name: 'Utilities',               type: 'expense', color: '#F59E0B' });
  const catTravel = await BudgetCategory.create({ name: 'Travel & Transportation', type: 'expense', color: '#EF4444' });
  const catTrain  = await BudgetCategory.create({ name: 'Training & Development',  type: 'expense', color: '#8B5CF6' });
  const catEquip  = await BudgetCategory.create({ name: 'Equipment & Machinery',   type: 'expense', color: '#06B6D4' });
  const catMkt    = await BudgetCategory.create({ name: 'Marketing & Advertising', type: 'expense', color: '#EC4899' });
  const catRent   = await BudgetCategory.create({ name: 'Rent & Lease',            type: 'expense', color: '#84CC16' });
  const catGrant  = await BudgetCategory.create({ name: 'Donations & Grants',      type: 'income',  color: '#14B8A6' });
  const catRev    = await BudgetCategory.create({ name: 'Service Revenue',         type: 'income',  color: '#22C55E' });
  const catInt    = await BudgetCategory.create({ name: 'Interest Income',         type: 'income',  color: '#3B82F6' });
  const catOther  = await BudgetCategory.create({ name: 'Other Income',            type: 'income',  color: '#A855F7' });
  console.log('✅  Created 12 budget categories');

  // ── Budgets ────────────────────────────────────────────────────────────────
  const budgetAnnual = await Budget.create({
    name: 'Annual Budget 2024-25',
    organizationId: org._id, departmentId: null,
    fiscalYear: '2024-25',
    startDate: '2024-07-16', endDate: '2025-07-15',
    totalAmount: 5000000, allocatedAmount: 4200000, spentAmount: 1850000,
    status: 'active',
    description: 'Organisation-wide annual budget for fiscal year 2024-25',
    createdBy: admin._id, approvedBy: admin._id,
  });
  const budgetFinQ1 = await Budget.create({
    name: 'Finance Dept Q1 Budget',
    organizationId: org._id, departmentId: deptFinance._id,
    fiscalYear: '2024-25',
    startDate: '2024-07-16', endDate: '2024-10-15',
    totalAmount: 800000, allocatedAmount: 800000, spentAmount: 450000,
    status: 'active',
    createdBy: finance._id, approvedBy: admin._id,
  });
  const budgetOpsQ1 = await Budget.create({
    name: 'Operations Q1 Budget',
    organizationId: org._id, departmentId: deptOps._id,
    fiscalYear: '2024-25',
    startDate: '2024-07-16', endDate: '2024-10-15',
    totalAmount: 1200000, allocatedAmount: 1200000, spentAmount: 680000,
    status: 'active',
    createdBy: deptHead._id, approvedBy: finance._id,
  });
  const budgetMkt = await Budget.create({
    name: 'Marketing Campaign Budget',
    organizationId: org._id, departmentId: deptMkt._id,
    fiscalYear: '2024-25',
    startDate: '2024-08-01', endDate: '2024-12-31',
    totalAmount: 500000, allocatedAmount: 500000, spentAmount: 120000,
    status: 'active',
    createdBy: admin._id, approvedBy: admin._id,
  });
  console.log('✅  Created 4 budgets');

  // ── Transactions ───────────────────────────────────────────────────────────
  const txData = [
    { budgetId: budgetAnnual._id, categoryId: catSalary._id, departmentId: deptFinance._id, type: 'expense', amount: 250000, description: 'Monthly salaries - August 2024',      date: '2024-08-28', payee: 'Staff Payroll',            reference: 'PAY-2024-08',    status: 'completed', createdBy: finance._id, approvedBy: admin._id },
    { budgetId: budgetAnnual._id, categoryId: catSupply._id, departmentId: deptOps._id,     type: 'expense', amount: 25000,  description: 'Office supplies purchase',              date: '2024-08-15', payee: 'Kathmandu Stationery',    reference: 'INV-KS-156',    status: 'completed', createdBy: deptHead._id, approvedBy: finance._id },
    { budgetId: budgetAnnual._id, categoryId: catGrant._id,  departmentId: null,             type: 'income',  amount: 1000000,description: 'Annual grant from USAID',               date: '2024-07-20', payee: 'USAID Nepal',             reference: 'GRANT-2024-001', status: 'completed', createdBy: finance._id, approvedBy: admin._id },
    { budgetId: budgetAnnual._id, categoryId: catUtil._id,   departmentId: deptFinance._id,  type: 'expense', amount: 45000,  description: 'Electricity bill - August',            date: '2024-08-25', payee: 'NEA',                     reference: 'NEA-AUG-2024',  status: 'completed', createdBy: finance._id, approvedBy: admin._id },
    { budgetId: budgetOpsQ1._id,  categoryId: catTravel._id, departmentId: deptOps._id,      type: 'expense', amount: 35000,  description: 'Field visit transportation',           date: '2024-09-05', payee: 'Nepal Transport Services', reference: 'NTS-089',       status: 'pending',   createdBy: deptHead._id, approvedBy: null },
    { budgetId: budgetAnnual._id, categoryId: catRent._id,   departmentId: null,             type: 'expense', amount: 200000, description: 'Office rent - Q2',                     date: '2024-09-01', payee: 'Kathmandu Properties',    reference: 'RENT-Q2-2024',  status: 'completed', createdBy: finance._id, approvedBy: admin._id },
    { budgetId: budgetAnnual._id, categoryId: catSalary._id, departmentId: deptFinance._id,  type: 'expense', amount: 250000, description: 'Monthly salaries - September 2024',    date: '2024-09-28', payee: 'Staff Payroll',            reference: 'PAY-2024-09',   status: 'completed', createdBy: finance._id, approvedBy: admin._id },
    { budgetId: budgetMkt._id,    categoryId: catMkt._id,    departmentId: deptMkt._id,      type: 'expense', amount: 75000,  description: 'Digital marketing campaign',           date: '2024-09-10', payee: 'Digital Media Nepal',     reference: 'DMN-2024-045',  status: 'completed', createdBy: admin._id, approvedBy: admin._id },
    { budgetId: budgetFinQ1._id,  categoryId: catTrain._id,  departmentId: deptFinance._id,  type: 'expense', amount: 45000,  description: 'Accounting software training',         date: '2024-08-20', payee: 'Tech Training Nepal',     reference: 'TTN-2024-012',  status: 'completed', createdBy: finance._id, approvedBy: admin._id },
    { budgetId: budgetAnnual._id, categoryId: catRev._id,    departmentId: null,             type: 'income',  amount: 500000, description: 'Consultancy service revenue Q1',       date: '2024-09-15', payee: 'GoN Ministry of Finance', reference: 'GOV-2024-REV',  status: 'completed', createdBy: finance._id, approvedBy: admin._id },
    { budgetId: budgetOpsQ1._id,  categoryId: catEquip._id,  departmentId: deptOps._id,      type: 'expense', amount: 180000, description: 'Laptop purchase for operations team',  date: '2024-07-25', payee: 'Laptop Bazaar Nepal',     reference: 'LBN-2024-078',  status: 'completed', createdBy: deptHead._id, approvedBy: finance._id },
    { budgetId: budgetAnnual._id, categoryId: catSalary._id, departmentId: deptHR._id,       type: 'expense', amount: 250000, description: 'Monthly salaries - October 2024',      date: '2024-10-28', payee: 'Staff Payroll',            reference: 'PAY-2024-10',   status: 'completed', createdBy: finance._id, approvedBy: admin._id },
    { budgetId: budgetAnnual._id, categoryId: catUtil._id,   departmentId: deptOps._id,      type: 'expense', amount: 42000,  description: 'Electricity bill - September',         date: '2024-09-25', payee: 'NEA',                     reference: 'NEA-SEP-2024',  status: 'completed', createdBy: finance._id, approvedBy: admin._id },
    { budgetId: budgetAnnual._id, categoryId: catGrant._id,  departmentId: null,             type: 'income',  amount: 750000, description: 'UNDP project grant disbursement',      date: '2024-10-05', payee: 'UNDP Nepal',              reference: 'UNDP-2024-002', status: 'completed', createdBy: finance._id, approvedBy: admin._id },
    { budgetId: budgetMkt._id,    categoryId: catMkt._id,    departmentId: deptMkt._id,      type: 'expense', amount: 45000,  description: 'Social media advertising boost',       date: '2024-10-12', payee: 'Meta Ads Nepal',          reference: 'META-2024-089', status: 'pending',   createdBy: admin._id, approvedBy: null },
    { budgetId: budgetOpsQ1._id,  categoryId: catTravel._id, departmentId: deptOps._id,      type: 'expense', amount: 28000,  description: 'Staff field visit - Pokhara',          date: '2024-10-18', payee: 'Himalayan Travels',       reference: 'HT-2024-034',   status: 'completed', createdBy: deptHead._id, approvedBy: finance._id },
    { budgetId: budgetAnnual._id, categoryId: catInt._id,    departmentId: null,             type: 'income',  amount: 25000,  description: 'Bank interest income - Q1',             date: '2024-10-01', payee: 'Nepal Bank Ltd',           reference: 'NBL-INT-Q1',    status: 'completed', createdBy: finance._id, approvedBy: admin._id },
    { budgetId: budgetFinQ1._id,  categoryId: catSupply._id, departmentId: deptFinance._id,  type: 'expense', amount: 18000,  description: 'Printer cartridges and paper',         date: '2024-10-08', payee: 'Office World Nepal',      reference: 'OWN-2024-156',  status: 'completed', createdBy: finance._id, approvedBy: finance._id },
    { budgetId: budgetAnnual._id, categoryId: catRent._id,   departmentId: null,             type: 'expense', amount: 200000, description: 'Office rent - Q3',                     date: '2024-10-01', payee: 'Kathmandu Properties',    reference: 'RENT-Q3-2024',  status: 'completed', createdBy: finance._id, approvedBy: admin._id },
    { budgetId: budgetAnnual._id, categoryId: catOther._id,  departmentId: null,             type: 'income',  amount: 150000, description: 'Workshop registration fees',           date: '2024-11-05', payee: 'Various Participants',    reference: 'WS-2024-NOV',   status: 'completed', createdBy: finance._id, approvedBy: admin._id },
  ];

  const createdTx = await Transaction.insertMany(
    txData.map(t => ({ ...t, organizationId: org._id }))
  );
  console.log(`✅  Created ${createdTx.length} transactions`);

  // ── Notifications ──────────────────────────────────────────────────────────
  await Notification.insertMany([
    { userId: admin._id,   title: 'Budget Approval Required',   message: 'Operations Q1 Budget requires your approval',           type: 'approval',     isRead: false, link: '/budgets' },
    { userId: finance._id, title: 'Transaction Pending',        message: 'Field visit transportation expense awaiting approval',   type: 'transaction',  isRead: false, link: '/transactions' },
    { userId: admin._id,   title: 'Budget Alert',               message: 'Marketing Campaign Budget is 24% utilized',             type: 'alert',        isRead: true,  link: '/budgets' },
    { userId: admin._id,   title: 'New User Registered',        message: 'Hari Prasad has joined as a Viewer',                    type: 'info',         isRead: false, link: '/admin/users' },
    { userId: finance._id, title: 'Monthly Report Due',         message: 'September financial report is due for submission',      type: 'info',         isRead: false, link: '/reports' },
  ]);
  console.log('✅  Created 5 notifications');

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════');
  console.log('  ✅ BudMap database seeded successfully!');
  console.log('═══════════════════════════════════════════════');
  console.log('\n  Login credentials:');
  console.log('  ┌──────────────────────────────┬───────────────┐');
  console.log('  │ Email                        │ Password      │');
  console.log('  ├──────────────────────────────┼───────────────┤');
  console.log('  │ admin@budmap.com             │ admin123      │');
  console.log('  │ finance@budmap.com           │ finance123    │');
  console.log('  │ department@budmap.com        │ dept123       │');
  console.log('  │ viewer@budmap.com            │ viewer123     │');
  console.log('  └──────────────────────────────┴───────────────┘\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
