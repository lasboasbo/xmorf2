#!/usr/bin/env bash
# Xmorf.net Quick Fixer Script for IONOS VPS
set -e

echo "🔧 Repairing Postfix configuration and updating Xmorf..."
rm -f /var/www/xmorf/server/scripts/mail-pipe.js
sed -i '/xmorfpipe flags=/d' /etc/postfix/master.cf || true

cd /var/www/xmorf
git pull
bash setup-ubuntu.sh xmorf.net 217.160.188.228

echo "✅ Postfix status:"
systemctl status postfix --no-pager
