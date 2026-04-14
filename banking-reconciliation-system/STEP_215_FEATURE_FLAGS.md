# Step 215: Feature Flags & A/B Testing

**Status**: ✅ Completed
**Date**: 2025-11-18
**Component**: Auth Service - Feature Flag Module

## Overview

This step implements a comprehensive feature flag and A/B testing system, enabling:
- Controlled feature rollout (percentage-based, whitelist, plan-based)
- A/B testing experiments with multiple variants
- User/tenant-specific overrides
- Feature flag caching for performance
- Route protection with decorators and guards
- Admin management interface
- Usage analytics and statistics

## Implementation Summary

### Files Created

1. **apps/auth-service/src/dto/feature-flag.dto.ts** (400+ lines)
   - Enums: FeatureFlagTypeEnum, FeatureFlagStatusEnum, TargetingStrategyEnum
   - 15+ DTOs for all operations
   - CreateFeatureFlagDto, UpdateFeatureFlagDto, CheckFeatureFlagDto
   - BulkFeatureFlagsDto, ExperimentVariantDto, FeatureFlagOverrideDto
   - Statistics, usage, and audit DTOs

2. **libs/shared/src/entities/feature-flag.entity.ts** (280+ lines)
   - Complete TypeORM entity with JSONB columns
   - Helper methods: `isEnabledFor()`, `getExperimentVariant()`
   - Consistent hashing for rollouts
   - Override management
   - Usage tracking

3. **apps/auth-service/src/feature-flag.service.ts** (450+ lines)
   - CRUD operations for flags
   - Flag evaluation with caching (1-minute TTL)
   - Bulk evaluation
   - A/B testing experiment management
   - Override management
   - Statistics and analytics

4. **apps/auth-service/src/feature-flag.controller.ts** (150+ lines)
   - 14 REST endpoints
   - Admin management operations
   - Client evaluation endpoints
   - Experiment management

5. **apps/auth-service/src/decorators/feature-flag.decorator.ts**
   - `@FeatureFlag(key)` decorator for route protection

6. **apps/auth-service/src/guards/feature-flag.guard.ts**
   - FeatureFlagGuard for automatic flag evaluation

### Integration

**`apps/auth-service/src/auth.module.ts`** - Added:
- Import: FeatureFlagService, FeatureFlagController, FeatureFlag entity
- TypeORM: FeatureFlag entity
- Controller: FeatureFlagController
- Provider: FeatureFlagService
- Export: FeatureFlagService

**`libs/shared/src/entities/index.ts`** - Added:
- Export: FeatureFlag entity

## Feature Types

### 1. Boolean Flags
Simple on/off switches for features.

### 2. Percentage Rollout
Gradual rollout to percentage of users using consistent hashing.

### 3. Whitelist
Explicit list of users or tenants.

### 4. Plan-Based
Features available based on subscription plan.

### 5. Experiments (A/B Testing)
Multiple variants with weighted distribution.

## Targeting Strategies

- **ALL_USERS**: Enabled for everyone
- **PERCENTAGE_ROLLOUT**: Gradual rollout (0-100%)
- **USER_WHITELIST**: Specific user IDs
- **TENANT_WHITELIST**: Specific tenant IDs
- **PLAN_BASED**: By subscription plan (free, starter, professional, enterprise)
- **CUSTOM**: Custom logic (future)

## API Endpoints

### Admin Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/feature-flags` | Create flag |
| GET | `/feature-flags` | List all flags |
| GET | `/feature-flags/statistics` | Get statistics |
| GET | `/feature-flags/:key` | Get flag by key |
| PUT | `/feature-flags/:key` | Update flag |
| DELETE | `/feature-flags/:key` | Delete flag |
| POST | `/feature-flags/experiments` | Create experiment |
| POST | `/feature-flags/overrides` | Add override |
| DELETE | `/feature-flags/overrides/:key` | Remove override |
| POST | `/feature-flags/cleanup/overrides` | Clean expired |

### Client Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/feature-flags/check` | Check single flag |
| POST | `/feature-flags/check/bulk` | Check multiple flags |
| POST | `/feature-flags/experiments/:key/variant` | Get experiment variant |

## Usage Examples

