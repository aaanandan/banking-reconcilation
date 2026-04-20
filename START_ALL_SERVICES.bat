@echo off
echo =============================================
echo Banking Reconciliation - START ALL SERVICES
echo =============================================
echo.
echo WARNING: This starts 23+ microservices!
echo.
echo SYSTEM REQUIREMENTS:
echo - 16GB RAM recommended
echo - 8GB RAM minimum
echo.
echo This will open ~20 terminal windows for:
echo - Auth Service
echo - Data Prep Service
echo - Match Orchestrator
echo - State Manager
echo - Learning Service
echo - Question Manager
echo - 16 Matching Technique Services (MT-01 to MT-16)
echo - Frontend
echo.
echo Press Ctrl+C to cancel, or
pause
echo.
echo Starting services in 3 seconds...
timeout /t 3 /nobreak >nul

cd /d "%~dp0"

echo.
echo [1/20] Starting Auth Service (port 3001)...
start "Auth Service - 3001" cmd /k "cd banking-reconciliation-system && npm run start:auth:dev"
timeout /t 2 /nobreak >nul

echo [2/20] Starting Data Prep Service (port 3003)...
start "Data Prep Service - 3003" cmd /k "cd banking-reconciliation-system && npm run start:data-prep:dev"
timeout /t 2 /nobreak >nul

echo [3/20] Starting Match Orchestrator (port 3004)...
start "Match Orchestrator - 3004" cmd /k "cd banking-reconciliation-system && npm run start:orchestrator:dev"
timeout /t 2 /nobreak >nul

echo [4/20] Starting State Manager Service...
start "State Manager Service" cmd /k "cd banking-reconciliation-system && npm run start:state-manager:dev"
timeout /t 2 /nobreak >nul

echo [5/20] Starting MT-01: Exact Match...
start "MT-01 Exact Match" cmd /k "cd banking-reconciliation-system && npm run start:mt-01:dev"
timeout /t 2 /nobreak >nul

echo [6/20] Starting MT-02: Near Exact...
start "MT-02 Near Exact" cmd /k "cd banking-reconciliation-system && npm run start:mt-02:dev"
timeout /t 2 /nobreak >nul

echo [7/20] Starting MT-03: Bank Fees...
start "MT-03 Bank Fees" cmd /k "cd banking-reconciliation-system && npx nest start mt-03-bank-fees --watch"
timeout /t 2 /nobreak >nul

echo [8/20] Starting MT-04: Interest...
start "MT-04 Interest" cmd /k "cd banking-reconciliation-system && npx nest start mt-04-interest --watch"
timeout /t 2 /nobreak >nul

echo [9/20] Starting MT-05: Split Payments...
start "MT-05 Split Payments" cmd /k "cd banking-reconciliation-system && npx nest start mt-05-split-payments --watch"
timeout /t 2 /nobreak >nul

echo [10/20] Starting MT-06: Consolidated Deposits...
start "MT-06 Consolidated" cmd /k "cd banking-reconciliation-system && npx nest start mt-06-consolidated-deposits --watch"
timeout /t 2 /nobreak >nul

echo [11/20] Starting MT-07: Duplicate Postings...
start "MT-07 Duplicates" cmd /k "cd banking-reconciliation-system && npx nest start mt-07-duplicate-postings --watch"
timeout /t 2 /nobreak >nul

echo [12/20] Starting MT-08: Reversals...
start "MT-08 Reversals" cmd /k "cd banking-reconciliation-system && npx nest start mt-08-reversals --watch"
timeout /t 2 /nobreak >nul

echo [13/20] Starting MT-09: Timing Differences...
start "MT-09 Timing" cmd /k "cd banking-reconciliation-system && npx nest start mt-09-timing-differences --watch"
timeout /t 2 /nobreak >nul

echo [14/20] Starting MT-10: Currency...
start "MT-10 Currency" cmd /k "cd banking-reconciliation-system && npx nest start mt-10-currency --watch"
timeout /t 2 /nobreak >nul

echo [15/20] Starting MT-11: Rounding...
start "MT-11 Rounding" cmd /k "cd banking-reconciliation-system && npx nest start mt-11-rounding --watch"
timeout /t 2 /nobreak >nul

echo [16/20] Starting MT-12: High Volume Payer...
start "MT-12 High Volume" cmd /k "cd banking-reconciliation-system && npx nest start mt-12-high-volume-payer --watch"
timeout /t 2 /nobreak >nul

echo [17/20] Starting MT-13: Standing Orders...
start "MT-13 Standing Orders" cmd /k "cd banking-reconciliation-system && npx nest start mt-13-standing-orders --watch"
timeout /t 2 /nobreak >nul

echo [18/20] Starting MT-14: Unmatched Pool...
start "MT-14 Unmatched Pool" cmd /k "cd banking-reconciliation-system && npx nest start mt-14-unmatched-pool --watch"
timeout /t 2 /nobreak >nul

echo [19/20] Starting MT-15: Manual Classification...
start "MT-15 Manual" cmd /k "cd banking-reconciliation-system && npx nest start mt-15-manual-classification --watch"
timeout /t 2 /nobreak >nul

echo [20/20] Starting MT-16: Final Validation...
start "MT-16 Final" cmd /k "cd banking-reconciliation-system && npx nest start mt-16-final-validation --watch"
timeout /t 2 /nobreak >nul

echo [21/23] Starting Learning Service...
start "Learning Service" cmd /k "cd banking-reconciliation-system && npx nest start learning-service --watch"
timeout /t 2 /nobreak >nul

echo [22/23] Starting Question Manager Service...
start "Question Manager" cmd /k "cd banking-reconciliation-system && npx nest start question-manager-service --watch"
timeout /t 2 /nobreak >nul

echo [23/23] Starting Frontend (port 5173)...
start "Frontend - 5173" cmd /k "cd banking-recon-frontend && npm run dev"

echo.
echo =============================================
echo ALL SERVICES STARTED!
echo =============================================
echo.
echo Frontend: http://localhost:5173
echo Auth API: http://localhost:3001
echo.
echo Monitor your Task Manager for resource usage
echo.
echo To stop: Close all terminal windows or press Ctrl+C in each
echo.
pause
