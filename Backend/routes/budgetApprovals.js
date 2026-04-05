const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const BudgetRequest = require('../models/BudgetRequest');
const Budget = require('../models/Budget');
const Department = require('../models/Department');
const BudgetCategory = require('../models/BudgetCategory');
const User = require('../models/User');
const { sendBudgetRequestNotification, sendBudgetApproved } = require('../services/emailService');

// ── Helper: get full name from DB by userId ───────────────────────────────────
const getUserFullName = async (userId) => {
  try {
    const user = await User.findById(userId).select('firstName lastName email').lean();
    if (!user) return 'Unknown';
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.email;
  } catch (_) {
    return 'Unknown';
  }
};

// Submit Budget Request (Department Head)
router.post('/request', verifyToken, checkRole('department_head', 'admin'), async (req, res) => {
  try {
    const { name, departmentId, fiscalYear, startDate, endDate, totalAmount, allocations, description } = req.body;

    const request = await BudgetRequest.create({
      name,
      departmentId,
      organizationId: req.user.organizationId,
      fiscalYear,
      startDate,
      endDate,
      totalAmount,
      allocations: allocations || [],
      description,
      status: 'pending',
      submittedBy: req.user.userId,
      submittedAt: new Date(),
      history: [{
        action: 'SUBMITTED',
        userId: req.user.userId,
        timestamp: new Date(),
        note: 'Budget request submitted'
      }]
    });

    // Notify all finance officers and admins in the organisation
    const reviewers = await User.find({
      organizationId: req.user.organizationId,
      role: { $in: ['finance_officer', 'admin'] },
      isActive: true,
    }).select('email firstName').lean();

    const submitterName = await getUserFullName(req.user.userId);

    for (const reviewer of reviewers) {
      sendBudgetRequestNotification(reviewer.email, reviewer.firstName, request, submitterName).catch(() => {});
    }

    res.json({ success: true, message: 'Budget request submitted successfully', data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit budget request', error: error.message });
  }
});

// Get All Budget Requests (with filters)
router.get('/requests', verifyToken, async (req, res) => {
  try {
    const { status, departmentId } = req.query;
    const filter = {};

    if (status) filter.status = status;

    if (req.user.role === 'department_head') {
      filter.submittedBy = req.user.userId;
    } else if (departmentId) {
      filter.departmentId = departmentId;
    }

    // Scope to user's organisation
    if (req.user.organizationId) {
      filter.organizationId = req.user.organizationId;
    }

    const requests = await BudgetRequest.find(filter).sort({ createdAt: -1 }).lean();

    const populated = await Promise.all(requests.map(async (r) => {
      const dept = r.departmentId ? await Department.findById(r.departmentId).select('name').lean() : null;
      const submitter = r.submittedBy ? await User.findById(r.submittedBy).select('firstName lastName').lean() : null;
      return {
        ...r,
        id: r._id.toString(),
        departmentName:  dept      ? dept.name                                      : 'Organisation-wide',
        submittedByName: submitter ? `${submitter.firstName} ${submitter.lastName}` : 'Unknown',
      };
    }));

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch budget requests', error: error.message });
  }
});

// Get Single Budget Request
router.get('/requests/:id', verifyToken, async (req, res) => {
  try {
    const request = await BudgetRequest.findById(req.params.id).lean();
    if (!request) return res.status(404).json({ success: false, message: 'Budget request not found' });

    const dept      = request.departmentId ? await Department.findById(request.departmentId).select('name').lean() : null;
    const submitter = request.submittedBy  ? await User.findById(request.submittedBy).select('firstName lastName').lean() : null;

    // Populate category names in allocations
    const allocations = await Promise.all((request.allocations || []).map(async (a) => {
      const cat = a.categoryId ? await BudgetCategory.findById(a.categoryId).select('name').lean() : null;
      return { ...a, categoryName: cat ? cat.name : 'Unknown' };
    }));

    res.json({
      success: true,
      data: {
        ...request,
        id: request._id.toString(),
        departmentName:  dept      ? dept.name                                      : 'Organisation-wide',
        submittedByName: submitter ? `${submitter.firstName} ${submitter.lastName}` : 'Unknown',
        allocations,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch budget request', error: error.message });
  }
});

// Add Comment to Budget Request
// FIX BUG 1: fetch real name from DB instead of using req.user.firstName (which is never set)
router.post('/requests/:id/comment', verifyToken, async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    }

    const request = await BudgetRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Budget request not found' });

    // FIX: fetch real user name from DB — req.user does not have firstName/lastName
    const userName = await getUserFullName(req.user.userId);

    const newComment = {
      userId:    req.user.userId,
      userName,
      comment:   comment.trim(),
      timestamp: new Date()
    };

    request.comments.push(newComment);
    await request.save();

    res.json({ success: true, message: 'Comment added successfully', data: newComment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add comment', error: error.message });
  }
});

// Review Budget Request (Finance Officer)
// FIX BUG 1 (part 2): fetch real name for review comments too
router.post('/requests/:id/review', verifyToken, checkRole('finance_officer', 'admin'), async (req, res) => {
  try {
    const { action, comment } = req.body;
    const request = await BudgetRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Budget request not found' });

    if (request.status !== 'pending' && request.status !== 'under_review') {
      return res.status(400).json({ success: false, message: 'This request has already been processed' });
    }

    request.status     = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'under_review';
    request.reviewedBy = req.user.userId;
    request.reviewedAt = new Date();

    if (action === 'approve') {
      request.approvedBy = req.user.userId;
      request.approvedAt = new Date();
    }

    request.history.push({
      action:    action.toUpperCase(),
      userId:    req.user.userId,
      timestamp: new Date(),
      note:      comment || `Request ${action}d`
    });

    if (comment) {
      // FIX: fetch real name from DB
      const reviewerName = await getUserFullName(req.user.userId);
      request.comments.push({
        userId:    req.user.userId,
        userName:  reviewerName,
        comment,
        timestamp: new Date()
      });
    }

    await request.save();

    // If approved, notify the submitter
    if (action === 'approve') {
      const submitter = request.submittedBy
        ? await User.findById(request.submittedBy).select('email firstName').lean()
        : null;
      if (submitter) {
        sendBudgetApproved(submitter.email, submitter.firstName, request).catch(() => {});
      }
    }

    res.json({ success: true, message: `Budget request ${action}d successfully`, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to review budget request', error: error.message });
  }
});

// Final Approval (Admin)
router.post('/requests/:id/final-approve', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { comment } = req.body;
    const request = await BudgetRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Budget request not found' });

    if (request.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Request must be reviewed and approved first' });
    }

    // Create actual budget from request
    const budget = await Budget.create({
      name:            request.name,
      organizationId:  request.organizationId || req.user.organizationId,
      departmentId:    request.departmentId,
      fiscalYear:      request.fiscalYear,
      startDate:       request.startDate,
      endDate:         request.endDate,
      totalAmount:     request.totalAmount,
      allocatedAmount: request.totalAmount,
      spentAmount:     0,
      status:          'active',
      description:     request.description,
      createdBy:       request.submittedBy,
      approvedBy:      req.user.userId,
      approvedAt:      new Date()
    });

    request.status = 'finalized';
    request.history.push({
      action:    'FINALIZED',
      userId:    req.user.userId,
      timestamp: new Date(),
      note:      comment || 'Budget finalized and activated'
    });
    await request.save();

    // Notify the original submitter that the budget is now live
    const submitter = request.submittedBy
      ? await User.findById(request.submittedBy).select('email firstName').lean()
      : null;
    if (submitter) {
      sendBudgetApproved(submitter.email, submitter.firstName, budget).catch(() => {});
    }

    res.json({ success: true, message: 'Budget approved and activated successfully', data: { request, budget } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to finalize budget', error: error.message });
  }
});

// Get Approval Statistics
router.get('/stats', verifyToken, checkRole('finance_officer', 'admin'), async (req, res) => {
  try {
    const allRequests = await BudgetRequest.find().lean();

    const stats = {
      total:        allRequests.length,
      pending:      allRequests.filter(r => r.status === 'pending').length,
      under_review: allRequests.filter(r => r.status === 'under_review').length,
      approved:     allRequests.filter(r => r.status === 'approved').length,
      rejected:     allRequests.filter(r => r.status === 'rejected').length,
      finalized:    allRequests.filter(r => r.status === 'finalized').length,
      totalAmount:  allRequests.reduce((s, r) => s + (r.totalAmount || 0), 0),
      avgProcessingTime: calculateAvgProcessingTime(allRequests)
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
  }
});

function calculateAvgProcessingTime(requests) {
  const processed = requests.filter(r => r.approvedAt || r.reviewedAt);
  if (processed.length === 0) return 0;
  const totalTime = processed.reduce((sum, r) => {
    const endTime   = new Date(r.approvedAt || r.reviewedAt);
    const startTime = new Date(r.submittedAt || r.createdAt);
    return sum + (endTime - startTime);
  }, 0);
  return Math.round(totalTime / processed.length / (1000 * 60 * 60));
}

module.exports = router;
