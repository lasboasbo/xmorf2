const http = require('http');

let rawData = '';
process.stdin.on('data', chunk => { rawData += chunk; });
process.stdin.on('end', () => {
  try {
    const lines = rawData.split(/\r?\n/);
    let sender = 'external@unknown.com';
    let recipient = 'demo@xmorf.net';
    let subject = 'Incoming External Mail';
    let bodyLines = [];
    let isBody = false;

    for (let line of lines) {
      if (!isBody) {
        if (line.toLowerCase().startsWith('from:')) {
          const match = line.match(/<([^>]+)>/);
          sender = match ? match[1] : line.substring(5).trim();
        }
        if (line.toLowerCase().startsWith('to:')) {
          const match = line.match(/<([^>]+)>/);
          recipient = match ? match[1] : line.substring(3).trim();
        }
        if (line.toLowerCase().startsWith('subject:')) {
          subject = line.substring(8).trim();
        }
        if (line.trim() === '') {
          isBody = true;
        }
      } else {
        bodyLines.push(line);
      }
    }

    // Clean recipient email address
    recipient = recipient.replace(/^[^<]*</, '').replace(/>.*$/, '').trim();

    let fullBody = bodyLines.join('\n').trim();
    if (!fullBody) fullBody = rawData.substring(0, 3000);

    const payload = JSON.stringify({
      senderEmail: sender,
      senderName: sender.split('@')[0],
      recipient: recipient,
      subject: subject || 'Incoming Mail',
      body: fullBody.substring(0, 8000),
      secret: 'xmorf_secret_webhook_key'
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/emails/incoming-webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    });

    req.on('error', (e) => {
      console.error('Mail pipe webhook request error:', e);
    });

    req.write(payload);
    req.end();
  } catch (err) {
    console.error('Mail pipe parsing error:', err);
  }
});
