@echo off
cd /d "%~dp0"
start "" http://localhost:3000
npm run dev -- --port 3000