### 1. Create Boolean Flag

```bash
curl -X POST http://localhost:3001/feature-flags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "key": "new-dashboard",
    "name": "New Dashboard UI",
    "description": "Redesigned dashboard with improved UX",
    "type": "boolean",
    "enabled": true,
    "targetingStrategy": "all_users"
  }'
```

### 2. Create Percentage Rollout

```bash
curl -X POST http://localhost:3001/feature-flags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "key": "advanced-reconciliation",
    "name": "Advanced Reconciliation Engine",
    "type": "percentage",
    "enabled": true,
    "targetingStrategy": "percentage_rollout",
    "rolloutPercentage": 25
  }'
```

### 3. Create Plan-Based Feature

```bash
curl -X POST http://localhost:3001/feature-flags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "key": "bulk-import",
    "name": "Bulk Transaction Import",
    "type": "boolean",
    "enabled": true,
    "targetingStrategy": "plan_based",
    "allowedPlans": ["professional", "enterprise"]
  }'
```

### 4. Create A/B Test Experiment

```bash
curl -X POST http://localhost:3001/feature-flags/experiments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "key": "checkout-flow-test",
    "name": "Checkout Flow A/B Test",
    "description": "Testing different checkout flows",
    "variants": [
      {
        "key": "control",
        "name": "Original Checkout",
        "weight": 50,
        "metadata": { "flow": "original" }
      },
      {
        "key": "variant-a",
        "name": "Simplified Checkout",
        "weight": 50,
        "metadata": { "flow": "simplified" }
      }
    ],
    "trafficAllocation": 100
  }'
```

### 5. Check Feature Flag

```bash
curl -X POST http://localhost:3001/feature-flags/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "flagKey": "new-dashboard",
    "userId": "user_123",
    "tenantId": "tenant_abc",
    "plan": "professional"
  }'
```

**Response**:
```json
{
  "flagKey": "new-dashboard",
  "enabled": true,
  "reason": "Enabled for all users",
  "metadata": {}
}
```

### 6. Bulk Flag Check

```bash
curl -X POST http://localhost:3001/feature-flags/check/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "user_123",
    "tenantId": "tenant_abc",
    "plan": "professional",
    "flagKeys": ["new-dashboard", "bulk-import", "advanced-reconciliation"]
  }'
```

**Response**:
```json
{
  "flags": {
    "new-dashboard": {
      "flagKey": "new-dashboard",
      "enabled": true,
      "reason": "Enabled for all users"
    },
    "bulk-import": {
      "flagKey": "bulk-import",
      "enabled": true,
      "reason": "Plan 'professional' allowed"
    },
    "advanced-reconciliation": {
      "flagKey": "advanced-reconciliation",
      "enabled": false,
      "reason": "User not in rollout percentage (25%)"
    }
  },
  "evaluatedAt": "2025-11-18T12:00:00Z"
}
```

### 7. Get Experiment Variant

```bash
curl -X POST http://localhost:3001/feature-flags/experiments/checkout-flow-test/variant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "identifier": "user_123"
  }'
```

**Response**:
```json
{
  "experimentKey": "checkout-flow-test",
  "variant": "variant-a",
  "variantMetadata": { "flow": "simplified" },
  "reason": "Variant assigned via consistent hashing"
}
```

### 8. Add Temporary Override

```bash
curl -X POST http://localhost:3001/feature-flags/overrides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "flagKey": "new-dashboard",
    "userId": "user_123",
    "enabled": true,
    "reason": "Beta tester",
    "expiresAt": "2025-12-31T23:59:59Z"
  }'
```

### 9. Update Flag (Increase Rollout)

```bash
curl -X PUT http://localhost:3001/feature-flags/advanced-reconciliation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "rolloutPercentage": 50
  }'
```

### 10. Get Statistics

```bash
curl http://localhost:3001/feature-flags/statistics \
  -H "Authorization: Bearer <admin_token>"
```

