const mongoose = require('mongoose');

const budgetAllocationSchema = new mongoose.Schema({
  budgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'BudgetCategory', required: true },
  allocatedAmount: { type: Number, required: true },
  spentAmount: { type: Number, default: 0 },
  notes: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('BudgetAllocation', budgetAllocationSchema);
