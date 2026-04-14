# Step 205: Rate Limiting & Brute Force Protection

## 📍 Phase 5: Security (Weeks 8-10)

**Phase:** Security Enhancements
**Week:** 8 - Authentication Security
**Step:** 205/280 (73.21%)
**Status:** ✅ COMPLETE

## 🎯 Overview

Step 205 implements comprehensive rate limiting and brute force protection to prevent abuse of authentication endpoints and protect user accounts from credential stuffing, dictionary attacks, and automated brute force attempts.

### What This Step Does

- Adds login attempt tracking fields to User entity
- Implements BruteForceProtectionService for account lockout logic
- Configures ThrottlerModule for API rate limiting
- Applies rate limiting guards to critical authentication endpoints
- Creates database migration for brute force protection fields
- Locks accounts after 5 failed login attempts for 15 minutes
- Tracks failed attempt timestamps and IP addresses

### Why It's Important

Rate limiting and brute force protection are essential for:
- **Attack Prevention**: Stops automated credential stuffing attacks
- **Resource Protection**: Prevents API abuse and DDoS attempts
- **User Security**: Protects accounts from unauthorized access attempts
- **Compliance**: Meets security requirements for authentication systems
- **Cost Control**: Reduces server load from malicious traffic
- **Audit Trail**: Tracks suspicious login patterns

## 📦 What Was Implemented

### 1. User Entity - Brute Force Protection Fields

**File:** `libs/shared/src/entities/user.entity.ts`

Added tracking fields for failed login attempts:

```typescript
// ═══════════════════════════════════════════════════════════
// BRUTE FORCE PROTECTION
// ═══════════════════════════════════════════════════════════
@Column({ default: 0 })
failedLoginAttempts: number;

@Column({ nullable: true, type: 'timestamp' })
lastFailedLoginAt: Date | null;

@Column({ nullable: true, type: 'timestamp' })
accountLockedUntil: Date | null;
// ═══════════════════════════════════════════════════════════
```

**Fields:**
- `failedLoginAttempts`: Counter for failed login attempts
- `lastFailedLoginAt`: Timestamp of last failed attempt (for time window)
- `accountLockedUntil`: Timestamp when account lock expires

### 2. Brute Force Protection Service

**File:** `apps/auth-service/src/brute-force-protection.service.ts` (200+ lines)

Comprehensive service for tracking and managing failed login attempts:

```typescript
export interface BruteForceConfig {
  maxAttempts: number; // Maximum failed attempts before lockout
  lockoutDurationMinutes: number; // How long to lock account
  attemptWindowMinutes: number; // Time window for counting attempts
}

@Injectable()
export class BruteForceProtectionService {
  // Default configuration
  private readonly config: BruteForceConfig = {
    maxAttempts: 5, // Lock after 5 failed attempts
    lockoutDurationMinutes: 15, // Lock for 15 minutes
    attemptWindowMinutes: 15, // Count attempts within 15 minutes
  };

  /**
   * Check if account is currently locked
   */
  isAccountLocked(user: User): boolean

  /**
   * Check if account is locked and throw exception if it is
   */
  async checkAccountLock(user: User): Promise<void>

  /**
   * Record a failed login attempt
   * Returns true if account should be locked
   */
  async recordFailedAttempt(userId: string): Promise<boolean>

  /**
   * Reset failed login attempts (called on successful login)
   */
  async resetLoginAttempts(userId: string): Promise<void>

  /**
   * Get remaining attempts before lockout
   */
  getRemainingAttempts(user: User): number

  /**
   * Manually unlock an account (admin function)
   */
  async unlockAccount(userId: string): Promise<void>

  /**
   * Get lockout status for a user
   */
  getLockoutStatus(user: User): {
    isLocked: boolean;
    remainingAttempts: number;
    lockExpiresAt: Date | null;
    lockExpiresInMinutes: number | null;
  }
}
```

**Key Features:**
- **Time Window**: Only counts attempts within 15-minute window
- **Auto-Expiry**: Locks automatically expire after 15 minutes
- **Progressive Tracking**: Increments counter on each failed attempt
- **Reset on Success**: Clears attempts after successful login
- **Manual Unlock**: Admin can manually unlock accounts
- **Status Queries**: Check lockout status without modifying state

### 3. Updated Auth Service - Login Protection

**File:** `apps/auth-service/src/auth.service.ts`

Integrated brute force protection into login flow:

