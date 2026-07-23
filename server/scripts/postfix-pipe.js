const fs = require('fs');
const path = require('path');
const { simpleParser } = require('mailparser');

const DB_PATH = path.join(__dirname, '../data/db.json');
const UPLOAD_DIR = path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

let rawEmail = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { rawEmail += chunk; });
process.stdin.on('end', async () => {
  try {
    const parsed = await simpleParser(rawEmail);

    const senderEmail = (parsed.from && parsed.from.value && parsed.from.value[0] && parsed.from.value[0].address)
      ? parsed.from.value[0].address.toLowerCase().trim()
      : 'external@xmorf.net';

    const senderName = (parsed.from && parsed.from.value && parsed.from.value[0] && parsed.from.value[0].name)
      ? parsed.from.value[0].name
      : senderEmail.split('@')[0];

    let recipient = process.argv[2] || (parsed.to && parsed.to.value && parsed.to.value[0] ? parsed.to.value[0].address : 'demo@xmorf.net');
    recipient = recipient.replace(/^<|>$/g, '').toLowerCase().trim();

    const subject = parsed.subject || '(No Subject)';
    const body = parsed.text || parsed.html || 'No content';

    const attachments = [];
    if (parsed.attachments && parsed.attachments.length > 0) {
      for (const att of parsed.attachments) {
        const uniqueFilename = Date.now() + '-' + Math.round(Math.random() * 1e9) + '-' + (att.filename || 'file');
        const filePath = path.join(UPLOAD_DIR, uniqueFilename);
        fs.writeFileSync(filePath, att.content);

        const formatSize = (bytes) => {
          if (bytes < 1024) return bytes + ' B';
          if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
          return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        };

        const fileExt = path.extname(att.filename || '').toLowerCase().replace('.', '');
        let fileType = 'document';
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(fileExt)) fileType = 'image';
        if (fileExt === 'pdf') fileType = 'pdf';
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExt)) fileType = 'archive';

        attachments.push({
          id: 'att-' + Date.now() + '-' + Math.round(Math.random() * 1000),
          name: att.filename || 'attachment',
          size: formatSize(att.size || att.content.length),
          type: fileType,
          filename: uniqueFilename,
          url: `/api/uploads/${uniqueFilename}`
        });
      }
    }

    // Insert into db.json
    let db = { users: [], emails: [] };
    if (fs.existsSync(DB_PATH)) {
      try {
        db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      } catch(e){}
    }
    if (!Array.isArray(db.emails)) db.emails = [];

    const newInboxEmail = {
      id: 'em-inbound-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      ownerEmail: recipient,
      folder: 'inbox',
      senderName: senderName,
      senderEmail: senderEmail,
      recipient: recipient,
      subject: subject,
      preview: body ? body.substring(0, 90).replace(/[\r\n]+/g, ' ') + '...' : 'No content',
      body: body,
      timestamp: 'Just now',
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUnread: true,
      isStarred: false,
      attachments: attachments
    };

    db.emails.unshift(newInboxEmail);
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log(`Inbound email successfully saved to inbox for ${recipient} from ${senderEmail}`);
  } catch (err) {
    console.error('Error processing inbound email pipe:', err);
  }
});
