import React, { useState, useEffect } from 'react';
import { organizationsAPI } from '../services/api';
import { Building2, Plus, Edit, Trash2, Users, Calendar, X } from 'lucide-react';
import './PageStyles.css';

const OrganizationsPage = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);

  const [formData, setFormData] = useState({
    name: '', type: 'NGO', fiscalYear: '', email: '', phone: ''
  });

  useEffect(() => { fetchOrganizations(); }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await organizationsAPI.getAll();
      if (res.data.success) {
        const raw = res.data.data.organizations || [];
        setOrganizations(raw.map((o, i) => ({ ...o, id: o.id ?? o._id ?? i })));
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOrg) {
        await organizationsAPI.update(editingOrg.id, formData);
        setOrganizations(prev => prev.map(o => o.id === editingOrg.id ? { ...o, ...formData } : o));
      } else {
        const res = await organizationsAPI.create(formData);
        if (res.data.success) {
          const org = res.data.data.organization;
          setOrganizations(prev => [{ ...org, id: org._id ?? org.id ?? Date.now() }, ...prev]);
        }
      }
    } catch (err) {
      console.error('Error saving organization:', err);
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (!id && id !== 0) return;
    try {
      await organizationsAPI.delete(id);
      setOrganizations(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      console.error('Error deleting organization:', err);
    }
  };

  const handleEdit = (org) => {
    setEditingOrg(org);
    setFormData({ name: org.name, type: org.type, fiscalYear: org.fiscalYear, email: org.email, phone: org.phone });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'NGO', fiscalYear: '', email: '', phone: '' });
    setEditingOrg(null);
  };

  const typeBadgeColor = (type) => {
    const map = { NGO: 'badge-success', SME: 'badge-info', 'Educational Institution': 'badge-warning', Government: 'badge-error' };
    return map[type] || 'badge-info';
  };

  if (loading) return <div className="loader"><div className="loader-spinner"></div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h2>Organizations</h2>
          <p>Manage all registered organizations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Add Organization
        </button>
      </div>

      <div className="budget-grid">
        {organizations.length > 0 ? organizations.map((org, index) => (
          <div key={org.id ?? index} className="budget-card">
            <div className="budget-card-header">
              <div className="budget-icon">
                <Building2 size={22} />
              </div>
              <span className={`badge ${typeBadgeColor(org.type)}`}>{org.type}</span>
            </div>

            <div>
              <h3 className="budget-name">{org.name}</h3>
              <p className="budget-dept">{org.email}</p>
            </div>

            <div className="budget-amounts">
              <div className="amount-item">
                <span className="amount-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} /> Fiscal Year
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>{org.fiscalYear || '—'}</span>
              </div>
              <div className="amount-item">
                <span className="amount-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Users size={13} /> Members
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>{org.userCount ?? 0}</span>
              </div>
              <div className="amount-item">
                <span className="amount-label">Phone</span>
                <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>{org.phone || '—'}</span>
              </div>
            </div>

            <div className="budget-footer">
              <span className="budget-period">
                Since {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—'}
              </span>
              <div className="budget-actions">
                <button className="action-btn" onClick={() => handleEdit(org)} title="Edit">
                  <Edit size={16} />
                </button>
                <button className="action-btn reject" onClick={() => handleDelete(org.id)} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="empty-state">
            <Building2 size={56} className="empty-state-icon" />
            <h3 className="empty-state-title">No organizations found</h3>
            <p className="empty-state-text">Add your first organization to get started</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingOrg ? 'Edit Organization' : 'Add Organization'}</h3>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Organization Name</label>
                <input className="input-field" type="text" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Type</label>
                  <select className="input-field" value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                    <option value="NGO">NGO</option>
                    <option value="SME">SME</option>
                    <option value="Educational Institution">Educational Institution</option>
                    <option value="Government">Government</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Fiscal Year</label>
                  <input className="input-field" type="text" value={formData.fiscalYear}
                    onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                    placeholder="2025/2026" required />
                </div>
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Email</label>
                  <input className="input-field" type="email" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Phone</label>
                  <input className="input-field" type="tel" value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary"
                  onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingOrg ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationsPage;
