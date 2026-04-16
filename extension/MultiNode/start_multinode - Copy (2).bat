@echo off
title Game Reader Autostart
cd /d "%~dp0"
echo Starting gamereader.js...
:loop
node gamereader.js || (
    echo Restarting gamereader.js...
    timeout /t 2 >nul
)
goto loop