const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');
const ADMIN_MASTER_KEY = process.env.ADMIN_KEY || '7449-74491-74492-74493';

function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { users: [], emails: [] };
  }
}

function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

// Bot verification check endpoint
router.post('/verify-bot', (req, res) => {
  const { botToken, sliderPosition } = req.body;
  
  if (!botToken || sliderPosition < 85) {
    return res.status(400).json({
      success: false,
      message: 'Anti-bot verification failed. Please slide to complete the security puzzle.'
    });
  }

  return res.json({
    success: true,
    verificationToken: 'xmorf_token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
    message: 'Human verification successful.'
  });
});

// Admin Master Key Verification
router.post('/admin-login', (req, res) => {
  const { adminKey } = req.body;
  if (!adminKey) {
    return res.status(400).json({ success: false, message: 'Admin Master Security Key required.' });
  }

  const cleanKey = adminKey.trim().replace(/[-\s]/g, '');
  const targetKey = '7449-74491-74492-74493';
  const cleanTarget = targetKey.replace(/[-\s]/g, '');
  const envTarget = ADMIN_MASTER_KEY.replace(/[-\s]/g, '');

  if (cleanKey === cleanTarget || cleanKey === envTarget || adminKey.trim() === targetKey || adminKey.trim() === ADMIN_MASTER_KEY) {
    return res.json({
      success: true,
      message: 'Admin Master Key verified! Access granted to Overseer Panel.',
      token: 'jwt_xmadmin_' + Date.now()
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid Admin Master Key. Access denied!'
  });
});

// User login endpoint
router.post('/login', (req, res) => {
  const { email, password, botVerified } = req.body;

  if (!botVerified) {
    return res.status(403).json({
      success: false,
      message: 'Security check required: Complete the anti-bot verification.'
    });
  }

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const db = readDB();
  let normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail.includes('@')) {
    normalizedEmail += '@xmorf.net';
  }

  const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User account not found. Please register first.'
    });
  }

  // Check if account is banned
  if (user.status === 'Banned') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been banned by the system administrator.'
    });
  }

  // Strict Password Validation
  if (user.password && user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect password. Access denied.'
    });
  }

  if (!user.password) {
    user.password = password;
  }

  // Update last login timestamp
  user.lastLogin = new Date().toISOString();
  writeDB(db);

  return res.json({
    success: true,
    message: 'Login successful.',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      status: user.status || 'Active',
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      lastEmailSent: user.lastEmailSent
    },
    token: 'jwt_xmorf_session_' + Date.now()
  });
});

// User registration endpoint
router.post('/register', (req, res) => {
  const { username, password, fullName, botVerified } = req.body;

  if (!botVerified) {
    return res.status(403).json({
      success: false,
      message: 'Anti-bot security verification mandatory for new account registration.'
    });
  }

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  let cleanUsername = username.toLowerCase().trim().replace(/@xmorf\.net$/i, '');
  let fullEmail = cleanUsername + '@xmorf.net';

  const db = readDB();
  const existing = db.users.find(u => u.email.toLowerCase() === fullEmail);

  if (existing) {
    return res.status(400).json({ success: false, message: `The address ${fullEmail} is already registered.` });
  }

  const nowIso = new Date().toISOString();
  const newUser = {
    id: 'u_' + Date.now(),
    email: fullEmail,
    name: fullName || cleanUsername,
    avatar: cleanUsername.substring(0, 2).toUpperCase(),
    password: password,
    status: 'Active',
    createdAt: nowIso,
    lastLogin: nowIso,
    lastEmailSent: 'Never'
  };

  db.users.push(newUser);

  // Send a welcome email to the newly registered user
  db.emails.unshift({
    id: 'em-' + Date.now(),
    ownerEmail: fullEmail,
    folder: 'inbox',
    senderName: 'Xmorf Security Team',
    senderEmail: 'system@xmorf.net',
    recipient: fullEmail,
    subject: 'Welcome to your new @xmorf.net mailbox',
    preview: 'Your identity and mailbox are secured with Xmorf 256-bit encryption.',
    body: `Hello ${newUser.name},\n\nThank you for choosing Xmorf.net Secure Mail!\nYour account (${fullEmail}) has been successfully created and secured against automated bots.\n\nYou now have full access to high-speed encrypted messaging, file attachments, and soft-delete/restore capabilities.\n\nBest regards,\nXmorf Core Team`,
    timestamp: 'Just now',
    date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isUnread: true,
    isStarred: true,
    attachments: []
  });

  writeDB(db);

  return res.json({
    success: true,
    message: 'Account successfully created!',
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatar: newUser.avatar,
      status: newUser.status,
      createdAt: newUser.createdAt,
      lastLogin: newUser.lastLogin,
      lastEmailSent: newUser.lastEmailSent
    },
    token: 'jwt_xmorf_session_' + Date.now()
  });
});

// GET all registered users (for admin panel #xmadmin)
router.get('/users', (req, res) => {
  const db = readDB();
  const users = (db.users || []).map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar || u.name.substring(0, 2).toUpperCase(),
    password: u.password || '••••••••',
    status: u.status || 'Active',
    createdAt: u.createdAt || 'N/A',
    lastLogin: u.lastLogin || 'N/A',
    lastEmailSent: u.lastEmailSent || 'Never'
  }));

  return res.json({
    success: true,
    users: users,
    totalEmails: (db.emails || []).length
  });
});

// PUT toggle user ban (Active <-> Banned)
router.put('/users/:id/toggle-ban', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const user = db.users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  user.status = user.status === 'Banned' ? 'Active' : 'Banned';
  writeDB(db);

  return res.json({
    success: true,
    message: `User ${user.email} is now ${user.status}.`,
    user: user
  });
});

// PUT change user password (Admin reset)
router.put('/users/:id/change-password', (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ success: false, message: 'New password must be at least 4 characters long.' });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  user.password = newPassword;
  writeDB(db);

  return res.json({
    success: true,
    message: `Password for ${user.email} updated successfully.`
  });
});

module.exports = router;
