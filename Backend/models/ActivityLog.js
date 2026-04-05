const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: String, required: true },
  details: { type: String, default: null },
  ipAddress: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
