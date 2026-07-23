#!/usr/bin/env bash
# Xmorf.net Quick Fixer Script for IONOS VPS
set -e

echo "🔧 Repairing Postfix configuration and updating Xmorf..."

cd /var/www/xmorf
git pull origin main || git pull
chmod +x setup-ubuntu.sh
chmod +x server/scripts/mail-pipe.js

bash setup-ubuntu.sh xmorf.net 217.160.188.228 7449-74491-74492-74493

echo "✅ Restarting Node.js Backend with PM2..."
cd /var/www/xmorf/server
npm install
pm2 restart xmorf-backend || pm2 start server.js --name "xmorf-backend"

echo "✅ Postfix status:"
systemctl status postfix --no-pager

