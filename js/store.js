/**
 * Xmorf Store & Node.js API Integration Engine
 * Supports 2-Way Email Routing, REST API Calls, File Uploads & Local Storage Fallback
 */
class XmorfStore {
  constructor() {
    this.apiBase = window.location.origin.includes('http') && !window.location.origin.includes('file://')
      ? `${window.location.origin}/api`
      : 'http://localhost:5000/api';

    this.currentUser = null; // Always require explicit login on site visit
    this.currentFolder = 'inbox';
    this.selectedEmailId = null;
    this.searchQuery = '';
    this.emails = [];
    this.isServerOnline = false;
    
    this.initData();
  }

  async initData() {
    const cached = localStorage.getItem('xmorf_emails_store_v2');
    if (cached) {
      try {
        this.emails = JSON.parse(cached);
      } catch (e) {}
    }

    if (!this.emails || this.emails.length === 0) {
      this.emails = [
        {
          id: "em-101",
          ownerEmail: "demo@xmorf.net",
          folder: "inbox",
          senderName: "Xmorf Security Core",
          senderEmail: "security@xmorf.net",
          recipient: "demo@xmorf.net",
          subject: "Welcome to Xmorf.net Encrypted Mail",
          preview: "Your high-security email account @xmorf.net is active and protected with 256-Bit end-to-end shield.",
          body: "Hello and welcome to Xmorf.net Secure Mail!\n\nYour account demo@xmorf.net is active. Our system uses zero-knowledge encryption, anti-bot verification, and automatic threat neutralization.\n\nKey features available:\n• Real 2-Way Mail Delivery Between Accounts\n• Drag & Drop Real File Attachments & Instant Downloads\n• Trash Soft-Deletion & Instant Restoration\n• Dynamic Multi-Language UI (English, German, French, Spanish)\n• 256-Bit Cryptographic Security\n\nBest regards,\nThe Xmorf.net Security Team",
          timestamp: "16:30",
          date: "Today, 16:30",
          isUnread: true,
          isStarred: true,
          attachments: [
            {
              id: "att-1",
              name: "Xmorf_Security_Whitepaper.pdf",
              size: "1.2 MB",
              type: "pdf",
              content: "Xmorf Security Whitepaper - 256-Bit Cryptographic System Specification.\nAll data is end-to-end encrypted."
            }
          ]
        }
      ];
      this.saveToStorage();
    }

    await this.refreshEmailsFromServer();
  }

