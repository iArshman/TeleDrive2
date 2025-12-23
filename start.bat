@echo off
cd /d "%~dp0"
start "" http://localhost:5174
npm run dev -- --port 5174