```typescript
async login(dto: LoginDto): Promise<AuthResponseDto> {
  const user = await this.userRepository.findOne({
    where: { email: dto.email },
    relations: ['tenant'],
  });

  if (!user) {
    // Don't reveal whether user exists
    throw new UnauthorizedException('Invalid credentials');
  }

  // ✅ Check if account is locked due to failed attempts
  await this.bruteForceProtection.checkAccountLock(user);

  const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!isPasswordValid) {
    // ✅ Record failed login attempt
    const isLocked = await this.bruteForceProtection.recordFailedAttempt(user.id);

    if (isLocked) {
      throw new UnauthorizedException(
        'Account is temporarily locked due to multiple failed login attempts. ' +
        'Please try again in 15 minutes.',
      );
    }

    const remainingAttempts = this.bruteForceProtection.getRemainingAttempts(user);
    this.logger.warn(
      `Failed login attempt for user: ${user.email}, ${remainingAttempts} attempts remaining`,
    );

    throw new UnauthorizedException('Invalid credentials');
  }

  // ... 2FA checks ...

  // ✅ Successful login - reset failed attempts
  await this.bruteForceProtection.resetLoginAttempts(user.id);

  // Generate tokens and return
}
```

**Login Flow:**
1. Check if account is locked → throw error if locked
2. Validate password → record failure if invalid
3. Check if locked after failure → inform user
4. Validate 2FA (if enabled) → record failure if invalid
5. Reset attempts on success → allow login

### 4. Rate Limiting Configuration

**File:** `apps/auth-service/src/auth.module.ts`

Configured ThrottlerModule with multiple rate limiting tiers:

```typescript
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 1000, // 1 second
    limit: 3, // 3 requests per second
  },
  {
    name: 'medium',
    ttl: 10000, // 10 seconds
    limit: 20, // 20 requests per 10 seconds
  },
  {
    name: 'long',
    ttl: 60000, // 1 minute
    limit: 100, // 100 requests per minute
  },
]),
```

**Rate Limiting Tiers:**
- **Short**: Burst protection (3 req/sec)
- **Medium**: Moderate sustained load (20 req/10sec)
- **Long**: Overall rate limit (100 req/min)

### 5. Auth Controller - Throttle Guards

**File:** `apps/auth-service/src/auth.controller.ts`

Applied rate limiting to critical endpoints:

```typescript
@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard) // Apply to all endpoints by default
export class AuthController {

  @Post('register')
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Register new user account' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto>

  @Post('login')
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto>

  @Post('refresh')
  @Throttle({ short: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto>
}
```

**Endpoint Limits:**
- `POST /auth/register`: 3 requests per minute
- `POST /auth/login`: 5 requests per minute
- `POST /auth/refresh`: 10 requests per minute

### 6. Database Migration

**File:** `migrations/20251118114500-AddBruteForceProtectionFields.ts`

Adds brute force protection fields to users table:

```typescript
export class AddBruteForceProtectionFields20251118114500 {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add failedLoginAttempts column
    await queryRunner.addColumn('users', new TableColumn({
      name: 'failedLoginAttempts',
      type: 'integer',
      default: 0,
    }));

    // Add lastFailedLoginAt column
    await queryRunner.addColumn('users', new TableColumn({
      name: 'lastFailedLoginAt',
      type: 'timestamp',
      isNullable: true,
    }));

    // Add accountLockedUntil column
    await queryRunner.addColumn('users', new TableColumn({
      name: 'accountLockedUntil',
      type: 'timestamp',
      isNullable: true,
    }));
  }
}
```

## 🔒 Security Considerations

### Brute Force Protection

**Attack Scenario**: Attacker tries 1000 passwords for user@example.com

```
Attempt 1-5: Allowed (within limit)
Attempt 5: Account locked for 15 minutes
Attempts 6-1000: Blocked with lockout message
After 15 min: Lock expires, counter resets
```

**Time Window Protection**:
- If attempts are spread out (>15 min between), counter resets
- Prevents slow brute force attacks from bypassing protection

**Progressive Response**:
```
Attempt 1: "Invalid credentials"
Attempt 2: "Invalid credentials"
Attempt 3: "Invalid credentials"
Attempt 4: "Invalid credentials"
Attempt 5: "Invalid credentials"
Attempt 6: "Account is temporarily locked due to multiple failed login attempts. Please try again in 15 minutes."
```

### Rate Limiting

**Attack Scenario**: Attacker floods login endpoint from single IP

```
Request 1-5: Allowed (within limit)
Request 6: HTTP 429 Too Many Requests
Attacker must wait 1 minute before trying again
```

