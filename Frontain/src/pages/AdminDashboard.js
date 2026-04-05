import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import {
  Users,
  Building2,
  Wallet,
  ArrowRightLeft,
  TrendingUp,
  Activity,
  Shield,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  UserPlus,
  FileText
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  const COLORS = ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getDashboard();
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin dashboard:', error);
      // Do NOT fall back to mock data — show real empty state
    } finally {
      setLoading(false);
    }
  };

  // No mock data — all data must come from the real database

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  const { users, organizations, budgets, transactions, departments, recentActivity } = dashboardData || {};

  const userRoleData = users ? [
    { name: 'Admin', value: users.byRole.admin || 0 },
    { name: 'Finance Officer', value: users.byRole.finance_officer || 0 },
    { name: 'Dept Head', value: users.byRole.department_head || 0 },
    { name: 'Viewer', value: users.byRole.viewer || 0 },
  ].filter(d => d.value > 0) : [];

  const orgTypeData = organizations ? [
    { name: 'NGO', value: organizations.byType.ngo || 0 },
    { name: 'SME', value: organizations.byType.sme || 0 },
    { name: 'Educational', value: organizations.byType.educational || 0 },
    { name: 'Government', value: organizations.byType.government || 0 }
  ].filter(d => d.value > 0) : [];

  const transactionStatusData = transactions ? [
    { name: 'Approved', value: transactions.byStatus?.approved || 0, color: '#10b981' },
    { name: 'Pending', value: transactions.byStatus?.pending || 0, color: '#f59e0b' },
    { name: 'Rejected', value: transactions.byStatus?.rejected || 0, color: '#ef4444' }
  ].filter(d => d.value > 0) : [];

  return (
    <div className="admin-dashboard">
      {/* Admin Header */}
      <div className="admin-header">
        <div className="header-content">
          <div className="header-title">
            <Shield className="header-icon" size={32} />
            <div>
              <h1>Admin Dashboard</h1>
              <p>System-wide overview and management</p>
            </div>
          </div>
          <div className="header-actions">
            <Link to="/admin/users" className="btn-primary">
              <UserPlus size={18} />
              Add User
            </Link>
            <button className="btn-secondary">
              <FileText size={18} />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card primary">
          <div className="stat-icon-wrapper">
            <Users className="stat-icon" />
          </div>
          <div className="stat-details">
            <div className="stat-header">
              <span className="stat-label">Total Users</span>
              <Link to="/admin/users" className="stat-link">View All →</Link>
            </div>
            <h2 className="stat-value">{formatNumber(users?.total || 0)}</h2>
            <div className="stat-meta">
              <span className="stat-badge success">
                <CheckCircle size={14} />
                {users?.active || 0} Active
              </span>
              <span className="stat-change positive">
                <TrendingUp size={14} />
                {users?.active || 0} of {users?.total || 0} active
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon-wrapper">
            <Building2 className="stat-icon" />
          </div>
          <div className="stat-details">
            <div className="stat-header">
              <span className="stat-label">Organizations</span>
              <Link to="/admin/organizations" className="stat-link">View All →</Link>
            </div>
            <h2 className="stat-value">{formatNumber(organizations?.total || 0)}</h2>
            <div className="stat-meta">
              <span className="stat-badge success">
                <CheckCircle size={14} />
                {organizations?.active || 0} Active
              </span>
              <span className="stat-info">{departments?.total || 0} Departments</span>
            </div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon-wrapper">
            <Wallet className="stat-icon" />
          </div>
          <div className="stat-details">
            <div className="stat-header">
              <span className="stat-label">Total Budgets</span>
              <Link to="/budgets" className="stat-link">View All →</Link>
            </div>
            <h2 className="stat-value">{formatNumber(budgets?.total || 0)}</h2>
            <div className="stat-meta">
              <span className="stat-amount">{formatCurrency(budgets?.totalBudgeted || 0)}</span>
              <span className="stat-badge info">{budgets?.utilizationRate || 0}% utilized</span>
            </div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon-wrapper">
            <ArrowRightLeft className="stat-icon" />
          </div>
          <div className="stat-details">
            <div className="stat-header">
              <span className="stat-label">Transactions</span>
              <Link to="/transactions" className="stat-link">View All →</Link>
            </div>
            <h2 className="stat-value">{formatNumber(transactions?.total || 0)}</h2>
            <div className="stat-meta">
              <span className="stat-badge warning">
                <Clock size={14} />
                {transactions?.byStatus?.pending || 0} Pending
              </span>
              <span className="stat-info">{transactions?.byStatus?.approved || 0} Approved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="financial-overview-section">
        <div className="section-card">
          <div className="section-header">
            <h3>Financial Overview</h3>
            <select className="period-select">
              <option>This Month</option>
              <option>Last 3 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="financial-stats">
            <div className="financial-stat-item">
              <div className="financial-stat-icon income">
                <TrendingUp size={20} />
              </div>
              <div className="financial-stat-content">
                <span className="financial-stat-label">Total Income</span>
                <h3 className="financial-stat-value income">{formatCurrency(transactions?.totalIncome || 0)}</h3>
              </div>
            </div>
            <div className="financial-stat-divider"></div>
            <div className="financial-stat-item">
              <div className="financial-stat-icon expense">
                <TrendingUp size={20} className="rotate-180" />
              </div>
              <div className="financial-stat-content">
                <span className="financial-stat-label">Total Expense</span>
                <h3 className="financial-stat-value expense">{formatCurrency(transactions?.totalExpense || 0)}</h3>
              </div>
            </div>
            <div className="financial-stat-divider"></div>
            <div className="financial-stat-item">
              <div className="financial-stat-icon balance">
                <Wallet size={20} />
              </div>
              <div className="financial-stat-content">
                <span className="financial-stat-label">Net Balance</span>
                <h3 className="financial-stat-value balance">
                  {formatCurrency((transactions?.totalIncome || 0) - (transactions?.totalExpense || 0))}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Users by Role */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Users by Role</h3>
            <span className="chart-subtitle">{users?.total || 0} total users</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={userRoleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userRoleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Organizations by Type */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Organizations by Type</h3>
            <span className="chart-subtitle">{organizations?.total || 0} organizations</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={orgTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Status */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Transaction Status</h3>
            <span className="chart-subtitle">{transactions?.total || 0} transactions</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={transactionStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label
                >
                  {transactionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bottom-grid">
        {/* Quick Actions */}
        <div className="section-card">
          <div className="section-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions-grid">
            <Link to="/admin/users" className="quick-action-card">
              <Users size={24} />
              <span>Manage Users</span>
            </Link>
            <Link to="/admin/organizations" className="quick-action-card">
              <Building2 size={24} />
              <span>Manage Organizations</span>
            </Link>
            <Link to="/reports" className="quick-action-card">
              <BarChart3 size={24} />
              <span>View Reports</span>
            </Link>
            <Link to="/settings" className="quick-action-card">
              <Settings size={24} />
              <span>System Settings</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="section-card">
          <div className="section-header">
            <h3>Recent Activity</h3>
            <a href="#" className="view-all-link">View All →</a>
          </div>
          <div className="activity-timeline">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="activity-timeline-item">
                  <div className="activity-timeline-icon">
                    <Activity size={16} />
                  </div>
                  <div className="activity-timeline-content">
                    <p className="activity-text">
                      <strong>{activity.userName}</strong> {activity.action.toLowerCase()}d a {activity.entity.toLowerCase()}
                    </p>
                    <span className="activity-time">
                      {new Date(activity.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No recent activity</p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="section-card">
          <div className="section-header">
            <h3>Recently Joined Users</h3>
            <Link to="/admin/users" className="view-all-link">View All →</Link>
          </div>
          <div className="recent-users-list">
            {users?.recentlyJoined && users.recentlyJoined.length > 0 ? (
              users.recentlyJoined.map((user, index) => (
                <div key={index} className="recent-user-item">
                  <div className="user-avatar">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </div>
                  <div className="user-details">
                    <h4 className="user-name">{user.firstName} {user.lastName}</h4>
                    <p className="user-email">{user.email}</p>
                  </div>
                  <span className={`role-badge role-${user.role}`}>
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <p className="empty-state">No recent users</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
