import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Wallet, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import './LoginPage.css'; // reuse login styles

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword(token, newPassword);
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="bg-circle circle-1"></div>
        <div className="bg-circle circle-2"></div>
        <div className="bg-circle circle-3"></div>
      </div>

      <div className="login-container" style={{ justifyContent: 'center' }}>
        <div className="login-left" style={{ maxWidth: 480 }}>
          <div className="login-header">
            <Link to="/" className="login-logo">
              <div className="logo-icon"><Wallet size={32} /></div>
              <span className="logo-text">BudMap</span>
            </Link>
          </div>

          <div className="login-content">
            {success ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle size={56} color="#10b981" style={{ marginBottom: 16 }} />
                <h2 style={{ color: '#111827', marginBottom: 8 }}>Password Reset!</h2>
                <p style={{ color: '#6b7280' }}>Your password has been updated. Redirecting to login...</p>
              </div>
            ) : (
              <>
                <div className="form-header">
                  <h1>Set New Password</h1>
                  <p>Enter your new password below</p>
                </div>

                {error && (
                  <div className="alert alert-error">
                    <span className="alert-icon">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div className="input-wrapper">
                      <Lock size={20} className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={!token}
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <div className="input-wrapper">
                      <Lock size={20} className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={!token}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading || !token}>
                    {loading ? (
                      <div className="spinner"></div>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>

                  <Link to="/login" style={{ display: 'block', textAlign: 'center', marginTop: 12, color: '#6b7280', fontSize: 14 }}>
                    Back to Sign In
                  </Link>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