**Multi-Tier Protection**:
1. Short-term (burst): 5 requests/minute on login
2. Medium-term: 20 requests/10 seconds on all endpoints
3. Long-term: 100 requests/minute on all endpoints

**Distributed Attack**: From multiple IPs
- Each IP is tracked separately
- Database-level brute force protection still triggers (5 attempts/account)
- Consider IP reputation services for advanced protection

### Account Lockout Best Practices

**Lockout Duration**: 15 minutes
- Long enough to deter automated attacks
- Short enough not to frustrate legitimate users

**Max Attempts**: 5 attempts
- Industry standard
- Balances security and usability

**Time Window**: 15 minutes
- Prevents slow brute force attacks
- Resets for legitimate users who forget password

## 📊 Attack Mitigation Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  Authentication Request                      │
│             POST /auth/login                                │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
     ┌──────────────────┐
     │ Rate Limiting    │
     │ Check (Throttle) │
     └────────┬─────────┘
              │
              ├─── >5 req/min? ──> HTTP 429 (Rate Limited)
              │
              ▼ ✓ Within limit
     ┌──────────────────┐
     │ Find User by     │
     │ Email            │
     └────────┬─────────┘
              │
              ├─── User not found? ──> "Invalid credentials"
              │
              ▼ ✓ User found
     ┌──────────────────┐
     │ Check Account    │
     │ Lockout Status   │
     └────────┬─────────┘
              │
              ├─── Locked? ──> "Account locked for X minutes"
              │
              ▼ ✓ Not locked
     ┌──────────────────┐
     │ Validate         │
     │ Password         │
     └────────┬─────────┘
              │
              ├─── Invalid? ──> Record Failed Attempt
              │                          │
              │                          ├─── 5th attempt? ──> Lock Account
              │                          │
              │                          └─── <5 attempts? ──> "Invalid credentials"
              │
              ▼ ✓ Valid password
     ┌──────────────────┐
     │ Validate 2FA     │
     │ (if enabled)     │
     └────────┬─────────┘
              │
              ├─── Invalid? ──> Record Failed Attempt + Error
              │
              ▼ ✓ Valid or disabled
     ┌──────────────────┐
     │ Reset Failed     │
     │ Attempts Counter │
     └────────┬─────────┘
              │
              ▼
     ┌──────────────────┐
     │ Generate Tokens  │
     │ Return Success   │
     └──────────────────┘
```

## 🧪 Testing the Implementation

### 1. Test Rate Limiting

```bash
# Test login rate limiting (5 requests/minute)
for i in {1..10}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "password123"
    }'
  echo "\n"
done
```

**Expected Output:**
```
Request 1: 200 OK (or 401 if credentials invalid)
Request 2: 200 OK (or 401)
Request 3: 200 OK (or 401)
Request 4: 200 OK (or 401)
Request 5: 200 OK (or 401)
Request 6: 429 Too Many Requests
Request 7: 429 Too Many Requests
...
```

### 2. Test Brute Force Protection

```bash
# Test account lockout (5 failed attempts)
for i in {1..7}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "victim@example.com",
      "password": "wrong-password-'$i'"
    }'
  echo "\n"
  sleep 2 # Avoid rate limiting
done
```

**Expected Output:**
```
Attempt 1: 401 "Invalid credentials"
Attempt 2: 401 "Invalid credentials"
Attempt 3: 401 "Invalid credentials"
Attempt 4: 401 "Invalid credentials"
Attempt 5: 401 "Invalid credentials"
Attempt 6: 401 "Account is temporarily locked due to multiple failed login attempts. Please try again in 15 minutes."
Attempt 7: 401 "Account is temporarily locked..."
```

### 3. Test Successful Login Resets Counter

```bash
# First, fail 3 times
for i in {1..3}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "user@example.com",
      "password": "wrong"
    }'
  sleep 2
done

# Then succeed
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "correct-password"
  }'

# Try again - counter should be reset
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "wrong"
  }'
```

**Expected:**
- First 3 attempts fail
- 4th attempt succeeds
- 5th attempt fails but doesn't trigger lockout (counter was reset)

### 4. Test Lock Expiry

```bash
# Trigger lockout
for i in {1..6}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}'
  sleep 2
done

# Wait 15 minutes (or modify config for testing)
sleep 900

# Try again - should work
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "correct-password"}'
```

### 5. Test 2FA with Brute Force

```bash
# User with 2FA enabled
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "2fa-user@example.com",
    "password": "correct-password",
    "twoFactorToken": "000000"
  }'
