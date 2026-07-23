const http = require('http');
const { simpleParser } = require('mailparser');

let chunks = [];
process.stdin.on('data', chunk => { chunks.push(chunk); });
process.stdin.on('end', async () => {
  try {
    const rawBuffer = Buffer.concat(chunks);
    let parsed = {};
    try {
      parsed = await simpleParser(rawBuffer);
    } catch (parseErr) {
      console.error('mailparser error, falling back to basic extraction:', parseErr.message);
    }

    let argRecipient = process.argv[2];
    let argSender = process.argv[3];

    let parsedRecipient = (parsed.to && parsed.to.value && parsed.to.value[0] ? parsed.to.value[0].address : null);
    let parsedSender = (parsed.from && parsed.from.value && parsed.from.value[0] ? parsed.from.value[0].address : null);
    let parsedSenderName = (parsed.from && parsed.from.value && parsed.from.value[0] && parsed.from.value[0].name) ? parsed.from.value[0].name : null;

    let recipient = (argRecipient || parsedRecipient || 'demo@xmorf.net').replace(/^<|>$/g, '').trim().toLowerCase();
    let sender = (argSender || parsedSender || 'external@unknown.com').replace(/^<|>$/g, '').trim().toLowerCase();
    let senderName = parsedSenderName || (sender.includes('@') ? sender.split('@')[0] : sender);

    const subject = parsed.subject || '(No Subject)';
    let body = parsed.text || parsed.html || rawBuffer.toString('utf8').substring(0, 5000);

    const attachments = [];
    if (parsed.attachments && parsed.attachments.length > 0) {
      for (const att of parsed.attachments) {
        if (att.content) {
          attachments.push({
            name: att.filename || 'attachment',
            size: att.size || att.content.length,
            content: att.content.toString('base64')
          });
        }
      }
    }

    const payload = JSON.stringify({
      senderEmail: sender,
      senderName: senderName,
      recipient: recipient,
      subject: subject,
      body: body,
      attachments: attachments,
      secret: process.env.WEBHOOK_SECRET || 'xmorf_secret_webhook_key'
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: process.env.PORT || 5000,
      path: '/api/emails/incoming-webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    });

    req.on('error', (e) => {
      console.error('Mail pipe webhook request error:', e.message);
    });

    req.write(payload);
    req.end();
  } catch (err) {
    console.error('Mail pipe overall error:', err);
  }
});

