# Step 207: API Key Management for External Access

**Status**: ✅ Completed
**Date**: 2025-11-18
**Phase**: Security Implementation (Steps 201-210)

## Overview

Step 207 implements a comprehensive API key management system that enables external programmatic access to the banking reconciliation platform. This system allows users and integrations to authenticate API requests without using JWT tokens, supporting automated workflows, third-party integrations, and machine-to-machine communication.

## Implementation Details

### 1. API Key Entity

**File**: `libs/shared/src/entities/api-key.entity.ts`

Created the `ApiKey` entity to store and manage API keys:

```typescript
@Entity('api_keys')
export class ApiKey {
  @Column({ unique: true })
  @Index()
  keyHash: string; // Hashed API key (SHA-256)

  @Column()
  name: string; // User-friendly name

  @Column()
  prefix: string; // First 8 characters for identification

  @Column({ type: 'simple-array', nullable: true })
  scopes: string[]; // Permissions/access levels

  @Column({ default: true })
  isActive: boolean; // Can be revoked

  @Column({ nullable: true, type: 'timestamp' })
  expiresAt: Date | null; // Optional expiration

  @Column({ default: 0 })
  usageCount: number; // Track API calls

  @Column({ nullable: true, type: 'timestamp' })
  lastUsedAt: Date | null; // Last usage timestamp

  @Column({ nullable: true, type: 'text' })
  ipWhitelist: string; // IP restrictions

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;
}
```

**Key Features**:
- Secure storage with SHA-256 hashing
- Scope-based permissions for granular access control
- Optional expiration dates for temporary access
- IP whitelisting for enhanced security
- Usage tracking for monitoring and auditing
- Soft deletion via `isActive` flag

### 2. API Key Service

**File**: `apps/auth-service/src/api-key.service.ts`

Implements comprehensive API key management logic:

**Key Generation**:
```typescript
async generateApiKey(userId: string, tenantId: string, dto: CreateApiKeyDto) {
  // Generate secure key: brs_<64-char-hex>
  const rawKey = this.generateSecureKey();
  const hashedKey = this.hashKey(rawKey);
  const prefix = rawKey.substring(0, 8);

  const apiKey = this.apiKeyRepository.create({
    userId,
    tenantId,
    keyHash: hashedKey,
    name: dto.name,
    prefix,
    scopes: dto.scopes,
    expiresAt: dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
      : null,
  });

  await this.apiKeyRepository.save(apiKey);

  // Return raw key only once!
  return { id: apiKey.id, key: rawKey, ... };
}
```

**Key Validation**:
```typescript
async validateApiKey(rawKey: string, requiredScope?: string, ipAddress?: string) {
  const hashedKey = this.hashKey(rawKey);
  const apiKey = await this.apiKeyRepository.findOne({
    where: { keyHash: hashedKey },
    relations: ['user', 'tenant'],
  });

  // Check validity
  if (!apiKey || !apiKey.isValid()) {
    throw new UnauthorizedException('Invalid API key');
  }

  // Check scope
  if (requiredScope && !apiKey.hasScope(requiredScope)) {
    throw new UnauthorizedException(`Missing scope: ${requiredScope}`);
  }

  // Check IP whitelist
  if (ipAddress && !apiKey.isIpAllowed(ipAddress)) {
    throw new UnauthorizedException('IP not authorized');
  }

  // Update usage stats
  await this.apiKeyRepository.update(apiKey.id, {
    lastUsedAt: new Date(),
    usageCount: apiKey.usageCount + 1,
  });

  return apiKey;
}
```

**Additional Operations**:
- `listApiKeys()` - List all keys for a user/tenant
- `getApiKey()` - Get details of specific key
- `revokeApiKey()` - Soft delete (set isActive = false)
- `rotateApiKey()` - Generate new key, revoke old one
- `deleteApiKey()` - Permanently delete key
- `cleanupExpiredKeys()` - Housekeeping task

### 3. API Key Guard

**File**: `apps/auth-service/src/guards/api-key.guard.ts`

Protects endpoints requiring API key authentication:

```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract API key from header
    const apiKey = this.extractApiKey(request);
    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    // Get required scope from decorator
    const requiredScope = this.reflector.get<string>('api-key-scope', context.getHandler());

    // Validate key
    const validatedKey = await this.apiKeyService.validateApiKey(
      apiKey,
      requiredScope,
      request.ip,
    );

    // Attach to request for downstream use
    request.apiKey = validatedKey;
    request.tenantId = validatedKey.tenantId;
    request.userId = validatedKey.userId;

    return true;
  }

  private extractApiKey(request: any): string | null {
    // Support multiple formats:
    // 1. x-api-key header
    // 2. Authorization: Bearer <key>
    // 3. Authorization: ApiKey <key>
    if (request.headers['x-api-key']) {
      return request.headers['x-api-key'];
    }

    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    if (authHeader?.startsWith('ApiKey ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
```

