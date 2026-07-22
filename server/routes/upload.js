const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
const DB_PATH = path.join(__dirname, '../data/db.json');
const PURGE_TEXT = 'this file got purged on a data purge';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB strict limit per file
});

// Single or multi file upload
router.post('/', (req, res) => {
  upload.any()(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size limit exceeded! Maximum allowed size is 2 MB.'
        });
      }
      return res.status(400).json({ success: false, message: err.message || 'File upload failed.' });
    }

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const formatSize = (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const processedFiles = files.map(file => {
      const fileExt = path.extname(file.originalname).toLowerCase().replace('.', '');
      let fileType = 'document';
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(fileExt)) fileType = 'image';
      if (fileExt === 'pdf') fileType = 'pdf';
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExt)) fileType = 'archive';

      return {
        id: 'att-' + Date.now() + '-' + Math.round(Math.random() * 1000),
        name: file.originalname,
        size: formatSize(file.size),
        type: fileType,
        filename: file.filename,
        url: `/api/uploads/${file.filename}`
      };
    });

    res.json({
      success: true,
      file: processedFiles[0],
      files: processedFiles
    });
  });
});

// GET /api/upload/list - List all uploaded files on server (for Admin)
router.get('/list', (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    const fileList = files.map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stat = fs.statSync(filePath);
      return {
        filename: filename,
        sizeBytes: stat.size,
        size: stat.size < 1024 ? stat.size + ' B' : (stat.size / 1024 < 1024 ? (stat.size / 1024).toFixed(1) + ' KB' : (stat.size / (1024 * 1024)).toFixed(2) + ' MB'),
        createdAt: stat.birthtime.toISOString(),
        modifiedAt: stat.mtime.toISOString(),
        url: `/api/uploads/${filename}`
      };
    });

    res.json({
      success: true,
      totalFiles: fileList.length,
      files: fileList
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to read upload directory.' });
  }
});

// DELETE /api/upload/file/:filename - Physically delete file from disk & update DB
router.delete('/file/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update db.json attachments
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      const db = JSON.parse(data);
      if (Array.isArray(db.emails)) {
        db.emails.forEach(email => {
          if (Array.isArray(email.attachments)) {
            email.attachments.forEach(att => {
              if (att.filename === filename || att.url?.includes(filename)) {
                att.purged = true;
                att.name = PURGE_TEXT;
                att.content = PURGE_TEXT;
                att.size = '0 B';
              }
            });
          }
        });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    }

    return res.json({ success: true, message: `File ${filename} physically deleted from disk.` });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to delete file.' });
  }
});

// POST /api/upload/data-clear - Global Data Purge (Physically delete all files & update DB)
router.post('/data-clear', (req, res) => {
  try {
    let deletedFilesCount = 0;

    // 1. Physically delete all files in server/uploads/
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      files.forEach(filename => {
        const filePath = path.join(uploadDir, filename);
        try {
          if (fs.lstatSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
            deletedFilesCount++;
          }
        } catch (e) {}
      });
    }

    // 2. Update db.json to mark all attachments as purged
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      const db = JSON.parse(data);

      if (Array.isArray(db.emails)) {
        db.emails.forEach(email => {
          if (Array.isArray(email.attachments)) {
            email.attachments.forEach(att => {
              att.purged = true;
              att.name = PURGE_TEXT;
              att.content = PURGE_TEXT;
              att.size = '0 B';
            });
          }
        });
      }

      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    }

    res.json({
      success: true,
      message: `DATA PURGE EXECUTED: All ${deletedFilesCount} physical files deleted from server disk. Database attachments marked with "${PURGE_TEXT}".`,
      clearedFilesCount: deletedFilesCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to execute Data Purge.' });
  }
});

module.exports = router;
