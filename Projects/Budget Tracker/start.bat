@echo off
title Budget Tracker
cd /d "%~dp0"

echo ========================================
echo    Budget Tracker - Starting Up
echo ========================================
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo [1/3] Installing dependencies...
    call npm install
    echo.
) else (
    echo [1/3] Dependencies already installed.
)

:: Check if database exists
if not exist "prisma\dev.db" (
    echo [2/3] Setting up database...
    call npx prisma migrate dev --name init
    echo.
) else (
    echo [2/3] Database already exists.
)

echo [3/3] Starting server...
echo.
echo ========================================
echo    Opening http://localhost:3000
echo    Press Ctrl+C to stop the server
echo ========================================
echo.

:: Open Chrome after a short delay (gives server time to start)
start "" cmd /c "timeout /t 2 /nobreak >nul && start chrome http://localhost:3000"

:: Start the server (this will keep running)
node server.js

