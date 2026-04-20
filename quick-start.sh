#!/bin/bash

# Banking Reconciliation SaaS Platform - Quick Start Script
# This script automates the setup and deployment process

set -e  # Exit on error

echo "=========================================="
echo "Banking Reconciliation Platform"
echo "Quick Start Setup"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}➜${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."

    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION"
    else
        print_error "Node.js not found. Please install Node.js 18+"
        exit 1
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm $NPM_VERSION"
    else
        print_error "npm not found"
        exit 1
    fi

    # Check PostgreSQL
    if command -v psql &> /dev/null; then
        PSQL_VERSION=$(psql --version | awk '{print $3}')
        print_success "PostgreSQL $PSQL_VERSION"
    else
        print_error "PostgreSQL not found. Please install PostgreSQL 15+"
        exit 1
    fi

    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
        print_success "Docker $DOCKER_VERSION"
    else
        print_info "Docker not found (optional for monitoring stack)"
    fi

    echo ""
}

# Setup environment
setup_environment() {
    print_info "Setting up environment..."

    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
            print_info "Please edit .env with your database credentials"
            echo ""
            read -p "Press Enter to continue after editing .env..."
        else
            print_error ".env.example not found"
            exit 1
        fi
    else
        print_success ".env file already exists"
    fi

    echo ""
}

# Setup database
setup_database() {
    print_info "Setting up database..."

    # Source .env file
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi

    DB_NAME=${POSTGRES_DB:-banking_reconciliation}
    DB_USER=${POSTGRES_USER:-postgres}

    # Check if database exists
    if psql -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        print_success "Database '$DB_NAME' already exists"
    else
        print_info "Creating database '$DB_NAME'..."
        psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
            print_error "Failed to create database. Make sure PostgreSQL is running and credentials are correct."
            exit 1
        }
        print_success "Database created"
    fi

    echo ""
}

# Install backend dependencies
install_backend() {
    print_info "Installing backend dependencies..."

    cd banking-reconciliation-system
    npm install
    print_success "Backend dependencies installed"

    echo ""
}

# Run migrations
run_migrations() {
    print_info "Running database migrations..."

    cd banking-reconciliation-system
    npm run migration:run || {
        print_error "Migration failed. Check your database connection."
        exit 1
    }
    print_success "Database migrations completed"

    cd ..
    echo ""
}

# Build backend
build_backend() {
    print_info "Building backend services..."

    cd banking-reconciliation-system
    npm run build || {
        print_error "Backend build failed"
        exit 1
    }
    print_success "Backend build completed"

    cd ..
    echo ""
}

# Install frontend dependencies
install_frontend() {
    print_info "Installing frontend dependencies..."

    cd banking-recon-frontend
    npm install
    print_success "Frontend dependencies installed"

    # Create frontend .env.local
    if [ ! -f .env.local ]; then
        cat > .env.local << 'EOF'
VITE_API_BASE_URL=http://localhost:3001
VITE_AUTH_SERVICE_URL=http://localhost:3001/api/auth
VITE_DATA_PREP_URL=http://localhost:3003/api
VITE_ORCHESTRATOR_URL=http://localhost:3004/api
EOF
        print_success "Created frontend .env.local"
    fi

    cd ..
    echo ""
}

# Build frontend
build_frontend() {
    print_info "Building frontend..."

    cd banking-recon-frontend
    npm run build || {
        print_error "Frontend build failed"
        exit 1
    }
    print_success "Frontend build completed"

    cd ..
    echo ""
}

# Start monitoring stack
start_monitoring() {
    if command -v docker-compose &> /dev/null; then
        print_info "Starting monitoring stack with Docker Compose..."
        docker-compose up -d || {
            print_error "Failed to start monitoring stack"
            return 1
        }
        print_success "Monitoring stack started"
        echo ""
        print_info "Monitoring dashboards available at:"
        echo "  - Grafana: http://localhost:3000 (admin/admin)"
        echo "  - Prometheus: http://localhost:9090"
        echo "  - Kibana: http://localhost:5601"
        echo "  - Jaeger: http://localhost:16686"
    else
        print_info "Docker Compose not available, skipping monitoring stack"
    fi

    echo ""
}

# Main execution
main() {
    check_prerequisites
    setup_environment
    setup_database
    install_backend
    run_migrations
    build_backend
    install_frontend
    build_frontend

    # Ask if user wants to start monitoring
    read -p "Do you want to start the monitoring stack? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_monitoring
    fi

    echo "=========================================="
    print_success "Setup Complete!"
    echo "=========================================="
    echo ""
    echo "To start the platform:"
    echo ""
    echo "1. Start backend services:"
    echo "   cd banking-reconciliation-system"
    echo "   npm run start:dev"
    echo ""
    echo "2. In a new terminal, start frontend:"
    echo "   cd banking-recon-frontend"
    echo "   npm run dev"
    echo ""
    echo "3. Access the application:"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend API: http://localhost:3001"
    echo "   API Docs: http://localhost:3001/api/docs"
    echo ""
    echo "For detailed instructions, see DEPLOYMENT_GUIDE.md"
    echo ""
}

# Run main function
main
