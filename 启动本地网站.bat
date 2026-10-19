@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18 or newer is required.
  echo Install it from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

curl.exe --silent --fail http://127.0.0.1:4173/ >nul
if not errorlevel 1 (
  start "" http://127.0.0.1:4173/
  exit /b 0
)

echo Starting the ACM algorithm map at http://127.0.0.1:4173/
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:4173/
node server.js
pause
