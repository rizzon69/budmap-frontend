const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');

// Get user notifications
router.get('/', verifyToken, async (req, res) => {
  try {
    const { isRead, type, page = 1, limit = 20 } = req.query;

    const filter = { userId: req.user.userId };
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (type) filter.type = type;

    const total = await Notification.countDocuments(filter);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const unreadCount = await Notification.countDocuments({ userId: req.user.userId, isRead: false });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
});

// Get unread count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ userId: req.user.userId, isRead: false });
    res.json({ success: true, data: { unreadCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch unread count', error: error.message });
  }
});

// FIX BUG 1: Mark ALL notifications as read — MUST be before /:id/read
// Otherwise Express matches "read-all" as the :id parameter
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.userId, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: `${result.modifiedCount} notifications marked as read` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read', error: error.message });
  }
});

// Mark single notification as read — MUST be after /read-all
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification marked as read', data: { notification } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark notification as read', error: error.message });
  }
});

// Delete notification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete notification', error: error.message });
  }
});

// Clear ALL notifications
router.delete('/', verifyToken, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.userId });
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to clear notifications', error: error.message });
  }
});

// Create notification (internal use)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { userId, title, message, type, link } = req.body;
    if (!userId || !title || !message) {
      return res.status(400).json({ success: false, message: 'Please provide userId, title, and message' });
    }
    const newNotification = await Notification.create({
      userId, title, message,
      type: type || 'info',
      isRead: false,
      link: link || null
    });
    res.status(201).json({ success: true, message: 'Notification created', data: { notification: newNotification } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create notification', error: error.message });
  }
});

module.exports = router;
