#!/usr/bin/env bash
# ==============================================================================
# Xmorf.net 1-Click Automated Setup Script for IONOS Ubuntu VPS (Ubuntu 22.04 / 24.04 / 26.04 LTS)
# Automatically configures Node.js, Nginx, SSL, PM2, Postfix, & Webhook Mail Routing
# Usage: bash setup-ubuntu.sh [domain] [server_ip] [admin_key]
# Example: bash setup-ubuntu.sh xmorf.net 123.45.67.89 1234-5678-9012-3456
# ==============================================================================

set -e

DOMAIN="${1:-xmorf.net}"
SERVER_IP="${2:-$(hostname -I | awk '{print $1}')}"
ADMIN_KEY="${3:-1234-5678-9012-3456}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo " 🚀 Starting Xmorf.net Automated Setup for Ubuntu LTS VPS"
echo " 🌐 Domain: ${DOMAIN}"
echo " 📡 Server IP: ${SERVER_IP}"
echo "=========================================================="

# 1. Update system and install required packages
echo "📦 Installing system packages (Node.js, Nginx, Postfix, Certbot, PM2)..."
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -y
sudo apt-get install -y curl git ufw nginx certbot python3-certbot-nginx postfix mailutils jq

if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - || true
    sudo apt-get install -y nodejs || true
fi

NODE_PATH="$(which node || echo '/usr/bin/node')"

sudo npm install -g pm2 || true

# 2. Setup firewall rules
echo "🛡️ Configuring Firewall (UFW)..."
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw allow 25/tcp || true
sudo ufw allow 587/tcp || true
sudo ufw allow 22/tcp || true
sudo ufw --force enable || true

# 3. Configure Node.js backend environment
echo "⚙️ Configuring Node.js Backend..."
cd "${APP_DIR}/server"
npm install

cat <<EOF > "${APP_DIR}/server/.env"
PORT=5000
ADMIN_KEY=${ADMIN_KEY}
DOMAIN=${DOMAIN}
SERVER_IP=${SERVER_IP}
WEBHOOK_SECRET=xmorf_secret_webhook_key
EOF

# 4. Configure Postfix to pipe incoming mail directly into Node.js Webhook
echo "📩 Configuring Postfix Mail Pipeline..."
cat <<EOF > /etc/postfix/main.cf
smtpd_banner = \$myhostname ESMTP \$mail_name
biff = no
append_dot_mydomain = no
readme_directory = no
compatibility_level = 2

smtpd_tls_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem
smtpd_tls_key_file=/etc/ssl/private/ssl-cert-snakeoil.key
smtpd_use_tls=yes
smtpd_tls_session_cache_database = btree:\${data_directory}/smtpd_scache
smtp_tls_session_cache_database = btree:\${data_directory}/smtp_scache

myhostname = mail.${DOMAIN}
alias_maps = hash:/etc/aliases
alias_database = hash:/etc/aliases
myorigin = /etc/mailname
mydestination = ${DOMAIN}, mail.${DOMAIN}, localhost, localhost.localdomain
relayhost = 
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128
mailbox_size_limit = 0
recipient_delimiter = +
inet_interfaces = all
inet_protocols = all

transport_maps = hash:/etc/postfix/transport
EOF

echo "${DOMAIN} xmorfpipe:" > /etc/postfix/transport
postmap /etc/postfix/transport

# Add master pipe handler to master.cf
if ! grep -q "xmorfpipe" /etc/postfix/master.cf; then
cat <<EOF >> /etc/postfix/master.cf
xmorfpipe flags=Fqhu user=nobody argv=${NODE_PATH} ${APP_DIR}/server/scripts/mail-pipe.js
EOF
fi

# Create mail pipe script
mkdir -p "${APP_DIR}/server/scripts"
cat <<'EOF' > "${APP_DIR}/server/scripts/mail-pipe.js"
const http = require('http');

let rawData = '';
process.stdin.on('data', chunk => { rawData += chunk; });
process.stdin.on('end', () => {
  const lines = rawData.split('\n');
  let sender = 'external@unknown.com';
  let recipient = 'demo@xmorf.net';
  let subject = 'Incoming External Mail';

  for (let line of lines) {
    if (line.toLowerCase().startsWith('from:')) sender = line.substring(5).trim();
    if (line.toLowerCase().startsWith('to:')) recipient = line.substring(3).trim();
    if (line.toLowerCase().startsWith('subject:')) subject = line.substring(8).trim();
  }

  const payload = JSON.stringify({
    senderEmail: sender,
    recipient: recipient,
    subject: subject,
    body: rawData.substring(0, 5000),
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
  req.write(payload);
  req.end();
});
EOF

sudo systemctl restart postfix || true

# 5. Configure Nginx Reverse Proxy
echo "🌐 Configuring Nginx for ${DOMAIN}..."
cat <<EOF | sudo tee /etc/nginx/sites-available/${DOMAIN} > /dev/null
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 5M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx || true

# 6. Run PM2 24/7 Service
echo "⚡ Starting Xmorf Node.js Server with PM2..."
cd "${APP_DIR}/server"
pm2 delete xmorf-backend 2>/dev/null || true
pm2 start server.js --name "xmorf-backend"
pm2 save

# 7. Attempt Let's Encrypt SSL
echo "🔒 Requesting SSL Certificate (Let's Encrypt)..."
sudo certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email || true

echo "=========================================================="
echo " 🎉 XMORF.NET AUTOMATED SETUP COMPLETE!"
echo "=========================================================="
echo " 🌐 Webmail App: https://${DOMAIN}"
echo " 🔑 Admin Panel: https://${DOMAIN}/#xmadmin"
echo " 🛡️ Admin Key: ${ADMIN_KEY}"
echo ""
echo " 📋 COPY-PASTE THESE 4 DNS RECORDS INTO YOUR IONOS DASHBOARD:"
echo " --------------------------------------------------------"
echo " 1. A Record  | Host: @     | Target: ${SERVER_IP}"
echo " 2. A Record  | Host: mail  | Target: ${SERVER_IP}"
echo " 3. MX Record | Host: @     | Target: mail.${DOMAIN} (Priority 10)"
echo " 4. TXT (SPF) | Host: @     | Target: v=spf1 mx ip4:${SERVER_IP} ~all"
echo " =========================================================="
