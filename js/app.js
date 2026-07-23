/**
 * Xmorf.net Web Application Controller
 * Handles UI, Auth, Anti-Bot, Strong Password Verification,
 * Spam Cooldown Rate Limiting, and Secret Admin Dashboard (#xmadmin).
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const authScreen = document.getElementById('authScreen');
  const appDashboard = document.getElementById('appDashboard');
  const adminDashboard = document.getElementById('adminDashboard');
  
  // Auth Form Elements
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  // Password Strength Meter Elements
  const regPassword = document.getElementById('regPassword');
  const passStrengthFill = document.getElementById('passStrengthFill');
  const reqLength = document.getElementById('reqLength');
  const reqUpper = document.getElementById('reqUpper');
  const reqNumber = document.getElementById('reqNumber');
  const reqSpecial = document.getElementById('reqSpecial');

  // App UI Elements
  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');
  const emailList = document.getElementById('emailList');
  const emailReaderPane = document.getElementById('emailReaderPane');
  const unreadBadgeCount = document.getElementById('unreadBadgeCount');
  const currentFolderName = document.getElementById('currentFolderName');
  const searchInput = document.getElementById('searchInput');
  const btnCompose = document.getElementById('btnCompose');
  const btnLogout = document.getElementById('btnLogout');
  const btnEmptyTrash = document.getElementById('btnEmptyTrash');
  const btnExitAdmin = document.getElementById('btnExitAdmin');
  
  // Compose Modal & File Upload Elements
  const composeModal = document.getElementById('composeModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnCancelCompose = document.getElementById('btnCancelCompose');
  const composeForm = document.getElementById('composeForm');
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const attachedFilesContainer = document.getElementById('attachedFilesContainer');

  let currentAttachments = [];
  let loginAntiBot = null;
  let regAntiBot = null;

  // Rate Limiting & Cooldown System
  const sendHistory = [];
  let cooldownUntil = 0;
  let botBlockCount = 148;

  // Initialize Anti-Bot Verification widgets
  function initAntiBotWidgets() {
    loginAntiBot = new window.AntiBotSecurity('loginAntibotContainer', () => {
      showToast('Human verification complete! You can now sign in.');
    });

    regAntiBot = new window.AntiBotSecurity('regAntibotContainer', () => {
      showToast('Human verification complete!');
    });
  }

  initAntiBotWidgets();
  window.i18n.updateDOM();

  // View Switchers between Landing Info Page and Auth Card View
  const landingView = document.getElementById('landingView');
  const authCardView = document.getElementById('authCardView');
  const btnGoToWebmail = document.getElementById('btnGoToWebmail');
  const btnQuickLogin = document.getElementById('btnQuickLogin');
  const btnQuickRegister = document.getElementById('btnQuickRegister');
  const btnBackToLanding = document.getElementById('btnBackToLanding');

  function showAuthCard(mode = 'login') {
    if (landingView) landingView.classList.add('hidden');
    if (authCardView) authCardView.classList.remove('hidden');
    if (mode === 'register') {
      tabRegister.click();
    } else {
      tabLogin.click();
    }
  }

  function showLandingInfo() {
    if (authCardView) authCardView.classList.add('hidden');
    if (landingView) landingView.classList.remove('hidden');
  }

  if (btnGoToWebmail) btnGoToWebmail.addEventListener('click', () => showAuthCard('login'));
  if (btnQuickLogin) btnQuickLogin.addEventListener('click', () => showAuthCard('login'));
  if (btnQuickRegister) btnQuickRegister.addEventListener('click', () => showAuthCard('register'));
  if (btnBackToLanding) btnBackToLanding.addEventListener('click', showLandingInfo);

  // Protected Video Player & Auto-Unmute Audio Handler
  const landingVideo = document.getElementById('landingVideo');
  const btnToggleSound = document.getElementById('btnToggleSound');
  const soundIconMuted = document.getElementById('soundIconMuted');
  const soundIconUnmuted = document.getElementById('soundIconUnmuted');
  const soundBtnText = document.getElementById('soundBtnText');

  function toggleVideoSound() {
    if (!landingVideo) return;
    landingVideo.muted = !landingVideo.muted;
    if (landingVideo.muted) {
      soundIconMuted?.classList.remove('hidden');
      soundIconUnmuted?.classList.add('hidden');
      if (soundBtnText) soundBtnText.innerText = 'Enable Sound / Audio';
    } else {
      soundIconMuted?.classList.add('hidden');
      soundIconUnmuted?.classList.remove('hidden');
      if (soundBtnText) soundBtnText.innerText = 'Sound Enabled';
    }
  }

  if (btnToggleSound) {
    btnToggleSound.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleVideoSound();
    });
  }

  // Auto-unmute sound on first user touch/click gesture anywhere on landing page
  const enableAudioOnUserGesture = () => {
    if (landingVideo && landingVideo.muted) {
      landingVideo.muted = false;
      landingVideo.play().catch(() => {});
      soundIconMuted?.classList.add('hidden');
      soundIconUnmuted?.classList.remove('hidden');
      if (soundBtnText) soundBtnText.innerText = 'Sound Enabled';
    }
  };

  window.addEventListener('click', enableAudioOnUserGesture, { once: true });
  window.addEventListener('touchstart', enableAudioOnUserGesture, { once: true });

  // Route & View Manager (/xmadmin, #xmadmin, or ?xmadmin Secret router)
  function handleRouting() {
    const urlStr = (window.location.href + ' ' + window.location.hash).toLowerCase();
    const isSecretAdmin = urlStr.includes('xmadmin');

    if (isSecretAdmin) {
      authScreen.classList.add('hidden');
      appDashboard.classList.add('hidden');
      adminDashboard.classList.remove('hidden');

      const adminAuthOverlay = document.getElementById('adminAuthOverlay');
      const adminContent = document.getElementById('adminContent');

      if (!isAdminUnlocked) {
        adminAuthOverlay.classList.remove('hidden');
        adminContent.classList.add('hidden');
        const keyInput = document.getElementById('adminKeyInput');
        if (keyInput) keyInput.value = '';
      } else {
        adminAuthOverlay.classList.add('hidden');
        adminContent.classList.remove('hidden');
        renderAdminDashboard();
      }
      logSecurityEvent('[ADMIN ACCESS] Overseer panel route triggered.');
    } else {
      adminDashboard.classList.add('hidden');
      if (window.xmorfStore.currentUser) {
        enterDashboard();
      } else {
        authScreen.classList.remove('hidden');
        appDashboard.classList.add('hidden');

        if (urlStr.includes('login') || urlStr.includes('register')) {
          showAuthCard(urlStr.includes('register') ? 'register' : 'login');
        }
      }
    }
  }

  // Bind router to hashchange, popstate & execute on initial load
  window.addEventListener('hashchange', handleRouting);
  window.addEventListener('popstate', handleRouting);
  handleRouting();

  // Admin Master Key Form Submission
  const adminAuthForm = document.getElementById('adminAuthForm');
  if (adminAuthForm) {
    adminAuthForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const keyInput = document.getElementById('adminKeyInput');
      const key = keyInput ? keyInput.value : '';

      const res = await window.xmorfStore.adminLoginApi(key);
      if (res && res.success) {
        isAdminUnlocked = true;
        if (keyInput) keyInput.value = '';
        showToast('Admin Master Key Verified! Overseer Unlocked.');
        handleRouting();
      } else {
        showToast((res && res.message) || 'Invalid Admin Master Key!', 'error');
      }
    });
  }

  // Mobile Drawer Toggle & View Switching
  const btnMobileMenu = document.getElementById('btnMobileMenu');
  const sidebar = document.querySelector('.sidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const mainContent = document.querySelector('.main-content');

  if (btnMobileMenu) {
    btnMobileMenu.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar-open');
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => {
      sidebar.classList.remove('sidebar-open');
    });
  }

  // Strong Password Checker
  regPassword.addEventListener('input', () => {
    const val = regPassword.value;
    const hasLen = val.length >= 8;
    const hasUpper = /[A-Z]/.test(val);
    const hasNum = /[0-9]/.test(val);
    const hasSpec = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val);

    updateReqItem(reqLength, hasLen);
    updateReqItem(reqUpper, hasUpper);
    updateReqItem(reqNumber, hasNum);
    updateReqItem(reqSpecial, hasSpec);

    const validCount = [hasLen, hasUpper, hasNum, hasSpec].filter(Boolean).length;

    passStrengthFill.className = 'pass-strength-fill';
    if (validCount <= 1 && val.length > 0) {
      passStrengthFill.classList.add('weak');
    } else if (validCount <= 3 && val.length > 0) {
      passStrengthFill.classList.add('medium');
    } else if (validCount === 4) {
      passStrengthFill.classList.add('strong');
    }
  });

  function updateReqItem(el, isValid) {
    if (isValid) {
      el.classList.add('valid');
      el.querySelector('span').textContent = '✓';
    } else {
      el.classList.remove('valid');
      el.querySelector('span').textContent = '✖';
    }
  }

  function isStrongPassword(val) {
    return val.length >= 8 && /[A-Z]/.test(val) && /[0-9]/.test(val) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val);
  }

  // Auth Tab Switching
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    if (loginAntiBot) loginAntiBot.reset();
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    if (regAntiBot) regAntiBot.reset();
  });

  // Language Switcher Buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      window.i18n.setLanguage(lang);
      renderDashboard();
    });
  });

  // Login Form Submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!loginAntiBot || !loginAntiBot.isVerified) {
      showToast(window.i18n.get('botError'), 'error');
      botBlockCount++;
      return;
    }

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
      showToast(window.i18n.get('fillAllFields'), 'error');
      return;
    }

    const res = await window.xmorfStore.loginApi(email, password, loginAntiBot.isVerified);
    if (res && res.success) {
      showToast(window.i18n.get('loginSuccess'));
      enterDashboard();
    } else {
      showToast((res && res.message) || 'Login failed', 'error');
    }
  });

  // Register Form Submission with Strong Password Enforcement
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!regAntiBot || !regAntiBot.isVerified) {
      showToast(window.i18n.get('botError'), 'error');
      botBlockCount++;
      return;
    }

    const fullName = document.getElementById('regFullName').value.trim();
    const username = document.getElementById('regUsername').value.trim().replace(/@xmorf\.net$/i, '');
    const password = regPassword.value;

    if (!username || !password) {
      showToast(window.i18n.get('fillAllFields'), 'error');
      return;
    }

    // Strong Password Check
    if (!isStrongPassword(password)) {
      showToast(window.i18n.get('passWeakError'), 'error');
      return;
    }

    const res = await window.xmorfStore.registerApi(username, password, fullName, regAntiBot.isVerified);
    if (res && res.success) {
      showToast(window.i18n.get('regSuccess'));
      logSecurityEvent(`[NEW USER REGISTERED] ${username}@xmorf.net created.`);
      enterDashboard();
    } else {
      showToast((res && res.message) || 'Registration failed', 'error');
    }
  });

  // Enter Dashboard
  function enterDashboard() {
    authScreen.classList.add('hidden');
    appDashboard.classList.remove('hidden');

    const user = window.xmorfStore.currentUser || { name: 'Demo User', avatar: 'DU', email: 'demo@xmorf.net' };
    userName.textContent = user.name;
    userAvatar.textContent = user.avatar;

    window.xmorfStore.selectedEmailId = null;
    window.xmorfStore.currentFolder = 'inbox';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.nav-item[data-folder="inbox"]')?.classList.add('active');

    renderDashboard();
  }

  // Logout
  btnLogout.addEventListener('click', () => {
    window.xmorfStore.logout();
    appDashboard.classList.add('hidden');
    authScreen.classList.remove('hidden');
    if (loginAntiBot) loginAntiBot.reset();
    if (regAntiBot) regAntiBot.reset();
  });

  // Exit Secret Admin Panel
  btnExitAdmin.addEventListener('click', () => {
    window.location.hash = '';
    handleRouting();
  });

  // Sidebar Folder Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', async () => {
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const folder = item.getAttribute('data-folder');
      window.xmorfStore.currentFolder = folder;
      window.xmorfStore.selectedEmailId = null;

      currentFolderName.textContent = window.i18n.get(folder);
      
      if (folder === 'trash') {
        btnEmptyTrash.classList.remove('hidden');
      } else {
        btnEmptyTrash.classList.add('hidden');
      }

      await window.xmorfStore.refreshEmailsFromServer();
      mainContent.classList.remove('mobile-show-reader');
      sidebar.classList.remove('sidebar-open');
      renderDashboard();
    });
  });

  // Search Input Handler
  searchInput.addEventListener('input', (e) => {
    window.xmorfStore.searchQuery = e.target.value;
    renderEmailList();
  });

  // Empty Trash Action
  btnEmptyTrash.addEventListener('click', async () => {
    if (confirm('Are you sure you want to empty the Trash permanently?')) {
      await window.xmorfStore.emptyTrash();
      showToast(window.i18n.get('trashEmptied'));
      window.xmorfStore.selectedEmailId = null;
      renderDashboard();
    }
  });

  // Refresh Mailbox Button Handler & Auto-Polling
  const btnRefreshMails = document.getElementById('btnRefreshMails');
  if (btnRefreshMails) {
    btnRefreshMails.addEventListener('click', async () => {
      btnRefreshMails.style.opacity = '0.5';
      await window.xmorfStore.refreshEmailsFromServer();
      renderDashboard();
      showToast('Mailbox updated');
      setTimeout(() => { btnRefreshMails.style.opacity = '1'; }, 300);
    });
  }

  // Auto-refresh emails every 8 seconds when user is logged in
  setInterval(async () => {
    if (window.xmorfStore.currentUser) {
      await window.xmorfStore.refreshEmailsFromServer();
      renderDashboard();
    }
  }, 8000);

  // Instant Main Render Dashboard Function
  function renderDashboard() {
    renderEmailList();
    renderEmailReader();
    updateUnreadBadge();
  }

  function updateUnreadBadge() {
    const count = window.xmorfStore.getUnreadCount();
    unreadBadgeCount.textContent = count;
    if (count === 0) {
      unreadBadgeCount.style.display = 'none';
    } else {
      unreadBadgeCount.style.display = 'inline-block';
    }
  }

  // Render Email List
  function renderEmailList() {
    const emails = window.xmorfStore.getEmails();
    emailList.innerHTML = '';

    if (emails.length === 0) {
      emailList.innerHTML = `
        <li style="padding: 30px; text-align: center; color: var(--text-dim); font-size: 0.9rem;">
          ${window.i18n.get('noEmailsFound')}
        </li>
      `;
      return;
    }

    emails.forEach((e, idx) => {
      const li = document.createElement('li');
      li.className = `email-card ${e.isUnread ? 'unread' : ''} ${e.id === window.xmorfStore.selectedEmailId ? 'active' : ''}`;
      li.style.animationDelay = `${Math.min(idx * 0.04, 0.4)}s`;
      
      const hasAttachment = e.attachments && e.attachments.length > 0;
      const displayDate = e.formattedDate || e.date || e.timestamp || 'Just now';
      const senderText = e.senderEmail ? `${e.senderName} (${e.senderEmail})` : e.senderName;

      li.innerHTML = `
        <div class="email-card-top">
          <span class="sender-name" title="${escapeHtml(e.senderEmail || e.senderName)}">${escapeHtml(senderText)}</span>
          <span class="email-time">${escapeHtml(displayDate)}</span>
        </div>
        <div class="email-subject">${escapeHtml(e.subject)}</div>
        <div class="email-snippet">${escapeHtml(e.preview)}</div>
        <div class="email-card-footer">
          ${hasAttachment ? `<span class="attachment-badge" style="display: flex; align-items: center; gap: 4px;">${window.XmorfIcons.paperclip} ${e.attachments.length}</span>` : ''}
          ${e.isStarred ? `<span style="margin-left: auto; display: flex;">${window.XmorfIcons.starFilled}</span>` : ''}
        </div>
      `;

      li.addEventListener('click', () => {
        window.xmorfStore.selectedEmailId = e.id;
        window.xmorfStore.markAsRead(e.id);
        renderEmailList();
        renderEmailReader();
        updateUnreadBadge();

        if (window.innerWidth <= 768) {
          mainContent.classList.add('mobile-show-reader');
          sidebar.classList.remove('sidebar-open');
        }
      });

      emailList.appendChild(li);
    });
  }

function decodeHtmlEntities(str) {
  if (!str) return '';
  let decoded = String(str);
  if (/&lt;[a-z\/\!]/i.test(decoded) || /&gt;/i.test(decoded)) {
    const txt = document.createElement('textarea');
    txt.innerHTML = decoded;
    decoded = txt.value;
  }
  return decoded;
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

  // Render Email Reader Pane
  function renderEmailReader() {
    const selectedId = window.xmorfStore.selectedEmailId;
    const email = window.xmorfStore.getEmailById(selectedId);

    if (!email) {
      emailReaderPane.innerHTML = `
        <div class="reader-empty">
          <div class="reader-empty-icon">${window.XmorfIcons.mailEmpty}</div>
          <p data-i18n="noEmailsFound">${window.i18n.get('noEmailsFound')}</p>
        </div>
      `;
      return;
    }

    const isTrashFolder = email.folder === 'trash';
    const isStarred = email.isStarred;
    const displayDate = email.formattedDate || email.date || email.timestamp || new Date().toLocaleString();

    let attachmentsHtml = '';
    if (email.attachments && email.attachments.length > 0) {
      attachmentsHtml = `
        <div class="attachments-section">
          <div class="attachments-title" style="display: flex; align-items: center; gap: 6px;">
            ${window.XmorfIcons.paperclip} Attached Files (${email.attachments.length})
          </div>
          <div class="attachments-grid">
            ${email.attachments.map((att, idx) => {
              const isPurged = att.purged || att.name === 'this file got purged on a data purge' || att.content === 'this file got purged on a data purge';
              const nameText = isPurged ? 'this file got purged on a data purge' : escapeHtml(att.name);
              const sizeText = isPurged ? 'Purged' : escapeHtml(att.size);

              return `
              <div class="attachment-card ${isPurged ? 'purged' : ''}" style="${isPurged ? 'border-color: rgba(255,30,60,0.5); background: rgba(255,30,60,0.08);' : ''}">
                <span class="att-icon">${getFileIconSvg(att.type)}</span>
                <div class="att-details">
                  <div class="att-name" style="${isPurged ? 'color: #ff4d6d; font-weight: 700;' : ''}">${nameText}</div>
                  <div class="att-size">${sizeText}</div>
                </div>
                <button class="att-download-btn" data-email-id="${email.id}" data-att-idx="${idx}">${window.XmorfIcons.download}</button>
              </div>
            `;
            }).join('')}
          </div>
        </div>
      `;
    }

    let cleanBody = decodeHtmlEntities(email.bodyHtml || email.body || '');
    const isHtmlEmail = /<[a-z\/\!][\s\S]*>/i.test(cleanBody);

    let emailBodyContent = '';
    if (isHtmlEmail) {
      let iframeHtml = cleanBody;
      if (!/<head/i.test(iframeHtml)) {
        iframeHtml = `<meta charset="utf-8"><base target="_blank"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111;margin:0;padding:16px;line-height:1.6;}a{color:#2563eb;}img{max-width:100%;height:auto;}</style>${cleanBody}`;
      } else {
        iframeHtml = iframeHtml.replace(/<head>/i, '<head><base target="_blank">');
      }

      emailBodyContent = `
        <div class="html-email-wrapper" style="margin-top: 16px; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: #ffffff;">
          <iframe class="html-email-iframe" sandbox="allow-popups allow-same-origin allow-scripts" srcdoc="${escapeAttr(iframeHtml)}" style="width: 100%; min-height: 450px; border: none; background: #ffffff; display: block;" onload="try { this.style.height = Math.max(350, (this.contentWindow.document.body.scrollHeight + 30)) + 'px'; } catch(e){}"></iframe>
        </div>
      `;
    } else {
      emailBodyContent = `
        <div class="reader-body" style="margin-top: 16px; white-space: pre-wrap; font-family: inherit; line-height: 1.6;">${escapeHtml(cleanBody)}</div>
      `;
    }

    emailReaderPane.innerHTML = `
      <button id="btnMobileBack" class="mobile-back-btn">
        ← Back to Mail List
      </button>
      <div class="reader-header">
        <div class="reader-toolbar">
          <div style="display: flex; gap: 8px;">
            <button id="btnStar" class="btn-action">
              ${isStarred ? window.XmorfIcons.starFilled : window.XmorfIcons.star}
              <span>${isStarred ? window.i18n.get('unstarMail') : window.i18n.get('starMail')}</span>
            </button>
            <button id="btnReply" class="btn-action">
              ${window.XmorfIcons.reply} <span data-i18n="replyBtn">${window.i18n.get('replyBtn')}</span>
            </button>
          </div>

          <div style="display: flex; gap: 8px;">
            ${isTrashFolder ? `
              <button id="btnRestore" class="btn-action btn-restore">
                ${window.XmorfIcons.restore} <span data-i18n="restoreBtn">${window.i18n.get('restoreBtn')}</span>
              </button>
              <button id="btnPermDelete" class="btn-action btn-danger">
                ${window.XmorfIcons.trash} <span data-i18n="permDeleteBtn">${window.i18n.get('permDeleteBtn')}</span>
              </button>
            ` : `
              <button id="btnDelete" class="btn-action btn-danger">
                ${window.XmorfIcons.trash} <span data-i18n="deleteBtn">${window.i18n.get('deleteBtn')}</span>
              </button>
            `}
          </div>
        </div>

        <div class="email-details-header" style="margin-top: 16px; padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 8px;">
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; color: var(--text-primary); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">${escapeHtml(email.subject)}</h2>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.88rem;">
            <div><strong style="color: var(--text-dim);">Absender:</strong> <span style="color: #60a5fa; font-weight: 600;">${escapeHtml(email.senderName)}</span> &lt;<span style="color: var(--text-primary); text-decoration: underline;">${escapeHtml(email.senderEmail || 'unbekannt')}</span>&gt;</div>
            <div><strong style="color: var(--text-dim);">Empfänger:</strong> <span style="color: var(--text-primary); font-weight: 500;">${escapeHtml(email.recipient)}</span></div>
            <div><strong style="color: var(--text-dim);">Datum & Zeit:</strong> <span style="color: #34d399; font-weight: 500;">${escapeHtml(displayDate)}</span></div>
          </div>
        </div>
      </div>

      ${emailBodyContent}

      ${attachmentsHtml}
    `;

    // Attachment download button listeners
    emailReaderPane.querySelectorAll('.att-download-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const emailId = btn.getAttribute('data-email-id');
        const attIdx = parseInt(btn.getAttribute('data-att-idx'));
        const em = window.xmorfStore.getEmailById(emailId);
        if (em && em.attachments && em.attachments[attIdx]) {
          downloadRealAttachment(em.attachments[attIdx]);
        }
      });
    });

    // Attach event listener for mobile back button
    document.getElementById('btnMobileBack')?.addEventListener('click', () => {
      mainContent.classList.remove('mobile-show-reader');
    });

    // Attach event listeners for email action buttons
    document.getElementById('btnStar')?.addEventListener('click', async () => {
      await window.xmorfStore.toggleStar(email.id);
      renderDashboard();
    });

    document.getElementById('btnReply')?.addEventListener('click', () => {
      openComposeModal({
        recipient: email.senderEmail,
        subject: `Re: ${email.subject}`
      });
    });

    if (isTrashFolder) {
      document.getElementById('btnRestore').addEventListener('click', async () => {
        await window.xmorfStore.restoreEmail(email.id);
        showToast(window.i18n.get('mailRestoredSuccess'));
        window.xmorfStore.selectedEmailId = null;
        renderDashboard();
      });

      document.getElementById('btnPermDelete').addEventListener('click', async () => {
        if (confirm('Permanently delete this email? This action cannot be undone.')) {
          await window.xmorfStore.deletePermanently(email.id);
          showToast(window.i18n.get('mailDeletedPerm'));
          window.xmorfStore.selectedEmailId = null;
          renderDashboard();
        }
      });
    } else {
      document.getElementById('btnDelete').addEventListener('click', async () => {
        await window.xmorfStore.moveToTrash(email.id);
        showToast(window.i18n.get('mailTrashedSuccess'));
        window.xmorfStore.selectedEmailId = null;
        renderDashboard();
      });
    }
  }

  // File Attachments Drag & Drop & Upload Handling
  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  });

  async function handleFiles(files) {
    for (const file of Array.from(files)) {
      // 2 MB strict size check
      if (file.size > 2 * 1024 * 1024) {
        showToast(`File "${file.name}" exceeds the 2 MB maximum size limit!`, 'error');
        continue;
      }

      const serverAtt = await window.xmorfStore.uploadFileApi(file);
      if (serverAtt) {
        currentAttachments.push(serverAtt);
        renderAttachmentChips();
      } else {
        const ext = file.name.split('.').pop().toLowerCase();
        let type = 'document';
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) type = 'image';
        if (ext === 'pdf') type = 'pdf';
        if (['zip', 'rar', '7z'].includes(ext)) type = 'archive';

        const reader = new FileReader();
        reader.onload = (event) => {
          const attachment = {
            id: 'att-' + Date.now() + Math.random(),
            name: file.name,
            size: formatSize(file.size),
            type: type,
            content: event.target.result
          };

          currentAttachments.push(attachment);
          renderAttachmentChips();
        };
        reader.readAsDataURL(file);
      }
    }
  }

  function renderAttachmentChips() {
    attachedFilesContainer.innerHTML = '';
    currentAttachments.forEach((att, index) => {
      const chip = document.createElement('div');
      chip.className = 'file-chip';
      chip.innerHTML = `
        <span>${getFileIconSvg(att.type)}</span>
        <span>${escapeHtml(att.name)} (${att.size})</span>
        <span class="file-chip-remove" data-index="${index}">✕</span>
      `;

      chip.querySelector('.file-chip-remove').addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        currentAttachments.splice(idx, 1);
        renderAttachmentChips();
      });

      attachedFilesContainer.appendChild(chip);
    });
  }

  // Compose Modal Handlers
  btnCompose.addEventListener('click', () => openComposeModal());
  btnCloseModal.addEventListener('click', closeComposeModal);
  btnCancelCompose.addEventListener('click', closeComposeModal);

  function openComposeModal(prefill = {}) {
    sidebar.classList.remove('sidebar-open');
    document.getElementById('composeRecipient').value = prefill.recipient || '';
    document.getElementById('composeSubject').value = prefill.subject || '';
    document.getElementById('composeBody').value = prefill.body || '';
    currentAttachments = [];
    renderAttachmentChips();
    composeModal.classList.add('active');
  }

  function closeComposeModal() {
    composeModal.classList.remove('active');
    composeForm.reset();
    currentAttachments = [];
    renderAttachmentChips();
  }

  // Send Email Submit Handler with Anti-Spam Rate Limit Cooldown Protection
  composeForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Check active rate limit cooldown
    const now = Date.now();
    if (now < cooldownUntil) {
      const secondsLeft = Math.ceil((cooldownUntil - now) / 1000);
      showToast(`${window.i18n.get('rateLimitMsg')} ${secondsLeft} ${window.i18n.get('secondsRemaining')}`, 'error');
      logSecurityEvent(`[RATE LIMIT BLOCKED] User attempted send during active cooldown (${secondsLeft}s left).`);
      return;
    }

    // Rate limit check: max 3 emails per 30 seconds
    sendHistory.push(now);
    const recentSends = sendHistory.filter(t => now - t < 30000);

    if (recentSends.length > 3) {
      cooldownUntil = now + 45000; // 45 second lock out
      showToast(`${window.i18n.get('rateLimitMsg')} 45 ${window.i18n.get('secondsRemaining')}`, 'error');
      logSecurityEvent(`[SPAM PROTECTION ACTIVATED] Rate limit triggered (45s cooldown enforced).`);
      return;
    }

    const recipient = document.getElementById('composeRecipient').value.trim();
    const subject = document.getElementById('composeSubject').value.trim();
    const body = document.getElementById('composeBody').value.trim();

    if (!recipient || !subject) {
      showToast(window.i18n.get('fillAllFields'), 'error');
      return;
    }

    const sendingAttachments = [...currentAttachments];
    closeComposeModal();
    showToast(window.i18n.get('mailSentSuccess'));

    setTimeout(() => {
      window.xmorfStore.sendEmail({
        recipient,
        subject,
        body,
        attachments: sendingAttachments
      });
      renderDashboard();
    }, 0);
  });

  // Secret Admin Dashboard Renderer (#xmadmin)
  async function renderAdminDashboard() {
    const data = await window.xmorfStore.fetchAdminUsersApi();
    const users = data.users || [];
    const filesRes = await window.xmorfStore.fetchAdminFilesApi();
    const files = filesRes.files || [];

    const bannedCount = users.filter(u => u.status === 'Banned').length;

    document.getElementById('statUsers').textContent = users.length;
    document.getElementById('statBannedUsers').textContent = bannedCount;
    document.getElementById('statEmails').textContent = data.totalEmails !== undefined ? data.totalEmails : window.xmorfStore.emails.length;
    document.getElementById('statFiles').textContent = files.length;

    renderAdminUserTable(users);
    await renderAdminEmailTable();
    renderAdminFileTable(files);
  }

  // Render User Accounts Table
  function renderAdminUserTable(users) {
    const tbody = document.getElementById('adminUserTableBody');
    const searchFilter = (document.getElementById('adminUserSearch')?.value || '').toLowerCase().trim();
    tbody.innerHTML = '';

    const filtered = users.filter(u =>
      u.name.toLowerCase().includes(searchFilter) ||
      u.email.toLowerCase().includes(searchFilter)
    );

    filtered.forEach(u => {
      const tr = document.createElement('tr');
      const isBanned = u.status === 'Banned';

      const formatDate = (isoStr) => {
        if (!isoStr || isoStr === 'N/A' || isoStr === 'Never') return isoStr;
        try {
          return new Date(isoStr).toLocaleString();
        } catch (e) {
          return isoStr;
        }
      };

      tr.innerHTML = `
        <td>
          <div style="font-weight: 700;">${escapeHtml(u.name)}</div>
          <div style="font-size: 0.8rem; color: var(--text-dim);">${escapeHtml(u.email)}</div>
        </td>
        <td style="font-family: monospace;">${escapeHtml(u.password || '••••••••')}</td>
        <td style="font-size: 0.8rem; color: var(--text-dim);">${formatDate(u.createdAt)}</td>
        <td style="font-size: 0.8rem; color: var(--text-dim);">${formatDate(u.lastLogin)}</td>
        <td style="font-size: 0.8rem; color: var(--text-dim);">${formatDate(u.lastEmailSent)}</td>
        <td>
          <span class="status-badge ${isBanned ? 'banned' : 'active'}">
            ● ${isBanned ? 'Banned' : 'Active'}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn-action ${isBanned ? 'btn-unban' : 'btn-ban'}" style="padding: 4px 8px; font-size: 0.76rem;" data-ban-id="${u.id}">
              ${isBanned ? 'Unban' : 'Ban User'}
            </button>
            <button class="btn-action" style="padding: 4px 8px; font-size: 0.76rem;" data-pass-id="${u.id}" data-pass-email="${escapeHtml(u.email)}">
              Change Password
            </button>
          </div>
        </td>
      `;

      // Ban/Unban click listener
      tr.querySelector(`[data-ban-id="${u.id}"]`)?.addEventListener('click', async () => {
        const res = await window.xmorfStore.toggleBanUserApi(u.id);
        showToast((res && res.message) || 'User status updated');
        logSecurityEvent(`[USER STATUS CHANGED] ${u.email} set to ${isBanned ? 'Active' : 'Banned'}.`);
        renderAdminDashboard();
      });

      // Change Password click listener
      tr.querySelector(`[data-pass-id="${u.id}"]`)?.addEventListener('click', () => {
        openAdminPassModal(u.id, u.email);
      });

      tbody.appendChild(tr);
    });
  }

  // Admin User Search Listener
  document.getElementById('adminUserSearch')?.addEventListener('input', async () => {
    const data = await window.xmorfStore.fetchAdminUsersApi();
    renderAdminUserTable(data.users || []);
  });

  // Render Admin Global Email Inspector Table
  async function renderAdminEmailTable() {
    const tbody = document.getElementById('adminEmailTableBody');
    if (!tbody) return;

    const query = document.getElementById('adminEmailSearch')?.value || '';
    const data = await window.xmorfStore.fetchAdminEmailsApi(query);
    const emails = data.emails || [];
    tbody.innerHTML = '';

    if (emails.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 20px;">No emails found in database.</td></tr>`;
      return;
    }

    emails.forEach(e => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family: monospace; font-size: 0.78rem;">${escapeHtml(e.id)}</td>
        <td>${escapeHtml(e.senderName)} &lt;${escapeHtml(e.senderEmail)}&gt;</td>
        <td>${escapeHtml(e.recipient)}</td>
        <td><strong style="color: white;">${escapeHtml(e.subject)}</strong></td>
        <td><span class="status-badge active" style="text-transform: capitalize;">${escapeHtml(e.folder)}</span></td>
        <td style="font-size: 0.8rem; color: var(--text-dim);">${escapeHtml(e.date)}</td>
        <td>
          <button class="btn-action btn-danger" style="padding: 4px 8px; font-size: 0.76rem;" data-del-email-id="${e.id}">
            Delete Email
          </button>
        </td>
      `;

      tr.querySelector(`[data-del-email-id="${e.id}"]`)?.addEventListener('click', async () => {
        if (confirm(`Permanently delete email "${e.subject}"?`)) {
          await window.xmorfStore.deleteAdminEmailApi(e.id);
          showToast('Email permanently deleted from system.');
          logSecurityEvent(`[EMAIL DELETED] Admin purged email ${e.id}.`);
          renderAdminDashboard();
        }
      });

      tbody.appendChild(tr);
    });
  }

  document.getElementById('adminEmailSearch')?.addEventListener('input', renderAdminEmailTable);

  // Render Admin File Manager Table
  function renderAdminFileTable(files) {
    const tbody = document.getElementById('adminFileTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (files.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 20px;">No uploaded files on server.</td></tr>`;
      return;
    }

    files.forEach(f => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><a href="${f.url}" target="_blank" style="color: var(--primary-red); text-decoration: underline;">${escapeHtml(f.filename)}</a></td>
        <td>${escapeHtml(f.size)}</td>
        <td style="font-size: 0.8rem; color: var(--text-dim);">${new Date(f.createdAt).toLocaleString()}</td>
        <td>
          <button class="btn-action btn-danger" style="padding: 4px 8px; font-size: 0.76rem;" data-del-filename="${escapeHtml(f.filename)}">
            Delete File
          </button>
        </td>
      `;

      tr.querySelector(`[data-del-filename="${f.filename}"]`)?.addEventListener('click', async () => {
        if (confirm(`Delete file "${f.filename}"?`)) {
          await window.xmorfStore.deleteAdminFileApi(f.filename);
          showToast(`File ${f.filename} cleared.`);
          renderAdminDashboard();
        }
      });

      tbody.appendChild(tr);
    });
  }

  // DATA CLEAR Purge Execution Handlers
  const executeDataClear = async () => {
    if (confirm('⚠️ CRITICAL WARNING: Execute DATA CLEAR?\n\nAll uploaded files on the server will be purged and overwritten with:\n"this data got deletet on a data clear"')) {
      const res = await window.xmorfStore.dataClearApi();
      showToast((res && res.message) || 'DATA CLEAR EXECUTED: All file contents purged!');
      logSecurityEvent('[DATA CLEAR PURGE EXECUTED] All server files overwritten with "this data got deletet on a data clear".');
      renderAdminDashboard();
    }
  };

  document.getElementById('btnDataClear')?.addEventListener('click', executeDataClear);
  document.getElementById('btnDataClearSecondary')?.addEventListener('click', executeDataClear);

  // Password Reset Modal Handlers for Admin
  const adminPasswordModal = document.getElementById('adminPasswordModal');
  const btnClosePassModal = document.getElementById('btnClosePassModal');
  const btnCancelPassModal = document.getElementById('btnCancelPassModal');
  const adminPasswordForm = document.getElementById('adminPasswordForm');

  function openAdminPassModal(userId, userEmail) {
    document.getElementById('passResetUserId').value = userId;
    document.getElementById('passResetTargetEmail').value = userEmail;
    document.getElementById('passResetNewPass').value = '';
    adminPasswordModal.classList.add('active');
  }

  function closeAdminPassModal() {
    adminPasswordModal.classList.remove('active');
  }

  if (btnClosePassModal) btnClosePassModal.addEventListener('click', closeAdminPassModal);
  if (btnCancelPassModal) btnCancelPassModal.addEventListener('click', closeAdminPassModal);

  if (adminPasswordForm) {
    adminPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userId = document.getElementById('passResetUserId').value;
      const targetEmail = document.getElementById('passResetTargetEmail').value;
      const newPassword = document.getElementById('passResetNewPass').value.trim();

      if (!newPassword || newPassword.length < 4) {
        showToast('Password must be at least 4 characters long!', 'error');
        return;
      }

      const res = await window.xmorfStore.changeUserPasswordApi(userId, newPassword);
      if (res && res.success) {
        showToast(`Password for ${targetEmail} updated!`);
        logSecurityEvent(`[PASSWORD RESET] Password for ${targetEmail} changed by Overseer Admin.`);
        closeAdminPassModal();
        renderAdminDashboard();
      } else {
        showToast((res && res.message) || 'Failed to update password', 'error');
      }
    });
  }

  function logSecurityEvent(msg) {
    const logsBox = document.getElementById('adminSecurityLogs');
    if (logsBox) {
      const line = document.createElement('div');
      line.className = 'log-line';
      line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
      logsBox.prepend(line);
    }
  }

  // Real Attachment File Downloader Function (Mobile & Desktop Compatible)
  function downloadRealAttachment(att) {
    if (att.purged || att.name === 'this file got purged on a data purge') {
      showToast('This file has been purged from server disk.', 'error');
      return;
    }

    showToast(`Downloading file: ${att.name}...`);

    const filenameToFetch = att.filename || att.name;
    const isLocalFileProtocol = window.location.protocol === 'file:';

    // 1. Direct Server Download (Triggers native HTTP attachment download on iOS & Android)
    if (!isLocalFileProtocol) {
      const serverDownloadUrl = `${window.xmorfStore.apiBase}/uploads/download/${encodeURIComponent(filenameToFetch)}`;
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = serverDownloadUrl;
      downloadAnchor.download = att.name;
      downloadAnchor.target = '_blank';
      downloadAnchor.rel = 'noopener';
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      
      setTimeout(() => {
        if (downloadAnchor.parentNode) {
          downloadAnchor.parentNode.removeChild(downloadAnchor);
        }
      }, 1000);
      return;
    }

    // 2. Offline / Local Data URL Fallback
    try {
      let blobUrl;
      if (att.content && att.content.startsWith('data:')) {
        const blob = dataURLtoBlob(att.content);
        blobUrl = URL.createObjectURL(blob);
      } else {
        const text = att.content || `Xmorf Encrypted Attachment: ${att.name}\nTransferred from Node.js Express Backend\nSecurity: 256-Bit Protection\nDate: ${new Date().toLocaleString()}`;
        const blob = new Blob([text], { type: 'application/octet-stream' });
        blobUrl = URL.createObjectURL(blob);
      }

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = att.name;
      link.target = '_blank';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (e) {
      showToast('Failed to download attachment.', 'error');
    }
  }

  function dataURLtoBlob(dataurl) {
    try {
      const arr = dataurl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (e) {
      return new Blob([dataurl], { type: 'text/plain;charset=utf-8' });
    }
  }

  function getFileIconSvg(type) {
    switch (type) {
      case 'pdf': return window.XmorfIcons.filePdf;
      case 'image': return window.XmorfIcons.fileImage;
      case 'archive': return window.XmorfIcons.fileArchive;
      default: return window.XmorfIcons.fileDoc;
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span style="display: flex; align-items: center;">${window.XmorfIcons.shield}</span>
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
});
