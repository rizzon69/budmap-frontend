const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// In-memory data store (simulating database)
// In production, this would be PostgreSQL as mentioned in the proposal

// Users store
const users = [
  {
    id: 'user-admin-001',
    email: 'admin@budmap.com',
    password: bcrypt.hashSync('admin123', 10),
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    organizationId: 'org-001',
    departmentId: null,
    phone: '+977-9841000001',
    avatar: null,
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    lastLogin: null
  },
  {
    id: 'user-finance-001',
    email: 'finance@budmap.com',
    password: bcrypt.hashSync('finance123', 10),
    firstName: 'Ram',
    lastName: 'Sharma',
    role: 'finance_officer',
    organizationId: 'org-001',
    departmentId: 'dept-001',
    phone: '+977-9841000002',
    avatar: null,
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
    lastLogin: null
  },
  {
    id: 'user-dept-001',
    email: 'department@budmap.com',
    password: bcrypt.hashSync('dept123', 10),
    firstName: 'Sita',
    lastName: 'Thapa',
    role: 'department_head',
    organizationId: 'org-001',
    departmentId: 'dept-002',
    phone: '+977-9841000003',
    avatar: null,
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString(),
    lastLogin: null
  },
  {
    id: 'user-viewer-001',
    email: 'viewer@budmap.com',
    password: bcrypt.hashSync('viewer123', 10),
    firstName: 'Hari',
    lastName: 'Prasad',
    role: 'viewer',
    organizationId: 'org-001',
    departmentId: 'dept-002',
    phone: '+977-9841000004',
    avatar: null,
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date('2024-02-15').toISOString(),
    updatedAt: new Date('2024-02-15').toISOString(),
    lastLogin: null
  }
];

// Organizations store
const organizations = [
  {
    id: 'org-001',
    name: 'Nepal Education Foundation',
    type: 'ngo',
    email: 'contact@nef.org.np',
    phone: '+977-1-4444444',
    address: 'Kathmandu, Nepal',
    website: 'https://nef.org.np',
    fiscalYearStart: 'July',
    currency: 'NPR',
    logo: null,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'org-002',
    name: 'Himalayan Tech Solutions',
    type: 'sme',
    email: 'info@himalayan-tech.com',
    phone: '+977-1-5555555',
    address: 'Lalitpur, Nepal',
    website: 'https://himalayan-tech.com',
    fiscalYearStart: 'July',
    currency: 'NPR',
    logo: null,
    isActive: true,
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString()
  }
];

// Departments store
const departments = [
  {
    id: 'dept-001',
    name: 'Finance Department',
    code: 'FIN',
    organizationId: 'org-001',
    headId: 'user-finance-001',
    description: 'Handles all financial operations and budgeting',
    isActive: true,
    createdAt: new Date('2024-01-05').toISOString(),
    updatedAt: new Date('2024-01-05').toISOString()
  },
  {
    id: 'dept-002',
    name: 'Operations Department',
    code: 'OPS',
    organizationId: 'org-001',
    headId: 'user-dept-001',
    description: 'Manages day-to-day operations',
    isActive: true,
    createdAt: new Date('2024-01-05').toISOString(),
    updatedAt: new Date('2024-01-05').toISOString()
  },
  {
    id: 'dept-003',
    name: 'Human Resources',
    code: 'HR',
    organizationId: 'org-001',
    headId: null,
    description: 'Employee management and welfare',
    isActive: true,
    createdAt: new Date('2024-01-06').toISOString(),
    updatedAt: new Date('2024-01-06').toISOString()
  },
  {
    id: 'dept-004',
    name: 'Marketing',
    code: 'MKT',
    organizationId: 'org-001',
    headId: null,
    description: 'Marketing and communications',
    isActive: true,
    createdAt: new Date('2024-01-07').toISOString(),
    updatedAt: new Date('2024-01-07').toISOString()
  }
];

// Budget Categories
const budgetCategories = [
  { id: 'cat-001', name: 'Salaries & Wages', type: 'expense', icon: 'users', color: '#4F46E5' },
  { id: 'cat-002', name: 'Office Supplies', type: 'expense', icon: 'package', color: '#10B981' },
  { id: 'cat-003', name: 'Utilities', type: 'expense', icon: 'zap', color: '#F59E0B' },
  { id: 'cat-004', name: 'Travel & Transportation', type: 'expense', icon: 'car', color: '#EF4444' },
  { id: 'cat-005', name: 'Training & Development', type: 'expense', icon: 'book', color: '#8B5CF6' },
  { id: 'cat-006', name: 'Equipment & Machinery', type: 'expense', icon: 'settings', color: '#06B6D4' },
  { id: 'cat-007', name: 'Marketing & Advertising', type: 'expense', icon: 'megaphone', color: '#EC4899' },
  { id: 'cat-008', name: 'Rent & Lease', type: 'expense', icon: 'home', color: '#84CC16' },
  { id: 'cat-009', name: 'Donations & Grants', type: 'income', icon: 'gift', color: '#14B8A6' },
  { id: 'cat-010', name: 'Service Revenue', type: 'income', icon: 'dollar-sign', color: '#22C55E' },
  { id: 'cat-011', name: 'Interest Income', type: 'income', icon: 'trending-up', color: '#3B82F6' },
  { id: 'cat-012', name: 'Other Income', type: 'income', icon: 'plus-circle', color: '#A855F7' }
];

