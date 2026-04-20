#!/bin/bash

echo "============================================="
echo "Banking Reconciliation - START ALL SERVICES"
echo "============================================="
echo ""
echo "WARNING: This starts 23+ microservices!"
echo ""
echo "SYSTEM REQUIREMENTS:"
echo "- 16GB RAM recommended"
echo "- 8GB RAM minimum"
echo ""
echo "This will open ~20 terminal windows for:"
echo "- Auth Service"
echo "- Data Prep Service"
echo "- Match Orchestrator"
echo "- State Manager"
echo "- Learning Service"
echo "- Question Manager"
echo "- 16 Matching Technique Services (MT-01 to MT-16)"
echo "- Frontend"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""
echo "Starting services in 3 seconds..."
sleep 3

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - use osascript
    TERMINAL_CMD="osascript -e"

    echo ""
    echo "[1/23] Starting Auth Service (port 3001)..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npm run start:auth:dev"'
    sleep 2

    echo "[2/23] Starting Data Prep Service (port 3003)..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npm run start:data-prep:dev"'
    sleep 2

    echo "[3/23] Starting Match Orchestrator (port 3004)..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npm run start:orchestrator:dev"'
    sleep 2

    echo "[4/23] Starting State Manager Service..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npm run start:state-manager:dev"'
    sleep 2

    echo "[5/23] Starting MT-01: Exact Match..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npm run start:mt-01:dev"'
    sleep 2

    echo "[6/23] Starting MT-02: Near Exact..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npm run start:mt-02:dev"'
    sleep 2

    echo "[7/23] Starting MT-03: Bank Fees..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npx nest start mt-03-bank-fees --watch"'
    sleep 2

    echo "[8/23] Starting MT-04: Interest..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npx nest start mt-04-interest --watch"'
    sleep 2

    echo "[9/23] Starting MT-05: Split Payments..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npx nest start mt-05-split-payments --watch"'
    sleep 2

    echo "[10/23] Starting MT-06: Consolidated Deposits..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npx nest start mt-06-consolidated-deposits --watch"'
    sleep 2

    echo "[11/23] Starting MT-07: Duplicate Postings..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npx nest start mt-07-duplicate-postings --watch"'
    sleep 2

    echo "[12/23] Starting MT-08: Reversals..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npx nest start mt-08-reversals --watch"'
    sleep 2

    echo "[13/23] Starting MT-09: Timing Differences..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npx nest start mt-09-timing-differences --watch"'
    sleep 2

    echo "[14/23] Starting MT-10: Currency..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npx nest start mt-10-currency --watch"'
    sleep 2

    echo "[15/23] Starting MT-11: Rounding..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npx nest start mt-11-rounding --watch"'
    sleep 2

    echo "[16/23] Starting MT-12: High Volume Payer..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npx nest start mt-12-high-volume-payer --watch"'
    sleep 2

    echo "[17/23] Starting MT-13: Standing Orders..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npx nest start mt-13-standing-orders --watch"'
    sleep 2

    echo "[18/23] Starting MT-14: Unmatched Pool..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npx nest start mt-14-unmatched-pool --watch"'
    sleep 2

    echo "[19/23] Starting MT-15: Manual Classification..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npx nest start mt-15-manual-classification --watch"'
    sleep 2

    echo "[20/23] Starting MT-16: Final Validation..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npx nest start mt-16-final-validation --watch"'
    sleep 2

    echo "[21/23] Starting Learning Service..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npx nest start learning-service --watch"'
    sleep 2

    echo "[22/23] Starting Question Manager Service..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npx nest start question-manager-service --watch"'
    sleep 2

    echo "[23/23] Starting Frontend (port 5173)..."
    $TERMINAL_CMD 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-recon-frontend && npm run dev"'

