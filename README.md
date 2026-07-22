# 🛡️ Xmorf.net Encrypted Webmail Platform

**Xmorf.net** is a high-security, 256-bit encrypted webmail platform featuring real 2-way email delivery (Gmail, Discord, Outlook, etc.), anti-bot verification sliders, full mobile responsiveness, 2 MB strict attachment upload controls, and a confidential Admin Overseer Control Panel.

---

## 📁 Clean Repository Structure

```
xmorf/
├── index.html           # Main Frontend Single Page Webmail Application
├── styles.css           # Modern Cyberpunk CSS Design System & Mobile Responsive Rules
├── logo.png             # Official Xmorf Brand Logo
├── setup-ubuntu.sh      # 1-Click Production VPS Deployer for Ubuntu 22.04/24.04/26.04 LTS
├── fix.sh               # 1-Click Production Repair & Update Utility
├── .gitignore           # Git Exclude Rules
├── js/                  # Frontend Logic Modules
│   ├── app.js           # UI Navigation, Mobile View Transitions & Admin Interactions
│   ├── store.js         # REST API Integration Engine & Local Storage Synchronization
│   ├── antibot.js       # Anti-Bot Drag-to-Verify Slider Controls
│   ├── i18n.js          # Multi-Language Localization Engine (EN, DE, FR, ES)
│   └── icons.js         # SVG Vector Icon Registry
└── server/              # Node.js Express Production Backend
    ├── server.js        # Express HTTP Server, Static Routes & File Downloads
    ├── data/
    │   └── db.json      # Permanent JSON Database (Users, Emails & Audit Logs)
    ├── routes/
    │   ├── auth.js      # Auth, Admin Master Key Verification, User Ban & Password Resets
    │   ├── emails.js    # Send/Receive REST Endpoints & Real Mail Webhook Processing
    │   └── upload.js    # 2MB File Attachment Uploads & DATA CLEAR Purge Engine
    ├── scripts/
    │   └── mail-pipe.js # Postfix Mail Parser Pipeline Script
    └── uploads/         # Server File Storage Folder
```

---

## 🔑 Secret Admin Overseer Panel (#xmadmin)

- **URL:** `https://xmorf.net/#xmadmin`
- **Default Master Key:** `1234-5678-9012-3456`
- **Features:**
  - View all user accounts with passwords, creation dates, last login, and last email sent timestamps.
  - Ban / Unban any user (banned users are blocked at login with 403 status).
  - Reset / Change user passwords directly.
  - Global Email Inspector: Search all system emails and delete any email.
  - File Storage Manager & **DATA CLEAR**: Overwrite all uploaded files on server disk with `"this data got deletet on a data clear"`.

---

## 🚀 Production Deployment Commands (IONOS Ubuntu VPS)

### 1-Click Deployment Command:
```bash
cd /var/www/xmorf && bash setup-ubuntu.sh xmorf.net 217.160.188.228
```

### 1-Click Quick Update Command:
```bash
curl -fsSL https://raw.githubusercontent.com/lasboasbo/xmorf2/main/fix.sh | bash
```

---

## ⚙️ IONOS DNS Records for `xmorf.net`

| Record Type | Host / Name | Target / Value | Priority |
| :--- | :--- | :--- | :--- |
| **A Record** | `@` | `217.160.188.228` | - |
| **A Record** | `mail` | `217.160.188.228` | - |
| **MX Record** | `@` | `mail.xmorf.net` | `10` |
| **TXT Record** | `@` | `v=spf1 mx ip4:217.160.188.228 ~all` | - |
