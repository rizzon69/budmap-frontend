import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registrationAPI } from '../services/api';
import api from '../services/api';
import {
  Wallet, Mail, Lock, Eye, EyeOff, User,
  Phone, ArrowRight, Building2, Users, Shield,
  CheckCircle, RefreshCw, PlusCircle, LogIn,
} from 'lucide-react';
import './AuthPages.css';

// ─── Mode toggle ──────────────────────────────────────────────────────────────
const MODES = {
  JOIN: 'join',     // join existing organisation
  CREATE: 'create', // register new organisation + become admin
};

const RegisterPage = () => {
  const [mode, setMode] = useState(MODES.JOIN);

  // ── Shared fields ──────────────────────────────────────────────────────────
  const [firstName, setFirstName]           = useState('');
  const [lastName,  setLastName]            = useState('');
  const [email,     setEmail]               = useState('');
  const [phone,     setPhone]               = useState('');
  const [password,  setPassword]            = useState('');
  const [confirm,   setConfirm]             = useState('');
  const [showPw,    setShowPw]              = useState(false);

  // ── Join-org fields ────────────────────────────────────────────────────────
  const [role,           setRole]           = useState('viewer');
  const [organizationId, setOrganizationId] = useState('');
  const [departmentId,   setDepartmentId]   = useState('');
  const [organizations,  setOrganizations]  = useState([]);
  const [departments,    setDepartments]    = useState([]);
  const [loadingOrgs,    setLoadingOrgs]    = useState(true);
  const [orgsError,      setOrgsError]      = useState('');

  // ── Create-org fields ──────────────────────────────────────────────────────
  const [orgName,    setOrgName]    = useState('');
  const [orgType,    setOrgType]    = useState('ngo');
  const [orgEmail,   setOrgEmail]   = useState('');
  const [orgPhone,   setOrgPhone]   = useState('');
  const [orgAddress, setOrgAddress] = useState('');

  // ── UI state ───────────────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [registered, setRegistered] = useState(null);
  const [resending,  setResending]  = useState(false);
  const [resendMsg,  setResendMsg]  = useState('');

  const { register } = useAuth();

  // ── Load public organisations list ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingOrgs(true);
      setOrgsError('');
      try {
        const res = await api.get('/organizations/public');
        if (res.data.success) {
          setOrganizations(res.data.data.organizations || []);
        }
      } catch (e) {
        setOrgsError('Could not load organisations — backend may be offline.');
        console.error('Failed to load organisations:', e);
      } finally {
        setLoadingOrgs(false);
      }
    };
    load();
  }, []);

  // ── Load departments when org changes (uses public endpoint — no token needed) ──
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [customDept,   setCustomDept]   = useState('');

  useEffect(() => {
    if (!organizationId) { setDepartments([]); setDepartmentId(''); setCustomDept(''); return; }
    setLoadingDepts(true);
    api.get('/departments/public', { params: { organizationId } })
      .then(r => { if (r.data.success) setDepartments(r.data.data.departments || []); })
      .catch(() => setDepartments([]))
      .finally(() => setLoadingDepts(false));
  }, [organizationId]);

  // ── Resend verification ────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!registered?.email) return;
    setResending(true); setResendMsg('');
    try {
      const res = await registrationAPI.resendVerification(registered.email);
      setResendMsg(res.data.message || 'Verification email sent!');
    } catch { setResendMsg('Failed to resend. Please try again.'); }
    finally   { setResending(false); }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    let result;

    if (mode === MODES.CREATE) {
      // Register new organisation + admin account
      if (!orgName || !orgType) { setError('Organisation name and type are required'); setLoading(false); return; }
      try {
        const res = await api.post('/registration/organization', {
          orgName, orgType,
          orgEmail: orgEmail || email,
          orgPhone, orgAddress,
          firstName, lastName, email, password, phone,
        });
        if (res.data.success) {
          result = { success: true, verificationLink: res.data.data?.verificationLink };
        } else {
          result = { success: false, error: res.data.message };
        }
      } catch (err) {
        result = { success: false, error: err.response?.data?.message || 'Registration failed' };
      }
    } else {
      // Join existing organisation
      // resolve department: ignore __custom__ sentinel, pass customDept as name if no real id
      const resolvedDeptId = (departmentId && departmentId !== '__custom__') ? departmentId : undefined;

      result = await register({
        firstName, lastName, email, phone, password, role,
        organizationId:   organizationId || undefined,
        departmentId:     resolvedDeptId,
        departmentName:   (!resolvedDeptId && customDept) ? customDept : undefined,
      });
    }

    if (result?.success) {
      setRegistered({ email, devLink: result.verificationLink });
    } else {
      setError(result?.error || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ maxWidth: 520 }}>
          <div className="auth-left" style={{ flex: 1, width: '100%', textAlign: 'center' }}>
            <div className="auth-brand">
              <Link to="/" className="auth-logo">
                <div className="auth-logo-icon"><Wallet size={28} /></div>
                <span>BudMap</span>
              </Link>
            </div>
            <div className="auth-content" style={{ paddingTop: 40 }}>
              <CheckCircle size={64} style={{ color: '#16a34a', margin: '0 auto 20px', display: 'block' }} />
              <h1 style={{ marginBottom: 8 }}>Check Your Email</h1>
              <p style={{ color: '#64748b', marginBottom: 24 }}>
                We sent a verification link to <strong>{registered.email}</strong>.
                Click the link to activate your account.
              </p>

              {registered.devLink && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16, marginBottom: 20, textAlign: 'left' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 6 }}>
                    Dev mode — click to verify instantly:
                  </p>
                  <a href={registered.devLink} style={{ fontSize: 12, color: '#16a34a', wordBreak: 'break-all' }}>
                    {registered.devLink}
                  </a>
                </div>
              )}

              {resendMsg && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#166534' }}>
                  {resendMsg}
                </div>
              )}

              <button onClick={handleResend} disabled={resending}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                {resending ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Mail size={14} />}
                {resending ? 'Sending…' : 'Resend verification email'}
              </button>

              <p style={{ fontSize: 13, color: '#94a3b8' }}>
                Already verified? <Link to="/login" style={{ color: '#16a34a' }}>Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-brand">
            <Link to="/" className="auth-logo">
              <div className="auth-logo-icon"><Wallet size={28} /></div>
              <span>BudMap</span>
            </Link>
          </div>

          <div className="auth-content">
            <h1>Create Account</h1>
            <p>Start managing your budgets smarter</p>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 8, margin: '16px 0 20px', background: 'var(--color-background-tertiary)', borderRadius: 10, padding: 4 }}>
              <button type="button"
                onClick={() => { setMode(MODES.JOIN); setError(''); }}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: mode === MODES.JOIN ? 'var(--color-background-primary)' : 'transparent',
                  color: mode === MODES.JOIN ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  boxShadow: mode === MODES.JOIN ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}>
                <LogIn size={15} /> Join Organisation
              </button>
              <button type="button"
                onClick={() => { setMode(MODES.CREATE); setError(''); }}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: mode === MODES.CREATE ? 'var(--color-background-primary)' : 'transparent',
                  color: mode === MODES.CREATE ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  boxShadow: mode === MODES.CREATE ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}>
                <PlusCircle size={15} /> New Organisation
              </button>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">

              {/* ── CREATE ORG section ── */}
              {mode === MODES.CREATE && (
                <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: '14px 16px', marginBottom: 16, border: '1px solid var(--color-border-tertiary)' }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>Organisation details</p>

                  <div className="input-group">
                    <label className="input-label">Organisation name *</label>
                    <div className="input-wrapper">
                      <Building2 size={20} className="input-icon" />
                      <input type="text" className="input-field with-icon"
                        placeholder="e.g. Sunrise NGO Nepal"
                        value={orgName} onChange={e => setOrgName(e.target.value)} required={mode === MODES.CREATE} />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Organisation type *</label>
                    <div className="input-wrapper">
                      <Shield size={20} className="input-icon" />
                      <select className="input-field with-icon" value={orgType} onChange={e => setOrgType(e.target.value)}>
                        <option value="ngo">NGO</option>
                        <option value="sme">SME</option>
                        <option value="educational">Educational Institution</option>
                        <option value="government">Government Agency</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="input-group">
                      <label className="input-label">Org email</label>
                      <div className="input-wrapper">
                        <Mail size={20} className="input-icon" />
                        <input type="email" className="input-field with-icon"
                          placeholder="info@org.com"
                          value={orgEmail} onChange={e => setOrgEmail(e.target.value)} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Org phone</label>
                      <div className="input-wrapper">
                        <Phone size={20} className="input-icon" />
                        <input type="tel" className="input-field with-icon"
                          placeholder="+977-1-XXXXXXX"
                          value={orgPhone} onChange={e => setOrgPhone(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Address</label>
                    <div className="input-wrapper">
                      <input type="text" className="input-field"
                        placeholder="Kathmandu, Nepal"
                        value={orgAddress} onChange={e => setOrgAddress(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Shared: personal info ── */}
              <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: '14px 16px', marginBottom: 16, border: '1px solid var(--color-border-tertiary)' }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>Your details</p>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">First name *</label>
                    <div className="input-wrapper">
                      <User size={20} className="input-icon" />
                      <input type="text" className="input-field with-icon"
                        placeholder="First name" value={firstName}
                        onChange={e => setFirstName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Last name *</label>
                    <div className="input-wrapper">
                      <User size={20} className="input-icon" />
                      <input type="text" className="input-field with-icon"
                        placeholder="Last name" value={lastName}
                        onChange={e => setLastName(e.target.value)} required />
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Email *</label>
                  <div className="input-wrapper">
                    <Mail size={20} className="input-icon" />
                    <input type="email" className="input-field with-icon"
                      placeholder="your@email.com" value={email}
                      onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Phone</label>
                  <div className="input-wrapper">
                    <Phone size={20} className="input-icon" />
                    <input type="tel" className="input-field with-icon"
                      placeholder="+977-98XXXXXXXX" value={phone}
                      onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>

                {/* Role + org selectors — only for JOIN mode */}
                {mode === MODES.JOIN && (
                  <>
                    <div className="input-group">
                      <label className="input-label">Role</label>
                      <div className="input-wrapper">
                        <Shield size={20} className="input-icon" />
                        <select className="input-field with-icon" value={role} onChange={e => setRole(e.target.value)}>
                          <option value="viewer">Viewer</option>
                          <option value="department_head">Department Head</option>
                          <option value="finance_officer">Finance Officer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">
                        Organisation
                        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 6 }}>(optional)</span>
                      </label>
                      <div className="input-wrapper">
                        <Building2 size={20} className="input-icon" />
                        <select className="input-field with-icon"
                          value={organizationId} onChange={e => setOrganizationId(e.target.value)}
                          disabled={loadingOrgs}>
                          <option value="">
                            {loadingOrgs ? 'Loading…' : orgsError ? 'Unavailable — backend offline' : '— Select Organisation —'}
                          </option>
                          {organizations.map(org => (
                            <option key={org._id} value={org._id}>
                              {org.name} ({org.type?.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>
                      {orgsError && (
                        <p style={{ fontSize: 12, color: 'var(--color-text-danger)', marginTop: 4 }}>
                          {orgsError} You can still register without selecting one.
                        </p>
                      )}
                    </div>

                    {organizationId && (
                      <div className="input-group">
                        <label className="input-label">
                          Department
                          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 6 }}>(optional)</span>
                        </label>

                        {loadingDepts ? (
                          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', padding: '8px 12px' }}>
                            Loading departments…
                          </div>
                        ) : departments.length > 0 ? (
                          /* ── Has departments: show dropdown ── */
                          <div className="input-wrapper">
                            <Users size={20} className="input-icon" />
                            <select
                              className="input-field with-icon"
                              value={departmentId}
                              onChange={e => {
                                setDepartmentId(e.target.value);
                                setCustomDept('');
                              }}
                            >
                              <option value="">— Select Department —</option>
                              {departments.map(dept => (
                                <option key={dept._id} value={dept._id}>
                                  {dept.name}{dept.code ? ` (${dept.code})` : ''}
                                </option>
                              ))}
                              <option value="__custom__">+ Type a different department…</option>
                            </select>
                          </div>
                        ) : (
                          /* ── No departments in DB: free-text input ── */
                          <div>
                            <div className="input-wrapper">
                              <Users size={20} className="input-icon" />
                              <input
                                type="text"
                                className="input-field with-icon"
                                placeholder="e.g. Finance, Operations, HR"
                                value={customDept}
                                onChange={e => setCustomDept(e.target.value)}
                              />
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                              No departments added yet — type your department name above.
                            </p>
                          </div>
                        )}

                        {/* Free-text input shown when user picks "Type a different department…" */}
                        {departmentId === '__custom__' && (
                          <div className="input-wrapper" style={{ marginTop: 8 }}>
                            <Users size={20} className="input-icon" />
                            <input
                              type="text"
                              className="input-field with-icon"
                              placeholder="Type your department name"
                              value={customDept}
                              onChange={e => setCustomDept(e.target.value)}
                              autoFocus
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="input-group">
                  <label className="input-label">Password *</label>
                  <div className="input-wrapper">
                    <Lock size={20} className="input-icon" />
                    <input type={showPw ? 'text' : 'password'}
                      className="input-field with-icon"
                      placeholder="Min. 6 characters"
                      value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="button" className="password-toggle" onClick={() => setShowPw(!showPw)}>
                      {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Confirm password *</label>
                  <div className="input-wrapper">
                    <Lock size={20} className="input-icon" />
                    <input type={showPw ? 'text' : 'password'}
                      className="input-field with-icon"
                      placeholder="Repeat your password"
                      value={confirm} onChange={e => setConfirm(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div className="auth-options">
                <label className="checkbox-label">
                  <input type="checkbox" required />
                  <span>I agree to the{' '}
                    <a href="#terms" onClick={e => e.preventDefault()} style={{ pointerEvents: 'none', textDecoration: 'underline' }}>Terms of Service</a>
                    {' '}and{' '}
                    <a href="#privacy" onClick={e => e.preventDefault()} style={{ pointerEvents: 'none', textDecoration: 'underline' }}>Privacy Policy</a>
                  </span>
                </label>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? <span className="loader-spinner small"></span> : (
                  <>{mode === MODES.CREATE ? 'Create Organisation & Account' : 'Create Account'} <ArrowRight size={20} /></>
                )}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-features">
            <h3>Why BudMap?</h3>
            <ul>
              <li>✓ Free for small organisations</li>
              <li>✓ Real-time budget tracking</li>
              <li>✓ Role-based access control</li>
              <li>✓ Detailed financial reports</li>
              <li>✓ AI-powered forecasting</li>
              <li>✓ Made for Nepal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
