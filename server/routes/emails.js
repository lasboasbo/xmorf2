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

function cleanEmailAddress(str) {
  if (!str) return '';
  const match = String(str).match(/<([^>]+)>/);
  return (match ? match[1] : str).toLowerCase().trim();
}

function getGermanFormattedDate() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} um ${timeStr}`;
}

// GET all emails filtered by user email & folder
router.get('/', (req, res) => {
  const { folder = 'inbox', search = '', userEmail = 'demo@xmorf.net' } = req.query;
  const db = readDB();

  const cleanUserEmail = cleanEmailAddress(userEmail);

  let filtered = (db.emails || []).filter(email => {
    const owner = cleanEmailAddress(email.ownerEmail || email.recipient);
    const recipient = cleanEmailAddress(email.recipient);
    const sender = cleanEmailAddress(email.senderEmail);

    const isOwner = owner === cleanUserEmail;
    const isRecipient = recipient === cleanUserEmail;
    const isSender = sender === cleanUserEmail;
    const isDemoCatchall = (cleanUserEmail === 'demo@xmorf.net' && (!owner || owner === 'demo@xmorf.net'));

    if (!isOwner && !isRecipient && !isSender && !isDemoCatchall) {
      return false;
    }

    if (folder === 'starred') {
      return email.isStarred && (email.folder || 'inbox') !== 'trash';
    }
    return (email.folder || 'inbox').toLowerCase() === folder.toLowerCase();
  });

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(e =>
      (e.subject || '').toLowerCase().includes(q) ||
      (e.senderName || '').toLowerCase().includes(q) ||
      (e.senderEmail || '').toLowerCase().includes(q) ||
      (e.body || '').toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    count: filtered.length,
    unreadCount: (db.emails || []).filter(e => {
      const owner = cleanEmailAddress(e.ownerEmail || e.recipient);
      return owner === cleanUserEmail && (e.folder || 'inbox') === 'inbox' && e.isUnread;
    }).length,
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

  const germanDateStr = getGermanFormattedDate();

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
    formattedDate: germanDateStr,
    timestamp: germanDateStr,
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
    formattedDate: germanDateStr,
    timestamp: germanDateStr,
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
      const formattedAttachments = (attachments || []).map(att => {
        if (att.filename) {
          const filePath = path.join(__dirname, '../uploads', att.filename);
          if (fs.existsSync(filePath)) {
            return {
              filename: att.name || att.filename,
              path: filePath
            };
          }
        }
        if (att.content && typeof att.content === 'string') {
          if (att.content.startsWith('data:')) {
            const matches = att.content.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
              return {
                filename: att.name || 'attachment',
                content: Buffer.from(matches[2], 'base64')
              };
            }
          } else {
            return {
              filename: att.name || 'attachment',
              content: att.content
            };
          }
        }
        return null;
      }).filter(Boolean);

      transporter.sendMail({
        from: `"${senderName}" <${process.env.SMTP_FROM || cleanSender}>`,
        to: cleanRecipient,
        subject: subject,
        text: body,
        attachments: formattedAttachments
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

  const cleanRecipient = cleanEmailAddress(recipient);
  const cleanSender = cleanEmailAddress(senderEmail);
  const db = readDB();

  // Check if a registered user exists for this recipient
  const targetUser = (db.users || []).find(u => cleanEmailAddress(u.email) === cleanRecipient);
  // Catch-all: if recipient user doesn't exist, deliver to demo@xmorf.net so external emails are never lost
  const ownerEmail = targetUser ? cleanRecipient : (cleanRecipient.endsWith('@xmorf.net') ? 'demo@xmorf.net' : cleanRecipient);

  // Process attachments if raw base64 content is sent from mail-pipe
  const processedAttachments = (attachments || []).map(att => {
    if (att.content && typeof att.content === 'string') {
      try {
        const uniqueFilename = Date.now() + '-' + Math.round(Math.random() * 1e9) + '-' + (att.name || 'file');
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, uniqueFilename);
        fs.writeFileSync(filePath, Buffer.from(att.content, 'base64'));

        const formatSize = (bytes) => {
          if (!bytes) return '0 B';
          if (bytes < 1024) return bytes + ' B';
          if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
          return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        };

        const fileExt = path.extname(att.name || '').toLowerCase().replace('.', '');
        let fileType = 'document';
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(fileExt)) fileType = 'image';
        if (fileExt === 'pdf') fileType = 'pdf';
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExt)) fileType = 'archive';

        return {
          id: 'att-' + Date.now() + '-' + Math.round(Math.random() * 1000),
          name: att.name || 'attachment',
          size: formatSize(att.size || 0),
          type: fileType,
          filename: uniqueFilename,
          url: `/api/uploads/${uniqueFilename}`
        };
      } catch (err) {
        console.error('Failed to save incoming attachment:', err);
        return null;
      }
    }
    return att;
  }).filter(Boolean);

  const germanDateStr = getGermanFormattedDate();

  const inboxEmail = {
    id: 'em-real-inbox-' + Date.now(),
    ownerEmail: ownerEmail,
    folder: 'inbox',
    senderName: senderName || senderEmail || 'External Sender',
    senderEmail: senderEmail || 'unknown@external.com',
    recipient: cleanRecipient,
    subject: subject,
    preview: body ? body.substring(0, 90).replace(/[\r\n]+/g, ' ') + '...' : 'No content',
    body: body || '',
    formattedDate: germanDateStr,
    timestamp: germanDateStr,
    date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isUnread: true,
    isStarred: false,
    attachments: processedAttachments
  };

  db.emails.unshift(inboxEmail);
  writeDB(db);

  res.json({
    success: true,
    message: `Incoming email for ${cleanRecipient} processed and delivered to ${ownerEmail}!`,
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
