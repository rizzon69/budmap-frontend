import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI, transactionsAPI, budgetsAPI } from '../services/api';
import api from '../services/api';
import {
  BarChart3, TrendingUp, TrendingDown, Wallet,
  Users, AlertCircle, CheckCircle, Clock,
  DollarSign, FileText, Target, Activity, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line,
} from 'recharts';
import './Dashboard.css';

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '13px',
};

const fmt = (v) =>
  new Intl.NumberFormat('en-NP', {
    style: 'currency', currency: 'NPR', minimumFractionDigits: 0,
  }).format(v || 0);

// ─────────────────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => { setTimeout(() => setLoading(false), 400); }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  switch (user?.role) {
    case 'admin':          return <AdminDashboard     user={user} />;
    case 'finance_officer': return <FinanceDashboard  user={user} />;
    case 'department_head': return <DepartmentDashboard user={user} />;
    default:               return <ViewerDashboard    user={user} />;
  }
};

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────
const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminAPI.getDashboard();
        if (res.data.success) setData(res.data.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="dashboard-loading"><div className="spinner"></div><p>Loading...</p></div>;

  const budgets      = data?.budgets      || {};
  const transactions = data?.transactions || {};
  const users        = data?.users        || {};
  const depts        = data?.departments  || {};

  const stats = [
    { title: 'Total Budget',    value: fmt(budgets.totalBudgeted),          change: `${budgets.utilizationRate || 0}% utilized`, trend: 'neutral', icon: <Wallet size={24}/>,      color: 'primary' },
    { title: 'Total Spent',     value: fmt(budgets.totalSpent),             change: fmt((budgets.totalBudgeted||0) - (budgets.totalSpent||0)) + ' remaining', trend: 'neutral', icon: <TrendingDown size={24}/>, color: 'success' },
    { title: 'Active Budgets',  value: String(budgets.byStatus?.active||0), change: `${budgets.byStatus?.draft||0} drafts`,       trend: 'neutral', icon: <FileText size={24}/>,    color: 'warning' },
    { title: 'Total Users',     value: String(users.total||0),              change: `${users.active||0} active`,                  trend: 'up',      icon: <Users size={24}/>,       color: 'info'    },
  ];

  // Pie: users by role
  const roleColors = ['#10b981','#059669','#34d399','#6ee7b7'];
  const roleData = users.byRole
    ? Object.entries(users.byRole).map(([k,v],i) => ({ name: k.replace('_',' '), value: v, color: roleColors[i%4] })).filter(d => d.value > 0)
    : [];

  // Activity list
  const recentActivity = (data?.recentActivity || []).slice(0, 5);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user.firstName}! Here's your organisation overview.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/reports')}>
          <FileText size={18} /> Generate Report
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card stat-${s.color}`}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-content">
              <p className="stat-label">{s.title}</p>
              <h3 className="stat-value">{s.value}</h3>
              <div className={`stat-change ${s.trend}`}>
                {s.trend === 'up' && <TrendingUp size={16}/>}
                <span>{s.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-row">
        {/* Users by role pie */}
        <div className="chart-card">
          <div className="chart-header"><h3>Users by Role</h3></div>
          {roleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                  outerRadius={95} dataKey="value">
                  {roleData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{textAlign:'center',padding:40,color:'#94a3b8',fontSize:13}}>No user data</p>}
        </div>

        {/* Transaction status */}
        <div className="chart-card">
          <div className="chart-header"><h3>Financial Overview</h3></div>
          <div style={{display:'flex',flexDirection:'column',gap:14,padding:'16px 0'}}>
            {[
              { label:'Total Income',  val: fmt(transactions.totalIncome),  color:'#10b981' },
              { label:'Total Expense', val: fmt(transactions.totalExpense), color:'#ef4444' },
              { label:'Net Balance',   val: fmt((transactions.totalIncome||0)-(transactions.totalExpense||0)), color:'#2563eb' },
            ].map(row => (
              <div key={row.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',background:'#f8fafc',borderRadius:10,borderLeft:`3px solid ${row.color}`}}>
                <span style={{fontSize:13,color:'#64748b',fontWeight:500}}>{row.label}</span>
                <span style={{fontSize:16,fontWeight:800,color:row.color}}>{row.val}</span>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',padding:'10px 16px',background:'#f0fdf4',borderRadius:10}}>
              <span style={{fontSize:12,color:'#64748b'}}>Pending Transactions</span>
              <span style={{fontWeight:700,color:'#d97706'}}>{transactions.byStatus?.pending||0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <div className="section-header">
          <h3>Recent Activity</h3>
          <Link to="/admin/activity-logs" className="view-all">View All →</Link>
        </div>
        <div className="activity-list">
          {recentActivity.length > 0 ? recentActivity.map((a, i) => (
            <div key={i} className="activity-item">
              <div className="activity-status status-info"><Activity size={20}/></div>
              <div className="activity-details">
                <p className="activity-action">{a.userName} {a.action?.toLowerCase()}d a {a.entity?.toLowerCase()}</p>
                <p className="activity-meta">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            </div>
          )) : (
            <p style={{color:'#94a3b8',fontSize:13,padding:16}}>No recent activity recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── FINANCE DASHBOARD ────────────────────────────────────────────────────────
const FinanceDashboard = ({ user }) => {
  const navigate  = useNavigate();
  const [txStats,  setTxStats]  = useState(null);
  const [pending,  setPending]  = useState([]);
  const [monthly,  setMonthly]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, txRes] = await Promise.all([
          transactionsAPI.getStats(),
          transactionsAPI.getAll({ status: 'pending', limit: 5 }),
        ]);
        if (statsRes.data.success) {
          setTxStats(statsRes.data.data.summary);
          setMonthly(statsRes.data.data.monthlyBreakdown || []);
        }
        if (txRes.data.success) {
          setPending(txRes.data.data.transactions || []);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="dashboard-loading"><div className="spinner"></div><p>Loading...</p></div>;

  const stats = [
    { title: 'Pending Approvals', value: String(txStats?.pendingCount||0),   change: 'Need review',      icon: <Clock size={24}/>,    color: 'warning' },
    { title: 'Total Income',      value: fmt(txStats?.totalIncome),           change: 'Completed',        icon: <TrendingUp size={24}/>,color: 'primary' },
    { title: 'Total Expense',     value: fmt(txStats?.totalExpense),          change: 'Completed',        icon: <TrendingDown size={24}/>, color: 'success' },
    { title: 'Net Balance',       value: fmt((txStats?.totalIncome||0)-(txStats?.totalExpense||0)), change: 'This period', icon: <Activity size={24}/>, color: 'info' },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Finance Dashboard</h1>
          <p>Welcome back, {user.firstName}! Manage your financial operations.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/transactions')}>
          <DollarSign size={18}/> New Transaction
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card stat-${s.color}`}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-content">
              <p className="stat-label">{s.title}</p>
              <h3 className="stat-value">{s.value}</h3>
              <p className="stat-change">{s.change}</p>
            </div>
          </div>
        ))}
      </div>

      {monthly.length > 0 && (
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3>Income vs Expenses Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
              <XAxis dataKey="month" stroke="#6b7280" fontSize={11}/>
              <YAxis stroke="#6b7280" fontSize={11}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => fmt(v)}/>
              <Legend/>
              <Line type="monotone" dataKey="income"  stroke="#10b981" strokeWidth={3} name="Income"  dot={false}/>
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} name="Expense" dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="approval-section">
        <div className="section-header">
          <h3>Pending Transactions</h3>
          <span className="badge badge-warning">{txStats?.pendingCount||0} Pending</span>
        </div>
        <div className="approval-list">
          {pending.length > 0 ? pending.map((tx, i) => (
            <div key={i} className="approval-item">
              <div className="approval-info">
                <h4>{tx.description}</h4>
                <p>{tx.category?.name || 'N/A'} • {new Date(tx.date).toLocaleDateString()}</p>
              </div>
              <div className="approval-actions">
                <span className="approval-amount">{fmt(tx.amount)}</span>
                <button className="btn-success-sm" onClick={() => navigate('/transactions')}>Review</button>
              </div>
            </div>
          )) : (
            <p style={{color:'#94a3b8',fontSize:13,padding:16}}>No pending transactions.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── DEPARTMENT HEAD DASHBOARD ────────────────────────────────────────────────
const DepartmentDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [budgetData, setBudgetData] = useState(null);
  const [monthly,    setMonthly]    = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, txRes] = await Promise.all([
          budgetsAPI.getAll({ status: 'active', limit: 10 }),
          transactionsAPI.getStats(),
        ]);
        if (bRes.data.success) {
          const budgets = bRes.data.data.budgets || [];
          const total   = budgets.reduce((s,b)=>s+b.totalAmount,0);
          const spent   = budgets.reduce((s,b)=>s+b.spentAmount,0);
          setBudgetData({ total, spent, remaining: total-spent, count: budgets.length });
        }
        if (txRes.data.success) {
          setMonthly(txRes.data.data.monthlyBreakdown || []);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="dashboard-loading"><div className="spinner"></div><p>Loading...</p></div>;

  const total   = budgetData?.total     || 0;
  const spent   = budgetData?.spent     || 0;
  const remaining = budgetData?.remaining || 0;
  const utilPct = total > 0 ? ((spent/total)*100).toFixed(1) : 0;

  const stats = [
    { title: 'Total Budget',     value: fmt(total),     change: `${utilPct}% utilized`,      icon: <Wallet size={24}/>,     color: 'primary' },
    { title: 'Remaining Budget', value: fmt(remaining), change: `${(100-utilPct).toFixed(1)}% available`, icon: <TrendingUp size={24}/>, color: 'success' },
    { title: 'Amount Spent',     value: fmt(spent),     change: 'This period',                icon: <TrendingDown size={24}/>, color: 'warning' },
    { title: 'Active Budgets',   value: String(budgetData?.count||0), change: 'Your department', icon: <BarChart3 size={24}/>, color: 'info' },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Department Dashboard</h1>
          <p>Welcome back, {user.firstName}! Track your department's performance.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/budgets')}>
          <FileText size={18}/> View Budgets
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card stat-${s.color}`}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-content">
              <p className="stat-label">{s.title}</p>
              <h3 className="stat-value">{s.value}</h3>
              <p className="stat-change">{s.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Budget utilization bar */}
      <div className="chart-card">
        <div className="chart-header"><h3>Budget Utilization</h3></div>
        <div style={{padding:'16px 0'}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8}}>
            <span style={{color:'#64748b'}}>Spent: {fmt(spent)}</span>
            <span style={{color:'#64748b'}}>Total: {fmt(total)}</span>
          </div>
          <div style={{height:12,background:'#e5e7eb',borderRadius:10,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${Math.min(utilPct,100)}%`,background: utilPct>90?'#ef4444':utilPct>70?'#f59e0b':'#10b981',borderRadius:10,transition:'width 0.8s ease'}}/>
          </div>
          <p style={{fontSize:13,color:'#64748b',marginTop:8,textAlign:'center'}}>{utilPct}% of total budget utilized</p>
        </div>
      </div>

      {monthly.length > 0 && (
        <div className="chart-card">
          <div className="chart-header"><h3>Monthly Spending Trend</h3></div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
              <XAxis dataKey="month" stroke="#6b7280" fontSize={11}/>
              <YAxis stroke="#6b7280" fontSize={11}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => fmt(v)}/>
              <Area type="monotone" dataKey="expense" stroke="#10b981" fill="#10b981" fillOpacity={0.15} name="Expense"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

// ─── VIEWER DASHBOARD ─────────────────────────────────────────────────────────
const ViewerDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await transactionsAPI.getStats();
        if (res.data.success) setSummary(res.data.data.summary);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome, {user.firstName}! You have read-only access.</p>
        </div>
      </div>

      {loading ? (
        <div className="viewer-message"><div className="spinner"/></div>
      ) : summary ? (
        <div className="stats-grid">
          {[
            { title: 'Total Income',  value: fmt(summary.totalIncome),  color:'stat-primary', icon:<TrendingUp size={24}/>,  link:'/transactions' },
            { title: 'Total Expense', value: fmt(summary.totalExpense), color:'stat-success', icon:<TrendingDown size={24}/>, link:'/transactions' },
            { title: 'Net Balance',   value: fmt((summary.totalIncome||0)-(summary.totalExpense||0)), color:'stat-info', icon:<Activity size={24}/>, link:'/reports' },
            { title: 'Transactions',  value: String(summary.completedCount||0), color:'stat-warning', icon:<FileText size={24}/>, link:'/transactions' },
          ].map((s,i) => (
            <div key={i} className={`stat-card ${s.color}`}
              onClick={() => navigate(s.link)}
              style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=''; }}
            >
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-content">
                <p className="stat-label">{s.title}</p>
                <h3 className="stat-value">{s.value}</h3>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="viewer-message">
          <Activity size={48}/>
          <h3>Viewer Access</h3>
          <p>You have view-only access. Contact your administrator for more permissions.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
