import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { transactionsAPI, budgetsAPI } from '../services/api';
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  X,
  XCircle,
} from 'lucide-react';
import './PageStyles.css';

const TransactionsPage = () => {
  const { canCreateTransactions, canApproveTransactions, isViewerOnly } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  // Viewers are locked to completed — others can filter freely
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    budgetId: '',
    categoryId: '',
    type: 'expense',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    payee: '',
    reference: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // For viewers, explicitly request only completed transactions
      // This works as a frontend guarantee even if the server hasn't restarted
      const transParams = isViewerOnly
        ? { limit: 50, status: 'completed' }
        : { limit: 50 };

      const [transRes, budgetsRes, catsRes] = await Promise.all([
        transactionsAPI.getAll(transParams),
        budgetsAPI.getAll({ status: 'active' }),
        budgetsAPI.getCategories(),
      ]);

      if (transRes.data.success) {
        let raw = transRes.data.data.transactions || [];
        // Client-side safety net: strip any non-completed transactions for viewers
        // This catches the case where the backend hasn't been restarted yet
        if (isViewerOnly) {
          raw = raw.filter(t => t.status === 'completed');
        }
        // Normalise IDs
        const normalised = raw.map((t, i) => ({
          ...t,
          id: t.id ?? t._id ?? i,
        }));
        setTransactions(normalised);
      }
      if (budgetsRes.data.success) {
        setBudgets(budgetsRes.data.data.budgets || []);
      }
      if (catsRes.data.success) {
        setCategories(catsRes.data.data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await transactionsAPI.create(formData);
      if (res.data.success) {
        setTransactions([res.data.data.transaction, ...transactions]);
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  // Helper: get the id from a transaction object regardless of field name
  const getTransId = (t) => t.id ?? t._id;

  const handleApprove = async (id) => {
    try {
      const res = await transactionsAPI.approve(id);
      if (res.data.success) {
        const updated = res.data.data.transaction;
        setTransactions(transactions.map(t =>
          getTransId(t) === getTransId(updated) ? updated : t
        ));
      }
    } catch (error) {
      console.error('Failed to approve transaction:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await transactionsAPI.reject(id);
      if (res.data.success) {
        const updated = res.data.data.transaction;
        setTransactions(transactions.map(t =>
          getTransId(t) === getTransId(updated) ? updated : t
        ));
      }
    } catch (error) {
      console.error('Failed to reject transaction:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      budgetId: '',
      categoryId: '',
      type: 'expense',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      payee: '',
      reference: '',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  const filteredTransactions = transactions.filter(trans => {
    // Viewers can NEVER see pending or cancelled — hard block at render time
    if (isViewerOnly && trans.status !== 'completed') return false;
    const matchesSearch = trans.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || trans.type === typeFilter;
    // Viewers have no status filter UI so statusFilter is always '' for them
    const matchesStatus = isViewerOnly ? true : (!statusFilter || trans.status === statusFilter);
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return <div className="loader"><div className="loader-spinner"></div></div>;
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h2>Transactions</h2>
          <p>{isViewerOnly ? 'Viewing approved transactions' : 'Track all income and expenses'}</p>
        </div>
        {canCreateTransactions && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Add Transaction
          </button>
        )}
      </div>

      {/* Viewer read-only notice */}
      {isViewerOnly && (
        <div className="viewer-notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>You have <strong>read-only</strong> access. Only approved transactions are visible to your role.</span>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        {/* Viewers only ever see completed — no status filter needed */}
        {!isViewerOnly && (
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}
        {isViewerOnly && (
          <span className="viewer-status-tag">
            <CheckCircle size={13} /> Approved only
          </span>
        )}
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((trans) => {
                  const transId = getTransId(trans);
                  return (
                    <tr key={transId}>
                      <td>
                      <div className="trans-desc-cell">
                      <span className="trans-desc-title">{trans.description}</span>
                      {trans.payee && <span className="trans-desc-payee">{trans.payee}</span>}
                      </div>
                      </td>
                      <td>{trans.category?.name || 'N/A'}</td>
                      <td>
                      <span className={`trans-type-pill ${trans.type}`}>
                      {trans.type === 'income' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {trans.type}
                      </span>
                      </td>
                      <td>
                      <span className={`trans-amount ${trans.type}`}>
                          {trans.type === 'income' ? '+' : '-'}{formatCurrency(trans.amount)}
                        </span>
                      </td>
                      <td>
                      <span className={`badge ${
                        trans.status === 'completed' ? 'badge-success' :
                      trans.status === 'pending' ? 'badge-warning' : 'badge-error'
                      }`}>
                      {trans.status === 'completed' ? <CheckCircle size={13} /> :
                         trans.status === 'pending' ? <Clock size={13} /> : <XCircle size={13} />}
                          {trans.status}
                      </span>
                    </td>
                      <td>{new Date(trans.date).toLocaleDateString()}</td>
                      <td>
                        {canApproveTransactions && trans.status === 'pending' && (
                          <div className="table-actions">
                            <button
                              className="action-btn approve"
                              onClick={() => handleApprove(transId)}
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              className="action-btn reject"
                              onClick={() => handleReject(transId)}
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr key="no-transactions">
                  <td colSpan="7" className="text-center text-muted" style={{padding: '40px'}}>
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Transaction</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Type</label>
                  <select
                    className="input-field"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value, categoryId: ''})}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Budget</label>
                  <select
                    className="input-field"
                    value={formData.budgetId}
                    onChange={(e) => setFormData({...formData, budgetId: e.target.value})}
                    required
                  >
                    <option value="">Select Budget</option>
                    {budgets.map(budget => (
                      <option key={budget.id ?? budget._id} value={budget.id ?? budget._id}>{budget.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select
                    className="input-field"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    {filteredCategories.map(cat => (
                      <option key={cat.id ?? cat._id} value={cat.id ?? cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Amount (NPR)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Transaction description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Payee/Payer</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Vendor name"
                    value={formData.payee}
                    onChange={(e) => setFormData({...formData, payee: e.target.value})}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Reference Number</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Invoice/Receipt number"
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