### 4. API Key Scope Decorator

**File**: `apps/auth-service/src/decorators/api-key-scope.decorator.ts`

Custom decorator to specify required scopes:

```typescript
export const ApiKeyScope = (scope: string) => SetMetadata('api-key-scope', scope);
```

**Usage Example**:
```typescript
@Get('transactions')
@UseGuards(ApiKeyGuard)
@ApiKeyScope('read:transactions')
async getTransactions() {
  // Only API keys with 'read:transactions' or 'admin' scope can access
}
```

### 5. API Key Controller

**File**: `apps/auth-service/src/api-key.controller.ts`

Provides REST endpoints for API key management:

**Endpoints**:
- `POST /api-keys` - Create new API key
- `GET /api-keys` - List all keys for user
- `GET /api-keys/:keyId` - Get key details
- `POST /api-keys/:keyId/revoke` - Revoke key
- `POST /api-keys/:keyId/rotate` - Rotate key
- `DELETE /api-keys/:keyId` - Delete key permanently

**Example Request**:
```bash
# Create API key
curl -X POST http://localhost:3000/api-keys \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Integration",
    "description": "API key for prod environment",
    "scopes": ["read:transactions", "write:reconciliations"],
    "expiresInDays": 365,
    "ipWhitelist": "192.168.1.100,10.0.0.0/24"
  }'

# Response (key only shown once!)
{
  "id": "uuid",
  "key": "brs_a1b2c3d4e5f6...",  # ⚠️ SAVE THIS - Never shown again!
  "prefix": "brs_a1b2",
  "name": "Production Integration",
  "scopes": ["read:transactions", "write:reconciliations"],
  "expiresAt": "2026-11-18T12:00:00Z",
  "isActive": true
}
```

### 6. DTOs

**File**: `apps/auth-service/src/dto/api-key.dto.ts`

**CreateApiKeyDto**:
```typescript
export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsNotEmpty()
  scopes: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(3650) // Max 10 years
  expiresInDays?: number;

  @IsString()
  @IsOptional()
  ipWhitelist?: string;
}
```

### 7. Database Migration

**File**: `migrations/20251118120000-CreateApiKeysTable.ts`

Creates the `api_keys` table with:
- All required columns
- Indexes on `keyHash`, `userId`, `tenantId`, `isActive`
- Composite index on `userId` + `tenantId`
- Foreign key constraints with CASCADE delete

## Security Considerations

### 1. Cryptographic Security
- **Secure Generation**: Uses `crypto.randomBytes(32)` for 256-bit entropy
- **Key Format**: `brs_<64-character-hex>` (512-bit key)
- **Hashing**: SHA-256 before database storage
- **One-time Display**: Raw key only returned on creation

### 2. Access Control
- **Scopes**: Granular permissions (read, write, admin)
- **IP Whitelisting**: Optional IP/CIDR restrictions
- **Expiration**: Time-limited access
- **Revocation**: Instant key invalidation

### 3. Monitoring & Auditing
- **Usage Tracking**: Count and timestamp of each use
- **Activity Logs**: Record key creation, rotation, revocation
- **Tenant Isolation**: Keys scoped to specific tenant

### 4. Best Practices
- Keys are treated like passwords (never logged)
- Prefix allows safe identification without full key
- CASCADE delete ensures cleanup when user/tenant deleted
- Rate limiting applied to all endpoints

## Usage Examples

### Creating an API Key

```typescript
// In your application
const response = await fetch('/api-keys', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Mobile App Integration',
    description: 'API access for mobile application',
    scopes: ['read:transactions', 'write:reconciliations'],
    expiresInDays: 90,
    ipWhitelist: '203.0.113.0/24',
  }),
});

const { key } = await response.json();
// IMPORTANT: Save this key securely - it won't be shown again!
console.log('API Key:', key);
```

### Using an API Key

```typescript
// Option 1: x-api-key header (recommended)
fetch('/api/v1/transactions', {
  headers: {
    'x-api-key': 'brs_a1b2c3d4e5f6...',
  },
});

// Option 2: Bearer token format
fetch('/api/v1/transactions', {
  headers: {
    'Authorization': `Bearer brs_a1b2c3d4e5f6...`,
  },
});

// Option 3: ApiKey prefix format
fetch('/api/v1/transactions', {
  headers: {
    'Authorization': `ApiKey brs_a1b2c3d4e5f6...`,
  },
});
```

### Protecting Endpoints

