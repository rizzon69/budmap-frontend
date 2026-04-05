const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename:     { type: String, required: true },  // original file name
  storedName:   { type: String, required: true },  // name on disk (uuid)
  mimetype:     { type: String, required: true },
  size:         { type: Number, required: true },   // bytes
  url:          { type: String, required: true },   // served URL
}, { _id: false });

const messageSchema = new mongoose.Schema({
  senderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject:      { type: String, default: null },
  body:         { type: String, default: '' },
  readAt:       { type: Date,   default: null },
  parentId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  attachments:  { type: [attachmentSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