```

**Note:** Failed 2FA attempts also count toward account lockout.

## 🛡️ Rate Limiting Response Headers

When rate limited, the API returns these headers:

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1700000000
Retry-After: 60

{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

**Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds until next request allowed

## 📝 Configuration Options

### Adjust Brute Force Settings

Edit `brute-force-protection.service.ts`:

```typescript
private readonly config: BruteForceConfig = {
  maxAttempts: 5, // ← Change max attempts
  lockoutDurationMinutes: 15, // ← Change lockout duration
  attemptWindowMinutes: 15, // ← Change time window
};
```

**Recommendations:**
- **Strict**: 3 attempts, 30 min lockout
- **Standard**: 5 attempts, 15 min lockout (current)
- **Lenient**: 10 attempts, 5 min lockout

### Adjust Rate Limiting

Edit `auth.module.ts`:

```typescript
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 60000, // Time window (ms)
    limit: 5, // Max requests in window
  },
]),
```

### Per-Endpoint Rate Limiting

Edit `auth.controller.ts`:

```typescript
@Post('login')
@Throttle({ short: { limit: 10, ttl: 60000 } }) // Override default
async login(@Body() dto: LoginDto): Promise<AuthResponseDto>
```

## 🎛️ Production Recommendations

### 1. Use Redis for Distributed Rate Limiting

For multiple server instances, use Redis:

```bash
npm install @nestjs/throttler @nestjs/throttler-storage-redis redis
```

```typescript
ThrottlerModule.forRoot({
  storage: new ThrottlerStorageRedisService({
    host: 'localhost',
    port: 6379,
  }),
  throttlers: [
    { name: 'short', ttl: 1000, limit: 3 },
  ],
});
```

### 2. IP-Based Rate Limiting

Create custom guard to track by IP:

```typescript
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Request): string {
    return req.ip; // Track by IP address
  }
}
```

### 3. Monitor Lockouts

Add logging/alerting for suspicious patterns:

```typescript
if (user.failedLoginAttempts >= 3) {
  this.logger.warn(`Multiple failed attempts for: ${user.email}`);
  // Send alert to security team
}
```

### 4. CAPTCHA Integration

Add CAPTCHA after 3 failed attempts:

```typescript
if (user.failedLoginAttempts >= 3 && !dto.captchaToken) {
  throw new UnauthorizedException('CAPTCHA required');
}
```

### 5. Account Recovery

Provide password reset link in lockout message:

```typescript
throw new UnauthorizedException(
  'Account locked. Please try again in 15 minutes or reset your password at /reset-password',
);
```

## ✅ Success Criteria

- [x] User entity has failed login tracking fields
- [x] BruteForceProtectionService implements lockout logic
- [x] Auth service checks lockout before login
- [x] Failed attempts are recorded and counted
- [x] Accounts lock after 5 failed attempts
- [x] Locks expire after 15 minutes
- [x] Successful login resets failed attempts
- [x] ThrottlerModule configured with multiple tiers
- [x] Rate limiting guards applied to auth endpoints
- [x] 429 responses returned when rate limited
- [x] Database migration creates required fields

## 🔄 Integration with Previous Steps

**Step 202 (2FA):**
- Failed 2FA attempts count toward brute force protection
- Account locks apply even with correct password + wrong 2FA

**Step 204 (Session Management):**
- Rate limiting applies to refresh token endpoint
- Prevents token refresh abuse

**All Auth Methods:**
- Rate limiting applies to register, login, OAuth callbacks
- Consistent protection across authentication methods

## 📚 Related Files

**Created:**
- `apps/auth-service/src/brute-force-protection.service.ts`
- `migrations/20251118114500-AddBruteForceProtectionFields.ts`
- `STEP_205_RATE_LIMITING_BRUTE_FORCE_PROTECTION.md`

**Modified:**
- `libs/shared/src/entities/user.entity.ts`
- `apps/auth-service/src/auth.service.ts`
- `apps/auth-service/src/auth.controller.ts`
- `apps/auth-service/src/auth.module.ts`
- `package.json` (added @nestjs/throttler)

## 🎓 Key Learnings

1. **Defense in Depth**: Rate limiting + brute force protection = comprehensive security
2. **Time Windows**: Track attempts within windows to prevent slow attacks
3. **User Experience**: 15-minute lockout balances security and convenience
4. **Progressive Response**: Don't reveal whether email exists (security through obscurity)
5. **Logging**: Track suspicious patterns for security monitoring

---

**Implementation Status:** ✅ COMPLETE
**Next Step:** Step 206 (Password Reset & Recovery)
**Phase Progress:** 5/20 steps complete in Gate 5: Security
