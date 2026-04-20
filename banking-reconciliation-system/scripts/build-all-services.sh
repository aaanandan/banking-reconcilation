#!/bin/bash

# Build All Services Script
# Builds shared library and all 22 backend services

set -e

echo "🔨 Banking Reconciliation System - Build All Services"
echo "=========================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_building() {
    echo -e "${BLUE}🔨 Building: $1${NC}"
}

# Counter for success/failure
TOTAL=0
SUCCESS=0
FAILED=0
FAILED_SERVICES=()

# Build function
build_service() {
    local service_name=$1
    TOTAL=$((TOTAL + 1))

    print_building "$service_name"

    if npm run build $service_name > /dev/null 2>&1; then
        SUCCESS=$((SUCCESS + 1))
        print_success "$service_name built successfully"
        return 0
    else
        FAILED=$((FAILED + 1))
        FAILED_SERVICES+=("$service_name")
        print_error "$service_name build failed"
        return 1
    fi
}

# 1. Build shared library first (required by all services)
print_info "Step 1/23: Building shared library..."
if npm run build:shared; then
    print_success "Shared library built successfully"
else
    print_error "Shared library build failed - cannot continue"
    exit 1
fi
echo ""

# 2. Build core services
print_info "Step 2/23: Building core services (6)..."
build_service "auth-service" || true
build_service "data-prep-service" || true
build_service "state-manager-service" || true
build_service "match-orchestrator" || true
build_service "learning-service" || true
build_service "question-manager-service" || true
echo ""

# 3. Build match type services
print_info "Step 3/23: Building match type services (16)..."
build_service "mt-01-exact-match" || true
build_service "mt-02-near-exact" || true
build_service "mt-03-bank-fees" || true
build_service "mt-04-interest" || true
build_service "mt-05-split-payments" || true
build_service "mt-06-consolidated-deposits" || true
build_service "mt-07-duplicate-postings" || true
build_service "mt-08-reversals" || true
build_service "mt-09-timing-differences" || true
build_service "mt-10-currency" || true
build_service "mt-11-rounding" || true
build_service "mt-12-high-volume-payer" || true
build_service "mt-13-standing-orders" || true
build_service "mt-14-unmatched-pool" || true
build_service "mt-15-manual-classification" || true
build_service "mt-16-final-validation" || true
echo ""

# Display summary
echo "=========================================================="
echo "📊 Build Summary"
echo "=========================================================="
echo ""
echo "Total Services: $TOTAL"
print_success "Successfully Built: $SUCCESS"
if [ $FAILED -gt 0 ]; then
    print_error "Failed to Build: $FAILED"
    echo ""
    echo "Failed Services:"
    for service in "${FAILED_SERVICES[@]}"; do
        echo "  - $service"
    done
fi
echo ""

if [ $FAILED -eq 0 ]; then
    print_success "All services built successfully! 🎉"
    echo ""
    echo "Next Steps:"
    echo "  1. Start test environment: ./scripts/test-setup.sh"
    echo "  2. Start services: docker-compose -f docker-compose.test.yml up -d"
    echo "  3. Run tests: ./scripts/run-all-tests.sh"
    exit 0
else
    print_error "Some services failed to build"
    echo ""
    echo "To rebuild a specific service:"
    echo "  npm run build [service-name]"
    echo ""
    echo "To see build errors:"
    echo "  npm run build [service-name]"
    exit 1
fi
