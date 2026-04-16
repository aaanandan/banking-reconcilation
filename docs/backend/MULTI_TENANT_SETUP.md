# Multi-Tenant Setup Guide

This guide provides detailed instructions for setting up and managing tenants in the Banking Reconciliation SaaS platform.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Design](#database-design)
3. [Creating Tenants](#creating-tenants)
4. [User Management](#user-management)
5. [Quota Configuration](#quota-configuration)
6. [Security Considerations](#security-considerations)
7. [Testing Multi-Tenancy](#testing-multi-tenancy)
8. [Monitoring](#monitoring)

## Architecture Overview

The system implements **database-level multi-tenancy** with a single database shared across all tenants. Each table includes a `tenantId` column for data isolation.

### Key Design Principles

1. **Strict Isolation**: All queries MUST include `tenantId` filtering
2. **Indexed Performance**: `tenantId` columns have indexes for fast filtering
3. **JWT Context**: Every authenticated request includes tenant context
4. **Quota Enforcement**: Resource limits enforced per tenant
5. **NOT NULL Constraints**: `tenantId` cannot be null on any multi-tenant table

## Database Design

### Tenant Table Schema

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "tenantId" VARCHAR NOT NULL UNIQUE,
  "companyName" VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  domain VARCHAR,
  status VARCHAR DEFAULT 'active',
  plan VARCHAR DEFAULT 'starter',
  "trialEndsAt" TIMESTAMP,
  "subscriptionEndsAt" TIMESTAMP,
  "stripeCustomerId" VARCHAR,
  "stripeSubscriptionId" VARCHAR,
  quotas JSONB DEFAULT '{}',
  "currentUsage" JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "IDX_tenants_tenantId" ON tenants("tenantId");
CREATE UNIQUE INDEX "UQ_tenants_email" ON tenants(email);
```

### Multi-Tenant Table Pattern

All data tables follow this pattern:

```sql
CREATE TABLE <table_name> (
  id SERIAL PRIMARY KEY,
  "tenantId" VARCHAR NOT NULL,  -- Always required
  -- ... other columns ...
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Always create index on tenantId
CREATE INDEX "IDX_<table>_tenantId" ON <table_name>("tenantId");
```

### Tables with Tenant Isolation

- `users` - User accounts
- `reconciliations` - Reconciliation jobs
- `bank_files` - Bank statement uploads
- `ledger_files` - Ledger file uploads
- `bank_transactions` - Parsed bank transactions
- `ledger_transactions` - Parsed ledger entries
- `matched_pairs` - Matched transaction pairs
- `staged_matches` - Pending matches
- `questions` - User clarifications

## Creating Tenants

### Method 1: Using API

```typescript
// POST /api/tenants
const response = await fetch('http://localhost:3000/api/tenants', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin_token>'
  },
  body: JSON.stringify({
    companyName: 'Acme Corporation',
    email: 'admin@acme.com',
    domain: 'acme.com',
    plan: 'professional',
    settings: {
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
      timezone: 'America/New_York'
    }
  })
});

const tenant = await response.json();
console.log('Tenant ID:', tenant.tenantId);
```

### Method 2: Using Script

```typescript
// scripts/create-tenant.ts
import { AppDataSource } from './data-source';
import { Tenant } from './libs/shared/src/entities/tenant.entity';
import { v4 as uuidv4 } from 'uuid';

async function createTenant() {
  await AppDataSource.initialize();

  const tenantRepo = AppDataSource.getRepository(Tenant);

  const tenant = tenantRepo.create({
    tenantId: `tenant_${Date.now()}`,
    companyName: 'Acme Corporation',
    email: 'admin@acme.com',
    domain: 'acme.com',
    plan: 'professional',
    status: 'active',
    quotas: {
      maxBankAccounts: 10,
      maxTransactionsPerMonth: 10000,
      maxStorageMB: 500,
      maxUsers: 25
    },
    currentUsage: {
      bankAccounts: 0,
      transactionsThisMonth: 0,
      storageMB: 0,
      users: 0
    }
  });

  await tenantRepo.save(tenant);
  console.log('Created tenant:', tenant.tenantId);

  await AppDataSource.destroy();
}

createTenant();
```

### Method 3: Direct SQL

```sql
-- Create new tenant
INSERT INTO tenants (
  "tenantId",
  "companyName",
  email,
  domain,
  plan,
  status,
  quotas,
  "currentUsage"
) VALUES (
  'tenant_acme_001',
  'Acme Corporation',
  'admin@acme.com',
  'acme.com',
  'professional',
  'active',
  '{"maxBankAccounts": 10, "maxTransactionsPerMonth": 10000, "maxStorageMB": 500, "maxUsers": 25}',
  '{"bankAccounts": 0, "transactionsThisMonth": 0, "storageMB": 0, "users": 0}'
);
```

## User Management

### Creating Users for a Tenant

```typescript
import { User } from './libs/shared/src/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function createUser(tenantId: string) {
  const userRepo = AppDataSource.getRepository(User);

  const passwordHash = await bcrypt.hash('SecurePassword123', 10);

  const user = userRepo.create({
    tenantId: tenantId,
    email: 'john.doe@acme.com',
    passwordHash: passwordHash,
    firstName: 'John',
    lastName: 'Doe',
    role: 'admin', // or 'user'
    status: 'active'
  });

  await userRepo.save(user);
  return user;
}
```

### User Roles

**Admin Role**
- Full access to tenant data
- Can create/edit/delete reconciliations
- Can manage users
- Can view quota usage

**User Role**
- Can create/view reconciliations
- Cannot manage users
- Limited administrative access

## Quota Configuration

### Default Quota by Plan

```typescript
const PLAN_QUOTAS = {
  starter: {
    maxBankAccounts: 3,
    maxTransactionsPerMonth: 1000,
    maxStorageMB: 100,
    maxUsers: 5
  },
  professional: {
    maxBankAccounts: 10,
    maxTransactionsPerMonth: 10000,
    maxStorageMB: 500,
    maxUsers: 25
  },
  enterprise: {
    maxBankAccounts: -1,  // Unlimited
    maxTransactionsPerMonth: -1,
    maxStorageMB: 5000,
    maxUsers: -1
  }
};
```

### Updating Tenant Quotas

```typescript
// Update tenant quotas
async function updateQuota(tenantId: string, newQuotas: any) {
  const tenantRepo = AppDataSource.getRepository(Tenant);

  const tenant = await tenantRepo.findOne({
    where: { tenantId }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  tenant.quotas = {
    ...tenant.quotas,
    ...newQuotas
  };

  await tenantRepo.save(tenant);
}

// Example: Upgrade tenant to professional plan
await updateQuota('tenant_acme_001', {
  maxBankAccounts: 10,
  maxTransactionsPerMonth: 10000,
  maxStorageMB: 500,
  maxUsers: 25
});
```

### Tracking Usage

```typescript
// Increment transaction count
async function incrementTransactionCount(tenantId: string, count: number) {
  const tenant = await tenantRepo.findOne({ where: { tenantId } });

  const currentCount = tenant.currentUsage?.transactionsThisMonth || 0;
  const maxCount = tenant.quotas?.maxTransactionsPerMonth || 1000;

  if (currentCount + count > maxCount) {
    throw new Error('Transaction quota exceeded');
  }

  tenant.currentUsage = {
    ...tenant.currentUsage,
    transactionsThisMonth: currentCount + count
  };

  await tenantRepo.save(tenant);
}
```

## Security Considerations

### 1. Query Filtering

**ALWAYS include tenantId in queries:**

```typescript
// ✅ CORRECT: Always filter by tenantId
const reconciliations = await reconciliationRepo.find({
  where: {
    tenantId: user.tenantId
  }
});

// ❌ WRONG: Missing tenantId filter
const reconciliations = await reconciliationRepo.find({
  where: {
    status: 'completed'
  }
});
```

### 2. JWT Token Validation

```typescript
// Middleware to extract tenant from JWT
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = this.jwtService.verify(token);
      req['tenantId'] = decoded.tenantId;
      req['userId'] = decoded.userId;
    }

    next();
  }
}
```

### 3. Repository Pattern

Create a base repository that automatically filters by tenantId:

```typescript
export class TenantAwareRepository<T> {
  constructor(
    private repository: Repository<T>,
    private request: Request
  ) {}

  async find(options?: FindManyOptions<T>): Promise<T[]> {
    const tenantId = this.request['tenantId'];

    return this.repository.find({
      ...options,
      where: {
        ...options?.where,
        tenantId
      }
    });
  }

  // Similar methods for findOne, save, etc.
}
```

### 4. Data Migration Safety

When migrating data, always preserve tenantId:

```sql
-- Example: Safe data migration
UPDATE reconciliations
SET status = 'archived'
WHERE "tenantId" = 'tenant_acme_001'
  AND "createdAt" < NOW() - INTERVAL '1 year';
```

## Testing Multi-Tenancy

### Running Tests

```bash
# Run all multi-tenant tests
npm run test:tenant

# Run specific test suites
npm test test/tenant-isolation.test.ts
npm test test/quota-enforcement.test.ts
npm test test/security-audit.test.ts
```

### Writing Tests

Always test with multiple tenants:

```typescript
describe('Tenant Isolation', () => {
  const tenant1Id = 'tenant_test_1';
  const tenant2Id = 'tenant_test_2';

  it('should not allow cross-tenant access', async () => {
    // Create data for tenant1
    const recon1 = await createReconciliation(tenant1Id);

    // Attempt to access from tenant2 should fail
    await expect(
      getReconciliation(recon1.id, tenant2Id)
    ).rejects.toThrow('Not Found');
  });
});
```

## Monitoring

### Key Metrics

1. **Query Performance**
   ```sql
   -- Check index usage
   SELECT
     schemaname,
     relname,
     indexrelname,
     idx_scan,
     idx_tup_read
   FROM pg_stat_user_indexes
   WHERE relname IN ('reconciliations', 'users', 'transactions')
     AND indexrelname LIKE '%tenantId%'
   ORDER BY idx_scan DESC;
   ```

2. **Tenant Usage**
   ```sql
   -- Get tenant usage statistics
   SELECT
     "tenantId",
     "companyName",
     quotas->>'maxTransactionsPerMonth' as quota,
     "currentUsage"->>'transactionsThisMonth' as usage
   FROM tenants
   WHERE status = 'active'
   ORDER BY (("currentUsage"->>'transactionsThisMonth')::int) DESC;
   ```

3. **Slow Queries**
   ```sql
   -- Enable slow query logging in postgresql.conf
   log_min_duration_statement = 1000  # Log queries > 1 second

   -- Check for queries without tenantId index usage
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   WHERE query LIKE '%reconciliations%'
     AND query NOT LIKE '%tenantId%'
   ORDER BY mean_time DESC;
   ```

### Alerts to Set Up

1. Tenant approaching quota limits (>80%)
2. Slow queries without tenantId filtering
3. Failed login attempts per tenant
4. Unusual cross-tenant query patterns
5. Index scan count drops significantly

## Troubleshooting

### Issue: Slow Queries

```bash
# Verify indexes exist
npm run verify:indexes

# Check query plan
psql -d reconciliation_db
EXPLAIN ANALYZE
SELECT * FROM reconciliations WHERE "tenantId" = 'tenant_123';
```

### Issue: Cross-Tenant Data Leak

```sql
-- Audit query: Find records without tenantId
SELECT COUNT(*)
FROM reconciliations
WHERE "tenantId" IS NULL;

-- Should return 0

-- Verify NOT NULL constraint exists
SELECT
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'reconciliations'
  AND column_name = 'tenantId';
```

### Issue: Quota Not Enforced

```typescript
// Check quota enforcement in service
const tenant = await tenantRepo.findOne({
  where: { tenantId }
});

console.log('Quotas:', tenant.quotas);
console.log('Usage:', tenant.currentUsage);

// Verify quota check logic
if (currentUsage >= quota) {
  throw new Error('Quota exceeded');
}
```

## Best Practices

1. **Always use parameterized queries** (TypeORM does this automatically)
2. **Never construct SQL with string concatenation**
3. **Test with multiple tenants** in all scenarios
4. **Monitor index usage** regularly
5. **Set up alerts** for quota violations
6. **Audit logs** should include tenantId
7. **Backups** should be tested for tenant restore
8. **Document** any queries that don't use tenantId (with justification)
9. **Code reviews** must verify tenantId filtering
10. **Performance tests** should include multi-tenant load

## Additional Resources

- [Main README](./README.md) - System overview
- [Security Audit](./test/security-audit.test.ts) - Security tests
- [Database Indexes](./scripts/verify-database-indexes.ts) - Index verification
- [Test Data Creation](./scripts/create-test-data.ts) - Test setup

## Support

For questions about multi-tenant setup:
- Review test suites in `test/` directory
- Check security audit results
- Run index verification script
- Contact development team
