const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  headId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  description: { type: String, default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