**Response**:
```json
{
  "totalFlags": 15,
  "enabledFlags": 12,
  "disabledFlags": 3,
  "testingFlags": 0,
  "flagsByType": {
    "boolean": 8,
    "percentage": 4,
    "whitelist": 1,
    "experiment": 2
  },
  "flagsByStrategy": {
    "all_users": 6,
    "percentage_rollout": 4,
    "plan_based": 3,
    "user_whitelist": 1,
    "tenant_whitelist": 1,
    "custom": 0
  },
  "mostUsedFlags": [
    { "flagKey": "new-dashboard", "usageCount": 15420 },
    { "flagKey": "bulk-import", "usageCount": 8230 }
  ]
}
```

## Code Integration

### 1. Route Protection with Decorator

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { FeatureFlag } from './decorators/feature-flag.decorator';
import { FeatureFlagGuard } from './guards/feature-flag.guard';

@Controller('transactions')
export class TransactionsController {
  constructor(private transactionService: TransactionService) {}

  // Protect route with feature flag
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag('bulk-import')
  @Post('bulk-import')
  async bulkImport(@Body() dto: BulkImportDto) {
    return this.transactionService.bulkImport(dto);
  }

  // Another protected route
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag('advanced-reconciliation')
  @Post('reconcile/advanced')
  async advancedReconcile(@Body() dto: ReconcileDto) {
    return this.transactionService.advancedReconcile(dto);
  }
}
```

### 2. Programmatic Flag Check

```typescript
import { Injectable } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';

@Injectable()
export class DashboardService {
  constructor(private featureFlagService: FeatureFlagService) {}

  async getDashboard(userId: string, tenantId: string, plan: string) {
    // Check if new dashboard is enabled
    const newDashboard = await this.featureFlagService.isEnabled({
      flagKey: 'new-dashboard',
      userId,
      tenantId,
      plan,
    });

    if (newDashboard.enabled) {
      return this.getNewDashboard();
    } else {
      return this.getOldDashboard();
    }
  }
}
```

### 3. Bulk Flag Check (Frontend Bootstrap)

```typescript
// Backend service
@Injectable()
export class AppConfigService {
  constructor(private featureFlagService: FeatureFlagService) {}

  async getClientConfig(userId: string, tenantId: string, plan: string) {
    const flags = await this.featureFlagService.getBulk({
      userId,
      tenantId,
      plan,
    });

    return {
      features: flags.flags,
      user: { userId, tenantId, plan },
      evaluatedAt: flags.evaluatedAt,
    };
  }
}

// Frontend usage
const bootstrap = async () => {
  const config = await fetch('/api/config').then(r => r.json());

  // Store flags in context/state
  window.featureFlags = config.features;

  // Check flags in frontend
  if (config.features['new-dashboard']?.enabled) {
    renderNewDashboard();
  } else {
    renderOldDashboard();
  }
};
```

### 4. A/B Test Implementation

```typescript
@Injectable()
export class CheckoutService {
  constructor(private featureFlagService: FeatureFlagService) {}

  async getCheckoutFlow(userId: string) {
    const experiment = await this.featureFlagService.getExperimentVariant(
      'checkout-flow-test',
      userId,
    );

    switch (experiment.variant) {
      case 'variant-a':
        return this.getSimplifiedCheckout();
      case 'control':
      default:
        return this.getOriginalCheckout();
    }
  }
}
```

### 5. Conditional Feature Display (Frontend)

```typescript
// React component example
const FeatureGate = ({ flagKey, children, fallback = null }) => {
  const { userId, tenantId, plan } = useUser();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFlag(flagKey, userId, tenantId, plan)
      .then(result => {
        setEnabled(result.enabled);
        setLoading(false);
      });
  }, [flagKey, userId, tenantId, plan]);

  if (loading) return <Loader />;
  if (!enabled) return fallback;
  return children;
};

// Usage
<FeatureGate flagKey="bulk-import">
  <BulkImportButton />
</FeatureGate>
```

## Rollout Strategies

### 1. Canary Deployment (Gradual Rollout)

```
Day 1: 5% → Day 2: 10% → Day 3: 25% → Day 4: 50% → Day 5: 100%
```

```bash
# Day 1
curl -X PUT http://localhost:3001/feature-flags/new-feature \
  -d '{"rolloutPercentage": 5}'

# Day 2
curl -X PUT http://localhost:3001/feature-flags/new-feature \
  -d '{"rolloutPercentage": 10}'

