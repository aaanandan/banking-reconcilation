#!/bin/bash
# Stop the Banking Reconciliation Platform

echo "🛑 Stopping Banking Reconciliation Platform..."

# Stop backend
if [ -f /tmp/banking-backend.pid ]; then
    BACKEND_PID=$(cat /tmp/banking-backend.pid)
    echo "Stopping backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null || echo "Backend already stopped"
    rm /tmp/banking-backend.pid
fi

# Stop frontend
if [ -f /tmp/banking-frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/banking-frontend.pid)
    echo "Stopping frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null || echo "Frontend already stopped"
    rm /tmp/banking-frontend.pid
fi

# Kill any remaining node processes for this project
pkill -f "banking-reconciliation-system" 2>/dev/null
pkill -f "banking-recon-frontend" 2>/dev/null

echo "✅ Platform stopped"
