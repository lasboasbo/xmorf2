/**
 * Xmorf.net i18n Internationalization Engine
 * Main Language: English (EN)
 * Supported Languages: English (en), German (de), French (fr), Spanish (es)
 */

const translations = {
  en: {
    appTitle: "Xmorf.net | Encrypted Mail",
    brandSubtitle: "256-Bit Cryptographic Webmail",
    loginTitle: "Access Your Xmorf Vault",
    loginDesc: "Secure, encrypted email system with zero-knowledge architecture.",
    registerTitle: "Create Xmorf Account",
    registerDesc: "Get your personalized @xmorf.net encrypted mailbox.",
    loginTab: "Sign In",
    registerTab: "Register",
    emailLabel: "Email Address",
    emailPlaceholder: "username@xmorf.net",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••••••",
    fullNameLabel: "Full Name",
    fullNamePlaceholder: "Alex Mercer",
    desiredUsername: "Desired Address",
    antibotLabel: "Human Security Verification",
    antibotInstruction: "Slide to solve anti-bot verification",
    antibotSuccess: "Human verified!",
    loginBtn: "Unlock Mailbox",
    registerBtn: "Create Encrypted Account",
    demoAccountNotice: "Demo credentials available: demo@xmorf.net / password",
    
    // Password Strength & Security
    passWeak: "Weak Password",
    passMedium: "Medium Password",
    passStrong: "Strong Password",
    passReqLength: "At least 8 characters",
    passReqUpper: "At least 1 uppercase letter (A-Z)",
    passReqNumber: "At least 1 number (0-9)",
    passReqSpecial: "At least 1 special character (!@#$%^&*)",
    passWeakError: "Password does not meet security requirements. Min 8 chars, 1 uppercase, 1 number, 1 special character required.",

    // Rate Limit Cooldown
    rateLimitTitle: "Rate Limit Exceeded",
    rateLimitMsg: "Too many emails sent in a short time. Anti-spam cooldown active for ",
    secondsRemaining: " seconds.",

    // Secret Admin Dashboard
    adminTitle: "Xmorf Command & Security Control Panel",
    adminSubtitle: "Confidential Admin Access (#xmadmin)",
    adminUsersTotal: "Total Registered Users",
    adminEmailsTotal: "Total Emails in DB",
    adminBotBlocks: "Anti-Bot Threats Blocked",
    adminRateLimits: "Spam Rate-Limits Active",
    adminUserCol: "User Account",
    adminStorageCol: "Storage",
    adminStatusCol: "Security Status",
    adminActionsCol: "Actions",
    adminStatusActive: "Active / Verified",
    adminStatusSuspended: "Suspended",
    adminSuspendBtn: "Suspend",
    adminUnsuspendBtn: "Activate",
    adminDeleteUserBtn: "Delete Account",
    adminLogsTitle: "Global Security Audit & Anti-Bot Event Log",
    adminExitBtn: "Exit Admin View",

    // Navigation / Folders
    composeBtn: "New Encrypted Mail",
    inbox: "Inbox",
    sent: "Sent",
    starred: "Starred",
    trash: "Trash",
    drafts: "Drafts",
    storageUsed: "Storage Space",
    systemStatus: "Anti-Bot Shield Active",
    logout: "Sign Out",

    // Email List & Detail
    searchPlaceholder: "Search mails by subject, sender, content...",
    noEmailsFound: "No emails found in this folder.",
    unreadBadge: "Unread",
    starredBadge: "Starred",
    encryptedBadge: "256-Bit Encrypted",
    
    // Actions
    deleteBtn: "Move to Trash",
    restoreBtn: "Restore Mail",
    permDeleteBtn: "Delete Permanently",
    emptyTrashBtn: "Empty Trash",
    replyBtn: "Reply",
    forwardBtn: "Forward",
    starMail: "Star Email",
    unstarMail: "Unstar Email",

    // Compose Modal
    composeTitle: "New Encrypted Message",
    recipientLabel: "To",
    recipientPlaceholder: "recipient@xmorf.net or external email",
    subjectLabel: "Subject",
    subjectPlaceholder: "Enter message subject...",
    bodyPlaceholder: "Write your encrypted message here...",
    attachFiles: "Attach Files",
    dragDropText: "Drag & drop files here or click to browse",
    attachmentSizeLimit: "Max file size: 25 MB",
    sendMailBtn: "Send Encrypted Mail",
    closeModal: "Cancel",

    // Toasts & Alerts
    mailSentSuccess: "Message encrypted and delivered successfully!",
    mailTrashedSuccess: "Email moved to Trash.",
    mailRestoredSuccess: "Email restored back to Inbox!",
    mailDeletedPerm: "Email permanently erased.",
    trashEmptied: "Trash folder emptied.",
    botError: "Please slide to complete the anti-bot puzzle first!",
    loginSuccess: "Welcome back to Xmorf.net!",
    regSuccess: "Account created! Logging you into your new mailbox.",
    fillAllFields: "Please fill out all required fields."
  },
  de: {
    appTitle: "Xmorf.net | Verschlüsselte E-Mail",
    brandSubtitle: "256-Bit Kryptografischer Webmail-Dienst",
    loginTitle: "Zugang zu Ihrem Xmorf-Tresor",
    loginDesc: "Sicheres, verschlüsseltes E-Mail-System mit Zero-Knowledge-Architektur.",
    registerTitle: "Xmorf Konto Erstellen",
    registerDesc: "Holen Sie sich Ihre persönliche @xmorf.net E-Mail-Adresse.",
    loginTab: "Anmelden",
    registerTab: "Registrieren",
    emailLabel: "E-Mail Adresse",
    emailPlaceholder: "benutzername@xmorf.net",
    passwordLabel: "Passwort",
    passwordPlaceholder: "••••••••••••",
    fullNameLabel: "Vollständiger Name",
    fullNamePlaceholder: "Max Mustermann",
    desiredUsername: "Gewünschte Adresse",
    antibotLabel: "Menschliche Sicherheitsprüfung",
    antibotInstruction: "Schieben Sie den Regler zur Anti-Bot-Verifikation",
    antibotSuccess: "Mensch verifiziert!",
    loginBtn: "Postfach Entsperren",
    registerBtn: "Konto Erstellen",
    demoAccountNotice: "Demo-Zugang: demo@xmorf.net / password",

    // Passwort-Sicherheit
    passWeak: "Schwaches Passwort",
    passMedium: "Mittleres Passwort",
    passStrong: "Starkes Passwort",
    passReqLength: "Mindestens 8 Zeichen",
    passReqUpper: "Mindestens 1 Großbuchstabe (A-Z)",
    passReqNumber: "Mindestens 1 Zahl (0-9)",
    passReqSpecial: "Mindestens 1 Sonderzeichen (!@#$%^&*)",
    passWeakError: "Passwort erfüllt nicht die Sicherheitsanforderungen (Min 8 Zeichen, 1 Großbuchstabe, 1 Zahl, 1 Sonderzeichen).",

    // Rate Limit
    rateLimitTitle: "Limit Überschritten",
    rateLimitMsg: "Zu viele E-Mails in kurzer Zeit gesendet. Anti-Spam Cooldown aktiv für ",
    secondsRemaining: " Sekunden.",

    // Geheim-Admin Dashboard
    adminTitle: "Xmorf Command & Security Control Panel",
    adminSubtitle: "Vertraulicher Admin-Zugriff (#xmadmin)",
    adminUsersTotal: "Registrierte Konten",
    adminEmailsTotal: "E-Mails in Datenbank",
    adminBotBlocks: "Blockierte Bot-Angriffe",
    adminRateLimits: "Aktive Rate-Limits",
    adminUserCol: "Benutzer-Konto",
    adminStorageCol: "Speicher",
    adminStatusCol: "Sicherheits-Status",
    adminActionsCol: "Aktionen",
    adminStatusActive: "Aktiv / Verifiziert",
    adminStatusSuspended: "Gesperrt",
    adminSuspendBtn: "Sperren",
    adminUnsuspendBtn: "Aktivieren",
    adminDeleteUserBtn: "Konto Löschen",
    adminLogsTitle: "Globales Sicherheits-Audit & Anti-Bot Log",
    adminExitBtn: "Admin-Ansicht Verlassen",

    composeBtn: "Neue Nachricht",
    inbox: "Posteingang",
    sent: "Gesendet",
    starred: "Markiert",
    trash: "Papierkorb",
    drafts: "Entwürfe",
    storageUsed: "Speicherplatz",
    systemStatus: "Anti-Bot-Schutz Aktiv",
    logout: "Abmelden",

    searchPlaceholder: "E-Mails nach Betreff, Absender oder Inhalt suchen...",
    noEmailsFound: "Keine E-Mails in diesem Ordner gefunden.",
    unreadBadge: "Ungelesen",
    starredBadge: "Wichtig",
    encryptedBadge: "256-Bit Verschlüsselt",

    deleteBtn: "In Papierkorb verschieben",
    restoreBtn: "Wiederherstellen",
    permDeleteBtn: "Endgültig Löschen",
    emptyTrashBtn: "Papierkorb leeren",
    replyBtn: "Antworten",
    forwardBtn: "Weiterleiten",
    starMail: "E-Mail markieren",
    unstarMail: "Markierung aufheben",

    composeTitle: "Neue Verschlüsselte E-Mail",
    recipientLabel: "Empfänger",
    recipientPlaceholder: "empfaenger@xmorf.net oder externe E-Mail",
    subjectLabel: "Betreff",
    subjectPlaceholder: "Betreff eingeben...",
    bodyPlaceholder: "Verfassen Sie hier Ihre Nachricht...",
    attachFiles: "Dateien anhängen",
    dragDropText: "Dateien hierher ziehen oder klicken zum Auswählen",
    attachmentSizeLimit: "Maximal 25 MB",
    sendMailBtn: "Verschlüsselt Senden",
    closeModal: "Abbrechen",

    mailSentSuccess: "Nachricht erfolgreich verschlüsselt und gesendet!",
    mailTrashedSuccess: "E-Mail in den Papierkorb verschoben.",
    mailRestoredSuccess: "E-Mail erfolgreich wiederhergestellt!",
    mailDeletedPerm: "E-Mail endgültig gelöscht.",
    trashEmptied: "Papierkorb wurde geleert.",
    botError: "Bitte lösen Sie zuerst das Anti-Bot-Rätsel!",
    loginSuccess: "Willkommen zurück bei Xmorf.net!",
    regSuccess: "Konto erstellt! Sie werden angemeldet.",
    fillAllFields: "Bitte füllen Sie alle erforderlichen Felder aus."
  },
  fr: {
    appTitle: "Xmorf.net | Messagerie Sécurisée",
    brandSubtitle: "Webmail Cryptographique 256 Bits",
    loginTitle: "Accédez à votre coffre-fort Xmorf",
    loginDesc: "Système de messagerie crypté sécurisé à architecture Zero-Knowledge.",
    registerTitle: "Créer un compte Xmorf",
    registerDesc: "Obtenez votre adresse e-mail personnalisée @xmorf.net.",
    loginTab: "Connexion",
    registerTab: "S'inscrire",
    emailLabel: "Adresse E-mail",
    emailPlaceholder: "utilisateur@xmorf.net",
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "••••••••••••",
    fullNameLabel: "Nom complet",
    fullNamePlaceholder: "Jean Dupont",
    desiredUsername: "Adresse souhaitée",
    antibotLabel: "Vérification de sécurité anti-robot",
    antibotInstruction: "Faites glisser pour valider la sécurité",
    antibotSuccess: "Vérification réussie!",
    loginBtn: "Déverrouiller la boîte mail",
    registerBtn: "Créer un compte crypté",
    demoAccountNotice: "Compte démo: demo@xmorf.net / password",

    passWeak: "Mot de passe faible",
    passMedium: "Mot de passe moyen",
    passStrong: "Mot de passe fort",
    passReqLength: "Au moins 8 caractères",
    passReqUpper: "Au moins 1 majuscule (A-Z)",
    passReqNumber: "Au moins 1 chiffre (0-9)",
    passReqSpecial: "Au moins 1 caractère spécial (!@#$%^&*)",
    passWeakError: "Le mot de passe ne respecte pas les critères de sécurité requis.",

    rateLimitTitle: "Limite Dépassée",
    rateLimitMsg: "Trop d'e-mails envoyés rapidement. Cooldown actif pendant ",
    secondsRemaining: " secondes.",

    adminTitle: "Panneau de Contrôle Xmorf Admin",
    adminSubtitle: "Accès Confidentiel (#xmadmin)",
    adminUsersTotal: "Utilisateurs Inscrits",
    adminEmailsTotal: "E-mails en Base",
    adminBotBlocks: "Attaques Bots Bloquées",
    adminRateLimits: "Limites d'envoi Actives",
    adminUserCol: "Compte Utilisateur",
    adminStorageCol: "Stockage",
    adminStatusCol: "Statut Sécurité",
    adminActionsCol: "Actions",
    adminStatusActive: "Actif / Vérifié",
    adminStatusSuspended: "Suspendu",
    adminSuspendBtn: "Suspendre",
    adminUnsuspendBtn: "Activer",
    adminDeleteUserBtn: "Supprimer le Compte",
    adminLogsTitle: "Journal d'Audit Global et Événements Anti-Bot",
    adminExitBtn: "Quitter le Mode Admin",

    composeBtn: "Nouveau message crypté",
    inbox: "Boîte de réception",
    sent: "Envoyés",
    starred: "Favoris",
    trash: "Corbeille",
    drafts: "Brouillons",
    storageUsed: "Espace de stockage",
    systemStatus: "Bouclier Anti-Bot Actif",
    logout: "Déconnexion",

    searchPlaceholder: "Rechercher par objet, expéditeur, contenu...",
    noEmailsFound: "Aucun e-mail trouvé dans ce dossier.",
    unreadBadge: "Non lu",
    starredBadge: "Favori",
    encryptedBadge: "Crypté 256 Bits",

    deleteBtn: "Déplacer vers la corbeille",
    restoreBtn: "Restaurer l'e-mail",
    permDeleteBtn: "Supprimer définitivement",
    emptyTrashBtn: "Vider la corbeille",
    replyBtn: "Répondre",
    forwardBtn: "Transférer",
    starMail: "Marquer comme favori",
    unstarMail: "Retirer des favoris",

    composeTitle: "Nouveau message sécurisé",
    recipientLabel: "À",
    recipientPlaceholder: "destinataire@xmorf.net",
    subjectLabel: "Objet",
    subjectPlaceholder: "Saisissez l'objet du message...",
    bodyPlaceholder: "Rédigez votre message crypté ici...",
    attachFiles: "Joindre des fichiers",
    dragDropText: "Glissez-déposez des fichiers ici ou cliquez",
    attachmentSizeLimit: "Taille max: 25 Mo",
    sendMailBtn: "Envoyer le message",
    closeModal: "Annuler",

    mailSentSuccess: "Message chiffré et envoyé avec succès!",
    mailTrashedSuccess: "E-mail déplacé dans la corbeille.",
    mailRestoredSuccess: "E-mail restauré dans la boîte de réception!",
    mailDeletedPerm: "E-mail supprimé définitivement.",
    trashEmptied: "Corbeille vidée.",
    botError: "Veuillez résoudre le puzzle anti-bot d'abord!",
    loginSuccess: "Bienvenue sur Xmorf.net!",
    regSuccess: "Compte créé avec succès!",
    fillAllFields: "Veuillez remplir tous les champs obligatoires."
  },
  es: {
    appTitle: "Xmorf.net | Correo Cifrado",
    brandSubtitle: "Webmail Criptográfico de 256 Bits",
    loginTitle: "Acceso a su bóveda Xmorf",
    loginDesc: "Sistema de correo cifrado de alta seguridad.",
    registerTitle: "Crear cuenta Xmorf",
    registerDesc: "Obtenga su correo electrónico personalizado @xmorf.net.",
    loginTab: "Iniciar Sesión",
    registerTab: "Registrarse",
    emailLabel: "Correo Electrónico",
    emailPlaceholder: "usuario@xmorf.net",
    passwordLabel: "Contraseña",
    passwordPlaceholder: "••••••••••••",
    fullNameLabel: "Nombre Completo",
    fullNamePlaceholder: "Carlos Gómez",
    desiredUsername: "Dirección deseada",
    antibotLabel: "Verificación de Seguridad Anti-Bot",
    antibotInstruction: "Desliza para verificar seguridad",
    antibotSuccess: "Humano verificado!",
    loginBtn: "Desbloquear Correo",
    registerBtn: "Crear Cuenta Cifrada",
    demoAccountNotice: "Cuenta Demo: demo@xmorf.net / password",

    passWeak: "Contraseña Débil",
    passMedium: "Contraseña Media",
    passStrong: "Contraseña Fuerte",
    passReqLength: "Mínimo 8 caracteres",
    passReqUpper: "Al menos 1 mayúscula (A-Z)",
    passReqNumber: "Al menos 1 número (0-9)",
    passReqSpecial: "Al menos 1 carácter especial (!@#$%^&*)",
    passWeakError: "La contraseña no cumple los requisitos de seguridad obligatorios.",

    rateLimitTitle: "Límite Excedido",
    rateLimitMsg: "Demasiados correos enviados rápidamente. Enfriamiento activo por ",
    secondsRemaining: " segundos.",

    adminTitle: "Panel de Control y Seguridad Xmorf",
    adminSubtitle: "Acceso Confidencial (#xmadmin)",
    adminUsersTotal: "Usuarios Registrados",
    adminEmailsTotal: "Correos en Base de Datos",
    adminBotBlocks: "Ataques de Bots Bloqueados",
    adminRateLimits: "Límites de Envío Activos",
    adminUserCol: "Cuenta de Usuario",
    adminStorageCol: "Almacenamiento",
    adminStatusCol: "Estado de Seguridad",
    adminActionsCol: "Acciones",
    adminStatusActive: "Activo / Verificado",
    adminStatusSuspended: "Suspendido",
    adminSuspendBtn: "Suspender",
    adminUnsuspendBtn: "Activar",
    adminDeleteUserBtn: "Eliminar Cuenta",
    adminLogsTitle: "Registro Global de Auditoría y Eventos Anti-Bot",
    adminExitBtn: "Salir de Vista Admin",

    composeBtn: "Nuevo Mensaje Cifrado",
    inbox: "Bandeja de Entrada",
    sent: "Enviados",
    starred: "Destacados",
    trash: "Papelera",
    drafts: "Borradores",
    storageUsed: "Espacio de Almacenamiento",
    systemStatus: "Escudo Anti-Bot Activo",
    logout: "Cerrar Sesión",

    searchPlaceholder: "Buscar por asunto, remitente, contenido...",
    noEmailsFound: "No hay correos en esta carpeta.",
    unreadBadge: "No leído",
    starredBadge: "Destacado",
    encryptedBadge: "Cifrado 256-Bit",

    deleteBtn: "Mover a Papelera",
    restoreBtn: "Restaurar Correo",
    permDeleteBtn: "Eliminar Definitivamente",
    emptyTrashBtn: "Vaciar Papelera",
    replyBtn: "Responder",
    forwardBtn: "Reenviar",
    starMail: "Marcar correo",
    unstarMail: "Desmarcar correo",

    composeTitle: "Nuevo Mensaje Cifrado",
    recipientLabel: "Para",
    recipientPlaceholder: "destinatario@xmorf.net",
    subjectLabel: "Asunto",
    subjectPlaceholder: "Escriba el asunto...",
    bodyPlaceholder: "Escriba su mensaje cifrado aquí...",
    attachFiles: "Adjuntar archivos",
    dragDropText: "Arrastre archivos aquí o haga clic",
    attachmentSizeLimit: "Tamaño máx: 25 MB",
    sendMailBtn: "Enviar Correo Cifrado",
    closeModal: "Cancelar",

    mailSentSuccess: "Mensaje cifrado y enviado correctamente!",
    mailTrashedSuccess: "Correo movido a la papelera.",
    mailRestoredSuccess: "Correo restaurado a la bandeja de entrada!",
    mailDeletedPerm: "Correo eliminado permanentemente.",
    trashEmptied: "Papelera vaciada.",
    botError: "Por favor complete la verificación anti-bot primero!",
    loginSuccess: "Bienvenido a Xmorf.net!",
    regSuccess: "Cuenta creada con éxito!",
    fillAllFields: "Por favor complete todos los campos."
  }
};

class I18n {
  constructor() {
    this.currentLang = localStorage.getItem('xmorf_lang') || 'en';
  }

  setLanguage(lang) {
    if (translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('xmorf_lang', lang);
      this.updateDOM();
    }
  }

  get(key) {
    return translations[this.currentLang][key] || translations['en'][key] || key;
  }

  updateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[this.currentLang][key]) {
        el.textContent = translations[this.currentLang][key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (translations[this.currentLang][key]) {
        el.placeholder = translations[this.currentLang][key];
      }
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
      if (btn.getAttribute('data-lang') === this.currentLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
}

window.i18n = new I18n();
