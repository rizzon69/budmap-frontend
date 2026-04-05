import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { budgetsAPI } from '../services/api';
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, RefreshCw, Wallet, BarChart2, AlertCircle,
  Sparkles, Building2, ShieldAlert, Lightbulb, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import './PageStyles.css';

const fmt = (v) =>
  new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', minimumFractionDigits: 0 }).format(v || 0);

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
  borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '13px',
};

const CONFIDENCE_COLOR = { high: '#16a34a', medium: '#d97706', low: '#dc2626' };

const HEALTH_CONFIG = {
  good:     { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: CheckCircle,   label: 'Healthy'  },
  warning:  { color: '#d97706', bg: '#fffbeb', border: '#fef08a', icon: AlertTriangle, label: 'Warning'  },
  critical: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: ShieldAlert,   label: 'Critical' },
};

// ── Small loading spinner ──────────────────────────────────────────────────────
const Spinner = ({ size = 16 }) => (
  <RefreshCw size={size} style={{ animation: 'spin 1s linear infinite', color: 'var(--green)' }} />
);

// ── AI insight card ────────────────────────────────────────────────────────────
const AICard = ({ title, icon: Icon, children, loading, color = 'var(--green)' }) => (
  <div className="card" style={{ borderTop: `3px solid ${color}` }}>
    <div className="card-header">
      <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={16} style={{ color }} />
        {title}
        {loading && <Spinner />}
        {!loading && <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: color, padding: '2px 7px', borderRadius: 20, marginLeft: 4 }}>AI</span>}
      </h3>
    </div>
    {children}
  </div>
);

