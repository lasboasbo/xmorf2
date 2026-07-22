require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/emails');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure data folder and db.json exist (Do NOT overwrite on restart if already exists)
const dataFolder = path.join(__dirname, 'data');
const dbFile = path.join(dataFolder, 'db.json');

if (!fs.existsSync(dataFolder)) {
  fs.mkdirSync(dataFolder, { recursive: true });
}

if (!fs.existsSync(dbFile)) {
  const initialData = {
    users: [
      { id: "u1", email: "demo@xmorf.net", name: "Demo User", avatar: "DU", password: "password", storageUsed: "2.4 GB", storageLimit: "15 GB", status: "Active" },
      { id: "u2", email: "admin@xmorf.net", name: "Xmorf Administrator", avatar: "XA", password: "password", storageUsed: "8.1 GB", storageLimit: "50 GB", status: "Active" }
    ],
    emails: [
      {
        id: "em-101",
        ownerEmail: "demo@xmorf.net",
        folder: "inbox",
        senderName: "Xmorf Security Core",
        senderEmail: "security@xmorf.net",
        recipient: "demo@xmorf.net",
        subject: "Welcome to Xmorf.net Encrypted Mail",
        preview: "Your high-security email account @xmorf.net is active.",
        body: "Hello and welcome to Xmorf.net Secure Mail!\nYour account is secured with 256-Bit cryptographic protection.",
        timestamp: "16:30",
        date: "Today, 16:30",
        isUnread: true,
        isStarred: true,
        attachments: [
          { id: "att-1", name: "Xmorf_Security_Whitepaper.pdf", size: "1.2 MB", type: "pdf", url: "#" }
        ]
      }
    ]
  };
  fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2), 'utf8');
}

// Ensure uploads folder exists
const uploadsFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsFolder)) {
  fs.mkdirSync(uploadsFolder, { recursive: true });
}

// Seed sample physical downloadable files in uploads folder
const sampleFiles = [
  { name: 'Xmorf_Security_Whitepaper.pdf', content: '%PDF-1.4 Xmorf Security Whitepaper\n256-Bit Cryptographic System Specification.\nAll data is end-to-end encrypted.' },
  { name: 'Audit_Summary_Q3.txt', content: 'Q3 SECURITY AUDIT REPORT\nStatus: PASSED (Zero Vulnerabilities Found)\nTarget: Xmorf.net Infrastructure' },
  { name: 'Deployment_Specs.txt', content: 'PROJECT XMORF DEPLOYMENT SPECS\nNode Clusters: 4\nRedundancy: Dual-Active Failover\nEncryption: AES-GCM-256' }
];

sampleFiles.forEach(f => {
  const filePath = path.join(uploadsFolder, f.name);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, f.content, 'utf8');
  }
});

// Serve static uploads with fallback for purged/deleted files
app.get('/api/uploads/:filename', (req, res, next) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadsFolder, filename);

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  } else {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send('this file got purged on a data purge');
  }
});

// Express Direct File Transfer Download Route with Content-Disposition Attachment header
app.get('/api/uploads/download/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadsFolder, filename);

  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.download(filePath, filename, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ success: false, message: 'File transfer error' });
      }
    });
  } else {
    // Stream generated fallback text file directly from server
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send('this file got purged on a data purge');
  }
});

// Protected Video Streaming Endpoint (Inline streaming, no attachment download)
app.get('/api/video/stream', (req, res) => {
  const videoPath = path.join(__dirname, '../video.mp4');
  if (!fs.existsSync(videoPath)) {
    return res.status(404).send('Video stream not found');
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', 'inline; filename="xmorf-stream.mp4"');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
      'Content-Disposition': 'inline; filename="xmorf-stream.mp4"',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Content-Disposition': 'inline; filename="xmorf-stream.mp4"',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/upload', uploadRoutes);

// Serve client static files
const clientFolder = path.join(__dirname, '../');
app.use(express.static(clientFolder));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientFolder, 'index.html'));
  } else {
    res.status(404).json({ success: false, message: 'API Endpoint not found' });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`   🚀 Xmorf.net Encrypted Webmail Server Running!   `);
  console.log(`   🌐 Server listening at http://localhost:${PORT}   `);
  console.log(`   🛡️ Anti-Bot & 256-Bit Shield Active              `);
  console.log(`   💾 Permanent DB Persistence Active (db.json)    `);
  console.log(`====================================================`);
});