// Budgets store
const budgets = [
  {
    id: 'budget-001',
    name: 'Annual Budget 2024-25',
    organizationId: 'org-001',
    departmentId: null,
    fiscalYear: '2024-25',
    startDate: '2024-07-16',
    endDate: '2025-07-15',
    totalAmount: 5000000,
    allocatedAmount: 4200000,
    spentAmount: 1850000,
    status: 'active',
    description: 'Organization-wide annual budget for fiscal year 2024-25',
    createdBy: 'user-admin-001',
    approvedBy: 'user-admin-001',
    approvedAt: new Date('2024-07-10').toISOString(),
    createdAt: new Date('2024-07-01').toISOString(),
    updatedAt: new Date('2024-09-15').toISOString()
  },
  {
    id: 'budget-002',
    name: 'Finance Dept Q1 Budget',
    organizationId: 'org-001',
    departmentId: 'dept-001',
    fiscalYear: '2024-25',
    startDate: '2024-07-16',
    endDate: '2024-10-15',
    totalAmount: 800000,
    allocatedAmount: 800000,
    spentAmount: 450000,
    status: 'active',
    description: 'Finance department quarterly budget',
    createdBy: 'user-finance-001',
    approvedBy: 'user-admin-001',
    approvedAt: new Date('2024-07-12').toISOString(),
    createdAt: new Date('2024-07-05').toISOString(),
    updatedAt: new Date('2024-09-10').toISOString()
  },
  {
    id: 'budget-003',
    name: 'Operations Q1 Budget',
    organizationId: 'org-001',
    departmentId: 'dept-002',
    fiscalYear: '2024-25',
    startDate: '2024-07-16',
    endDate: '2024-10-15',
    totalAmount: 1200000,
    allocatedAmount: 1200000,
    spentAmount: 680000,
    status: 'active',
    description: 'Operations department quarterly budget',
    createdBy: 'user-dept-001',
    approvedBy: 'user-finance-001',
    approvedAt: new Date('2024-07-14').toISOString(),
    createdAt: new Date('2024-07-08').toISOString(),
    updatedAt: new Date('2024-09-12').toISOString()
  },
  {
    id: 'budget-004',
    name: 'Marketing Campaign Budget',
    organizationId: 'org-001',
    departmentId: 'dept-004',
    fiscalYear: '2024-25',
    startDate: '2024-08-01',
    endDate: '2024-12-31',
    totalAmount: 500000,
    allocatedAmount: 500000,
    spentAmount: 120000,
    status: 'active',
    description: 'Marketing campaign for awareness programs',
    createdBy: 'user-admin-001',
    approvedBy: 'user-admin-001',
    approvedAt: new Date('2024-07-28').toISOString(),
    createdAt: new Date('2024-07-25').toISOString(),
    updatedAt: new Date('2024-09-05').toISOString()
  }
];

// Budget Allocations
const budgetAllocations = [
  {
    id: 'alloc-001',
    budgetId: 'budget-001',
    categoryId: 'cat-001',
    allocatedAmount: 2000000,
    spentAmount: 850000,
    notes: 'Staff salaries and benefits'
  },
  {
    id: 'alloc-002',
    budgetId: 'budget-001',
    categoryId: 'cat-002',
    allocatedAmount: 200000,
    spentAmount: 75000,
    notes: 'Office supplies and stationery'
  },
  {
    id: 'alloc-003',
    budgetId: 'budget-001',
    categoryId: 'cat-003',
    allocatedAmount: 300000,
    spentAmount: 125000,
    notes: 'Electricity, water, internet'
  },
  {
    id: 'alloc-004',
    budgetId: 'budget-001',
    categoryId: 'cat-008',
    allocatedAmount: 600000,
    spentAmount: 400000,
    notes: 'Office rent'
  },
  {
    id: 'alloc-005',
    budgetId: 'budget-002',
    categoryId: 'cat-001',
    allocatedAmount: 500000,
    spentAmount: 300000,
    notes: 'Finance team salaries'
  },
  {
    id: 'alloc-006',
    budgetId: 'budget-002',
    categoryId: 'cat-005',
    allocatedAmount: 100000,
    spentAmount: 45000,
    notes: 'Training programs'
  }
];

