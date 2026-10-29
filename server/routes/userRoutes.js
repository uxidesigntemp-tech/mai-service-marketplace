// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { requireAuth, hashPassword, verifyPassword } = require('../middleware/auth');

router.use(requireAuth);

// 1. GET PROFILE
router.get('/me', (req, res) => {
  const { passwordHash: _, salt: __, ...userPublic } = req.user;
  res.status(200).json(userPublic);
});

// 2. UPDATE PROFILE
router.patch('/me', (req, res) => {
  const currentUserId = req.user.id;
  const { name, phone, bio, location, avatar } = req.body;

  const updates = {};
  if (name && typeof name === 'string' && name.trim().length >= 2) {
    updates.name = name.trim();
  }
  if (phone !== undefined) {
    updates.phone = phone.trim();
  }
  if (bio !== undefined) {
    updates.bio = bio.trim();
  }
  if (location !== undefined) {
    updates.location = location.trim();
  }
  if (avatar !== undefined) {
    updates.avatar = avatar.trim();
  }

  const updated = store.update('users', currentUserId, updates);
  const { passwordHash: _, salt: __, ...userPublic } = updated;

  res.status(200).json({
    message: 'Profile updated successfully',
    user: userPublic
  });
});

// 3. UPDATE PREFERENCES
router.patch('/me/preferences', (req, res) => {
  const currentUserId = req.user.id;
  const preferences = req.body;

  const currentPrefs = req.user.preferences || {};
  const mergedPrefs = { ...currentPrefs, ...preferences };

  const updated = store.update('users', currentUserId, { preferences: mergedPrefs });
  const { passwordHash: _, salt: __, ...userPublic } = updated;

  res.status(200).json({
    message: 'Preferences updated successfully',
    user: userPublic
  });
});

// 4. CHANGE PASSWORD
router.patch('/me/password', (req, res) => {
  const currentUserId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ 
      error: 'ValidationError', 
      message: 'New password must be at least 6 characters.' 
    });
  }

  const user = store.find('users', u => u.id === currentUserId);
  if (!user) {
    return res.status(404).json({ error: 'NotFound', message: 'User not found.' });
  }

  // Verify current password if user has hash
  if (user.passwordHash && user.salt) {
    const valid = verifyPassword(currentPassword, user.salt, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ 
        error: 'InvalidPassword', 
        message: 'Current password does not match.' 
      });
    }
  }

  // Hash new password
  const { hash, salt } = hashPassword(newPassword);
  store.update('users', user.id, {
    passwordHash: hash,
    salt: salt
  });

  res.status(200).json({ message: 'Password updated successfully' });
});

module.exports = router;
