import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { authAPI } from '../services/api';
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Edit,
  Save,
  X,
  Key,
} from 'lucide-react';
import './PageStyles.css';

const ProfilePage = () => {
  const { user, organization, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.put(`/users/${user?._id || user?.id}`, formData);
      if (res.data.success) {
        updateUser({ ...user, ...formData });
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setEditing(false);
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      await authAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const config = {
      admin: { label: 'Administrator', className: 'role-admin' },
      finance_officer: { label: 'Finance Officer', className: 'role-finance' },
      department_head: { label: 'Department Head', className: 'role-dept' },
      viewer: { label: 'Viewer', className: 'role-viewer' },
    };
    return config[role] || { label: role, className: '' };
  };

  const roleBadge = getRoleBadge(user?.role);

  return (
    <div className="page-container">
      <div className="profile-layout">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="profile-info">
              <h2>{user?.firstName} {user?.lastName}</h2>
              <span className={`profile-role ${roleBadge.className}`}>
                <Shield size={16} />
                {roleBadge.label}
              </span>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <Mail size={20} />
              <div>
                <span className="detail-label">Email</span>
                <span className="detail-value">{user?.email}</span>
              </div>
            </div>
            <div className="detail-item">
              <Phone size={20} />
              <div>
                <span className="detail-label">Phone</span>
                <span className="detail-value">{user?.phone || 'Not provided'}</span>
              </div>
            </div>
            <div className="detail-item">
              <Building2 size={20} />
              <div>
                <span className="detail-label">Organization</span>
                <span className="detail-value">{organization?.name || 'Not assigned'}</span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn btn-primary" onClick={() => setEditing(true)}>
              <Edit size={18} />
              Edit Profile
            </button>
            <button className="btn btn-secondary" onClick={() => setShowPasswordModal(true)}>
              <Key size={18} />
              Change Password
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="profile-section">
          <h3>Account Information</h3>
          
          {message.text && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {message.text}
            </div>
          )}

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">User ID</span>
              <span className="info-value">{user?.id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Status</span>
              <span className="info-value">
                <span className="badge badge-success">Active</span>
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Email Verified</span>
              <span className="info-value">
                <span className={`badge ${user?.isEmailVerified ? 'badge-success' : 'badge-warning'}`}>
                  {user?.isEmailVerified ? 'Verified' : 'Pending'}
                </span>
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Member Since</span>
              <span className="info-value">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Login</span>
              <span className="info-value">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Profile</h3>
              <button className="modal-close" onClick={() => setEditing(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile}>
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
                <label className="input-label">Phone Number</label>
                <input
                  type="tel"
                  className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+977-98XXXXXXXX"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Change Password</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="input-group">
                <label className="input-label">Current Password</label>
                <input
                  type="password"
                  className="input-field"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">New Password</label>
                <input
                  type="password"
                  className="input-field"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                  minLength={6}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Confirm New Password</label>
                <input
                  type="password"
                  className="input-field"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
