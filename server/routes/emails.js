const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { users: [], emails: [] };
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { users: [], emails: [] };
  }
}

function writeDB(db) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write to database JSON file:', err);
  }
}

// GET all emails filtered by user email & folder
router.get('/', (req, res) => {
  const { folder = 'inbox', search = '', userEmail = 'demo@xmorf.net' } = req.query;
  const db = readDB();

  const cleanUserEmail = userEmail.toLowerCase().trim();

  let filtered = db.emails.filter(email => {
    const owner = (email.ownerEmail || email.recipient || '').toLowerCase().trim();
    if (owner && owner !== cleanUserEmail && (email.senderEmail || '').toLowerCase().trim() !== cleanUserEmail) {
      return false;
    }

    if (folder === 'starred') {
      return email.isStarred && email.folder !== 'trash';
    }
    return email.folder.toLowerCase() === folder.toLowerCase();
  });

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(e =>
      e.subject.toLowerCase().includes(q) ||
      e.senderName.toLowerCase().includes(q) ||
      e.senderEmail.toLowerCase().includes(q) ||
      e.body.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    count: filtered.length,
    unreadCount: db.emails.filter(e => (e.ownerEmail || e.recipient) === cleanUserEmail && e.folder === 'inbox' && e.isUnread).length,
    emails: filtered
  });
});

const nodemailer = require('nodemailer');

function getSmtpTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  // Fallback to local Postfix ESMTP engine on localhost:25
  return nodemailer.createTransport({
    host: '127.0.0.1',
    port: 25,
    secure: false,
    tls: { rejectUnauthorized: false }
  });
}

// POST compose & send email with persistent DB storage & optional Real SMTP Routing
router.post('/send', (req, res) => {
  const { recipient, subject, body, attachments = [], senderEmail = 'demo@xmorf.net', senderName = 'Demo User' } = req.body;

  if (!recipient || !subject) {
    return res.status(400).json({ success: false, message: 'Recipient and Subject are required.' });
  }

  const cleanSender = senderEmail.toLowerCase().trim();
  const cleanRecipient = recipient.toLowerCase().trim();
  const db = readDB();

  // 1. Sent email entry for sender
  const sentEmail = {
    id: 'em-sent-' + Date.now(),
    ownerEmail: cleanSender,
    folder: 'sent',
    senderName: senderName,
    senderEmail: cleanSender,
    recipient: cleanRecipient,
    subject: subject,
    preview: body ? body.substring(0, 90) + '...' : 'No content',
    body: body || '',
    timestamp: 'Just now',
    date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isUnread: false,
    isStarred: false,
    attachments: attachments
  };

  db.emails.unshift(sentEmail);

  // 2. Inbox email entry for recipient
  const inboxEmail = {
    id: 'em-inbox-' + Date.now(),
    ownerEmail: cleanRecipient,
    folder: 'inbox',
    senderName: senderName,
    senderEmail: cleanSender,
    recipient: cleanRecipient,
    subject: subject,
    preview: body ? body.substring(0, 90) + '...' : 'No content',
    body: body || '',
    timestamp: 'Just now',
    date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isUnread: true,
    isStarred: false,
    attachments: attachments
  };

  db.emails.unshift(inboxEmail);

  // Update sender user's lastEmailSent timestamp in db.users
  const senderUser = (db.users || []).find(u => u.email.toLowerCase() === cleanSender);
  if (senderUser) {
    senderUser.lastEmailSent = new Date().toISOString();
  }

  // Synchronous atomic write to database file on disk
  writeDB(db);

  // 3. Attempt Real External Email Delivery via SMTP (e.g. to @gmail.com, @discord.com)
  if (cleanRecipient.includes('@') && !cleanRecipient.endsWith('@xmorf.net')) {
    const transporter = getSmtpTransporter();
    if (transporter) {
      transporter.sendMail({
        from: `"${senderName}" <${process.env.SMTP_FROM || cleanSender}>`,
        to: cleanRecipient,
        subject: subject,
        text: body
      }).catch(err => {
        console.warn('Real SMTP delivery warning:', err.message);
      });
    }
  }

  res.json({
    success: true,
    message: 'Email saved to database and sent successfully!',
    email: sentEmail
  });
});