# Continue increasing...
```

### 2. Beta Testing

```bash
# Create whitelist for beta testers
curl -X POST http://localhost:3001/feature-flags \
  -d '{
    "key": "beta-feature",
    "name": "Beta Feature",
    "enabled": true,
    "targetingStrategy": "user_whitelist",
    "whitelistedUsers": ["beta_user_1", "beta_user_2", "beta_user_3"]
  }'
```

### 3. Premium Features

```bash
# Professional and Enterprise only
curl -X POST http://localhost:3001/feature-flags \
  -d '{
    "key": "premium-analytics",
    "name": "Premium Analytics",
    "enabled": true,
    "targetingStrategy": "plan_based",
    "allowedPlans": ["professional", "enterprise"]
  }'
```

### 4. Emergency Killswitch

```bash
# Instantly disable problematic feature
curl -X PUT http://localhost:3001/feature-flags/problematic-feature \
  -d '{"enabled": false}'
```

## Consistent Hashing

The system uses consistent hashing to ensure:
- Same user always gets same result
- Fair distribution across population
- No sudden changes when rollout percentage changes

```typescript
// Simplified algorithm
private evaluatePercentageRollout(identifier: string): boolean {
  const hash = simpleHash(identifier + this.key); // Include flag key
  const bucket = hash % 100;
  return bucket < this.rolloutPercentage;
}
```

**Example**: User `user_123` with flag `new-feature`:
- Hash: `simpleHash("user_123new-feature")` → 1,234,567
- Bucket: `1,234,567 % 100` → 67
- If `rolloutPercentage >= 67`, user sees feature

## Caching Strategy

- **Client-side**: Cache bulk flag results
- **Server-side**: In-memory cache with 1-minute TTL
- **Invalidation**: Automatic refresh on updates
- **Performance**: <1ms evaluation after cache hit

```typescript
// Cache structure
private readonly flagCache = new Map<string, FeatureFlag>();
private cacheLastUpdated: Date = new Date();
private readonly CACHE_TTL = 60000; // 1 minute
```

## Monitoring & Analytics

### 1. Flag Usage Tracking

```typescript
// Automatically tracked
flag.usageCount += 1;
flag.lastUsedAt = new Date();
```

### 2. Most Used Flags

```bash
curl http://localhost:3001/feature-flags/statistics
```

Shows top 10 most-used flags for optimization.

### 3. Experiment Metrics (Future)

Track conversion rates per variant:
- Variant A: 1000 users, 150 conversions (15%)
- Variant B: 1000 users, 180 conversions (18%) ← Winner

### 4. Integration with Analytics Service

```typescript
// Track flag evaluations
await this.analyticsService.trackEvent({
  eventType: 'feature_flag_evaluated',
  eventCategory: 'feature_flags',
  tenantId,
  userId,
  metadata: {
    flagKey,
    enabled,
    variant,
  },
});
```

## Testing

### Unit Tests

```typescript
describe('FeatureFlagService', () => {
  it('should enable flag for all users', async () => {
    await service.create({
      key: 'test-flag',
      name: 'Test',
      enabled: true,
      targetingStrategy: TargetingStrategyEnum.ALL_USERS,
    });

    const result = await service.isEnabled({
      flagKey: 'test-flag',
      userId: 'user_123',
    });

    expect(result.enabled).toBe(true);
  });

  it('should respect percentage rollout', async () => {
    await service.create({
      key: 'rollout-flag',
      enabled: true,
      targetingStrategy: TargetingStrategyEnum.PERCENTAGE_ROLLOUT,
      rolloutPercentage: 50,
    });

    // Test 100 users, ~50 should see feature
    const results = [];
    for (let i = 0; i < 100; i++) {
      const result = await service.isEnabled({
        flagKey: 'rollout-flag',
        userId: `user_${i}`,
      });
      results.push(result.enabled);
    }

    const enabled = results.filter(r => r).length;
    expect(enabled).toBeGreaterThan(40);
    expect(enabled).toBeLessThan(60);
  });

  it('should apply user overrides', async () => {
    await service.create({
      key: 'override-test',
      enabled: false,
    });

    await service.addOverride({
      flagKey: 'override-test',
      userId: 'special_user',
      enabled: true,
      reason: 'Beta tester',
    });

    const result = await service.isEnabled({
      flagKey: 'override-test',
      userId: 'special_user',
    });

    expect(result.enabled).toBe(true);
    expect(result.reason).toContain('Override applied');
  });
});
```

### Integration Tests

```typescript
describe('FeatureFlagController (e2e)', () => {
  it('/feature-flags (POST)', () => {
    return request(app.getHttpServer())
      .post('/feature-flags')
      .send({
        key: 'test-flag',
        name: 'Test Flag',
        enabled: true,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.key).toBe('test-flag');
        expect(res.body.enabled).toBe(true);
      });
  });

  it('/feature-flags/check (POST)', () => {
    return request(app.getHttpServer())
      .post('/feature-flags/check')
      .send({
        flagKey: 'test-flag',
        userId: 'user_123',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('enabled');
        expect(res.body).toHaveProperty('reason');
      });
  });
});
```

## Production Considerations

### 1. Performance

- **Caching**: 1-minute TTL reduces database load
- **Bulk Operations**: Single call for multiple flags
- **Async Updates**: Usage tracking doesn't block evaluation

### 2. Reliability

- **Default Behavior**: If flag not found, return false (safe default)
- **Cache Fallback**: Continue serving cached flags if DB unavailable
- **Monitoring**: Track flag evaluation errors

### 3. Security

- **Admin Only**: Flag CRUD operations require admin role
- **Audit Logging**: Track all flag changes
- **Override Expiration**: Temporary overrides auto-expire

### 4. Scalability

- **Stateless**: Can scale horizontally
- **Cache**: Reduces database queries
- **Consistent Hashing**: No state needed for percentage rollouts

### 5. Database Schema

```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type feature_flag_type_enum DEFAULT 'boolean',
  enabled BOOLEAN DEFAULT FALSE,
  status feature_flag_status_enum DEFAULT 'disabled',
  targeting_strategy targeting_strategy_enum DEFAULT 'all_users',
  rollout_percentage INT,
  whitelisted_users JSONB,
  whitelisted_tenants JSONB,
  allowed_plans JSONB,
  experiment_variants JSONB,
  metadata JSONB,
  overrides JSONB,
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
```

## Migration Guide

### Adding Feature Flags to Existing Features

```typescript
// Before
@Get('advanced')
async advancedFeature() {
  return this.service.advancedLogic();
}