```typescript
@Controller('transactions')
export class TransactionController {
  @Get()
  @UseGuards(ApiKeyGuard)
  @ApiKeyScope('read:transactions')
  async listTransactions(@Req() request) {
    const { userId, tenantId } = request; // Injected by guard
    // Only API keys with 'read:transactions' scope can access
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  @ApiKeyScope('write:transactions')
  async createTransaction(@Req() request, @Body() dto) {
    // Only API keys with 'write:transactions' scope can access
  }
}
```

### Rotating an API Key

```typescript
// Rotate key before expiration
const response = await fetch(`/api-keys/${keyId}/rotate`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
  },
});

const { key: newKey } = await response.json();
// Old key is automatically revoked
// Update your application to use newKey
```

## Integration with Existing Services

### Auth Module Updates

**File**: `apps/auth-service/src/auth.module.ts`

Added API Key components:
- Imported `ApiKey` entity
- Registered `ApiKeyService` as provider
- Registered `ApiKeyController`
- Exported `ApiKeyService` for use in other modules

## Common Scopes

Recommended scope naming convention:

- `admin` - Full access (bypasses all scope checks)
- `read:transactions` - Read transaction data
- `write:transactions` - Create/update transactions
- `read:reconciliations` - Read reconciliation data
- `write:reconciliations` - Create/update reconciliations
- `read:reports` - Access reporting endpoints
- `read:users` - Read user data
- `write:users` - Manage users

## Error Handling

The API Key system provides detailed error messages:

```typescript
// Invalid or missing key
401 Unauthorized: "API key is required"
401 Unauthorized: "Invalid API key"

// Expired key
401 Unauthorized: "Invalid API key"  // Doesn't reveal expiration

// Missing scope
401 Unauthorized: "API key does not have required scope: read:transactions"

// IP not whitelisted
401 Unauthorized: "IP address not authorized"

// Revoked key
401 Unauthorized: "Invalid API key"  // Doesn't reveal revocation
```

## Monitoring & Maintenance

### Usage Tracking

```sql
-- Find most-used API keys
SELECT name, usage_count, last_used_at
FROM api_keys
WHERE is_active = true
ORDER BY usage_count DESC
LIMIT 10;

-- Find unused keys (candidates for cleanup)
SELECT name, created_at, last_used_at
FROM api_keys
WHERE is_active = true
  AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '30 days');
```

### Cleanup Task

```typescript
// Scheduled job to cleanup expired keys
@Cron('0 0 * * *') // Daily at midnight
async cleanupExpiredKeys() {
  await this.apiKeyService.cleanupExpiredKeys();
}
```

## Testing

### Manual Testing

```bash
# 1. Create an API key
curl -X POST http://localhost:3000/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Key",
    "scopes": ["read", "write"],
    "expiresInDays": 30
  }'

# Save the returned key

# 2. Test API key authentication
curl http://localhost:3000/protected-endpoint \
  -H "x-api-key: brs_your_key_here"

# 3. List keys
curl http://localhost:3000/api-keys \
  -H "Authorization: Bearer <jwt-token>"

# 4. Revoke key
curl -X POST http://localhost:3000/api-keys/{keyId}/revoke \
  -H "Authorization: Bearer <jwt-token>"
```

## Next Steps

With API Key Management complete, the next step in the security phase is:

**Step 208**: CORS & Security Headers Configuration
- Configure Cross-Origin Resource Sharing (CORS)
- Implement security headers (Helmet.js)
- Set up Content Security Policy (CSP)
- Configure HTTPS/TLS settings

## Files Modified/Created

### Created Files:
1. `libs/shared/src/entities/api-key.entity.ts` - API Key entity
2. `apps/auth-service/src/api-key.service.ts` - API Key service (300+ lines)
3. `apps/auth-service/src/guards/api-key.guard.ts` - API Key guard
4. `apps/auth-service/src/decorators/api-key-scope.decorator.ts` - Scope decorator
5. `apps/auth-service/src/dto/api-key.dto.ts` - API Key DTOs
6. `apps/auth-service/src/api-key.controller.ts` - API Key controller
7. `migrations/20251118120000-CreateApiKeysTable.ts` - Database migration
8. `STEP_207_API_KEY_MANAGEMENT.md` - This documentation

### Modified Files:
1. `libs/shared/src/entities/index.ts` - Exported ApiKey entity
2. `apps/auth-service/src/auth.module.ts` - Registered API Key components

## Summary

Step 207 successfully implements a production-ready API key management system with:

✅ Secure key generation and storage (SHA-256 hashing)
✅ Scope-based access control
✅ IP whitelisting capabilities
✅ Key expiration and rotation
✅ Usage tracking and auditing
✅ RESTful management endpoints
✅ Guard-based endpoint protection
✅ Multiple authentication header formats
✅ Comprehensive error handling
✅ Database migration with proper indexing

The implementation enables secure programmatic access to the banking reconciliation platform while maintaining strong security guarantees and operational flexibility.
