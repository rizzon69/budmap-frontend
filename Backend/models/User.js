const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, default: null },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  role: { type: String, enum: ['admin', 'finance_officer', 'department_head', 'viewer'], default: 'viewer' },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  phone: { type: String, default: null },
  avatar: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  authProvider: { type: String, default: 'local' },
  googleId: { type: String, default: null },
  lastLogin: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
