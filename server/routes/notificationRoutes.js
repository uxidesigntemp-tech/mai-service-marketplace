// server/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { requireAuth, requireCustomer } = require('../middleware/auth');

router.use(requireAuth, requireCustomer);

// 1. GET ALL NOTIFICATIONS FOR USER
router.get('/', (req, res) => {
  const currentUserId = req.user.id;
  const userNotifs = store.filter('notifications', n => n.userId === currentUserId);

  userNotifs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const unreadCount = userNotifs.filter(n => !n.isRead).length;

  res.status(200).json({
    unreadCount,
    notifications: userNotifs
  });
});

// 2. MARK NOTIFICATION AS READ
router.patch('/:id/read', (req, res) => {
  const currentUserId = req.user.id;
  const notif = store.find('notifications', n => n.id === req.params.id && n.userId === currentUserId);

  if (!notif) {
    return res.status(404).json({ error: 'NotFound', message: 'Notification not found.' });
  }

  const updated = store.update('notifications', notif.id, { isRead: true });
  res.status(200).json({ message: 'Marked as read', notification: updated });
});

// 3. MARK ALL AS READ
router.patch('/read-all', (req, res) => {
  const currentUserId = req.user.id;
  const userNotifs = store.filter('notifications', n => n.userId === currentUserId);

  userNotifs.forEach(n => {
    store.update('notifications', n.id, { isRead: true });
  });

  res.status(200).json({ message: 'All notifications marked as read' });
});

module.exports = router;
