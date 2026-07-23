@echo off
chcp 65001 >nul
title Xmorf.net VPS Server Controller
color 0C
cls

echo ============================================================
echo   XMORF.NET VPS SERVER CONTROLLER (217.160.188.228)
echo ============================================================
echo.
echo   [1] ONLINE  - Start Xmorf Server (https://xmorf.net)
echo   [2] OFFLINE - Stop Xmorf Server (Offline / Maintenance)
echo   [3] STATUS  - Check PM2 and Nginx Status
echo.
echo ============================================================
echo.

set CHOICE=%1
if "%CHOICE%"=="" set /p CHOICE="Type 'online', 'offline', or 'status': "

if /i "%CHOICE%"=="online" goto CMD_ONLINE
if /i "%CHOICE%"=="1" goto CMD_ONLINE

if /i "%CHOICE%"=="offline" goto CMD_OFFLINE
if /i "%CHOICE%"=="2" goto CMD_OFFLINE

if /i "%CHOICE%"=="status" goto CMD_STATUS
if /i "%CHOICE%"=="3" goto CMD_STATUS

echo.
echo Invalid input! Please type 'online', 'offline' or 'status'.
echo.
pause
exit /b

:CMD_ONLINE
echo.
echo Connecting to VPS and starting Xmorf Webmail (fixing 502 Bad Gateway if needed)...
node -e "const { Client } = require('./server/node_modules/ssh2'); const c = new Client(); c.on('ready', () => { c.exec('cd /var/www/xmorf/server && (pm2 restart xmorf-backend || pm2 start server.js --name xmorf-backend) && pm2 save && systemctl restart nginx', (err, s) => { s.on('close', () => { console.log('\nSUCCESS: XMORF.NET IS NOW ONLINE! (https://xmorf.net)\n'); c.end(); process.exit(0); }); s.on('data', (d) => process.stdout.write(d.toString())); s.stderr.on('data', (d) => process.stderr.write(d.toString())); }); }).connect({ host: '217.160.188.228', username: 'root', password: '225weG39uCYKgfKM' });"
pause
exit /b

:CMD_OFFLINE
echo.
echo Connecting to VPS and stopping Xmorf Webmail...
node -e "const { Client } = require('./server/node_modules/ssh2'); const c = new Client(); c.on('ready', () => { c.exec('pm2 stop xmorf-backend; systemctl stop nginx', (err, s) => { s.on('close', () => { console.log('\nSUCCESS: XMORF.NET IS NOW OFFLINE!\n'); c.end(); process.exit(0); }); s.on('data', (d) => process.stdout.write(d.toString())); s.stderr.on('data', (d) => process.stderr.write(d.toString())); }); }).connect({ host: '217.160.188.228', username: 'root', password: '225weG39uCYKgfKM' });"
pause
exit /b

:CMD_STATUS
echo.
echo Checking live VPS status...
node -e "const { Client } = require('./server/node_modules/ssh2'); const c = new Client(); c.on('ready', () => { c.exec('pm2 status; systemctl status nginx --no-pager', (err, s) => { s.on('close', () => { c.end(); process.exit(0); }); s.on('data', (d) => process.stdout.write(d.toString())); s.stderr.on('data', (d) => process.stderr.write(d.toString())); }); }).connect({ host: '217.160.188.228', username: 'root', password: '225weG39uCYKgfKM' });"
pause
exit /b
