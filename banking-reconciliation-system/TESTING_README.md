# Testing Guide - Steps 1-220

This guide covers the comprehensive testing setup for the Banking Reconciliation System.

## Quick Start

```bash
# 1. Setup test environment (PostgreSQL, Redis, MinIO, MailHog)
./scripts/test-setup.sh

# 2. Run all tests
./scripts/run-all-tests.sh

# 3. View reports
open test-reports/TEST_RESULTS_BACKEND_UNIT.md
```

## Test Environment Architecture

### Infrastructure Services

| Service | Port (Host) | Port (Container) | Purpose |
|---------|------------|------------------|---------|
| PostgreSQL | 5433 | 5432 | Test database |
| Redis | 6380 | 6379 | Caching & sessions |
| MinIO | 9010, 9011 | 9000, 9001 | File storage |
| MailHog | 1025, 8025 | 1025, 8025 | Email testing |

### Backend Services (22 total)

| Service | Port | Type |
|---------|------|------|
| auth-service | 3001 | Core |
| data-prep-service | 3002 | Core |
| state-manager-service | 3003 | Core |
| match-orchestrator | 3004 | Core |
| learning-service | 3005 | Core |
| question-manager-service | 3006 | Core |
| mt-01-exact-match | 3011 | Match Type |
| mt-02-near-exact | 3012 | Match Type |
| mt-03-bank-fees | 3013 | Match Type |
| mt-04-interest | 3014 | Match Type |
| mt-05-split-payments | 3015 | Match Type |
| mt-06-consolidated-deposits | 3016 | Match Type |
| mt-07-duplicate-postings | 3017 | Match Type |
| mt-08-reversals | 3018 | Match Type |
| mt-09-timing-differences | 3019 | Match Type |
| mt-10-currency | 3020 | Match Type |
| mt-11-rounding | 3021 | Match Type |
| mt-12-high-volume-payer | 3022 | Match Type |
| mt-13-standing-orders | 3023 | Match Type |
| mt-14-unmatched-pool | 3024 | Match Type |
| mt-15-manual-classification | 3025 | Match Type |
| mt-16-final-validation | 3026 | Match Type |

## Manual Setup (Alternative to Scripts)

### 1. Start Infrastructure

```bash
docker-compose -f docker-compose.test.yml up -d postgres-test redis-test minio-test mailhog
```

### 2. Wait for Services

```bash
# PostgreSQL
until docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U postgres; do sleep 1; done

# Redis
until docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli ping; do sleep 1; done
```

### 3. Run Migrations

```bash
DB_HOST=localhost DB_PORT=5433 DB_USERNAME=postgres DB_PASSWORD=test_password_123 DB_DATABASE=banking_recon_test npm run migration:run
```

### 4. Start Backend Services

```bash
# Start all 22 backend services
docker-compose -f docker-compose.test.yml up -d

# Or start specific services
docker-compose -f docker-compose.test.yml up -d auth-service data-prep-service
```

## Running Tests

### Backend Unit Tests

```bash
# All services with coverage
npm run test:cov

# Specific service
npm test -- apps/auth-service --coverage

# Watch mode
npm run test:watch
```

### Database Tests

```bash
# Tenant isolation (CRITICAL)
npm run test:tenant

# Database indexes
npm run verify:indexes
```

### Integration Tests

```bash
npm run test:e2e
```

### Security Tests (Steps 201-220)

```bash
# Run security-specific tests
npm test -- apps/auth-service/test/security
```

## Test Reports

After running `./scripts/run-all-tests.sh`, reports are generated in `test-reports/`:

1. **TEST_RESULTS_BACKEND_UNIT.md** - Backend unit test results
2. **TEST_RESULTS_DATABASE.md** - Database operation results
3. **TEST_RESULTS_INTEGRATION.md** - Integration test results
4. **coverage-{timestamp}/** - Code coverage reports (HTML)
5. **\*-{timestamp}.log** - Raw test logs

## Viewing Results

### Coverage Report

```bash
open test-reports/coverage-TIMESTAMP/lcov-report/index.html
```

### MailHog (Email Testing)

```bash
open http://localhost:8025
```

### MinIO Console

```bash
open http://localhost:9011
```

Login: `minioadmin` / `minioadmin`

## Common Commands

### Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.test.yml up -d

# Stop all services
docker-compose -f docker-compose.test.yml down

# View logs
docker-compose -f docker-compose.test.yml logs -f [service-name]

# Rebuild services
docker-compose -f docker-compose.test.yml up -d --build

# Clean everything (including volumes)
docker-compose -f docker-compose.test.yml down -v
```

### Database

```bash
# Connect to test database
docker-compose -f docker-compose.test.yml exec postgres-test psql -U postgres -d banking_recon_test

# Run SQL query
docker-compose -f docker-compose.test.yml exec -T postgres-test psql -U postgres -d banking_recon_test -c "SELECT * FROM tenants;"

# Backup database
docker-compose -f docker-compose.test.yml exec -T postgres-test pg_dump -U postgres banking_recon_test > backup.sql

# Restore database
docker-compose -f docker-compose.test.yml exec -T postgres-test psql -U postgres banking_recon_test < backup.sql
```

### Service Health Checks

```bash
# Check all services
docker-compose -f docker-compose.test.yml ps

# Test specific service endpoint
curl http://localhost:3001/health
curl http://localhost:3002/health
```

## Troubleshooting

### PostgreSQL Connection Refused

```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.test.yml ps postgres-test

# Check logs
docker-compose -f docker-compose.test.yml logs postgres-test

# Restart PostgreSQL
docker-compose -f docker-compose.test.yml restart postgres-test
```

### Tests Failing with "Cannot connect to database"

Ensure you're using the correct environment variables:

```bash
export DB_HOST=localhost
export DB_PORT=5433
export DB_USERNAME=postgres
export DB_PASSWORD=test_password_123
export DB_DATABASE=banking_recon_test
```

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.test.yml logs [service-name]

# Rebuild service
docker-compose -f docker-compose.test.yml up -d --build [service-name]
```

### Out of Disk Space

```bash
# Clean up unused Docker resources
docker system prune -a --volumes

# Remove test volumes
docker volume rm banking-reconciliation-system_postgres_test_data
docker volume rm banking-reconciliation-system_redis_test_data
docker volume rm banking-reconciliation-system_minio_test_data
```

## Test Phases (T-1 through T-15)

| Phase | Description | Status | Duration |
|-------|-------------|--------|----------|
| T-1 | Create testing branch | ✅ Complete | - |
| T-2 | Create Docker Compose config | ✅ Complete | - |
| T-3 | Build all services | ⏳ Pending | 30-45 min |
| T-4 | Start all services | ⏳ Pending | 10-15 min |
| T-5 | Run database migrations | ⏳ Pending | 5-10 min |
| T-6 | Seed test data | ⏳ Pending | 5-10 min |
| T-7 | Test backend services (22) | ⏳ Pending | 4-6 hours |
| T-8 | Test frontend screens (15) | ⏳ Pending | 2-3 hours |
| T-9 | Test service communication | ⏳ Pending | 2-3 hours |
| T-10 | Test database operations | ⏳ Pending | 2-3 hours |
| T-11 | Test authentication | ⏳ Pending | 2-3 hours |
| T-12 | Test security features | ⏳ Pending | 4-6 hours |
| T-13 | Test reconciliation flow | ⏳ Pending | 4-6 hours |
| T-14 | Validate business requirements | ⏳ Pending | 2-4 hours |
| T-15 | Create master test report | ⏳ Pending | 1-2 hours |

**Total Estimated Duration:** 26-38 hours (3-5 days)

## Success Criteria

### Test Coverage
- ✅ Backend: >80% code coverage
- ✅ Frontend: >75% code coverage
- ✅ Critical paths: 100% coverage

### Test Pass Rate
- ✅ Unit tests: >95% pass rate
- ✅ Integration tests: >90% pass rate
- ✅ E2E tests: 100% pass rate

### Security
- ✅ All security features: 100% functional
- ✅ No critical vulnerabilities: OWASP Top 10 verified
- ✅ Tenant isolation: 100% verified

### Business Requirements
- ✅ All 25 requirements: Validated
- ✅ Complete reconciliation flow: Working
- ✅ Learning model: Improving match rate

## Next Steps After Testing

1. **Review all test reports** in `test-reports/`
2. **Fix failing tests** - Never remove tests, fix root causes
3. **Achieve coverage targets** - >80% backend, >75% frontend
4. **Document issues** in `ISSUES_TO_FIX.md`
5. **Create final report** - `COMPREHENSIVE_TEST_REPORT_FINAL.md`
6. **Proceed to Steps 221-280** after all tests pass

## Support

For issues or questions:
1. Check logs: `docker-compose -f docker-compose.test.yml logs [service]`
2. Review TESTING_ROADMAP.md
3. Check STEP_*.md documentation files

---

**Last Updated:** 2025-01-18
**Branch:** testing/comprehensive-validation
**Status:** Test environment ready