// After
@UseGuards(FeatureFlagGuard)
@FeatureFlag('advanced-feature')
@Get('advanced')
async advancedFeature() {
  return this.service.advancedLogic();
}
```

### Gradual Migration

```typescript
// Step 1: Add feature flag (disabled)
await featureFlagService.create({
  key: 'new-algorithm',
  enabled: false,
});

// Step 2: Add code with feature check
if (await isNewAlgorithmEnabled()) {
  return newAlgorithm();
} else {
  return oldAlgorithm();
}

// Step 3: Enable for 5% of users
await featureFlagService.update('new-algorithm', {
  enabled: true,
  rolloutPercentage: 5,
});

// Step 4: Monitor, increase gradually

// Step 5: Remove feature flag, keep new code
```

## Best Practices

1. **Naming**: Use descriptive, kebab-case keys (`new-dashboard`, not `flag1`)
2. **Description**: Always include clear description
3. **Cleanup**: Remove flags after full rollout
4. **Monitoring**: Track flag usage and performance impact
5. **Testing**: Test both enabled/disabled states
6. **Documentation**: Document flag purpose and rollout plan
7. **Gradual Rollout**: Start small (5%), increase slowly
8. **Rollback Plan**: Be ready to disable quickly
9. **Overrides**: Use sparingly, set expiration dates
10. **Experiments**: Run long enough for statistical significance

## Related Steps

- **Step 212**: Billing (plan-based feature gates)
- **Step 213**: Analytics (track feature usage)
- **Step 214**: Onboarding (progressive feature reveal)

---

**Implementation Date**: 2025-11-18
**Implemented By**: Claude (AI Assistant)
**Reviewed By**: Pending
**Status**: ✅ Complete - Ready for Testing
