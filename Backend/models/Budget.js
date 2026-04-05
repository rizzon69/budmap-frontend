const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  fiscalYear: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  allocatedAmount: { type: Number, default: 0 },
  spentAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'active', 'closed', 'archived'], default: 'draft' },
  description: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Budget', budgetSchema);
