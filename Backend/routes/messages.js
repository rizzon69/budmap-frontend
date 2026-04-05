const express  = require('express');
const router   = express.Router();
const path     = require('path');
const fs       = require('fs');
const multer   = require('multer');
const { v4: uuidv4 } = require('uuid');
const { verifyToken: auth } = require('../middleware/auth');
const Message      = require('../models/Message');
const User         = require('../models/User');
const Notification = require('../models/Notification');

// ── Multer storage ────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'messages');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = uuidv4() + ext;
    cb(null, name);
  },
});

const ALLOWED_TYPES = [
  // images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  // documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // video
  'video/mp4', 'video/webm', 'video/quicktime',
];

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed. Allowed: images, PDF, Word, MP4/WebM/MOV`));
    }
  },
});

// ── Helper: build attachment objects from multer files ────────────────────────
const buildAttachments = (files = [], baseUrl) =>
  files.map(f => ({
    filename:   f.originalname,
    storedName: f.filename,
    mimetype:   f.mimetype,
    size:       f.size,
    url:        `${baseUrl}/api/messages/attachment/${f.filename}`,
  }));

// ── Helper: create in-app notification for new message ───────────────────────
const notifyRecipient = async (recipientId, senderName, hasAttachments) => {
  try {
    const preview = hasAttachments ? 'sent you a message with attachments' : 'sent you a new message';
    await Notification.create({
      userId:  recipientId,
      title:   `New message from ${senderName}`,
      message: `${senderName} ${preview}`,
      type:    'message',
      isRead:  false,
      link:    '/messages',
    });
  } catch (e) {
    console.error('Failed to create message notification:', e.message);
  }
};

// ── GET /api/messages/attachment/:filename — serve uploaded file ──────────────
router.get('/attachment/:filename', auth, (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }
  res.sendFile(filePath);
});

// ── GET /api/messages/conversations ──────────────────────────────────────────
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const allMessages = await Message.find({
      $or: [{ senderId: userId }, { recipientId: userId }]
    }).sort({ createdAt: -1 }).lean();

    const conversations = new Map();

    for (const msg of allMessages) {
      const partnerId = msg.senderId.toString() === userId
        ? msg.recipientId.toString()
        : msg.senderId.toString();

      if (!conversations.has(partnerId)) {
        const partner = await User.findById(partnerId)
          .select('firstName lastName email avatar role').lean();
        const unreadCount = await Message.countDocuments({
          senderId: partnerId, recipientId: userId, readAt: null,
        });
        conversations.set(partnerId, { partnerId, partner, lastMessage: msg, unreadCount });
      }
    }

    const list = Array.from(conversations.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
});

// ── GET /api/messages/unread/count ────────────────────────────────────────────
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ recipientId: req.user.id, readAt: null });
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
});

// ── GET /api/messages/thread/:userId ─────────────────────────────────────────
router.get('/thread/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId   = req.params.userId;

    const thread = await Message.find({
      $or: [
        { senderId: currentUserId, recipientId: otherUserId },
        { senderId: otherUserId,   recipientId: currentUserId },
      ],
    }).sort({ createdAt: 1 }).lean();

    // Mark received messages as read
    await Message.updateMany(
      { senderId: otherUserId, recipientId: currentUserId, readAt: null },
      { readAt: new Date() }
    );

    const otherUser = await User.findById(otherUserId)
      .select('firstName lastName email avatar role').lean();

    res.json({ success: true, data: { user: otherUser, messages: thread } });
  } catch (error) {
    console.error('Get thread error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch message thread' });
  }
});

// ── POST /api/messages — send message (with optional file attachments) ────────
router.post('/', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientId, subject, body, parentId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient is required' });
    }
    // Allow sending with just attachments (no body text required)
    if (!body && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ success: false, message: 'Please add a message or attach a file' });
    }

    const recipient = await User.findById(recipientId)
      .select('firstName lastName email avatar').lean();
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const attachments = buildAttachments(req.files || [], baseUrl);

    const newMessage = await Message.create({
      senderId,
      recipientId,
      subject:     subject  || null,
      body:        body     || '',
      parentId:    parentId || null,
      attachments,
    });

    const sender = await User.findById(senderId)
      .select('firstName lastName email avatar').lean();

    // Create in-app notification for the recipient
    const senderName = `${sender.firstName} ${sender.lastName}`;
    await notifyRecipient(recipientId, senderName, attachments.length > 0);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { ...newMessage.toObject(), sender, recipient },
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(f => {
        try { fs.unlinkSync(f.path); } catch (_) {}
      });
    }
    console.error('Send message error:', error);
    if (error.message?.includes('not allowed') || error.message?.includes('File type')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// ── PUT /api/messages/:id/read ────────────────────────────────────────────────
router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    if (message.recipientId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    message.readAt = new Date();
    await message.save();
    res.json({ success: true, message: 'Marked as read', data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
});

// ── DELETE /api/messages/:id ──────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const uid = req.user.id;
    if (message.senderId.toString() !== uid && message.recipientId.toString() !== uid) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Delete attachment files from disk
    message.attachments.forEach(att => {
      const fp = path.join(UPLOAD_DIR, att.storedName);
      try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch (_) {}
    });

    await Message.findByIdAndDelete(message._id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
});

// ── GET /api/messages — all messages for user ─────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const messages = await Message.find({
      $or: [{ senderId: userId }, { recipientId: userId }],
    })
      .populate('senderId',    'firstName lastName email avatar')
      .populate('recipientId', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// ── GET /api/messages/:id ─────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('senderId',    'firstName lastName email avatar')
      .populate('recipientId', 'firstName lastName email avatar')
      .lean();

    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const uid = req.user.id;
    const sId = message.senderId?._id?.toString() || message.senderId?.toString();
    const rId = message.recipientId?._id?.toString() || message.recipientId?.toString();
    if (sId !== uid && rId !== uid) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (rId === uid && !message.readAt) {
      await Message.findByIdAndUpdate(message._id, { readAt: new Date() });
    }

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch message' });
  }
});

module.exports = router;
