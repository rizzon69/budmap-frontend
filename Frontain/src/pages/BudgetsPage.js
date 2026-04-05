import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { budgetsAPI, departmentsAPI } from '../services/api';
import {
  Plus, Search, Edit, Trash2,
  CheckCircle, Clock, AlertTriangle,
  Wallet, X, Eye, Save,
} from 'lucide-react';
import './PageStyles.css';

const EMPTY_FORM = {
  name: '',
  fiscalYear: '2024-25',
  startDate: '',
  endDate: '',
  totalAmount: '',
  departmentId: '',
  description: '',
};

const BudgetsPage = () => {
  const { canManageBudgets, canApproveBudgets } = useAuth();
  const [budgets,     setBudgets]     = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editingBudget, setEditingBudget] = useState(null); // null = create, object = edit
  const [formData,    setFormData]    = useState(EMPTY_FORM);
  const [formError,   setFormError]   = useState('');
  const [searchTerm,  setSearchTerm]  = useState('');
  const [statusFilter,setStatusFilter]= useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetsRes, deptsRes] = await Promise.all([
        budgetsAPI.getAll(),
        departmentsAPI.getAll(),
      ]);
      if (budgetsRes.data.success) {
        const raw = budgetsRes.data.data.budgets || [];
        setBudgets(raw.map(b => ({ ...b, id: b.id ?? b._id })));
      }
      if (deptsRes.data.success) {
        const raw = deptsRes.data.data.departments || [];
        setDepartments(raw.map(d => ({ ...d, id: d.id ?? d._id })));
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Open create modal ──────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingBudget(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  // ── Open edit modal pre-filled from DB record ──────────────────────────────
  const openEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      name:         budget.name         || '',
      fiscalYear:   budget.fiscalYear   || '2024-25',
      startDate:    budget.startDate    || '',
      endDate:      budget.endDate      || '',
      totalAmount:  String(budget.totalAmount ?? ''),
      departmentId: String(budget.departmentId ?? budget.department?.id ?? ''),
      description:  budget.description  || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBudget(null);
    setFormData(EMPTY_FORM);
    setFormError('');
  };

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await budgetsAPI.create(formData);
      if (res.data.success) {
        const b = res.data.data.budget;
        setBudgets(prev => [{ ...b, id: b.id ?? b._id }, ...prev]);
        closeModal();
      } else {
        setFormError(res.data.message || 'Failed to create budget');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create budget');
    }
  };

  // ── Update ─────────────────────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await budgetsAPI.update(editingBudget.id, formData);
      if (res.data.success) {
        const updated = res.data.data.budget;
        const uid = updated?.id ?? updated?._id ?? editingBudget.id;
        setBudgets(prev => prev.map(b =>
          b.id === editingBudget.id ? { ...b, ...updated, id: uid } : b
        ));
        closeModal();
      } else {
        setFormError(res.data.message || 'Failed to update budget');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update budget');
    }
  };

  // ── Approve ────────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    if (!id && id !== 0) return;
    try {
      const res = await budgetsAPI.approve(id);
      if (res.data.success) {
        const updated = res.data.data.budget;
        const uid = updated?.id ?? updated?._id ?? id;
        setBudgets(prev => prev.map(b =>
          b.id === id ? { ...b, ...updated, id: uid } : b
        ));
      }
    } catch (err) {
      console.error('Failed to approve budget:', err);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget? This cannot be undone.')) return;
    try {
      await budgetsAPI.delete(id);
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete budget');
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-NP', {
      style: 'currency', currency: 'NPR', minimumFractionDigits: 0,
    }).format(amount);

  const getStatusBadge = (status) => {
    const cfg = {
      active:   { icon: CheckCircle,  className: 'badge-success', label: 'Active'  },
      draft:    { icon: Clock,        className: 'badge-warning', label: 'Draft'   },
      closed:   { icon: AlertTriangle,className: 'badge-error',   label: 'Closed'  },
      archived: { icon: AlertTriangle,className: 'badge-error',   label: 'Archived'},
    };
    return cfg[status] || cfg.draft;
  };

  const filteredBudgets = budgets.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="loader"><div className="loader-spinner"></div></div>;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h2>Budget Management</h2>
          <p>Create and manage your organisation's budgets</p>
        </div>
        {canManageBudgets && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} /> Create Budget
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search budgets..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="filter-select" value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Budget Cards */}
      <div className="budget-grid">
        {filteredBudgets.length > 0 ? filteredBudgets.map((budget) => {
          const badge       = getStatusBadge(budget.status);
          const utilization = budget.totalAmount > 0
            ? Math.round((budget.spentAmount / budget.totalAmount) * 100) : 0;

          return (
            <div key={budget.id} className="budget-card">
              <div className="budget-card-header">
                <div className="budget-icon"><Wallet size={24} /></div>
                <span className={`badge ${badge.className}`}>
                  <badge.icon size={14} /> {badge.label}
                </span>
              </div>

              <h3 className="budget-name">{budget.name}</h3>
              <p className="budget-dept">
                {budget.department?.name || 'Organisation-wide'}
              </p>

              <div className="budget-amounts">
                <div className="amount-item">
                  <span className="amount-label">Total Budget</span>
                  <span className="amount-value">{formatCurrency(budget.totalAmount)}</span>
                </div>
                <div className="amount-item">
                  <span className="amount-label">Spent</span>
                  <span className="amount-value spent">{formatCurrency(budget.spentAmount)}</span>
                </div>
              </div>

              <div className="budget-progress">
                <div className="progress-header">
                  <span>Utilization</span>
                  <span>{utilization}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${utilization > 90 ? 'danger' : utilization > 70 ? 'warning' : ''}`}
                    style={{ width: `${Math.min(utilization, 100)}%` }}
                  />
                </div>
              </div>

              <div className="budget-footer">
                <span className="budget-period">FY {budget.fiscalYear}</span>
                <div className="budget-actions">
                  {canManageBudgets && (
                    <button
                      className="action-btn"
                      title="Edit"
                      onClick={() => openEdit(budget)}
                    >
                      <Edit size={18} />
                    </button>
                  )}
                  {canManageBudgets && budget.status === 'draft' && (
                    <button
                      className="action-btn reject"
                      title="Delete"
                      onClick={() => handleDelete(budget.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  {canApproveBudgets && budget.status === 'draft' && (
                    <button
                      className="action-btn approve"
                      title="Approve"
                      onClick={() => handleApprove(budget.id)}
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="empty-state">
            <Wallet size={64} className="empty-state-icon" />
            <h3 className="empty-state-title">No budgets found</h3>
            <p className="empty-state-text">
              {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Create your first budget to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingBudget ? `Edit: ${editingBudget.name}` : 'Create New Budget'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ margin: '0 0 12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
                {formError}
              </div>
            )}

            <form onSubmit={editingBudget ? handleUpdate : handleCreate}>
              {/* Name */}
              <div className="input-group">
                <label className="input-label">Budget Name</label>
                <input type="text" className="input-field"
                  placeholder="e.g., Annual Budget 2024-25"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required />
              </div>

              {/* Fiscal Year + Department */}
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Fiscal Year</label>
                  <select className="input-field" value={formData.fiscalYear}
                    onChange={e => setFormData({ ...formData, fiscalYear: e.target.value })}>
                    <option value="2023-24">2023-24</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2025-26">2025-26</option>
                    <option value="2026-27">2026-27</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Department</label>
                  <select className="input-field" value={formData.departmentId}
                    onChange={e => setFormData({ ...formData, departmentId: e.target.value })}>
                    <option value="">Organisation-wide</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start + End Date */}
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Start Date</label>
                  <input type="date" className="input-field" value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    required />
                </div>
                <div className="input-group">
                  <label className="input-label">End Date</label>
                  <input type="date" className="input-field" value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    required />
                </div>
              </div>

              {/* Total Amount */}
              <div className="input-group">
                <label className="input-label">Total Amount (NPR)</label>
                <input type="number" className="input-field"
                  placeholder="Enter budget amount"
                  value={formData.totalAmount}
                  onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                  required min="1" />
              </div>

              {/* Description */}
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea className="input-field" rows="3"
                  placeholder="Budget description..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBudget ? (
                    <><Save size={16} /> Save Changes</>
                  ) : (
                    <><Plus size={16} /> Create Budget</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;
