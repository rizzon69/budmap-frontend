const mongoose = require('mongoose');

const emailTokenSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email:     { type: String, required: true },
  token:     { type: String, required: true, unique: true },
  type:      { type: String, enum: ['email_verification', 'password_reset'], required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// Auto-delete expired tokens
emailTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('EmailToken', emailTokenSchema);
