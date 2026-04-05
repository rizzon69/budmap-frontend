import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  BarChart2, GitCompare, Building2, Wallet,
  TrendingUp, TrendingDown, RefreshCw, AlertCircle, Plus, X,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import './PageStyles.css';

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: '13px',
};

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#db2777'];

const ComparisonPage = () => {
  const { user } = useAuth();
  const [departments, setDepartments]     = useState([]);
  const [budgets, setBudgets]             = useState([]);
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [compareType, setCompareType]     = useState('department');
  const [loading, setLoading]             = useState(false);
  const [loadingInit, setLoadingInit]     = useState(true);
  const [error, setError]                 = useState(null);

  // Load departments and budgets on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [dRes, bRes] = await Promise.all([
          api.get('/departments'),
          api.get('/budgets'),
        ]);
        if (dRes.data.success) setDepartments(dRes.data.data.departments || []);
        if (bRes.data.success) setBudgets(bRes.data.data.budgets || []);
      } catch (err) {
        setError('Failed to load data. Make sure the backend is running.');
      } finally {
        setLoadingInit(false);
      }
    };
    init();
  }, []);

  const toggleSelection = (id) => {
    setSelectedDepts(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const runComparison = async () => {
    if (selectedDepts.length < 2) {
      setError('Please select at least 2 items to compare.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.get('/analytics/comparison', {
        params: { type: compareType, ids: selectedDepts.join(',') },
      });
      if (res.data.success) setComparisonData(res.data.data.comparison);
      else setError(res.data.message || 'Comparison failed');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run comparison.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('en-NP', {
      style: 'currency', currency: 'NPR', minimumFractionDigits: 0,
    }).format(v || 0);

  const formatPct = (spent, total) =>
    total > 0 ? ((spent / total) * 100).toFixed(1) + '%' : '0%';

  // Build chart data from comparison results
  const barData = comparisonData?.map(d => ({
    name: d.name,
    'Total Budget': d.totalBudget,
    'Total Spent':  d.totalSpent,
    'Income':       d.income,
    'Expense':      d.expense,
  })) || [];

  const radarData = comparisonData?.length
    ? ['totalBudget','totalSpent','income','expense','transactionCount'].map(key => {
        const row = { metric: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()) };
        comparisonData.forEach(d => { row[d.name] = d[key] || 0; });
        return row;
      })
    : [];

  const items = compareType === 'department' ? departments : budgets;

  if (loadingInit) return <div className="loader"><div className="loader-spinner"></div></div>;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h2>Spending Comparison</h2>
          <p>Compare budgets and spending across departments or fiscal periods</p>
        </div>
      </div>

      {/* Config panel */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <GitCompare size={16} style={{ display:'inline', marginRight:6, color:'var(--green)' }} />
            Configure Comparison
          </h3>
          {selectedDepts.length > 0 && (
            <button className="btn btn-secondary" onClick={() => { setSelectedDepts([]); setComparisonData(null); }}>
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Type toggle */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {['department'].map(t => (
            <button
              key={t}
              className={`tab-btn ${compareType === t ? 'active' : ''}`}
              onClick={() => { setCompareType(t); setSelectedDepts([]); setComparisonData(null); }}
            >
              <Building2 size={14} />
              By Department
            </button>
          ))}
        </div>

        {/* Item grid */}
        <p style={{ fontSize:12, color:'var(--gray-500)', marginBottom:10 }}>
          Select 2–6 {compareType === 'department' ? 'departments' : 'budgets'} to compare:
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10, marginBottom:16 }}>
          {items.map((item, i) => {
            const id   = (item.id || item._id).toString();
            const sel  = selectedDepts.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleSelection(id)}
                style={{
                  padding:'12px 14px',
                  borderRadius:'var(--radius)',
                  border: sel ? '2px solid var(--green)' : '1px solid var(--gray-200)',
                  background: sel ? 'var(--green-light)' : 'var(--white)',
                  cursor:'pointer',
                  textAlign:'left',
                  transition:'all 0.15s',
                  display:'flex', alignItems:'center', gap:10,
                }}
              >
                <div style={{
                  width:28, height:28, borderRadius:7,
                  background: sel ? 'var(--green)' : COLORS[i % COLORS.length] + '22',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color: sel ? 'white' : COLORS[i % COLORS.length],
                  fontSize:12, fontWeight:700, flexShrink:0,
                }}>
                  {item.code || item.name?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--gray-900)' }}>{item.name}</div>
                  {item.code && <div style={{ fontSize:11, color:'var(--gray-400)' }}>{item.code}</div>}
                </div>
                {sel && <div style={{ marginLeft:'auto', color:'var(--green)', fontSize:16 }}>✓</div>}
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'var(--radius)', color:'#dc2626', fontSize:13, marginBottom:12 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={runComparison}
          disabled={loading || selectedDepts.length < 2}
        >
          {loading ? <RefreshCw size={15} style={{ animation:'spin 1s linear infinite' }} /> : <BarChart2 size={15} />}
          {loading ? 'Comparing…' : `Compare ${selectedDepts.length > 0 ? `(${selectedDepts.length} selected)` : ''}`}
        </button>
      </div>

      {/* Results */}
      {comparisonData && comparisonData.length > 0 && (
        <>
          {/* Summary cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:16 }}>
            {comparisonData.map((d, i) => (
              <div key={d.id} className="card" style={{ borderTop:`3px solid ${COLORS[i % COLORS.length]}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <div style={{
                    width:36, height:36, borderRadius:9,
                    background: COLORS[i % COLORS.length] + '22',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color: COLORS[i % COLORS.length], fontWeight:700, fontSize:13,
                  }}>
                    {d.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--gray-900)' }}>{d.name}</div>
                    <div style={{ fontSize:11, color:'var(--gray-400)' }}>{d.transactionCount} transactions</div>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { label:'Total Budget', val: formatCurrency(d.totalBudget), icon:<Wallet size={13}/> },
                    { label:'Total Spent',  val: formatCurrency(d.totalSpent),  icon:<TrendingDown size={13}/> },
                    { label:'Utilization',  val: formatPct(d.totalSpent, d.totalBudget), icon:<BarChart2 size={13}/> },
                    { label:'Income',       val: formatCurrency(d.income),      icon:<TrendingUp size={13}/> },
                    { label:'Expense',      val: formatCurrency(d.expense),     icon:<TrendingDown size={13}/> },
                  ].map(row => (
                    <div key={row.label} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                      <span style={{ color:'var(--gray-500)', display:'flex', alignItems:'center', gap:4 }}>{row.icon}{row.label}</span>
                      <span style={{ fontWeight:600, color:'var(--gray-800)' }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bar chart: Budget vs Spent */}
          <div className="chart-card">
            <h3>Budget vs Spending Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="Total Budget" fill="#16a34a" radius={[4,4,0,0]} />
                <Bar dataKey="Total Spent"  fill="#dc2626" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart: Income vs Expense */}
          <div className="chart-card">
            <h3>Income vs Expense Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="Income"  fill="#16a34a" radius={[4,4,0,0]} />
                <Bar dataKey="Expense" fill="#d97706" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Comparison table */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">Detailed Comparison Table</h3></div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Total Budget</th>
                    <th>Total Spent</th>
                    <th>Utilization</th>
                    <th>Income</th>
                    <th>Expense</th>
                    <th>Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((d, i) => (
                    <tr key={d.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:10, height:10, borderRadius:2, background: COLORS[i % COLORS.length], flexShrink:0 }} />
                          <span style={{ fontWeight:600 }}>{d.name}</span>
                        </div>
                      </td>
                      <td>{formatCurrency(d.totalBudget)}</td>
                      <td>{formatCurrency(d.totalSpent)}</td>
                      <td>
                        <div className="utilization-cell">
                          <div className="mini-progress">
                            <div
                              className={`mini-progress-fill ${
                                (d.totalSpent/d.totalBudget*100) > 90 ? 'danger' :
                                (d.totalSpent/d.totalBudget*100) > 70 ? 'warning' : ''
                              }`}
                              style={{ width:`${Math.min(d.totalBudget > 0 ? (d.totalSpent/d.totalBudget*100) : 0, 100)}%` }}
                            />
                          </div>
                          <span style={{ fontSize:12, fontWeight:600 }}>{formatPct(d.totalSpent, d.totalBudget)}</span>
                        </div>
                      </td>
                      <td className="text-success">{formatCurrency(d.income)}</td>
                      <td className="text-error">{formatCurrency(d.expense)}</td>
                      <td>{d.transactionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty prompt */}
      {!comparisonData && !loading && (
        <div className="empty-state">
          <GitCompare size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No comparison yet</h3>
          <p className="empty-state-text">Select at least 2 departments above and click Compare.</p>
        </div>
      )}
    </div>
  );
};

export default ComparisonPage;
