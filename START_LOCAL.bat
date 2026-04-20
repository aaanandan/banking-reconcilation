@echo off
echo ========================================
echo Banking Reconciliation - Local Startup
echo ========================================
echo.
echo Starting essential services...
echo.
echo This will open 4 terminal windows:
echo 1. Auth Service (port 3001)
echo 2. Data Prep Service (port 3003)
echo 3. Match Orchestrator (port 3004)
echo 4. Frontend (port 5173)
echo.
echo Press Ctrl+C in each window to stop services
echo ========================================
echo.

cd /d "%~dp0"

echo Starting Auth Service...
start "Auth Service - Port 3001" cmd /k "cd banking-reconciliation-system && npm run start:auth:dev"

timeout /t 3 /nobreak >nul

echo Starting Data Prep Service...
start "Data Prep Service - Port 3003" cmd /k "cd banking-reconciliation-system && npm run start:data-prep:dev"

timeout /t 3 /nobreak >nul

echo Starting Match Orchestrator...
start "Match Orchestrator - Port 3004" cmd /k "cd banking-reconciliation-system && npm run start:orchestrator:dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "Frontend - Port 5173" cmd /k "cd banking-recon-frontend && npm run dev"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Open your browser to: http://localhost:5173
echo.
echo To stop: Close each terminal window or press Ctrl+C
echo.
pause