export default function AnalyticsPage() {
  const [budgets,      setBudgets]      = useState([]);
  const [selBudget,    setSelBudget]    = useState('');
  const [months,       setMonths]       = useState(3);
  const [forecast,     setForecast]     = useState(null);   // statistical forecast
  const [patterns,     setPatterns]     = useState(null);
  const [dashboard,    setDashboard]    = useState(null);

  // Real AI state
  const [aiAnalysis,   setAiAnalysis]   = useState(null);   // per-budget AI
  const [aiOrgInsights,setAiOrgInsights]= useState(null);   // org-wide AI
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiOrgLoading, setAiOrgLoading] = useState(false);
  const [aiError,      setAiError]      = useState(null);
  const [aiOrgError,   setAiOrgError]   = useState(null);

  const [loading,   setLoading]   = useState(false);
  const [initLoad,  setInitLoad]  = useState(true);
  const [error,     setError]     = useState(null);

  // Load dashboard + spending patterns + budgets on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [bRes, dRes, pRes] = await Promise.all([
          budgetsAPI.getAll({ status: 'active' }),
          api.get('/analytics/dashboard'),
          api.get('/analytics/spending-patterns'),
        ]);
        if (bRes.data.success) setBudgets(bRes.data.data.budgets || []);
        if (dRes.data.success) setDashboard(dRes.data.data);
        if (pRes.data.success) setPatterns(pRes.data.data);
      } catch (e) { console.error(e); }
      finally { setInitLoad(false); }
    };
    init();
  }, []);

  // ── Run statistical forecast (existing logic) ────────────────────────────
  const runForecast = async () => {
    if (!selBudget) { setError('Please select a budget first.'); return; }
    setError(null);
    setLoading(true);
    setAiAnalysis(null); // reset AI when budget changes
    try {
      const res = await api.get('/analytics/forecast', { params: { budgetId: selBudget, months } });
      if (res.data.success) {
        setForecast(res.data.data);
        if (!res.data.data) setError('Not enough transaction history to forecast. Need at least 3 completed expense transactions.');
      } else {
        setError(res.data.message || 'Forecast failed.');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to run forecast.');
    } finally { setLoading(false); }
  };

  // ── Run REAL Claude AI budget analysis ───────────────────────────────────
  const runAIAnalysis = async () => {
    if (!selBudget) return;
    setAiError(null);
    setAiLoading(true);
    try {
      const res = await api.post('/analytics/ai-budget-analysis', {
        budgetId: selBudget,
        forecastMonths: months,
      });
      if (res.data.success) {
        setAiAnalysis(res.data.data);
      } else {
        setAiError(res.data.message || 'AI analysis failed.');
      }
    } catch (e) {
      setAiError(e.response?.data?.message || 'AI analysis failed. Make sure ANTHROPIC_API_KEY is set in .env');
    } finally { setAiLoading(false); }
  };

  // ── Run REAL Claude AI org-wide insights ────────────────────────────────
  const runAIOrgInsights = async () => {
    if (!dashboard) return;
    setAiOrgError(null);
    setAiOrgLoading(true);
    try {
      const res = await api.post('/analytics/ai-organization-insights', {
        summary: {
          ...dashboard.summary,
          overBudget: dashboard.alerts?.overBudget || 0,
          nearLimit:  dashboard.alerts?.nearLimit  || 0,
        },
        departments:  dashboard.departments  || [],
        monthlyTrend: dashboard.trends?.monthly || [],
      });
      if (res.data.success) {
        setAiOrgInsights(res.data.data);
      } else {
        setAiOrgError(res.data.message || 'AI insights failed.');
      }
    } catch (e) {
      setAiOrgError(e.response?.data?.message || 'AI insights failed. Make sure ANTHROPIC_API_KEY is set in .env');
    } finally { setAiOrgLoading(false); }
  };

  if (initLoad) return <div className="loader"><div className="loader-spinner"></div></div>;

  const alertCount = (dashboard?.alerts?.overBudget || 0) + (dashboard?.alerts?.nearLimit || 0);

  return (
    <div className="page-container">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-content">
          <h2>AI Predictive Analytics</h2>
          <p>Real Claude AI financial insights, forecasting, and spending analysis</p>
        </div>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      {dashboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {[
            { label: 'Total Budget',  value: fmt(dashboard.summary?.totalBudget),    color: 'var(--green)' },
            { label: 'Total Spent',   value: fmt(dashboard.summary?.totalSpent),     color: '#2563eb'      },
            { label: 'Net Income',    value: fmt(dashboard.summary?.netIncome),      color: '#7c3aed'      },
            { label: 'Utilization',   value: (dashboard.summary?.budgetUtilization || 0).toFixed(1) + '%', color: '#d97706' },
            { label: 'Alerts',        value: String(alertCount),                     color: alertCount > 0 ? '#dc2626' : 'var(--green)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px 18px', borderTop: '3px solid ' + s.color }}>
              <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-900)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Real AI — Organization Insights ──────────────────────────────── */}
      {dashboard && (
        <AICard title="Organization AI Insights" icon={Sparkles} loading={aiOrgLoading} color="#7c3aed">
          {!aiOrgInsights && !aiOrgLoading && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 14 }}>
                Click below to generate real AI insights powered by Claude — analyzing your organization's financial health, department performance, and spending trends.
              </p>
              {aiOrgError && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, color:'#dc2626', fontSize:13, marginBottom:12, textAlign:'left' }}>
                  <AlertCircle size={15} style={{ flexShrink:0 }}/> {aiOrgError}
                </div>
              )}
              <button className="btn btn-primary" onClick={runAIOrgInsights} style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
                <Sparkles size={15} /> Generate AI Organization Insights
              </button>
            </div>
          )}

          {aiOrgLoading && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-500)', fontSize: 13 }}>
              <Spinner size={24} /><br /><br />Claude is analyzing your organization's financial data...
            </div>
          )}

          {aiOrgInsights && !aiOrgLoading && (() => {
            const hc = HEALTH_CONFIG[aiOrgInsights.organizationHealth] || HEALTH_CONFIG.good;
            const HIcon = hc.icon;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Health badge */}
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', background: hc.bg, border:`1px solid ${hc.border}`, borderRadius:10 }}>
                  <HIcon size={22} style={{ color: hc.color, flexShrink:0 }}/>
                  <div>
                    <span style={{ fontWeight:700, color: hc.color, fontSize:14 }}>Organization Health: {hc.label}</span>
                    <p style={{ fontSize:13, color:'var(--gray-700)', marginTop:4, lineHeight:1.5 }}>{aiOrgInsights.executiveSummary}</p>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  {/* Key Insights */}
                  <div style={{ background:'var(--gray-50)', borderRadius:10, padding:'14px 16px' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                      <Lightbulb size={13}/> Key Insights
                    </div>
                    {(aiOrgInsights.topInsights || []).map((ins, i) => (
                      <div key={i} style={{ fontSize:13, color:'var(--gray-700)', marginBottom:7, display:'flex', gap:8, alignItems:'flex-start' }}>
                        <span style={{ color:'#7c3aed', fontWeight:700, flexShrink:0 }}>•</span>{ins}
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  <div style={{ background:'var(--green-light)', borderRadius:10, padding:'14px 16px', border:'1px solid var(--green-border)' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--green-text)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                      <CheckCircle size={13}/> Recommendations
                    </div>
                    {(aiOrgInsights.recommendations || []).map((rec, i) => (
                      <div key={i} style={{ fontSize:13, color:'var(--green-text)', marginBottom:7, display:'flex', gap:8, alignItems:'flex-start' }}>
                        <span style={{ fontWeight:700, flexShrink:0 }}>{i+1}.</span>{rec}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alerts */}
                {(aiOrgInsights.alerts || []).length > 0 && (
                  <div style={{ background:'#fffbeb', border:'1px solid #fef08a', borderRadius:10, padding:'12px 16px' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#92400e', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                      <AlertTriangle size={13}/> Alerts
                    </div>
                    {aiOrgInsights.alerts.map((a, i) => (
                      <div key={i} style={{ fontSize:13, color:'#92400e', marginBottom:5 }}>⚠ {a}</div>
                    ))}
                  </div>
                )}

                {/* Dept performance */}
                {(aiOrgInsights.bestPerformingDept || aiOrgInsights.worstPerformingDept) && (
                  <div style={{ display:'flex', gap:12 }}>
                    {aiOrgInsights.bestPerformingDept && (
                      <div style={{ flex:1, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'12px 14px' }}>
                        <div style={{ fontSize:11, color:'#166534', fontWeight:700, marginBottom:4 }}>🏆 Best Performing</div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#166534' }}>{aiOrgInsights.bestPerformingDept}</div>
                      </div>
                    )}
                    {aiOrgInsights.worstPerformingDept && (
                      <div style={{ flex:1, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 14px' }}>
                        <div style={{ fontSize:11, color:'#991b1b', fontWeight:700, marginBottom:4 }}>⚠ Needs Attention</div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#991b1b' }}>{aiOrgInsights.worstPerformingDept}</div>
                      </div>
                    )}
                  </div>
                )}

                <button className="btn btn-secondary" onClick={runAIOrgInsights} style={{ alignSelf:'flex-end' }}>
                  <RefreshCw size={13}/> Refresh AI Insights
                </button>
              </div>
            );
          })()}
        </AICard>
      )}

      {/* ── Monthly trend chart ─────────────────────────────────────────── */}
      {dashboard?.trends?.monthly?.length > 0 && (
        <div className="chart-card">
          <h3>Monthly Income vs Expense Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dashboard.trends.monthly}>
              <defs>
                <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11}/>
              <YAxis stroke="#94a3b8" fontSize={11}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => fmt(v)}/>
              <Legend/>
              <Area type="monotone" dataKey="income"  stroke="#16a34a" fill="url(#gInc)" name="Income"/>
              <Area type="monotone" dataKey="expense" stroke="#dc2626" fill="url(#gExp)" name="Expense"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Department utilization ──────────────────────────────────────── */}
      {dashboard?.departments?.filter(d => d.totalBudget > 0).length > 0 && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Department Budget Utilization</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
            {dashboard.departments.filter(d => d.totalBudget > 0).map(d => {
              const pct = Math.min(d.utilization || 0, 100);
              const col = pct > 90 ? '#dc2626' : pct > 70 ? '#d97706' : '#16a34a';
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)', minWidth: 160 }}>{d.name}</span>
                  <div style={{ flex: 1, height: 10, background: 'var(--gray-100)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: col, borderRadius: 6, transition: 'width 0.8s ease' }}/>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: col, minWidth: 46, textAlign: 'right' }}>{pct.toFixed(1)}%</span>
                  <span style={{ fontSize: 11, color: 'var(--gray-400)', minWidth: 120, textAlign: 'right' }}>{fmt(d.totalSpent)} / {fmt(d.totalBudget)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Spending patterns ───────────────────────────────────────────── */}
      {patterns && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Spending by Day of Week</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={patterns.dayOfWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickFormatter={v => v.slice(0,3)}/>
                <YAxis stroke="#94a3b8" fontSize={10}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => fmt(v)}/>
                <Bar dataKey="amount" fill="#16a34a" name="Amount" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="card-title">Spending Time Distribution</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
              {['beginning','middle','end'].map(k => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'var(--gray-50)', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--gray-700)', textTransform: 'capitalize' }}>
                    {k === 'beginning' ? '🌅' : k === 'middle' ? '📅' : '🌆'} {k} of month
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-900)' }}>{fmt(patterns.timeOfMonth[k]?.amount)}</span>
                </div>
              ))}
              <div style={{ padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 8, marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Transaction Size Distribution</div>
                {Object.entries(patterns.amountDistribution || {}).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--gray-600)' }}>NPR {v.range}</span>
                    <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{v.count} txns — {fmt(v.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           REAL AI BUDGET ANALYSIS SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ borderTop: '3px solid var(--green)' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={16} style={{ color: 'var(--green)' }}/>
            AI Budget Analysis
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'var(--green)', padding: '2px 7px', borderRadius: 20 }}>Powered by Claude</span>
          </h3>
        </div>

        {/* Budget selector + controls */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', display: 'block', marginBottom: 6 }}>Select Budget</label>
            <select className="filter-select" style={{ width: '100%' }} value={selBudget}
              onChange={e => { setSelBudget(e.target.value); setForecast(null); setAiAnalysis(null); }}>
              <option value="">-- Choose a budget --</option>
              {budgets.map(b => (
                <option key={b._id || b.id} value={b._id || b.id}>{b.name} ({fmt(b.totalAmount)})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', display: 'block', marginBottom: 6 }}>Forecast Months</label>
            <select className="filter-select" value={months} onChange={e => setMonths(Number(e.target.value))}>
              {[1,2,3,6].map(n => <option key={n} value={n}>{n} month{n>1?'s':''}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={runForecast} disabled={loading || !selBudget} title="Statistical forecast">
              {loading ? <Spinner/> : <BarChart2 size={15}/>}
              {loading ? 'Forecasting…' : 'Statistical Forecast'}
            </button>
            <button className="btn btn-primary" onClick={runAIAnalysis} disabled={aiLoading || !selBudget} title="Real Claude AI analysis">
              {aiLoading ? <Spinner/> : <Brain size={15}/>}
              {aiLoading ? 'AI Thinking…' : 'Run AI Analysis'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'var(--radius)', color:'#dc2626', fontSize:13, marginBottom:16 }}>
            <AlertCircle size={15}/> {error}
          </div>
        )}
        {aiError && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'var(--radius)', color:'#dc2626', fontSize:13, marginBottom:16 }}>
            <AlertCircle size={15}/> {aiError}
          </div>
        )}

        {/* ── Real AI Analysis Result ─────────────────────────────────── */}
        {aiAnalysis && !aiLoading && (() => {
          const hc = HEALTH_CONFIG[aiAnalysis.overallHealth] || HEALTH_CONFIG.good;
          const HIcon = hc.icon;
          return (
            <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom: forecast ? 32 : 0 }}>
              <div style={{ padding:'14px 18px', background: hc.bg, border:`1px solid ${hc.border}`, borderRadius:10, display:'flex', alignItems:'flex-start', gap:14 }}>
                <HIcon size={22} style={{ color: hc.color, flexShrink:0, marginTop:2 }}/>
                <div>
                  <div style={{ fontWeight:700, color: hc.color, fontSize:14, marginBottom:4 }}>
                    Budget Health: {hc.label}
                  </div>
                  <div style={{ fontSize:13, color:'var(--gray-700)', lineHeight:1.6 }}>{aiAnalysis.summary}</div>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                {/* Insights */}
                <div style={{ background:'var(--gray-50)', borderRadius:10, padding:'14px 16px' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                    <Lightbulb size={12}/> Key Insights
                  </div>
                  {(aiAnalysis.keyInsights||[]).map((ins,i) => (
                    <div key={i} style={{ fontSize:12, color:'var(--gray-700)', marginBottom:8, display:'flex', gap:6, lineHeight:1.4 }}>
                      <span style={{ color:'var(--green)', fontWeight:700, flexShrink:0 }}>•</span>{ins}
                    </div>
                  ))}
                  <div style={{ fontSize:12, color:'var(--gray-600)', marginTop:8, fontStyle:'italic' }}>
                    Pattern: {aiAnalysis.spendingPattern}
                  </div>
                </div>

                {/* Recommendations */}
                <div style={{ background:'var(--green-light)', border:'1px solid var(--green-border)', borderRadius:10, padding:'14px 16px' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--green-text)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                    <CheckCircle size={12}/> Recommendations
                  </div>
                  {(aiAnalysis.recommendations||[]).map((rec,i) => (
                    <div key={i} style={{ fontSize:12, color:'var(--green-text)', marginBottom:8, display:'flex', gap:6, lineHeight:1.4 }}>
                      <span style={{ fontWeight:700, flexShrink:0 }}>{i+1}.</span>{rec}
                    </div>
                  ))}
                </div>

                {/* Risk factors + AI forecast */}
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {(aiAnalysis.riskFactors||[]).length > 0 && (
                    <div style={{ background:'#fffbeb', border:'1px solid #fef08a', borderRadius:10, padding:'14px 16px', flex:1 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#92400e', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                        <AlertTriangle size={12}/> Risk Factors
                      </div>
                      {aiAnalysis.riskFactors.map((r,i) => (
                        <div key={i} style={{ fontSize:12, color:'#92400e', marginBottom:6, display:'flex', gap:6, lineHeight:1.4 }}>
                          <span style={{ flexShrink:0 }}>⚠</span>{r}
                        </div>
                      ))}
                    </div>
                  )}
                  {aiAnalysis.forecast && (
                    <div style={{ background: aiAnalysis.forecast.willExceedBudget ? '#fef2f2' : '#f0fdf4', border:`1px solid ${aiAnalysis.forecast.willExceedBudget ? '#fecaca' : '#bbf7d0'}`, borderRadius:10, padding:'14px 16px' }}>
                      <div style={{ fontSize:11, fontWeight:700, color: aiAnalysis.forecast.willExceedBudget ? '#991b1b' : '#166534', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:8 }}>
                        🤖 AI Forecast
                      </div>
                      <div style={{ fontSize:12, color:'var(--gray-700)', marginBottom:5 }}>
                        Next month estimate: <strong>{fmt(aiAnalysis.forecast.nextMonthEstimate)}</strong>
                      </div>
                      <div style={{ fontSize:12, color:'var(--gray-700)', marginBottom:5 }}>
                        Will exceed budget: <strong style={{ color: aiAnalysis.forecast.willExceedBudget ? '#dc2626' : '#16a34a' }}>{aiAnalysis.forecast.willExceedBudget ? 'Yes ⚠' : 'No ✓'}</strong>
                      </div>
                      {aiAnalysis.forecast.projectedExhaustionMonths && (
                        <div style={{ fontSize:12, color:'var(--gray-700)', marginBottom:5 }}>
                          Exhaustion in: <strong>{aiAnalysis.forecast.projectedExhaustionMonths} months</strong>
                        </div>
                      )}
                      <div style={{ fontSize:11, color:'var(--gray-400)', marginTop:6 }}>
                        Confidence: <span style={{ fontWeight:700, color: CONFIDENCE_COLOR[aiAnalysis.forecast.confidence] }}>{aiAnalysis.forecast.confidence?.toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Statistical forecast (existing) ────────────────────────── */}
        {forecast && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, borderTop: aiAnalysis ? '1px solid var(--gray-200)' : 'none', paddingTop: aiAnalysis ? 24 : 0 }}>
            <h4 style={{ fontSize:14, fontWeight:700, color:'var(--gray-700)' }}>📊 Statistical Forecast Details</h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {[
                { label:'Budget Name',      value: forecast.budget?.name,                                           color:'var(--green)' },
                { label:'Total Amount',     value: fmt(forecast.budget?.totalAmount),                               color:'#2563eb'      },
                { label:'Already Spent',    value: fmt(forecast.budget?.spentAmount),                               color:'#d97706'      },
                { label:'Current Usage',    value: (forecast.budget?.currentUtilization||0).toFixed(1)+'%',         color:'#7c3aed'      },
                { label:'Avg Monthly Exp',  value: fmt(forecast.historicalData?.avgMonthlySpending),                color:'#dc2626'      },
                { label:'Data Points',      value: (forecast.historicalData?.transactionCount||0)+' transactions',  color:'#64748b'      },
              ].map(s => (
                <div key={s.label} style={{ padding:'12px 14px', background:'var(--gray-50)', borderRadius:10, borderLeft:'3px solid '+s.color }}>
                  <div style={{ fontSize:10, color:'var(--gray-500)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:14, fontWeight:800, color:'var(--gray-900)' }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ padding:'14px 18px', background: forecast.predictions?.recommendedAction?.includes('track') ? '#f0fdf4' : '#fffbeb', borderRadius:10, border:'1px solid '+(forecast.predictions?.recommendedAction?.includes('track')?'#bbf7d0':'#fef08a'), display:'flex', alignItems:'center', gap:12 }}>
              {forecast.predictions?.recommendedAction?.includes('track')
                ? <CheckCircle size={20} style={{ color:'#16a34a', flexShrink:0 }}/>
                : <AlertTriangle size={20} style={{ color:'#d97706', flexShrink:0 }}/>}
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--gray-900)', marginBottom:2 }}>Statistical Recommendation</div>
                <div style={{ fontSize:13, color:'var(--gray-700)' }}>{forecast.predictions?.recommendedAction}</div>
                {forecast.predictions?.exhaustionDate && (
                  <div style={{ fontSize:12, color:'var(--gray-500)', marginTop:4 }}>
                    Projected exhaustion: <strong>{forecast.predictions.exhaustionDate}</strong>
                    {forecast.predictions.monthsRemaining && ` (${forecast.predictions.monthsRemaining} months)`}
                  </div>
                )}
              </div>
            </div>

            {forecast.forecast?.length > 0 && (
              <div className="chart-card" style={{ margin:0 }}>
                <h3>Predicted Monthly Spending</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={forecast.forecast}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11}/>
                    <YAxis stroke="#94a3b8" fontSize={11}/>
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => fmt(v)}/>
                    <Legend/>
                    <Bar dataKey="predictedSpending" fill="#16a34a" name="Predicted Spending" radius={[4,4,0,0]}/>
                    <Bar dataKey="cumulativeSpent"   fill="#2563eb" name="Cumulative Spent"   radius={[4,4,0,0]} fillOpacity={0.6}/>
                    <ReferenceLine y={forecast.budget?.totalAmount} stroke="#dc2626" strokeDasharray="6 3"
                      label={{ value:'Budget Limit', position:'insideTopRight', fontSize:11, fill:'#dc2626' }}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {forecast.forecast?.length > 0 && (
              <div className="card" style={{ margin:0, padding:0 }}>
                <div className="card-header" style={{ padding:'14px 20px' }}><h3 className="card-title">Monthly Forecast Details</h3></div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>Month</th><th>Predicted</th><th>Cumulative</th><th>Utilization</th><th>Risk</th><th>Confidence</th></tr>
                    </thead>
                    <tbody>
                      {forecast.forecast.map((f, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight:600 }}>{f.month}</td>
                          <td>{fmt(f.predictedSpending)}</td>
                          <td>{fmt(f.cumulativeSpent)}</td>
                          <td>
                            <div className="utilization-cell">
                              <div className="mini-progress">
                                <div className={'mini-progress-fill '+(f.projectedUtilization>100?'danger':f.projectedUtilization>80?'warning':'')}
                                  style={{ width:Math.min(f.projectedUtilization,100)+'%' }}/>
                              </div>
                              <span style={{ fontSize:12, fontWeight:600 }}>{f.projectedUtilization}%</span>
                            </div>
                          </td>
                          <td><span className={'badge '+(f.willExceed?'badge-error':'badge-success')}>{f.willExceed?'⚠ Over Budget':'✓ OK'}</span></td>
                          <td><span style={{ fontSize:11, fontWeight:700, color:CONFIDENCE_COLOR[f.confidence]||'#64748b', textTransform:'uppercase' }}>{f.confidence}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {!forecast && !aiAnalysis && !loading && !aiLoading && (
          <div className="empty-state" style={{ padding:'40px 0' }}>
            <Brain size={48} className="empty-state-icon"/>
            <h3 className="empty-state-title">Ready to analyse</h3>
            <p className="empty-state-text">Select a budget then click <strong>Run AI Analysis</strong> for real Claude AI insights, or <strong>Statistical Forecast</strong> for trend projections.</p>
          </div>
        )}
      </div>
    </div>
  );
}
