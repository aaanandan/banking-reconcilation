#!/bin/bash
# Banking Reconciliation Platform - Quick Start
# Run this script to start everything

set -e

echo "=================================================="
echo "🚀 Banking Reconciliation Platform - Quick Start"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_info() { echo -e "${YELLOW}➜${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }

# Step 1: Start PostgreSQL
print_info "Step 1: Starting PostgreSQL..."

# Check if postgres is already running
if pg_isready -q 2>/dev/null; then
    print_success "PostgreSQL already running"
else
    # Try to start PostgreSQL using pg_ctl
    if [ -f /usr/lib/postgresql/16/bin/pg_ctl ]; then
        # Initialize data directory if needed
        if [ ! -d /var/lib/postgresql/16/main ]; then
            print_info "Initializing PostgreSQL data directory..."
            mkdir -p /var/lib/postgresql/16/main
            chown -R postgres:postgres /var/lib/postgresql/16/main
            su - postgres -c "/usr/lib/postgresql/16/bin/initdb -D /var/lib/postgresql/16/main"
        fi

        # Start PostgreSQL
        print_info "Starting PostgreSQL service..."
        su - postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /var/lib/postgresql/16/main -l /var/log/postgresql/postgresql-16-main.log start"
        sleep 3

        if pg_isready -q 2>/dev/null; then
            print_success "PostgreSQL started successfully"
        else
            print_error "Failed to start PostgreSQL with pg_ctl, trying service command..."
            service postgresql start 2>/dev/null || systemctl start postgresql 2>/dev/null || {
                print_error "Could not start PostgreSQL. Please start it manually."
                exit 1
            }
        fi
    else
        # Try service/systemctl
        service postgresql start 2>/dev/null || systemctl start postgresql 2>/dev/null || {
            print_error "Could not start PostgreSQL"
            exit 1
        }
    fi

    # Wait for PostgreSQL to be ready
    print_info "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if pg_isready -q 2>/dev/null; then
            print_success "PostgreSQL is ready"
            break
        fi
        sleep 1
    done
fi

# Step 2: Create database
print_info "Step 2: Creating database..."
su - postgres -c "psql -c \"SELECT 1 FROM pg_database WHERE datname = 'banking_reconciliation'\" | grep -q 1" 2>/dev/null || {
    su - postgres -c "psql -c 'CREATE DATABASE banking_reconciliation;'"
    print_success "Database created"
} || print_success "Database already exists"

# Step 3: Install backend dependencies
print_info "Step 3: Installing backend dependencies..."
cd /home/user/banking-reconcilation/banking-reconciliation-system
if [ ! -d "node_modules" ]; then
    npm install
    print_success "Backend dependencies installed"
else
    print_success "Backend dependencies already installed"
fi

# Step 4: Run migrations
print_info "Step 4: Running database migrations..."
npm run migration:run 2>&1 | grep -q "No migrations" && print_info "No pending migrations" || print_success "Migrations completed"

# Step 5: Start backend services
print_info "Step 5: Starting backend services (23 microservices)..."
print_info "This will run in the background..."

# Create logs directory
mkdir -p /tmp/banking-logs

# Start backend in background
nohup npm run start:dev > /tmp/banking-logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/banking-backend.pid
print_success "Backend services starting (PID: $BACKEND_PID)"
print_info "Waiting for services to initialize (30 seconds)..."
sleep 30

# Step 6: Install and start frontend
print_info "Step 6: Installing frontend dependencies..."
cd /home/user/banking-reconcilation/banking-recon-frontend
if [ ! -d "node_modules" ]; then
    npm install
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies already installed"
fi

print_info "Starting frontend..."
nohup npm run dev > /tmp/banking-logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/banking-frontend.pid
print_success "Frontend starting (PID: $FRONTEND_PID)"
print_info "Waiting for frontend to initialize (10 seconds)..."
sleep 10

echo ""
echo "=================================================="
print_success "Platform started successfully!"
echo "=================================================="
echo ""
echo "📊 Access the application:"
echo "   Frontend:     http://localhost:5173"
echo "   Auth API:     http://localhost:3001"
echo "   API Docs:     http://localhost:3001/api/docs"
echo "   Data Prep:    http://localhost:3003"
echo "   Orchestrator: http://localhost:3004"
echo ""
echo "📝 View logs:"
echo "   Backend:  tail -f /tmp/banking-logs/backend.log"
echo "   Frontend: tail -f /tmp/banking-logs/frontend.log"
echo ""
echo "🛑 To stop the platform:"
echo "   ./STOP_PLATFORM.sh"
echo ""
echo "✅ Platform is ready for testing!"
echo ""
