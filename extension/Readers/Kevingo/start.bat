@echo off
title Kevingo Reader
cd /d "%~dp0"
echo Kevingo Reader...
:loop
node KevingoReader.js acereader || (
    echo [CRASH DETECTED] %DATE% %TIME% >> crash_log.txt
    echo Restarting Kevingoreader...
    timeout /t 2 >nul
)
goto loop