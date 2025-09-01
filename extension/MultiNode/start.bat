@echo off
title MultiNode Auto-Restart
cd /d "%~dp0"
echo Starting multinode.js...
:loop
node multinode.js || (
    echo [CRASH DETECTED] %DATE% %TIME% >> crash_log.txt
    echo Restarting multinode.js...
    timeout /t 2 >nul
)
goto loop