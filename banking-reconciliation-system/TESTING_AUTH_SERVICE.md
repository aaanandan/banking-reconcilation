# Auth Service Testing Guide

## Prerequisites

1. **PostgreSQL Database Running:**
   ```bash
   # Start PostgreSQL
   sudo service postgresql start

   # Verify connection
   psql -h localhost -U postgres -d reconciliation_db -c "SELECT 1;"
   ```

2. **Run Migrations:**
   ```bash
   npm run migration:run
   ```

3. **Start Auth Service:**
   ```bash
   npm run start:dev -- auth-service
   # Service will run on http://localhost:3001
   ```

## Test Step 29: Registration

### Automated Test:
```bash
./test-auth-registration.sh
```

### Manual Test with curl:
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Corporation",
    "companyEmail": "admin@testcorp.com",
    "name": "John Doe",
    "email": "john@testcorp.com",
    "password": "SecurePass123!"
  }'
```

### Expected Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "john@testcorp.com",
    "name": "John Doe",
    "role": "tenant_admin",
    "tenantId": "tenant_abc123...",
    "companyName": "Test Corporation"
  }
}
```

### JWT Token Contents:
The JWT token should decode to include:
```json
{
  "userId": "uuid-here",
  "tenantId": "tenant_abc123...",
  "email": "john@testcorp.com",
  "role": "tenant_admin",
  "iat": 1700000000,
  "exp": 1700604800
}
```

### What Registration Does:
1. **Creates Tenant Record:**
   - tenantId: `tenant_<random>`
   - companyName: "Test Corporation"
   - email: admin@testcorp.com
   - status: "trial"
   - plan: "free"
   - trialEndsAt: +14 days
   - quotas: {maxBankAccounts: 1, maxTransactionsPerMonth: 100, ...}

2. **Creates Admin User:**
   - tenantId: (from tenant created above)
   - email: john@testcorp.com
   - passwordHash: bcrypt hash
   - name: "John Doe"
   - role: "tenant_admin"
   - isActive: true

3. **Issues JWT Token:**
   - Contains tenantId (CRITICAL for multi-tenancy)
   - Valid for 7 days
   - Signed with JWT_SECRET

## Test Step 30: Login

### Automated Test:
```bash
./test-auth-login.sh
```

### Manual Test with curl:
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@testcorp.com",
    "password": "SecurePass123!"
  }'
```

### Expected Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "john@testcorp.com",
    "name": "John Doe",
    "role": "tenant_admin",
    "tenantId": "tenant_abc123...",
    "companyName": "Test Corporation"
  }
}
```

### What Login Does:
1. **Validates Credentials:**
   - Finds user by email
   - Compares password with bcrypt hash

2. **Checks Account Status:**
   - user.isActive must be true
   - tenant.status must not be "suspended"

3. **Loads Tenant Relation:**
   - Eager loads tenant data
   - Returns companyName in response

4. **Issues JWT Token:**
   - Same structure as registration
   - Contains tenantId for tenant isolation

## Verification Checklist

### ✅ Step 29: Registration
- [ ] Endpoint responds on POST /auth/register
- [ ] Creates tenant record in database
- [ ] Creates admin user record in database
- [ ] Returns JWT token
- [ ] JWT contains userId, tenantId, email, role
- [ ] Password is hashed with bcrypt (not plaintext)
- [ ] Tenant has trial status and free plan
- [ ] User has tenant_admin role
- [ ] User has isActive = true

### ✅ Step 30: Login
- [ ] Endpoint responds on POST /auth/login
- [ ] Validates correct password
- [ ] Rejects incorrect password with 401
- [ ] Rejects inactive users with 401
- [ ] Rejects suspended tenants with 401
- [ ] Returns JWT token
- [ ] JWT contains same fields as registration
- [ ] JWT tenantId matches user's tenantId
- [ ] Response includes user and company info

## Database Verification

After registration, check database:

```sql
-- Verify tenant created
SELECT * FROM tenants ORDER BY "createdAt" DESC LIMIT 1;

-- Verify user created
SELECT id, email, name, role, "tenantId", "isActive"
FROM users
ORDER BY "createdAt" DESC LIMIT 1;

-- Verify relationship
SELECT
  u.email,
  u.role,
  u."tenantId",
  t."companyName",
  t.status,
  t.plan
FROM users u
JOIN tenants t ON u."tenantId" = t."tenantId"
WHERE u.email = 'john@testcorp.com';
```

## Troubleshooting

### Connection Refused (ECONNREFUSED)
- Auth service not running
- Solution: `npm run start:dev -- auth-service`

### Database Connection Error
- PostgreSQL not running
- Solution: `sudo service postgresql start`

### Migrations Not Run
- Tables don't exist
- Solution: `npm run migration:run`

### 401 Unauthorized on Login
- Incorrect password
- User doesn't exist (registration failed)
- User isActive = false
- Tenant status = 'suspended'

### JWT Decode Shows No tenantId
- Auth service using wrong JWT signing
- Check auth.service.ts line ~73 and ~123

## Current Environment Status

**PostgreSQL:** ❌ Not running in sandbox environment
**Migrations:** ✅ Created and ready to run
**Auth Service:** ✅ Built successfully
**Test Scripts:** ✅ Ready to execute

**To test when database is available:**
1. Start PostgreSQL
2. Run migrations: `npm run migration:run`
3. Start auth-service: `npm run start:dev -- auth-service`
4. Run test scripts: `./test-auth-registration.sh && ./test-auth-login.sh`

## Next Steps (After Testing)

Once Steps 29-30 are verified:
- **Step 31+:** Apply TenantIsolationMiddleware to all 22 existing services
- **Step 32+:** Update service layers with tenant-aware queries
- **Step 33+:** Test multi-tenant data isolation