// Transactions store
const transactions = [
  {
    id: 'trans-001',
    organizationId: 'org-001',
    budgetId: 'budget-001',
    categoryId: 'cat-001',
    departmentId: 'dept-001',
    type: 'expense',
    amount: 250000,
    description: 'Monthly salaries - August 2024',
    date: '2024-08-28',
    payee: 'Staff Payroll',
    reference: 'PAY-2024-08',
    status: 'completed',
    createdBy: 'user-finance-001',
    approvedBy: 'user-admin-001',
    createdAt: new Date('2024-08-28').toISOString(),
    updatedAt: new Date('2024-08-28').toISOString()
  },
  {
    id: 'trans-002',
    organizationId: 'org-001',
    budgetId: 'budget-001',
    categoryId: 'cat-002',
    departmentId: 'dept-002',
    type: 'expense',
    amount: 25000,
    description: 'Office supplies purchase',
    date: '2024-08-15',
    payee: 'Kathmandu Stationery',
    reference: 'INV-KS-2024-156',
    status: 'completed',
    createdBy: 'user-dept-001',
    approvedBy: 'user-finance-001',
    createdAt: new Date('2024-08-15').toISOString(),
    updatedAt: new Date('2024-08-15').toISOString()
  },
  {
    id: 'trans-003',
    organizationId: 'org-001',
    budgetId: 'budget-001',
    categoryId: 'cat-009',
    departmentId: null,
    type: 'income',
    amount: 1000000,
    description: 'Annual grant from USAID',
    date: '2024-07-20',
    payee: 'USAID Nepal',
    reference: 'GRANT-2024-001',
    status: 'completed',
    createdBy: 'user-finance-001',
    approvedBy: 'user-admin-001',
    createdAt: new Date('2024-07-20').toISOString(),
    updatedAt: new Date('2024-07-20').toISOString()
  },
  {
    id: 'trans-004',
    organizationId: 'org-001',
    budgetId: 'budget-001',
    categoryId: 'cat-003',
    departmentId: 'dept-001',
    type: 'expense',
    amount: 45000,
    description: 'Electricity bill - August',
    date: '2024-08-25',
    payee: 'NEA',
    reference: 'NEA-AUG-2024',
    status: 'completed',
    createdBy: 'user-finance-001',
    approvedBy: null,
    createdAt: new Date('2024-08-25').toISOString(),
    updatedAt: new Date('2024-08-25').toISOString()
  },
  {
    id: 'trans-005',
    organizationId: 'org-001',
    budgetId: 'budget-003',
    categoryId: 'cat-004',
    departmentId: 'dept-002',
    type: 'expense',
    amount: 35000,
    description: 'Field visit transportation',
    date: '2024-09-05',
    payee: 'Nepal Transport Services',
    reference: 'NTS-2024-089',
    status: 'pending',
    createdBy: 'user-dept-001',
    approvedBy: null,
    createdAt: new Date('2024-09-05').toISOString(),
    updatedAt: new Date('2024-09-05').toISOString()
  },
  {
    id: 'trans-006',
    organizationId: 'org-001',
    budgetId: 'budget-001',
    categoryId: 'cat-008',
    departmentId: null,
    type: 'expense',
    amount: 200000,
    description: 'Office rent - Q2',
    date: '2024-09-01',
    payee: 'Kathmandu Properties',
    reference: 'RENT-Q2-2024',
    status: 'completed',
    createdBy: 'user-finance-001',
    approvedBy: 'user-admin-001',
    createdAt: new Date('2024-09-01').toISOString(),
    updatedAt: new Date('2024-09-01').toISOString()
  }
];

// Notifications store
const notifications = [
  {
    id: 'notif-001',
    userId: 'user-admin-001',
    title: 'Budget Approval Required',
    message: 'Operations Q1 Budget requires your approval',
    type: 'approval',
    isRead: false,
    link: '/budgets/budget-003',
    createdAt: new Date('2024-09-10').toISOString()
  },
  {
    id: 'notif-002',
    userId: 'user-finance-001',
    title: 'Transaction Pending',
    message: 'Field visit transportation expense awaiting approval',
    type: 'transaction',
    isRead: false,
    link: '/transactions/trans-005',
    createdAt: new Date('2024-09-05').toISOString()
  },
  {
    id: 'notif-003',
    userId: 'user-admin-001',
    title: 'Budget Alert',
    message: 'Marketing Campaign Budget is 24% utilized',
    type: 'alert',
    isRead: true,
    link: '/budgets/budget-004',
    createdAt: new Date('2024-09-01').toISOString()
  }
];

// Activity logs
const activityLogs = [
  {
    id: 'log-001',
    userId: 'user-admin-001',
    action: 'CREATE',
    entity: 'budget',
    entityId: 'budget-001',
    details: 'Created Annual Budget 2024-25',
    ipAddress: '192.168.1.1',
    createdAt: new Date('2024-07-01').toISOString()
  },
  {
    id: 'log-002',
    userId: 'user-finance-001',
    action: 'CREATE',
    entity: 'transaction',
    entityId: 'trans-001',
    details: 'Created expense transaction for monthly salaries',
    ipAddress: '192.168.1.2',
    createdAt: new Date('2024-08-28').toISOString()
  }
];

// Helper function to generate IDs
const generateId = (prefix) => `${prefix}-${uuidv4().slice(0, 8)}`;

module.exports = {
  users,
  organizations,
  departments,
  budgetCategories,
  budgets,
  budgetAllocations,
  transactions,
  notifications,
  activityLogs,
  generateId
};
