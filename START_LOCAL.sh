#!/bin/bash

echo "========================================"
echo "Banking Reconciliation - Local Startup"
echo "========================================"
echo ""
echo "Starting essential services..."
echo ""
echo "This will open 4 terminal windows:"
echo "1. Auth Service (port 3001)"
echo "2. Data Prep Service (port 3003)"
echo "3. Match Orchestrator (port 3004)"
echo "4. Frontend (port 5173)"
echo ""
echo "Press Ctrl+C in each window to stop services"
echo "========================================"
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npm run start:auth:dev"'
    sleep 3
    osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npm run start:data-prep:dev"'
    sleep 3
    osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-reconciliation-system && npm run start:orchestrator:dev"'
    sleep 3
    osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/banking-recon-frontend && npm run dev"'
else
    # Linux
    gnome-terminal -- bash -c "cd banking-reconciliation-system && npm run start:auth:dev; exec bash"
    sleep 3
    gnome-terminal -- bash -c "cd banking-reconciliation-system && npm run start:data-prep:dev; exec bash"
    sleep 3
    gnome-terminal -- bash -c "cd banking-reconciliation-system && npm run start:orchestrator:dev; exec bash"
    sleep 3
    gnome-terminal -- bash -c "cd banking-recon-frontend && npm run dev; exec bash"
fi

echo ""
echo "========================================"
echo "All services started!"
echo "========================================"
echo ""
echo "Open your browser to: http://localhost:5173"
echo ""
echo "To stop: Close each terminal window or press Ctrl+C"
echo ""
