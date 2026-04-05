import React, { useState, useEffect } from 'react';
import { usersAPI, organizationsAPI } from '../services/api';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  User,
  Mail,
  Phone,
  Shield,
} from 'lucide-react';
import './PageStyles.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'viewer',
    organizationId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, orgsRes] = await Promise.all([
        usersAPI.getAll({ limit: 100 }),
        organizationsAPI.getAll(),
      ]);

      if (usersRes.data.success) {
        const raw = usersRes.data.data.users || [];
        setUsers(raw.map((u, i) => ({ ...u, id: u.id ?? u._id ?? i })));
      }
      if (orgsRes.data.success) {
        const raw = orgsRes.data.data.organizations || [];
        setOrganizations(raw.map((o, i) => ({ ...o, id: o.id ?? o._id ?? i })));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role,
      organizationId: user.organizationId || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const res = await usersAPI.update(editingUser.id, formData);
        if (res.data.success) {
          const updated = res.data.data.user;
          const updatedId = updated?.id ?? updated?._id ?? editingUser.id;
          setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...updated, id: updatedId } : u));
        }
      }
      // Note: In a real app, you'd have a separate endpoint for creating users
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const handleDeactivate = async (id) => {
    if (!id && id !== 0) return;
    
    try {
      await usersAPI.delete(id);
      setUsers(users.map(u => u.id === id ? { ...u, isActive: false } : u));
    } catch (error) {
      console.error('Failed to deactivate user:', error);
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      role: 'viewer',
      organizationId: '',
    });
  };

  const getRoleBadge = (role) => {
    const config = {
      admin: { label: 'Admin', className: 'role-admin' },
      finance_officer: { label: 'Finance', className: 'role-finance' },
      department_head: { label: 'Dept Head', className: 'role-dept' },
      viewer: { label: 'Viewer', className: 'role-viewer' },
    };
    return config[role] || { label: role, className: '' };
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <div className="loader"><div className="loader-spinner"></div></div>;
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h2>User Management</h2>
          <p>Manage system users and their roles</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="finance_officer">Finance Officer</option>
          <option value="department_head">Department Head</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => {
                  const roleBadge = getRoleBadge(user.role);
                  return (
                    <tr key={user.id ?? index}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-small">
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </div>
                          <div>
                            <span className="user-name">{user.firstName} {user.lastName}</span>
                            <span className="user-phone">{user.phone || 'No phone'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${roleBadge.className}`}>
                          <Shield size={14} />
                          {roleBadge.label}
                        </span>
                      </td>
                      <td>{user.organization?.name || 'Not assigned'}</td>
                      <td>
                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                          {user.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button 
                            className="action-btn" 
                            onClick={() => handleEdit(user)}
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          {user.isActive && (
                            <button 
                              className="action-btn reject" 
                              onClick={() => handleDeactivate(user.id)}
                              title="Deactivate"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr key="no-users">
                  <td colSpan="6" className="text-center text-muted" style={{padding: '40px'}}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingUser ? 'Edit User' : 'Add User'}
              </h3>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">First Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Last Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Email</label>
                <input
                  type="email"
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  disabled={!!editingUser}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Phone</label>
                <input
                  type="tel"
                  className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Role</label>
                  <select
                    className="input-field"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="department_head">Department Head</option>
                    <option value="finance_officer">Finance Officer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Organization</label>
                  <select
                    className="input-field"
                    value={formData.organizationId}
                    onChange={(e) => setFormData({...formData, organizationId: e.target.value})}
                  >
                    <option value="">Select Organization</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
