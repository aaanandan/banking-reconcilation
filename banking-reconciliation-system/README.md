# Banking Reconciliation SaaS Platform

A multi-tenant SaaS platform for automated bank and ledger reconciliation, built with NestJS, TypeScript, and PostgreSQL.

## Overview

This system provides automated reconciliation services using advanced matching algorithms to identify and resolve discrepancies between bank statements and accounting ledger data. The platform supports multiple tenants with complete data isolation, per-tenant quotas, and role-based access control.

## Architecture

### Multi-Tenant Design

- **Database-level isolation**: All tables include a `tenantId` column with proper indexes
- **JWT-based authentication**: Every token includes tenant context
- **Quota enforcement**: Per-tenant limits on transactions, storage, bank accounts, and users
- **Plan-based access**: Starter, Professional, and Enterprise tiers

### Microservices

The system consists of 22+ microservices organized into functional groups:

1. **Core Services**
   - `auth-service`: Authentication, JWT token management
   - `tenant-manager-service`: Tenant lifecycle and configuration
   - `quota-manager-service`: Resource usage tracking and enforcement
   - `user-manager-service`: User management and permissions

2. **Data Services**
   - `data-prep-service`: File upload and preprocessing
   - `bank-file-service`: Bank statement processing
   - `ledger-file-service`: Ledger file processing
   - `question-manager-service`: User clarification workflows

3. **Matching Services** (MT-01 through MT-17)
   - MT-01: Exact amount and date matching
   - MT-02: Near-exact matching with tolerance
   - MT-03: Amount grouping and splitting
   - MT-04: One-to-many matching
   - MT-05: Cross-period matching
   - MT-06: Partial matching algorithms
   - MT-07: Pattern-based matching
   - MT-08: Sequential matching
   - MT-09: Timing difference handling
   - MT-10-17: Advanced fuzzy and ML-based matching

4. **Orchestration**
   - `match-orchestrator`: Coordinates matching workflow
   - `state-manager-service`: Maintains reconciliation state

## Technology Stack

- **Backend**: NestJS (Node.js/TypeScript)
- **Database**: PostgreSQL 16 with TypeORM
- **Authentication**: JWT with bcrypt password hashing
- **Testing**: Jest with comprehensive test suites
- **Frontend**: React 18 with TypeScript and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd banking-reconciliation-system

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=reconciliation_db

# Environment
NODE_ENV=development

# JWT Secret (use a strong random string in production)
JWT_SECRET=your_jwt_secret_key_change_in_production

# Optional: Service Ports
AUTH_SERVICE_PORT=3001
TENANT_MANAGER_PORT=3002
DATA_PREP_SERVICE_PORT=3003
```

### Database Setup

```bash
# Run migrations to create all tables
npm run migration:run

# Verify migrations
npm run migration:show

# (Optional) Create test data
ts-node scripts/create-test-data.ts
```

### Running the Services

```bash
# Development mode (watch for changes)
npm run start:dev

# Specific services
npm run start:auth:dev          # Authentication service
npm run start:data-prep:dev     # Data preparation service
npm run start:orchestrator:dev  # Match orchestrator

# Production mode
npm run start:prod
```

## Multi-Tenant Setup

### Creating a New Tenant

Tenants can be created through the tenant-manager-service or directly via database:

```typescript
// Example: Create a new tenant
POST /api/tenants
{
  "companyName": "Acme Corp",
  "email": "admin@acme.com",
  "domain": "acme.com",
  "plan": "professional"
}
```

### Tenant Plans and Quotas

Each tenant has resource quotas based on their plan:

**Starter Plan**
- 1,000 transactions/month
- 3 bank accounts
- 100 MB storage
- 5 users

**Professional Plan**
- 10,000 transactions/month
- 10 bank accounts
- 500 MB storage
- 25 users

**Enterprise Plan**
- Unlimited transactions
- Unlimited bank accounts
- 5 GB storage
- Unlimited users

### User Management

Users are associated with a specific tenant:

```typescript
// Create user for a tenant
POST /api/users
{
  "email": "user@acme.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "admin" | "user"
}
```

### Authentication Flow

1. User logs in with email and password
2. System validates credentials and tenant association
3. JWT token generated with tenant context:
   ```json
   {
     "userId": "uuid",
     "tenantId": "tenant_123",
     "email": "user@acme.com",
     "role": "admin",
     "iat": 1234567890,
     "exp": 1234654290
   }
   ```
4. All subsequent requests include this token
5. Backend automatically filters data by tenantId

## Testing

The system includes comprehensive test suites:

```bash
# Run all tests
npm test

# Tenant-specific tests (uses test database)
npm run test:tenant

# Specific test suites
npm test test/tenant-isolation.test.ts
npm test test/jwt-authentication.test.ts
npm test test/quota-enforcement.test.ts
npm test test/performance-multi-tenant.test.ts
npm test test/security-audit.test.ts
npm test test/database-indexes.test.ts

# Test coverage
npm run test:cov
```

### Test Suites

1. **Tenant Isolation** (7 tests)
   - Cross-tenant data access prevention
   - Query filtering by tenantId
   - Data integrity under concurrent operations

2. **JWT Authentication** (11 tests)
   - Token generation with tenant context
   - JWT signature validation
   - Token expiration handling

3. **Quota Enforcement** (16 tests)
   - Transaction quota limits
   - Bank account restrictions
   - Storage quota enforcement
   - User limit validation

4. **Performance Testing** (11 tests)
   - Concurrent multi-tenant operations
   - Large dataset query performance
   - Authentication speed under load
   - Connection pooling efficiency

5. **Security Audit** (22 tests)
   - SQL injection prevention
   - Password security (bcrypt)
   - Data exposure prevention
   - Authorization checks

6. **Database Indexes** (7 tests)
   - TenantId index coverage
   - Index utilization verification
   - Query performance validation

**Total Test Coverage: 74+ tests across all suites**

### Database Index Verification

```bash
# Verify database indexes are being used
npm run verify:indexes

