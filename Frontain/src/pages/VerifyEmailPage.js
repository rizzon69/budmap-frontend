import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { registrationAPI } from '../services/api';
import axios from 'axios';
import { Wallet, CheckCircle, XCircle, Loader, Mail } from 'lucide-react';
import './LoginPage.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate   = useNavigate();
  const [status, setStatus]     = useState('loading'); // loading | success | error | resent
  const [message, setMessage]   = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending]     = useState(false);

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token found.'); return; }

    const verify = async () => {
      try {
        // Use plain axios (no auth interceptor) so a missing JWT doesn't redirect away
        const res = await axios.get(`${API}/registration/verify-email/${token}`);
        if (res.data.success) {
          setStatus('success');
          setMessage(res.data.message || 'Email verified! You can now log in.');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(res.data.message || 'Verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Invalid or expired verification link. Please request a new one.');
      }
    };
    verify();
  }, [token, navigate]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResending(true);
    try {
      const res = await registrationAPI.resendVerification(resendEmail);
      setStatus('resent');
      setMessage(res.data.message || 'Verification email sent!');
    } catch (err) {
      setMessage('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="bg-circle circle-1"></div>
        <div className="bg-circle circle-2"></div>
        <div className="bg-circle circle-3"></div>
      </div>

      <div className="login-container" style={{ maxWidth: 500 }}>
        <div className="login-left" style={{ flex: 1, width: '100%' }}>
          <div className="login-header">
            <Link to="/" className="login-logo">
              <div className="logo-icon"><Wallet size={32} /></div>
              <span className="logo-text">BudMap</span>
            </Link>
          </div>

          <div className="login-content" style={{ textAlign: 'center', paddingTop: 32 }}>

            {/* Loading */}
            {status === 'loading' && (
              <>
                <Loader size={56} style={{ color: '#16a34a', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Verifying your email…</h2>
                <p style={{ color: '#64748b', fontSize: 14 }}>Please wait a moment.</p>
              </>
            )}

            {/* Success */}
            {status === 'success' && (
              <>
                <CheckCircle size={64} style={{ color: '#16a34a', margin: '0 auto 20px' }} />
                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#0f172a' }}>Email Verified!</h2>
                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>{message}</p>
                <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>Redirecting to login in 3 seconds…</p>
                <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                  Go to Login Now
                </Link>
              </>
            )}

            {/* Error — show resend form */}
            {status === 'error' && (
              <>
                <XCircle size={64} style={{ color: '#dc2626', margin: '0 auto 20px' }} />
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>Verification Failed</h2>
                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>{message}</p>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, textAlign: 'left' }}>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Request a new verification link:</p>
                  <form onSubmit={handleResend}>
                    <div className="form-group">
                      <div className="input-wrapper">
                        <Mail size={20} className="input-icon" />
                        <input
                          type="email"
                          className="form-input"
                          placeholder="Enter your email address"
                          value={resendEmail}
                          onChange={e => setResendEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary" disabled={resending} style={{ width: '100%', marginTop: 8 }}>
                      {resending ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</> : 'Resend Verification Email'}
                    </button>
                  </form>
                </div>

                <p style={{ marginTop: 20 }}>
                  <Link to="/login" style={{ color: '#16a34a', fontSize: 13 }}>← Back to Login</Link>
                </p>
              </>
            )}

            {/* Resent confirmation */}
            {status === 'resent' && (
              <>
                <Mail size={64} style={{ color: '#16a34a', margin: '0 auto 20px' }} />
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Check Your Inbox</h2>
                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>{message}</p>
                <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                  Back to Login
                </Link>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
