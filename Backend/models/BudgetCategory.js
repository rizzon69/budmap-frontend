const mongoose = require('mongoose');

const budgetCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['expense', 'income'], required: true },
  icon: { type: String, default: null },
  color: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('BudgetCategory', budgetCategorySchema);