# Output shows:
# - Index usage statistics
# - TenantId index coverage
# - Performance recommendations
```

## API Documentation

### Authentication Endpoints

```
POST   /api/auth/login           # User login
POST   /api/auth/register         # New user registration
GET    /api/auth/profile          # Get current user profile
POST   /api/auth/refresh          # Refresh JWT token
```

### Tenant Management

```
GET    /api/tenants               # List tenants (admin only)
POST   /api/tenants               # Create new tenant
GET    /api/tenants/:id           # Get tenant details
PUT    /api/tenants/:id           # Update tenant
DELETE /api/tenants/:id           # Delete tenant
GET    /api/tenants/quota         # Get quota information
```

### Reconciliation Workflow

```
POST   /api/reconciliations                    # Create new reconciliation
GET    /api/reconciliations                    # List reconciliations
GET    /api/reconciliations/:id                # Get reconciliation details
PUT    /api/reconciliations/:id/status         # Update status
POST   /api/reconciliations/:id/bank-file      # Upload bank statement
POST   /api/reconciliations/:id/ledger-file    # Upload ledger file
POST   /api/reconciliations/:id/start-matching # Start matching process
GET    /api/reconciliations/:id/results        # Get matching results
```

### File Management

```
POST   /api/bank-files            # Upload bank statement
GET    /api/bank-files/:id        # Get bank file details
POST   /api/ledger-files          # Upload ledger file
GET    /api/ledger-files/:id      # Get ledger file details
```

### Transaction Management

```
GET    /api/transactions                       # List transactions
GET    /api/transactions/:id                   # Get transaction details
PUT    /api/transactions/:id                   # Update transaction
GET    /api/transactions/unmatched             # Get unmatched transactions
POST   /api/transactions/:id/manual-match      # Create manual match
```

## Security Best Practices

### Implemented Security Measures

1. **Authentication & Authorization**
   - JWT tokens with 7-day expiration
   - bcrypt password hashing (10 salt rounds)
   - Tenant context in every authenticated request
   - Role-based access control (admin/user)

2. **Data Protection**
   - Database-level tenant isolation
   - NOT NULL constraints on tenantId columns
   - Indexes on all tenant filtering columns
   - Parameterized queries (TypeORM) prevent SQL injection

3. **Input Validation**
   - Email format validation
   - Password strength requirements
   - File upload size limits
   - Content type verification

4. **Error Handling**
   - Generic error messages (no sensitive data exposure)
   - Structured logging with tenant context
   - Rate limiting on authentication endpoints

### Production Recommendations

1. Use strong JWT secrets (minimum 32 characters)
2. Enable HTTPS/TLS in production
3. Configure CORS appropriately
4. Set up database connection pooling
5. Enable PostgreSQL row-level security (RLS)
6. Implement request rate limiting
7. Set up monitoring and alerting
8. Regular security audits and updates
9. Database backups with encryption
10. Secrets management (AWS Secrets Manager, Vault, etc.)

## Database Schema

### Core Tables

- `tenants`: Tenant information and quotas
- `users`: User accounts with tenant association
- `reconciliations`: Reconciliation jobs
- `bank_files`: Uploaded bank statements
- `ledger_files`: Uploaded ledger files
- `bank_transactions`: Parsed bank transactions
- `ledger_transactions`: Parsed ledger entries
- `matched_pairs`: Successfully matched transactions
- `staged_matches`: Pending match suggestions
- `questions`: User clarification requests

### Indexes

All multi-tenant tables have indexes on:
- `tenantId` (for query performance)
- Primary keys
- Foreign keys
- Frequently queried columns (email, status, etc.)

## Performance Optimization

### Query Performance

- TenantId indexes ensure fast filtering
- Connection pooling for concurrent requests
- Query result caching where appropriate
- Batch processing for large datasets

### Scalability

- Microservices architecture allows horizontal scaling
- Database read replicas for query distribution
- Message queues for async processing
- CDN for static asset delivery

### Monitoring

Key metrics to monitor:
- Query response times
- Index scan counts (via `pg_stat_user_indexes`)
- Active connections
- CPU and memory usage
- Tenant quota utilization
- Error rates per tenant

## Development Guidelines

### Code Style

- TypeScript strict mode enabled
- ESLint with NestJS rules
- Prettier for code formatting
- Conventional commits

### Testing Requirements

- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical workflows
- Security tests for authentication/authorization
- Performance tests for multi-tenant scenarios

### Git Workflow

1. Create feature branch from main
2. Implement changes with tests
3. Run full test suite
4. Create pull request
5. Code review
6. Merge to main
7. Deploy to staging
8. Validate in staging
9. Deploy to production

## Troubleshooting

### Common Issues

**Database connection fails**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify credentials in .env
psql -h localhost -U postgres -d reconciliation_db
```

**Migration errors**
```bash
# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

**Test failures**
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test test/tenant-isolation.test.ts
```

**Index performance issues**
```bash
# Verify indexes are being used
npm run verify:indexes

# Manually analyze query plan
psql -d reconciliation_db
EXPLAIN ANALYZE SELECT * FROM reconciliations WHERE "tenantId" = 'tenant_123';
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Ensure all tests pass
5. Submit a pull request

## License

[Your License Here]

## Support

For support and questions:
- Email: support@yourcompany.com
- Documentation: https://docs.yourcompany.com
- Issue Tracker: https://github.com/yourcompany/repo/issues

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.