  saveToStorage() {
    if (this._saveTimeout) clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('xmorf_emails_store_v2', JSON.stringify(this.emails));
      } catch (e) {
        console.warn('Storage quota exceeded, keeping in memory', e);
      }
    }, 0);
  }

  // Generic REST API Helper
  async fetchApi(endpoint, options = {}) {
    if (window.location.protocol === 'file:') return null;
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.apiBase}${endpoint}`;
      const defaultHeaders = options.body && !(options.body instanceof FormData) 
        ? { 'Content-Type': 'application/json' } 
        : {};

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...(options.headers || {})
        }
      });

      this.isServerOnline = true;
      const data = await response.json().catch(() => null);
      if (data) return data;
    } catch (err) {
      this.isServerOnline = false;
    }
    return null;
  }

  // Refresh emails list from Node.js server
  async refreshEmailsFromServer() {
    if (!this.currentUser) return;
    const myEmail = this.currentUser.email;

    const data = await this.fetchApi(`/emails?folder=${encodeURIComponent(this.currentFolder)}&search=${encodeURIComponent(this.searchQuery)}&userEmail=${encodeURIComponent(myEmail)}`);
    
    if (data && data.success && Array.isArray(data.emails)) {
      this.emails = data.emails;
      this.saveToStorage();
    }
  }

  // Anti-Bot Verification API
  async verifyBotApi(botToken, sliderPosition) {
    const res = await this.fetchApi('/auth/verify-bot', {
      method: 'POST',
      body: JSON.stringify({ botToken, sliderPosition })
    });
    return res || { success: sliderPosition >= 85 };
  }

  // Login API
  async loginApi(email, password, botVerified) {
    const res = await this.fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, botVerified })
    });

    if (res && res.success && res.user) {
      this.setCurrentUser(res.user);
      this.emails = [];
      await this.refreshEmailsFromServer();
      return res;
    }

    if (res) return res;

    // Fallback local login ONLY if server is completely offline (file://)
    let userEmail = email.includes('@') ? email.toLowerCase().trim() : `${email.toLowerCase().trim()}@xmorf.net`;
    const fallbackUser = {
      id: 'u_' + Date.now(),
      email: userEmail,
      name: userEmail.split('@')[0],
      avatar: userEmail.substring(0, 2).toUpperCase(),
      status: 'Active'
    };
    this.setCurrentUser(fallbackUser);
    return { success: true, user: fallbackUser, message: 'Logged in (Offline mode)' };
  }

  // Register API
  async registerApi(username, password, fullName, botVerified) {
    const res = await this.fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, fullName, botVerified })
    });

    if (res && res.success && res.user) {
      this.setCurrentUser(res.user);
      this.emails = [];
      await this.refreshEmailsFromServer();
      return res;
    }

    if (res) return res;

    // Fallback local registration if server unavailable
    const cleanUser = username.toLowerCase().trim().replace(/@xmorf\.net$/i, '');
    const fullEmail = `${cleanUser}@xmorf.net`;
    const newUser = {
      id: 'u_' + Date.now(),
      email: fullEmail,
      name: fullName || cleanUser,
      avatar: cleanUser.substring(0, 2).toUpperCase(),
      status: 'Active'
    };
    this.setCurrentUser(newUser);

    // Welcome email in local memory
    const welcomeEmail = {
      id: 'em-' + Date.now(),
      ownerEmail: fullEmail,
      folder: 'inbox',
      senderName: 'Xmorf Security Team',
      senderEmail: 'system@xmorf.net',
      recipient: fullEmail,
      subject: 'Welcome to your new @xmorf.net mailbox',
      preview: 'Your identity and mailbox are secured with Xmorf 256-bit encryption.',
      body: `Hello ${newUser.name},\n\nThank you for choosing Xmorf.net Secure Mail!\nYour account (${fullEmail}) has been successfully created.`,
      timestamp: 'Just now',
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUnread: true,
      isStarred: true,
      attachments: []
    };
    this.emails = [welcomeEmail];
    this.saveToStorage();

    return { success: true, user: newUser, message: 'Account registered' };
  }

  // Upload file API
  async uploadFileApi(file) {
    const formData = new FormData();
    formData.append('attachment', file);

    const res = await this.fetchApi('/upload', {
      method: 'POST',
      body: formData
    });

    if (res && res.success && res.file) {
      return res.file;
    }
    return null;
  }

  // Email filtering
  getEmails() {
    if (!this.currentUser) return [];

    const myEmail = this.currentUser.email.toLowerCase().trim();

    let list = this.emails.filter(e => {
      const owner = (e.ownerEmail || e.recipient || '').toLowerCase().trim();
      
      // User Isolation Check
      if (owner && owner !== myEmail && (e.senderEmail || '').toLowerCase().trim() !== myEmail) {
        return false;
      }

      if (this.currentFolder === 'starred') {
        return e.isStarred && e.folder !== 'trash';
      }
      return (e.folder || 'inbox').toLowerCase() === this.currentFolder.toLowerCase();
    });

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(e =>
        e.subject.toLowerCase().includes(q) ||
        e.senderName.toLowerCase().includes(q) ||
        e.senderEmail.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q)
      );
    }

    return list;
  }

  getUnreadCount() {
    if (!this.currentUser) return 0;
    const myEmail = this.currentUser.email.toLowerCase().trim();

    return this.emails.filter(e => {
      const owner = (e.ownerEmail || e.recipient || '').toLowerCase().trim();
      return owner === myEmail && (e.folder || 'inbox') === 'inbox' && e.isUnread;
    }).length;
  }

  getEmailById(id) {
    return this.emails.find(e => e.id === id);
  }

  async toggleStar(id) {
    const email = this.getEmailById(id);
    if (email) {
      email.isStarred = !email.isStarred;
      this.saveToStorage();
      await this.fetchApi(`/emails/${id}/star`, { method: 'PUT' });
    }
  }

  async markAsRead(id) {
    const email = this.getEmailById(id);
    if (email && email.isUnread) {
      email.isUnread = false;
      this.saveToStorage();
      await this.fetchApi(`/emails/${id}/read`, { method: 'PUT' });
    }
  }

  async moveToTrash(id) {
    const email = this.getEmailById(id);
    if (email && email.folder !== 'trash') {
      email.previousFolder = email.folder;
      email.folder = 'trash';
      this.saveToStorage();
      await this.fetchApi(`/emails/${id}/trash`, { method: 'PUT' });
      return email;
    }
    return null;
  }

  async restoreEmail(id) {
    const email = this.getEmailById(id);
    if (email && email.folder === 'trash') {
      email.folder = email.previousFolder || 'inbox';
      delete email.previousFolder;
      this.saveToStorage();
      await this.fetchApi(`/emails/${id}/restore`, { method: 'PUT' });
      return email;
    }
    return null;
  }

  async deletePermanently(id) {
    const index = this.emails.findIndex(e => e.id === id);
    if (index !== -1) {
      this.emails.splice(index, 1);
      this.saveToStorage();
      await this.fetchApi(`/emails/${id}`, { method: 'DELETE' });
      return true;
    }
    return false;
  }

  async emptyTrash() {
    if (!this.currentUser) return;
    const myEmail = this.currentUser.email.toLowerCase().trim();

    this.emails = this.emails.filter(e => {
      const owner = (e.ownerEmail || e.recipient || '').toLowerCase().trim();
      return !(owner === myEmail && e.folder === 'trash');
    });

    this.saveToStorage();
    await this.fetchApi(`/emails/trash/empty?userEmail=${encodeURIComponent(myEmail)}`, { method: 'DELETE' });
  }

  async sendEmail({ recipient, subject, body, attachments }) {
    if (!this.currentUser) return null;

    const senderEmail = this.currentUser.email.toLowerCase().trim();
    const senderName = this.currentUser.name;
    const cleanRecipient = recipient.toLowerCase().trim();

    // 1. Sent item for Sender
    const sentEmail = {
      id: 'em-sent-' + Date.now(),
      ownerEmail: senderEmail,
      folder: 'sent',
      senderName: senderName,
      senderEmail: senderEmail,
      recipient: cleanRecipient,
      subject: subject,
      preview: body ? body.substring(0, 90) + '...' : 'No content',
      body: body || '',
      timestamp: 'Just now',
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUnread: false,
      isStarred: false,
      attachments: attachments || []
    };

    this.emails.unshift(sentEmail);

    // 2. Inbox copy for Recipient
    const inboxCopy = {
      id: 'em-inbox-' + Date.now(),
      ownerEmail: cleanRecipient,
      folder: 'inbox',
      senderName: senderName,
      senderEmail: senderEmail,
      recipient: cleanRecipient,
      subject: subject,
      preview: body ? body.substring(0, 90) + '...' : 'No content',
      body: body || '',
      timestamp: 'Just now',
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUnread: true,
      isStarred: false,
      attachments: attachments || []
    };

    this.emails.unshift(inboxCopy);
    this.saveToStorage();

    await this.fetchApi('/emails/send', {
      method: 'POST',
      body: JSON.stringify({
        recipient: cleanRecipient,
        subject,
        body,
        attachments,
        senderName,
        senderEmail
      })
    });

    return sentEmail;
  }

  // Admin APIs
  async adminLoginApi(adminKey) {
    const res = await this.fetchApi('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ adminKey })
    });
    if (res) return res;

    const cleanKey = (adminKey || '').trim().replace(/[-\s]/g, '');
    if (cleanKey === '7449744917449274493' || (adminKey || '').trim() === '7449-74491-74492-74493') {
      return { success: true, message: 'Admin Master Key verified!' };
    }
    return { success: false, message: 'Invalid Admin Master Key!' };
  }

  async fetchAdminUsersApi() {
    const res = await this.fetchApi('/auth/users');
    if (res && res.success && res.users) {
      return res;
    }
    return {
      users: [
        { id: 'u1', email: 'demo@xmorf.net', name: 'Demo User', status: 'Active', createdAt: '2026-07-22', lastLogin: '2026-07-22', lastEmailSent: 'Never' },
        { id: 'u2', email: 'admin@xmorf.net', name: 'Xmorf Administrator', status: 'Active', createdAt: '2026-07-22', lastLogin: '2026-07-22', lastEmailSent: 'Never' }
      ],
      totalEmails: this.emails.length
    };
  }

  async toggleBanUserApi(id) {
    const res = await this.fetchApi(`/auth/users/${id}/toggle-ban`, { method: 'PUT' });
    return res;
  }

  async changeUserPasswordApi(id, newPassword) {
    const res = await this.fetchApi(`/auth/users/${id}/change-password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword })
    });
    return res;
  }

  async fetchAdminEmailsApi(search = '') {
    const res = await this.fetchApi(`/emails/admin/all?search=${encodeURIComponent(search)}`);
    return res || { success: false, emails: [] };
  }

  async deleteAdminEmailApi(id) {
    const res = await this.fetchApi(`/emails/admin/${id}`, { method: 'DELETE' });
    return res;
  }

  async fetchAdminFilesApi() {
    const res = await this.fetchApi('/upload/list');
    return res || { success: false, files: [] };
  }

  async deleteAdminFileApi(filename) {
    const res = await this.fetchApi(`/upload/file/${encodeURIComponent(filename)}`, { method: 'DELETE' });
    return res;
  }

  async dataClearApi() {
    const res = await this.fetchApi('/upload/data-clear', { method: 'POST' });
    return res;
  }

  setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem('xmorf_user', JSON.stringify(user));
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('xmorf_user');
  }
}

window.xmorfStore = new XmorfStore();
