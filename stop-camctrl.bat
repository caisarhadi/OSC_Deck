@echo off
title Stopping OSC Deck
echo Stopping OSC Deck background servers...
echo.

call pm2 stop osc-bridge
call pm2 stop osc-ui

call pm2 delete osc-bridge
call pm2 delete osc-ui

echo.
echo OSC Deck has been stopped and removed from background processes.
echo Terminal will close in 2 seconds or you can safely close this window.
echo ========================================================
timeout /t 2 >nul
