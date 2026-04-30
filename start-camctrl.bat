@echo off
title Starting OSC Deck (Background)
echo Starting OSC Deck in the background...
echo.

:: Check for project dependencies
if not exist "node_modules\" (
    echo Project dependencies not found. Installing now...
    call npm install
)

:: Check if PM2 is installed, install it if not
call pm2 -v >nul 2>&1
if %errorlevel% neq 0 (
    echo PM2 process manager not found. Installing globally via npm...
    call npm install -g pm2
)

:: Start the OSC bridge Node server
echo Starting bridge server...
call pm2 start server/osc-bridge.js --name "osc-bridge"

:: Start the UI using PM2's built-in static file server
echo Starting UI server...
call pm2 serve . 8080 --name "osc-ui"

echo.
echo ========================================================
echo OSC Deck is now running in the background!
echo Bridge: ws://localhost:9000
echo UI:     http://localhost:8080
echo.
echo Run stop-camctrl.bat to stop OSC Deck and remove servers from background processes.
echo Terminal will close in 3 seconds or you can safely close this window.
echo ========================================================
timeout /t 3 >nul