// POST /api/emails/incoming-webhook - Process incoming real emails (from Postfix/SendGrid/IONOS Catchall)
router.post('/incoming-webhook', (req, res) => {
  const { senderEmail, senderName, recipient, subject, body, attachments = [], secret } = req.body;

  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ success: false, message: 'Invalid webhook secret' });
  }

  if (!recipient || !subject) {
    return res.status(400).json({ success: false, message: 'Recipient and subject required.' });
  }

  const cleanRecipient = recipient.toLowerCase().trim();
  const db = readDB();

  const inboxEmail = {
    id: 'em-real-inbox-' + Date.now(),
    ownerEmail: cleanRecipient,
    folder: 'inbox',
    senderName: senderName || senderEmail || 'External Sender',
    senderEmail: senderEmail || 'unknown@external.com',
    recipient: cleanRecipient,
    subject: subject,
    preview: body ? body.substring(0, 90) + '...' : 'No content',
    body: body || '',
    timestamp: 'Just now',
    date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isUnread: true,
    isStarred: false,
    attachments: attachments
  };

  db.emails.unshift(inboxEmail);
  writeDB(db);

  res.json({
    success: true,
    message: `Incoming email for ${cleanRecipient} processed and delivered to Xmorf inbox!`,
    emailId: inboxEmail.id
  });
});

// GET all emails in system (for Admin Email Inspector)
router.get('/admin/all', (req, res) => {
  const { search = '' } = req.query;
  const db = readDB();
  let list = db.emails || [];

  if (search) {
    const q = search.toLowerCase().trim();
    list = list.filter(e =>
      (e.subject || '').toLowerCase().includes(q) ||
      (e.senderName || '').toLowerCase().includes(q) ||
      (e.senderEmail || '').toLowerCase().includes(q) ||
      (e.recipient || '').toLowerCase().includes(q) ||
      (e.body || '').toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    totalCount: list.length,
    emails: list
  });
});

// DELETE admin delete any email permanently
router.delete('/admin/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.emails.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Email not found.' });
  }

  db.emails.splice(index, 1);
  writeDB(db);

  res.json({
    success: true,
    message: 'Email permanently deleted by Administrator.'
  });
});

// PUT toggle star status
router.put('/:id/star', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const email = db.emails.find(e => e.id === id);

  if (!email) {
    return res.status(404).json({ success: false, message: 'Email not found.' });
  }

  email.isStarred = !email.isStarred;
  writeDB(db);

  res.json({ success: true, isStarred: email.isStarred });
});

// PUT mark as read
router.put('/:id/read', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const email = db.emails.find(e => e.id === id);

  if (email) {
    email.isUnread = false;
    writeDB(db);
  }

  res.json({ success: true });
});

// PUT soft delete email (Move to Trash)
router.put('/:id/trash', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const email = db.emails.find(e => e.id === id);

  if (!email) {
    return res.status(404).json({ success: false, message: 'Email not found.' });
  }

  if (email.folder !== 'trash') {
    email.previousFolder = email.folder;
    email.folder = 'trash';
  }

  writeDB(db);

  res.json({
    success: true,
    message: 'Email moved to Trash in database.',
    email: email
  });
});

// PUT restore email from Trash back to Inbox / original folder
router.put('/:id/restore', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const email = db.emails.find(e => e.id === id);

  if (!email) {
    return res.status(404).json({ success: false, message: 'Email not found.' });
  }

  email.folder = email.previousFolder || 'inbox';
  delete email.previousFolder;

  writeDB(db);

  res.json({
    success: true,
    message: `Email restored to ${email.folder} in database.`,
    email: email
  });
});

// DELETE permanent deletion from Trash
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.emails.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Email not found.' });
  }

  db.emails.splice(index, 1);
  writeDB(db);

  res.json({
    success: true,
    message: 'Email permanently deleted from database.'
  });
});

// DELETE empty trash folder
router.delete('/trash/empty', (req, res) => {
  const { userEmail = '' } = req.query;
  const db = readDB();
  const clean = userEmail.toLowerCase().trim();

  if (clean) {
    db.emails = db.emails.filter(e => {
      const owner = (e.ownerEmail || e.recipient || '').toLowerCase().trim();
      return !(owner === clean && e.folder === 'trash');
    });
  } else {
    db.emails = db.emails.filter(e => e.folder !== 'trash');
  }

  writeDB(db);

  res.json({
    success: true,
    message: 'Trash emptied in database.'
  });
});

module.exports = router;
