const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['sme', 'ngo', 'educational', 'government', 'other'], required: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, default: null },
  address: { type: String, default: null },
  website: { type: String, default: null },
  fiscalYearStart: { type: String, default: 'July' },
  currency: { type: String, default: 'NPR' },
  logo: { type: String, default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
