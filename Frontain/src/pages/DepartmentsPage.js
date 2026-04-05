import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { departmentsAPI } from '../services/api';
import {
  Plus,
  Search,
  Building2,
  Users,
  Wallet,
  Edit,
  X,
} from 'lucide-react';
import './PageStyles.css';

const DepartmentsPage = () => {
  const { isAdmin, isFinanceOfficer } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const canManage = isAdmin || isFinanceOfficer;

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await departmentsAPI.getAll();
      if (res.data.success) {
        const raw = res.data.data.departments || [];
        setDepartments(raw.map((d, i) => ({ ...d, id: d.id ?? d._id ?? i })));
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await departmentsAPI.create(formData);
      if (res.data.success) {
        const dept = res.data.data.department;
        const safeId = dept?.id ?? dept?._id ?? Date.now();
        setDepartments(prev => [{ ...dept, id: safeId }, ...prev]);
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create department:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loader"><div className="loader-spinner"></div></div>;
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h2>Departments</h2>
          <p>Manage your organization's departments</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            Add Department
          </button>
        )}
      </div>

      {/* Search */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Department Cards */}
      <div className="department-grid">
        {filteredDepartments.length > 0 ? (
          filteredDepartments.map((dept, index) => (
            <div key={dept.id ?? index} className="department-card">
              <div className="dept-header">
                <div className="dept-icon">
                  <Building2 size={24} />
                </div>
                <span className="dept-code">{dept.code}</span>
              </div>

              <h3 className="dept-name">{dept.name}</h3>
              <p className="dept-desc">{dept.description || 'No description'}</p>

              <div className="dept-stats">
                <div className="dept-stat">
                  <Users size={18} />
                  <span>{dept.stats?.userCount || 0} Members</span>
                </div>
                <div className="dept-stat">
                  <Wallet size={18} />
                  <span>{dept.stats?.budgetCount || 0} Budgets</span>
                </div>
              </div>

              <div className="dept-budget-info">
                <div className="budget-row">
                  <span>Total Budgeted</span>
                  <span className="budget-amount">{formatCurrency(dept.stats?.totalBudgeted || 0)}</span>
                </div>
                <div className="budget-row">
                  <span>Total Spent</span>
                  <span className="budget-amount spent">{formatCurrency(dept.stats?.totalSpent || 0)}</span>
                </div>
              </div>

              {dept.head && (
                <div className="dept-head">
                  <span className="head-label">Department Head</span>
                  <span className="head-name">{dept.head.name}</span>
                </div>
              )}

              {canManage && (
                <div className="dept-actions">
                  <button className="action-btn" title="Edit">
                    <Edit size={18} />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Building2 size={64} className="empty-state-icon" />
            <h3 className="empty-state-title">No departments found</h3>
            <p className="empty-state-text">
              {searchTerm ? 'Try a different search term' : 'Create your first department'}
            </p>
          </div>
        )}
      </div>

      {/* Add Department Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Department</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Department Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Finance Department"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Department Code</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., FIN"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  required
                  maxLength={5}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Department description..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
