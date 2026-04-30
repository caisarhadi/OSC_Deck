@echo off
title Starting OSC Deck (Background)
echo Starting OSC Deck in the background...
echo.

:: Check for project dependencies
if not exist "node_modules\" (
    echo Project dependencies are required and not found.
    echo Installing node modules OSC and web socket first...
    call npm install
) else (
    echo Project dependencies found.
)

:: Check if PM2 is installed, install it if not
call pm2 -v >nul 2>&1
if %errorlevel% neq 0 (
    echo PM2 process manager is required but was not found.
    echo Installing PM2 globally...
    call npm install -g pm2
    echo.
) else (
    echo PM2 process manager found.
)

:: Check if processes are already running, restart if so
call pm2 describe osc-bridge >nul 2>&1
if %errorlevel% equ 0 (
    echo Existing servers detected. Restarting...
    call pm2 restart osc-bridge
    call pm2 restart osc-ui
) else (
    echo Starting bridge server...
    call pm2 start server/osc-bridge.js --name "osc-bridge"
    echo Starting UI server...
    call pm2 serve . 8080 --name "osc-ui"
)

echo.
echo ========================================================
echo OSC Deck is now running in the background!
echo Bridge: ws://localhost:9000
echo UI:     http://localhost:8080
echo.
echo Run stop-camctrl.bat to stop OSC Deck and remove servers from background processes.
echo Terminal will close in 5 seconds or you can safely close this window.
echo ========================================================
timeout /t 5 >nul
