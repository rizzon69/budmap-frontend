const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  budgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'BudgetCategory', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  type: { type: String, enum: ['expense', 'income'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: null },
  date: { type: String, required: true },
  payee: { type: String, default: null },
  reference: { type: String, default: null },
  status: { type: String, enum: ['pending', 'completed', 'rejected', 'cancelled'], default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
