import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FileText, Clock, CheckCircle, XCircle, AlertCircle,
  Send, MessageSquare, Eye, ThumbsUp, ThumbsDown,
  Calendar, DollarSign, User, Building2, Search, X,
} from 'lucide-react';
import './BudgetApproval.css';

const BudgetApproval = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [comment, setComment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [newRequest, setNewRequest] = useState({
    name: '', fiscalYear: '2024-25', startDate: '', endDate: '',
    totalAmount: '', departmentId: '', description: '',
  });

  useEffect(() => { fetchRequests(); fetchMeta(); }, []);
  useEffect(() => { filterRequests(); }, [requests, filterStatus, searchTerm]);

  const fetchMeta = async () => {
    try {
      const [dRes, cRes] = await Promise.all([
        api.get('/departments'),
        api.get('/budgets/meta/categories'),
      ]);
      if (dRes.data.success) setDepartments(dRes.data.data.departments || []);
      if (cRes.data.success) setCategories(cRes.data.data.categories || []);
    } catch (e) { console.error(e); }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/budget-approvals/requests');
      if (res.data.success) {
        setRequests(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r =>
        (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.departmentName || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  const handleReview = async (requestId, action, commentText) => {
    try {
      await api.post(`/budget-approvals/requests/${requestId}/review`, {
        action,
        comment: commentText || undefined,
      });
      setRequests(prev => prev.map(r =>
        (r._id||r.id) === requestId
          ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' }
          : r
      ));
      setSelectedRequest(null);
      setComment('');
    } catch (error) {
      console.error('Error reviewing request:', error);
    }
  };

  const handleAddComment = async (requestId, commentText) => {
    try {
      await api.post(`/budget-approvals/requests/${requestId}/comment`, { comment: commentText });
      setComment('');
      const res = await api.get(`/budget-approvals/requests/${requestId}`);
      if (res.data.success) setSelectedRequest(res.data.data);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/budget-approvals/request', newRequest);
      if (res.data.success) {
        setShowRequestModal(false);
        setNewRequest({ name:'', fiscalYear:'2024-25', startDate:'', endDate:'', totalAmount:'', departmentId:'', description:'' });
        fetchRequests();
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="status-icon pending" size={18} />;
      case 'under_review':
        return <AlertCircle className="status-icon review" size={18} />;
      case 'approved':
        return <CheckCircle className="status-icon approved" size={18} />;
      case 'rejected':
        return <XCircle className="status-icon rejected" size={18} />;
      default:
        return <FileText className="status-icon" size={18} />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'Pending Review',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      finalized: 'Finalized'
    };
    return badges[status] || status;
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    underReview: requests.filter(r => r.status === 'under_review').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="approval-loading">
        <div className="spinner"></div>
        <p>Loading budget requests...</p>
      </div>
    );
  }

  return (
    <div className="budget-approval-container">
      {/* Header */}
      <div className="approval-header">
        <div className="header-content">
          <div className="header-title">
            <FileText size={32} className="header-icon" />
            <div>
              <h1>Budget Approval</h1>
              <p>Review and approve budget requests</p>
            </div>
          </div>
          {user.role === 'department_head' && (
            <button className="btn-primary" onClick={() => setShowRequestModal(true)}>
              <Send size={18} />
              New Budget Request
            </button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="approval-stats">
        <div className="stat-box">
          <div className="stat-icon total">
            <FileText size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Requests</span>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon pending">
            <Clock size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon review">
            <AlertCircle size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{stats.underReview}</span>
            <span className="stat-label">Under Review</span>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon approved">
            <CheckCircle size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Approved</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="approval-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </button>
          <button
            className={`filter-tab ${filterStatus === 'under_review' ? 'active' : ''}`}
            onClick={() => setFilterStatus('under_review')}
          >
            Under Review
          </button>
          <button
            className={`filter-tab ${filterStatus === 'approved' ? 'active' : ''}`}
            onClick={() => setFilterStatus('approved')}
          >
            Approved
          </button>
          <button
            className={`filter-tab ${filterStatus === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilterStatus('rejected')}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="requests-grid">
        {filteredRequests.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No Requests Found</h3>
            <p>There are no budget requests matching your criteria.</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request._id || request.id} className="request-card">
              <div className="request-header">
                <div className="request-title-section">
                  <h3>{request.name}</h3>
                  <span className={`status-badge status-${request.status}`}>
                    {getStatusIcon(request.status)}
                    {getStatusBadge(request.status)}
                  </span>
                </div>
                <button
                  className="btn-view"
                  onClick={() => setSelectedRequest({...request, id: request._id || request.id, _id: request._id || request.id})}
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>

              <div className="request-info">
                <div className="info-item">
                  <Building2 size={16} />
                  <span>{request.departmentName}</span>
                </div>
                <div className="info-item">
                  <User size={16} />
                  <span>{request.submittedByName}</span>
                </div>
                <div className="info-item">
                  <Calendar size={16} />
                  <span>{formatDate(request.submittedAt)}</span>
                </div>
                <div className="info-item">
                  <DollarSign size={16} />
                  <span className="amount">{formatCurrency(request.totalAmount)}</span>
                </div>
              </div>

              <div className="request-footer">
                <p className="request-description">{request.description}</p>
                {(user.role === 'finance_officer' || user.role === 'admin') &&
                  request.status === 'pending' && (
                    <div className="quick-actions">
                      <button
                        className="btn-approve-sm"
                        onClick={() => handleReview(request._id || request.id, 'approve', 'Quick approval')}
                      >
                        <ThumbsUp size={16} />
                        Approve
                      </button>
                      <button
                        className="btn-reject-sm"
                        onClick={() => handleReview(request._id || request.id, 'reject', 'Request rejected')}
                      >
                        <ThumbsDown size={16} />
                        Reject
                      </button>
                    </div>
                  )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Budget Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Budget Request</h2>
              <button className="close-btn" onClick={() => setShowRequestModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmitRequest}>
              <div className="detail-section">
                <div className="detail-grid">
                  <div className="detail-item" style={{gridColumn:'1/-1'}}>
                    <label>Request Name</label>
                    <input className="input-field" type="text" placeholder="e.g., Q1 Operations Budget"
                      value={newRequest.name} onChange={e => setNewRequest({...newRequest, name: e.target.value})} required/>
                  </div>
                  <div className="detail-item">
                    <label>Department</label>
                    <select className="input-field" value={newRequest.departmentId}
                      onChange={e => setNewRequest({...newRequest, departmentId: e.target.value})}>
                      <option value="">Organisation-wide</option>
                      {departments.map(d => (
                        <option key={d._id||d.id} value={d._id||d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="detail-item">
                    <label>Fiscal Year</label>
                    <select className="input-field" value={newRequest.fiscalYear}
                      onChange={e => setNewRequest({...newRequest, fiscalYear: e.target.value})}>
                      <option value="2023-24">2023-24</option>
                      <option value="2024-25">2024-25</option>
                      <option value="2025-26">2025-26</option>
                    </select>
                  </div>
                  <div className="detail-item">
                    <label>Start Date</label>
                    <input className="input-field" type="date" value={newRequest.startDate}
                      onChange={e => setNewRequest({...newRequest, startDate: e.target.value})} required/>
                  </div>
                  <div className="detail-item">
                    <label>End Date</label>
                    <input className="input-field" type="date" value={newRequest.endDate}
                      onChange={e => setNewRequest({...newRequest, endDate: e.target.value})} required/>
                  </div>
                  <div className="detail-item">
                    <label>Total Amount (NPR)</label>
                    <input className="input-field" type="number" placeholder="Enter amount"
                      value={newRequest.totalAmount} onChange={e => setNewRequest({...newRequest, totalAmount: e.target.value})} required/>
                  </div>
                  <div className="detail-item" style={{gridColumn:'1/-1'}}>
                    <label>Description</label>
                    <textarea className="input-field" rows={3} placeholder="Describe the purpose of this budget request..."
                      value={newRequest.description} onChange={e => setNewRequest({...newRequest, description: e.target.value})}/>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{justifyContent:'flex-end',gap:10,display:'flex',padding:'16px 24px'}}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button type="submit" className="btn-approve" disabled={submitting}>
                  <Send size={16}/> {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedRequest.name}</h2>
              <button className="close-btn" onClick={() => setSelectedRequest(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Request Info */}
              <div className="detail-section">
                <h3>Request Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Department</label>
                    <p>{selectedRequest.departmentName}</p>
                  </div>
                  <div className="detail-item">
                    <label>Fiscal Year</label>
                    <p>{selectedRequest.fiscalYear}</p>
                  </div>
                  <div className="detail-item">
                    <label>Period</label>
                    <p>
                      {formatDate(selectedRequest.startDate)} - {formatDate(selectedRequest.endDate)}
                    </p>
                  </div>
                  <div className="detail-item">
                    <label>Total Amount</label>
                    <p className="amount-large">{formatCurrency(selectedRequest.totalAmount)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Submitted By</label>
                    <p>{selectedRequest.submittedByName}</p>
                  </div>
                  <div className="detail-item">
                    <label>Submitted On</label>
                    <p>{formatDate(selectedRequest.submittedAt)}</p>
                  </div>
                </div>
                <div className="detail-description">
                  <label>Description</label>
                  <p>{selectedRequest.description}</p>
                </div>
              </div>

              {/* Budget Allocations */}
              <div className="detail-section">
                <h3>Budget Breakdown</h3>
                <div className="allocations-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedRequest.allocations || []).map((alloc, index) => (
                        <tr key={index}>
                          <td>{alloc.categoryName}</td>
                          <td className="amount">{formatCurrency(alloc.allocatedAmount || alloc.amount || 0)}</td>
                          <td>{alloc.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Comments Section */}
              <div className="detail-section">
                <h3>Comments & Discussions</h3>
                <div className="comments-list">
                  {(selectedRequest.comments || []).length === 0 ? (
                    <p className="empty-message">No comments yet</p>
                  ) : (
                    (selectedRequest.comments || []).map((c) => (
                      <div key={c.id} className="comment-item">
                        <div className="comment-header">
                          <strong>{c.userName}</strong>
                          <span>{formatDate(c.timestamp)}</span>
                        </div>
                        <p>{c.comment}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="add-comment">
                  <textarea
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                  <button
                    className="btn-primary"
                    onClick={() => handleAddComment(selectedRequest.id, comment)}
                    disabled={!comment.trim()}
                  >
                    <MessageSquare size={16} />
                    Add Comment
                  </button>
                </div>
              </div>

              {/* History Timeline */}
              <div className="detail-section">
                <h3>Approval History</h3>
                <div className="history-timeline">
                  {(selectedRequest.history || []).map((h, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <strong>{h.action}</strong>
                        <p>{h.note}</p>
                        <span className="timeline-time">{formatDate(h.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            {(user.role === 'finance_officer' || user.role === 'admin') &&
              selectedRequest.status === 'pending' && (
                <div className="modal-footer">
                  <button
                    className="btn-reject"
                    onClick={() => handleReview(selectedRequest.id, 'reject', comment)}
                  >
                    <ThumbsDown size={18} />
                    Reject Request
                  </button>
                  <button
                    className="btn-approve"
                    onClick={() => handleReview(selectedRequest.id, 'approve', comment)}
                  >
                    <ThumbsUp size={18} />
                    Approve Request
                  </button>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetApproval;