else
    # Linux - use gnome-terminal or xterm
    if command -v gnome-terminal &> /dev/null; then
        TERM_CMD="gnome-terminal --"
    elif command -v xterm &> /dev/null; then
        TERM_CMD="xterm -e"
    else
        echo "Error: No suitable terminal emulator found"
        exit 1
    fi

    echo ""
    echo "[1/23] Starting Auth Service (port 3001)..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npm run start:auth:dev; exec bash" &
    sleep 2

    echo "[2/23] Starting Data Prep Service (port 3003)..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npm run start:data-prep:dev; exec bash" &
    sleep 2

    echo "[3/23] Starting Match Orchestrator (port 3004)..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npm run start:orchestrator:dev; exec bash" &
    sleep 2

    echo "[4/23] Starting State Manager Service..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npm run start:state-manager:dev; exec bash" &
    sleep 2

    echo "[5/23] Starting MT-01: Exact Match..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npm run start:mt-01:dev; exec bash" &
    sleep 2

    echo "[6/23] Starting MT-02: Near Exact..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npm run start:mt-02:dev; exec bash" &
    sleep 2

    echo "[7/23] Starting MT-03: Bank Fees..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npx nest start mt-03-bank-fees --watch; exec bash" &
    sleep 2

    echo "[8/23] Starting MT-04: Interest..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npx nest start mt-04-interest --watch; exec bash" &
    sleep 2

    echo "[9/23] Starting MT-05: Split Payments..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npx nest start mt-05-split-payments --watch; exec bash" &
    sleep 2

    echo "[10/23] Starting MT-06: Consolidated Deposits..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npx nest start mt-06-consolidated-deposits --watch; exec bash" &
    sleep 2

    echo "[11/23] Starting MT-07: Duplicate Postings..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npx nest start mt-07-duplicate-postings --watch; exec bash" &
    sleep 2

    echo "[12/23] Starting MT-08: Reversals..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npx nest start mt-08-reversals --watch; exec bash" &
    sleep 2

    echo "[13/23] Starting MT-09: Timing Differences..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npx nest start mt-09-timing-differences --watch; exec bash" &
    sleep 2

    echo "[14/23] Starting MT-10: Currency..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npx nest start mt-10-currency --watch; exec bash" &
    sleep 2

    echo "[15/23] Starting MT-11: Rounding..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npx nest start mt-11-rounding --watch; exec bash" &
    sleep 2

    echo "[16/23] Starting MT-12: High Volume Payer..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npx nest start mt-12-high-volume-payer --watch; exec bash" &
    sleep 2

    echo "[17/23] Starting MT-13: Standing Orders..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npx nest start mt-13-standing-orders --watch; exec bash" &
    sleep 2

    echo "[18/23] Starting MT-14: Unmatched Pool..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npx nest start mt-14-unmatched-pool --watch; exec bash" &
    sleep 2

    echo "[19/23] Starting MT-15: Manual Classification..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npx nest start mt-15-manual-classification --watch; exec bash" &
    sleep 2

    echo "[20/23] Starting MT-16: Final Validation..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npx nest start mt-16-final-validation --watch; exec bash" &
    sleep 2

    echo "[21/23] Starting Learning Service..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npx nest start learning-service --watch; exec bash" &
    sleep 2

    echo "[22/23] Starting Question Manager Service..."
    $TERM_CMD bash -c "cd banking-reconciliation-system && npx nest start question-manager-service --watch; exec bash" &
    sleep 2

    echo "[23/23] Starting Frontend (port 5173)..."
    $TERM_CMD bash -c "cd banking-recon-frontend && npm run dev; exec bash" &
fi

echo ""
echo "============================================="
echo "ALL SERVICES STARTED!"
echo "============================================="
echo ""
echo "Frontend: http://localhost:5173"
echo "Auth API: http://localhost:3001"
echo ""
echo "Monitor system resources (htop, Activity Monitor, etc.)"
echo ""
echo "To stop: Close all terminal windows or press Ctrl+C in each"
echo ""
