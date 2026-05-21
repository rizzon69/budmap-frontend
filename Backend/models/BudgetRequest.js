const mongoose = require('mongoose');

const budgetRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  fiscalYear: { type: String, default: null },
  startDate: { type: String, default: null },
  endDate: { type: String, default: null },
  totalAmount: { type: Number, required: true },
  allocations: [{
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'BudgetCategory' },
    allocatedAmount: { type: Number },
    amount: { type: Number },
    notes: { type: String, default: null }
  }],
  description: { type: String, default: null },
  status: { type: String, enum: ['pending', 'under_review', 'approved', 'rejected', 'finalized'], default: 'pending' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedAt: { type: Date, default: Date.now },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    comment: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  history: [{
    action: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('BudgetRequest', budgetRequestSchema);
