@echo off
echo ==============================================
echo  Starting TraceOn (Backend :3001 + Frontend :5173)
echo ==============================================
cd /d "%~dp0"
npm run dev
