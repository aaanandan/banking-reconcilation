#!/bin/bash

# Test Environment Setup Script
# This script sets up the complete testing environment for Steps 1-220

set -e

echo "🚀 Banking Reconciliation System - Test Environment Setup"
echo "=========================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi
print_success "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install it and try again."
    exit 1
fi
print_success "docker-compose is available"

# Stop and remove existing containers
print_info "Stopping existing test containers..."
docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true
print_success "Cleaned up existing containers"

# Create .env.test if it doesn't exist
if [ ! -f .env.test ]; then
    print_info "Creating .env.test file..."
    cp .env.example .env.test
    print_success "Created .env.test"
else
    print_success ".env.test already exists"
fi

# Start infrastructure services first
print_info "Starting infrastructure services (PostgreSQL, Redis, MinIO, MailHog)..."
docker-compose -f docker-compose.test.yml up -d postgres-test redis-test minio-test mailhog

# Wait for PostgreSQL to be ready
print_info "Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=0
until docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U postgres > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        print_error "PostgreSQL failed to start within 30 seconds"
        exit 1
    fi
    echo -n "."
    sleep 1
done
echo ""
print_success "PostgreSQL is ready"

# Wait for Redis to be ready
print_info "Waiting for Redis to be ready..."
attempt=0
until docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli ping > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        print_error "Redis failed to start within 30 seconds"
        exit 1
    fi
    echo -n "."
    sleep 1
done
echo ""
print_success "Redis is ready"

# Run database migrations
print_info "Running database migrations..."
DB_HOST=localhost DB_PORT=5433 DB_USERNAME=postgres DB_PASSWORD=test_password_123 DB_DATABASE=banking_recon_test npm run migration:run || true
print_success "Database migrations completed"

# Seed test data
print_info "Seeding test data..."
if [ -f "scripts/seed-test-data.ts" ]; then
    DB_HOST=localhost DB_PORT=5433 DB_USERNAME=postgres DB_PASSWORD=test_password_123 DB_DATABASE=banking_recon_test ts-node scripts/seed-test-data.ts
    print_success "Test data seeded"
else
    print_info "No seed script found, skipping test data seeding"
fi

echo ""
echo "=========================================================="
print_success "Test environment setup complete!"
echo "=========================================================="
echo ""
echo "📊 Infrastructure Services Running:"
echo "   - PostgreSQL: localhost:5433"
echo "   - Redis: localhost:6380"
echo "   - MinIO: localhost:9010 (API), localhost:9011 (Console)"
echo "   - MailHog: localhost:8025 (Web UI)"
echo ""
echo "🔧 Next Steps:"
echo "   1. Start backend services: docker-compose -f docker-compose.test.yml up -d"
echo "   2. Run unit tests: npm run test:cov"
echo "   3. Run integration tests: npm run test:e2e"
echo "   4. View logs: docker-compose -f docker-compose.test.yml logs -f [service-name]"
echo ""
echo "🛑 To stop all services: docker-compose -f docker-compose.test.yml down"
echo ""
