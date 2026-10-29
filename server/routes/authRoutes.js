// server/routes/authRoutes.js
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const store = require('../data/store');
const { 
  createSessionToken, 
  revokeSessionToken, 
  requireAuth, 
  hashPassword, 
  verifyPassword 
} = require('../middleware/auth');
const { 
  validateRegistration, 
  validateLogin, 
  validateEmail 
} = require('../middleware/validation');

// 1. REGISTER
router.post('/register', validateRegistration, (req, res) => {
  const { name, email, password, phone } = req.body;
  const cleanEmail = email.trim().toLowerCase();

  // Check duplicate account
  const existing = store.find('users', u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(409).json({ 
      error: 'DuplicateAccount', 
      message: 'An account with this email address already exists. Please log in instead.' 
    });
  }

  // Hash password
  const { hash, salt } = hashPassword(password);

  const newUser = {
    id: 'usr-' + Date.now(),
    name: name.trim(),
    email: cleanEmail,
    passwordHash: hash,
    salt: salt,
    phone: phone ? phone.trim() : '',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    location: 'United Kingdom',
    joinedDate: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    bio: 'MAI Service Customer / Project Owner.',
    preferences: {
      emailNotifications: true,
      bookingUpdates: true,
      messageNotifications: true,
      promotionalOffers: false,
      profileVisibility: 'Public',
      communicationChannel: 'In-App & Email'
    }
  };

  store.insert('users', newUser);

  // Auto session token
  const token = createSessionToken(newUser.id);

  // Set secure cookie
  res.cookie('mai_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const { passwordHash: _, salt: __, ...userPublic } = newUser;
  res.status(201).json({
    message: 'Account registered successfully',
    token,
    user: userPublic
  });
});

// 2. LOGIN
router.post('/login', validateLogin, (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = email.trim().toLowerCase();

  const user = store.find('users', u => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    return res.status(401).json({ 
      error: 'InvalidCredentials', 
      message: 'Invalid email or password.' 
    });
  }

  // If user has passwordHash, verify it. Otherwise fallback to match Password123!
  let valid = false;
  if (user.passwordHash && user.salt) {
    valid = verifyPassword(password, user.salt, user.passwordHash);
  } else if (password === 'Password123!' || password === 'password') {
    valid = true;
  }

  if (!valid) {
    return res.status(401).json({ 
      error: 'InvalidCredentials', 
      message: 'Invalid email or password.' 
    });
  }

  const token = createSessionToken(user.id);

  res.cookie('mai_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const { passwordHash: _, salt: __, ...userPublic } = user;
  res.status(200).json({
    message: 'Login successful',
    token,
    user: userPublic
  });
});

// 3. LOGOUT
router.post('/logout', (req, res) => {
  const token = req.token || (req.cookies && req.cookies.mai_token);
  if (token) {
    revokeSessionToken(token);
  }
  res.clearCookie('mai_token');
  res.status(200).json({ message: 'Logged out successfully' });
});

// 4. GET CURRENT AUTH USER
router.get('/me', requireAuth, (req, res) => {
  const { passwordHash: _, salt: __, ...userPublic } = req.user;
  res.status(200).json({ user: userPublic });
});

// 5. FORGOT PASSWORD
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ 
      error: 'ValidationError', 
      message: 'Valid email address is required.' 
    });
  }

  const user = store.find('users', u => u.email.toLowerCase() === email.trim().toLowerCase());
  
  // To avoid email enumeration in production, respond positively even if not found
  if (!user) {
    return res.status(200).json({ 
      message: 'If an account exists with this email address, a password reset link has been sent.' 
    });
  }

  const rawToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  const resetRecord = {
    id: 'prt-' + Date.now(),
    userId: user.id,
    tokenHash,
    rawToken, // for testing / dev inspection
    expiresAt,
    used: false,
    createdAt: new Date().toISOString()
  };

  store.insert('passwordResetTokens', resetRecord);

  console.log(`[AUTH] Password reset requested for ${user.email}. Development Token: ${rawToken}`);

  // In development, return token in response for testing
  const isDev = process.env.NODE_ENV !== 'production';

  res.status(200).json({
    message: 'If an account exists with this email address, a password reset link has been sent.',
    ...(isDev ? { devResetToken: rawToken, instructions: 'Use devResetToken in reset-password flow' } : {})
  });
});

// 6. RESET PASSWORD
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ 
      error: 'ValidationError', 
      message: 'Valid reset token and new password (min 6 characters) are required.' 
    });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  const resetRecord = store.find('passwordResetTokens', t => 
    (t.tokenHash === tokenHash || t.rawToken === token) && !t.used
  );

  if (!resetRecord) {
    return res.status(400).json({ 
      error: 'InvalidToken', 
      message: 'Password reset link is invalid or has already been used.' 
    });
  }

  if (new Date(resetRecord.expiresAt) < new Date()) {
    return res.status(400).json({ 
      error: 'ExpiredToken', 
      message: 'Password reset link has expired. Please request a new one.' 
    });
  }

  const user = store.find('users', u => u.id === resetRecord.userId);
  if (!user) {
    return res.status(404).json({ error: 'UserNotFound', message: 'Associated user account not found.' });
  }

  // Hash new password
  const { hash, salt } = hashPassword(newPassword);
  store.update('users', user.id, {
    passwordHash: hash,
    salt: salt
  });

  // Mark token used
  store.update('passwordResetTokens', resetRecord.id, { used: true });

  res.status(200).json({ 
    message: 'Password has been updated successfully. You can now log in with your new password.' 
  });
});

module.exports = router;
