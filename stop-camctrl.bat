@echo off
title Stopping OSC Deck
echo Stopping OSC Deck background servers...
echo.

call pm2 stop osc-bridge
call pm2 stop osc-ui

call pm2 delete osc-bridge
call pm2 delete osc-ui

echo.
echo Servers have been stopped and removed from background processes.
timeout /t 4 >nul
