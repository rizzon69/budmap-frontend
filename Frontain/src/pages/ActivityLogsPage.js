import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Activity, Search, Filter, RefreshCw,
  AlertCircle, CheckCircle, Edit, Trash2,
  UserPlus, LogIn, FileText, Shield,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import './PageStyles.css';

// Map action → icon + colour
const ACTION_META = {
  CREATE:   { icon: <FileText  size={14} />, color: '#16a34a', bg: '#f0fdf4', label: 'Created'   },
  UPDATE:   { icon: <Edit      size={14} />, color: '#2563eb', bg: '#eff6ff', label: 'Updated'   },
  DELETE:   { icon: <Trash2    size={14} />, color: '#dc2626', bg: '#fef2f2', label: 'Deleted'   },
  APPROVE:  { icon: <CheckCircle size={14}/>, color: '#16a34a', bg: '#f0fdf4', label: 'Approved'  },
  REJECT:   { icon: <AlertCircle size={14}/>, color: '#dc2626', bg: '#fef2f2', label: 'Rejected'  },
  LOGIN:    { icon: <LogIn     size={14} />, color: '#7c3aed', bg: '#f5f3ff', label: 'Login'     },
  REGISTER: { icon: <UserPlus  size={14} />, color: '#d97706', bg: '#fffbeb', label: 'Registered'},
  DEFAULT:  { icon: <Activity  size={14} />, color: '#64748b', bg: '#f8fafc', label: 'Action'    },
};

const getMeta = (action) => ACTION_META[action?.toUpperCase()] || ACTION_META.DEFAULT;

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'Just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const ActivityLogsPage = () => {
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [actionFilter, setAction] = useState('');
  const [entityFilter, setEntity] = useState('');
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const LIMIT = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: LIMIT };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity = entityFilter;

      const res = await api.get('/admin/activity-logs', { params });
      if (res.data.success) {
        setLogs(res.data.data.logs || []);
        setPagination(res.data.data.pagination || { total: 0, pages: 1 });
      } else {
        setError(res.data.message || 'Failed to load logs');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Client-side search filter
  const filtered = logs.filter(log => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = log.user ? `${log.user.name || ''} ${log.user.email || ''}`.toLowerCase() : '';
    return (
      name.includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.entity?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q)
    );
  });

  const uniqueActions  = [...new Set(logs.map(l => l.action).filter(Boolean))];
  const uniqueEntities = [...new Set(logs.map(l => l.entity).filter(Boolean))];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h2>Activity Logs</h2>
          <p>Full audit trail of all system actions</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchLogs} disabled={loading}>
          <RefreshCw size={14} style={loading ? { animation:'spin 1s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12 }}>
        {[
          { label:'Total Logs',    value: pagination.total,                           color:'var(--green)' },
          { label:'This Page',     value: filtered.length,                            color:'var(--info)' },
          { label:'Unique Actions',value: uniqueActions.length,                       color:'var(--warning)' },
          { label:'Entities',      value: uniqueEntities.length,                      color:'var(--purple)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'14px 18px', borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:11, color:'var(--gray-500)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--gray-900)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={15} />
          <input
            placeholder="Search by user, action, entity…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={actionFilter} onChange={e => { setAction(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="filter-select" value={entityFilter} onChange={e => { setEntity(e.target.value); setPage(1); }}>
          <option value="">All Entities</option>
          {uniqueEntities.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'var(--radius)', color:'#dc2626', fontSize:13 }}>
          <AlertCircle size={15} /> {error}
          <button onClick={fetchLogs} style={{ marginLeft:'auto', background:'none', border:'none', color:'#dc2626', cursor:'pointer', fontWeight:600 }}>Retry</button>
        </div>
      )}

      {/* Log list */}
      {loading ? (
        <div className="loader"><div className="loader-spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Activity size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No activity logs found</h3>
          <p className="empty-state-text">
            {search || actionFilter || entityFilter ? 'Try adjusting your filters.' : 'No activity has been recorded yet.'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding:0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>User</th>
                  <th>Details</th>
                  <th>IP Address</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const meta = getMeta(log.action);
                  return (
                    <tr key={log._id || i}>
                      <td>
                        <span style={{
                          display:'inline-flex', alignItems:'center', gap:5,
                          padding:'3px 10px', borderRadius:6,
                          background: meta.bg, color: meta.color,
                          fontSize:11, fontWeight:700,
                        }}>
                          {meta.icon}
                          {log.action?.toUpperCase() || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display:'inline-flex', alignItems:'center', gap:4,
                          padding:'2px 8px', borderRadius:5,
                          background:'var(--gray-100)', color:'var(--gray-600)',
                          fontSize:11, fontWeight:600, textTransform:'capitalize',
                        }}>
                          {log.entity || '—'}
                        </span>
                      </td>
                      <td>
                        {log.user ? (
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:'var(--gray-900)' }}>{log.user.name || 'Unknown'}</div>
                            <div style={{ fontSize:11, color:'var(--gray-400)' }}>{log.user.email}</div>
                          </div>
                        ) : (
                          <span style={{ color:'var(--gray-400)', fontSize:12 }}>System</span>
                        )}
                      </td>
                      <td style={{ maxWidth:240 }}>
                        <span style={{ fontSize:12, color:'var(--gray-600)', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {log.details || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize:11, color:'var(--gray-400)', fontFamily:'monospace' }}>
                          {log.ipAddress || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize:12, color:'var(--gray-500)', whiteSpace:'nowrap' }}>
                          {timeAgo(log.createdAt)}
                        </span>
                        <div style={{ fontSize:10, color:'var(--gray-400)' }}>
                          {new Date(log.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderTop:'1px solid var(--gray-100)' }}>
              <span style={{ fontSize:12, color:'var(--gray-500)' }}>
                Page {page} of {pagination.pages} &nbsp;·&nbsp; {pagination.total} total logs
              </span>
              <div style={{ display:'flex', gap:6 }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding:'6px 12px', fontSize:12 }}
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding:'6px 12px', fontSize:12 }}
                  disabled={page >= pagination.pages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityLogsPage;
