const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Organization = require('../models/Organization');
const Department = require('../models/Department');
const Budget = require('../models/Budget');
const BudgetAllocation = require('../models/BudgetAllocation');
const BudgetCategory = require('../models/BudgetCategory');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/budmap');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Department.deleteMany({}),
      Budget.deleteMany({}),
      BudgetAllocation.deleteMany({}),
      BudgetCategory.deleteMany({}),
      Transaction.deleteMany({}),
      Notification.deleteMany({}),
      ActivityLog.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // 1. Create Organizations
    const org1 = await Organization.create({
      name: 'Nepal Education Foundation',
      type: 'ngo',
      email: 'contact@nef.org.np',
      phone: '+977-1-4444444',
      address: 'Kathmandu, Nepal',
      website: 'https://nef.org.np',
      fiscalYearStart: 'July',
      currency: 'NPR',
      isActive: true
    });

    const org2 = await Organization.create({
      name: 'Himalayan Tech Solutions',
      type: 'sme',
      email: 'info@himalayan-tech.com',
      phone: '+977-1-5555555',
      address: 'Lalitpur, Nepal',
      website: 'https://himalayan-tech.com',
      fiscalYearStart: 'July',
      currency: 'NPR',
      isActive: true
    });

    console.log('Organizations created');

    // 2. Create Users
    const adminUser = await User.create({
      email: 'admin@budmap.com',
      password: bcrypt.hashSync('admin123', 10),
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      organizationId: org1._id,
      phone: '+977-9841000001',
      isActive: true,
      isEmailVerified: true
    });

    const financeUser = await User.create({
      email: 'finance@budmap.com',
      password: bcrypt.hashSync('finance123', 10),
      firstName: 'Ram',
      lastName: 'Sharma',
      role: 'finance_officer',
      organizationId: org1._id,
      phone: '+977-9841000002',
      isActive: true,
      isEmailVerified: true
    });

    const deptUser = await User.create({
      email: 'department@budmap.com',
      password: bcrypt.hashSync('dept123', 10),
      firstName: 'Sita',
      lastName: 'Thapa',
      role: 'department_head',
      organizationId: org1._id,
      phone: '+977-9841000003',
      isActive: true,
      isEmailVerified: true
    });

    const viewerUser = await User.create({
      email: 'viewer@budmap.com',
      password: bcrypt.hashSync('viewer123', 10),
      firstName: 'Hari',
      lastName: 'Prasad',
      role: 'viewer',
      organizationId: org1._id,
      phone: '+977-9841000004',
      isActive: true,
      isEmailVerified: true
    });

    console.log('Users created');

    // 3. Create Departments
    const dept1 = await Department.create({
      name: 'Finance Department',
      code: 'FIN',
      organizationId: org1._id,
      headId: financeUser._id,
      description: 'Handles all financial operations and budgeting',
      isActive: true
    });

    const dept2 = await Department.create({
      name: 'Operations Department',
      code: 'OPS',
      organizationId: org1._id,
      headId: deptUser._id,
      description: 'Manages day-to-day operations',
      isActive: true
    });

    const dept3 = await Department.create({
      name: 'Human Resources',
      code: 'HR',
      organizationId: org1._id,
      description: 'Employee management and welfare',
      isActive: true
    });

    const dept4 = await Department.create({
      name: 'Marketing',
      code: 'MKT',
      organizationId: org1._id,
      description: 'Marketing and communications',
      isActive: true
    });

    // Update users with department IDs
    await User.findByIdAndUpdate(financeUser._id, { departmentId: dept1._id });
    await User.findByIdAndUpdate(deptUser._id, { departmentId: dept2._id });
    await User.findByIdAndUpdate(viewerUser._id, { departmentId: dept2._id });

    console.log('Departments created');

    // 4. Create Budget Categories
    const categories = await BudgetCategory.insertMany([
      { name: 'Salaries & Wages', type: 'expense', icon: 'users', color: '#4F46E5' },
      { name: 'Office Supplies', type: 'expense', icon: 'package', color: '#10B981' },
      { name: 'Utilities', type: 'expense', icon: 'zap', color: '#F59E0B' },
      { name: 'Travel & Transportation', type: 'expense', icon: 'car', color: '#EF4444' },
      { name: 'Training & Development', type: 'expense', icon: 'book', color: '#8B5CF6' },
      { name: 'Equipment & Machinery', type: 'expense', icon: 'settings', color: '#06B6D4' },
      { name: 'Marketing & Advertising', type: 'expense', icon: 'megaphone', color: '#EC4899' },
      { name: 'Rent & Lease', type: 'expense', icon: 'home', color: '#84CC16' },
      { name: 'Donations & Grants', type: 'income', icon: 'gift', color: '#14B8A6' },
      { name: 'Service Revenue', type: 'income', icon: 'dollar-sign', color: '#22C55E' },
      { name: 'Interest Income', type: 'income', icon: 'trending-up', color: '#3B82F6' },
      { name: 'Other Income', type: 'income', icon: 'plus-circle', color: '#A855F7' }
    ]);

    console.log('Budget categories created');

    // 5. Create Budgets
    const budget1 = await Budget.create({
      name: 'Annual Budget 2024-25',
      organizationId: org1._id,
      fiscalYear: '2024-25',
      startDate: '2024-07-16',
      endDate: '2025-07-15',
      totalAmount: 5000000,
      allocatedAmount: 4200000,
      spentAmount: 1850000,
      status: 'active',
      description: 'Organization-wide annual budget for fiscal year 2024-25',
      createdBy: adminUser._id,
      approvedBy: adminUser._id,
      approvedAt: new Date('2024-07-10')
    });

    const budget2 = await Budget.create({
      name: 'Finance Dept Q1 Budget',
      organizationId: org1._id,
      departmentId: dept1._id,
      fiscalYear: '2024-25',
      startDate: '2024-07-16',
      endDate: '2024-10-15',
      totalAmount: 800000,
      allocatedAmount: 800000,
      spentAmount: 450000,
      status: 'active',
      description: 'Finance department quarterly budget',
      createdBy: financeUser._id,
      approvedBy: adminUser._id,
      approvedAt: new Date('2024-07-12')
    });

    const budget3 = await Budget.create({
      name: 'Operations Q1 Budget',
      organizationId: org1._id,
      departmentId: dept2._id,
      fiscalYear: '2024-25',
      startDate: '2024-07-16',
      endDate: '2024-10-15',
      totalAmount: 1200000,
      allocatedAmount: 1200000,
      spentAmount: 680000,
      status: 'active',
      description: 'Operations department quarterly budget',
      createdBy: deptUser._id,
      approvedBy: financeUser._id,
      approvedAt: new Date('2024-07-14')
    });

    const budget4 = await Budget.create({
      name: 'Marketing Campaign Budget',
      organizationId: org1._id,
      departmentId: dept4._id,
      fiscalYear: '2024-25',
      startDate: '2024-08-01',
      endDate: '2024-12-31',
      totalAmount: 500000,
      allocatedAmount: 500000,
      spentAmount: 120000,
      status: 'active',
      description: 'Marketing campaign for awareness programs',
      createdBy: adminUser._id,
      approvedBy: adminUser._id,
      approvedAt: new Date('2024-07-28')
    });

    console.log('Budgets created');

    // 6. Create Budget Allocations
    await BudgetAllocation.insertMany([
      { budgetId: budget1._id, categoryId: categories[0]._id, allocatedAmount: 2000000, spentAmount: 850000, notes: 'Staff salaries and benefits' },
      { budgetId: budget1._id, categoryId: categories[1]._id, allocatedAmount: 200000, spentAmount: 75000, notes: 'Office supplies and stationery' },
      { budgetId: budget1._id, categoryId: categories[2]._id, allocatedAmount: 300000, spentAmount: 125000, notes: 'Electricity, water, internet' },
      { budgetId: budget1._id, categoryId: categories[7]._id, allocatedAmount: 600000, spentAmount: 400000, notes: 'Office rent' },
      { budgetId: budget2._id, categoryId: categories[0]._id, allocatedAmount: 500000, spentAmount: 300000, notes: 'Finance team salaries' },
      { budgetId: budget2._id, categoryId: categories[4]._id, allocatedAmount: 100000, spentAmount: 45000, notes: 'Training programs' }
    ]);

    console.log('Budget allocations created');

    // 7. Create Transactions
    await Transaction.insertMany([
      {
        organizationId: org1._id, budgetId: budget1._id, categoryId: categories[0]._id, departmentId: dept1._id,
        type: 'expense', amount: 250000, description: 'Monthly salaries - August 2024', date: '2024-08-28',
        payee: 'Staff Payroll', reference: 'PAY-2024-08', status: 'completed',
        createdBy: financeUser._id, approvedBy: adminUser._id
      },
      {
        organizationId: org1._id, budgetId: budget1._id, categoryId: categories[1]._id, departmentId: dept2._id,
        type: 'expense', amount: 25000, description: 'Office supplies purchase', date: '2024-08-15',
        payee: 'Kathmandu Stationery', reference: 'INV-KS-2024-156', status: 'completed',
        createdBy: deptUser._id, approvedBy: financeUser._id
      },
      {
        organizationId: org1._id, budgetId: budget1._id, categoryId: categories[8]._id,
        type: 'income', amount: 1000000, description: 'Annual grant from USAID', date: '2024-07-20',
        payee: 'USAID Nepal', reference: 'GRANT-2024-001', status: 'completed',
        createdBy: financeUser._id, approvedBy: adminUser._id
      },
      {
        organizationId: org1._id, budgetId: budget1._id, categoryId: categories[2]._id, departmentId: dept1._id,
        type: 'expense', amount: 45000, description: 'Electricity bill - August', date: '2024-08-25',
        payee: 'NEA', reference: 'NEA-AUG-2024', status: 'completed',
        createdBy: financeUser._id
      },
      {
        organizationId: org1._id, budgetId: budget3._id, categoryId: categories[3]._id, departmentId: dept2._id,
        type: 'expense', amount: 35000, description: 'Field visit transportation', date: '2024-09-05',
        payee: 'Nepal Transport Services', reference: 'NTS-2024-089', status: 'pending',
        createdBy: deptUser._id
      },
      {
        organizationId: org1._id, budgetId: budget1._id, categoryId: categories[7]._id,
        type: 'expense', amount: 200000, description: 'Office rent - Q2', date: '2024-09-01',
        payee: 'Kathmandu Properties', reference: 'RENT-Q2-2024', status: 'completed',
        createdBy: financeUser._id, approvedBy: adminUser._id
      }
    ]);

    console.log('Transactions created');

    // 8. Create Notifications
    await Notification.insertMany([
      {
        userId: adminUser._id, title: 'Budget Approval Required',
        message: 'Operations Q1 Budget requires your approval', type: 'approval',
        isRead: false, link: '/budgets'
      },
      {
        userId: financeUser._id, title: 'Transaction Pending',
        message: 'Field visit transportation expense awaiting approval', type: 'transaction',
        isRead: false, link: '/transactions'
      },
      {
        userId: adminUser._id, title: 'Budget Alert',
        message: 'Marketing Campaign Budget is 24% utilized', type: 'alert',
        isRead: true, link: '/budgets'
      }
    ]);

    console.log('Notifications created');

    // 9. Create Activity Logs
    await ActivityLog.insertMany([
      {
        userId: adminUser._id, action: 'CREATE', entity: 'budget',
        entityId: budget1._id.toString(), details: 'Created Annual Budget 2024-25',
        ipAddress: '192.168.1.1'
      },
      {
        userId: financeUser._id, action: 'CREATE', entity: 'transaction',
        entityId: 'trans-seed', details: 'Created expense transaction for monthly salaries',
        ipAddress: '192.168.1.2'
      }
    ]);

    console.log('Activity logs created');

    console.log('\nDatabase seeded successfully!');
    console.log('You can now login with:');
    console.log('  Admin: admin@budmap.com / admin123');
    console.log('  Finance: finance@budmap.com / finance123');
    console.log('  Dept Head: department@budmap.com / dept123');
    console.log('  Viewer: viewer@budmap.com / viewer123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
