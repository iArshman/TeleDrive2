@echo off
title TeleDrive
cd /d "C:\Users\THECSA\Documents\Antigravity\TeleDrive"

echo.
echo  Starting TeleDrive...
echo  Browser will open at http://localhost:5174/
echo.
start "" http://localhost:5174/
npm run dev