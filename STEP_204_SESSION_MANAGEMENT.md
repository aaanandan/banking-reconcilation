# Step 204: Session Management & JWT Refresh Tokens

## 📍 Phase 5: Security (Weeks 8-10)

**Phase:** Security Enhancements
**Week:** 8 - Authentication Security
**Step:** 204/280 (72.86%)
**Status:** ✅ COMPLETE

## 🎯 Overview

Step 204 implements secure session management with JWT refresh tokens, enabling users to maintain authenticated sessions without repeatedly logging in while maintaining security through short-lived access tokens and token rotation.

### What This Step Does

- Creates RefreshToken entity for storing refresh tokens in database
- Implements SessionService for token generation, validation, and rotation
- Updates authentication flow to return both access and refresh tokens
- Adds token refresh endpoint for obtaining new access tokens
- Implements session management endpoints (logout, logout-all, list sessions)
- Creates database migration for refresh_tokens table
- Integrates with all authentication methods (local, OAuth)

### Why It's Important

Session management with refresh tokens is essential for:
- **Security**: Short-lived access tokens (15 min) minimize exposure if compromised
- **User Experience**: Users stay logged in without frequent re-authentication
- **Token Rotation**: Each refresh generates new tokens, preventing replay attacks
- **Session Control**: Users can view and revoke sessions from specific devices
- **Audit Trail**: Track login locations and devices for security monitoring
- **Graceful Expiration**: Refresh tokens expire after 7 days, forcing periodic re-authentication

## 📦 What Was Implemented

### 1. RefreshToken Entity

**File:** `libs/shared/src/entities/refresh-token.entity.ts`

Created a database entity to store refresh tokens securely:

```typescript
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column({ unique: true })
  @Index()
  token: string; // Hashed refresh token

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ nullable: true })
  revokedAt: Date | null;

  @Column({ nullable: true })
  @Index()
  ipAddress: string;

  @Column({ nullable: true, type: 'text' })
  userAgent: string;

  @Column({ default: false })
  isRevoked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Helper methods
  isExpired(): boolean
  isValid(): boolean
}
```

**Key Features:**
- Hashed token storage (SHA-256) - never store plain tokens
- IP address and user agent tracking for security monitoring
- Expiration and revocation support
- Cascade delete when user is deleted
- Indexes for fast lookups

### 2. Session Service

**File:** `apps/auth-service/src/session.service.ts` (200+ lines)

Comprehensive session management service:

```typescript
@Injectable()
export class SessionService {
  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair>

  /**
   * Refresh access token using refresh token
   * Implements token rotation for enhanced security
   */
  async refreshAccessToken(
    refreshTokenValue: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair>

  /**
   * Revoke a specific refresh token (single device logout)
   */
  async revokeToken(tokenId: string): Promise<void>

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId: string): Promise<void>

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<RefreshToken[]>

  /**
   * Clean up expired refresh tokens (run periodically via cron)
   */
  async cleanupExpiredTokens(): Promise<number>

  /**
   * Validate access token and extract payload
   */
  async validateAccessToken(token: string): Promise<any>
}
```

**Security Features:**
- Cryptographically secure token generation (64 bytes)
- SHA-256 hashing before database storage
- Token rotation on refresh (old token revoked)
- IP address validation (optional, commented for flexibility)
- Automatic cleanup of expired tokens

### 3. Updated Auth Service

**Files:**
- `apps/auth-service/src/auth.service.ts`
- `apps/auth-service/src/oauth.service.ts`

Modified `register()` and `login()` methods to use SessionService:

```typescript
// Before (Step 203)
const token = this.jwtService.sign({
  userId: user.id,
  tenantId: tenant.tenantId,
  email: user.email,
  role: user.role,
});

return {
  token,
  user: { ... },
};

// After (Step 204)
const tokenPair = await this.sessionService.generateTokenPair(user);

return {
  token: tokenPair.accessToken, // Backward compatibility
  accessToken: tokenPair.accessToken,
  refreshToken: tokenPair.refreshToken,
  expiresIn: tokenPair.expiresIn,
  user: { ... },
};
```

**Benefits:**
- All authentication methods (register, login, OAuth) now return refresh tokens
- Consistent token generation across the application
- Centralized session management logic

### 4. Auth Controller Endpoints

**File:** `apps/auth-service/src/auth.controller.ts`

Added new session management endpoints:

```typescript
// Refresh access token
POST /auth/refresh
Body: { refreshToken: string }
Response: { accessToken, refreshToken, expiresIn, user }

// Logout (revoke current session)
POST /auth/logout
Body: { refreshToken: string }
Response: { message: "Logged out successfully" }

// Logout from all devices
POST /auth/logout-all
Body: { userId: string }
Response: { message: "Logged out from all devices successfully" }

// Get all active sessions
GET /auth/sessions?userId={userId}
Response: { sessions: [{ id, createdAt, ipAddress, userAgent, expiresAt }] }
```

**Use Cases:**
- **Refresh**: Called automatically when access token expires (frontend)
- **Logout**: User logs out from current device
- **Logout-all**: User compromises detected, revoke all sessions
- **Sessions**: User views where they're logged in, can revoke suspicious sessions

### 5. Updated Auth Response DTO

**File:** `apps/auth-service/src/dto/auth-response.dto.ts`

Extended to include refresh token:

```typescript
export class AuthResponseDto {
  token: string; // Access token (kept for backward compatibility)
  accessToken?: string; // Access token (new field)
  refreshToken?: string; // Refresh token
  expiresIn?: number; // Token expiry in seconds
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    companyName: string;
  };
}
```

### 6. Refresh Token DTO

**File:** `apps/auth-service/src/dto/refresh-token.dto.ts`

Simple DTO for refresh token requests:

```typescript
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
```

### 7. Database Migration

**File:** `migrations/20251118113200-CreateRefreshTokensTable.ts`

Creates `refresh_tokens` table with:
- UUID primary key
- Foreign key to `users` table (CASCADE delete)
- Indexes on: userId, token, ipAddress
- Timestamp fields: createdAt, expiresAt, revokedAt

### 8. Updated Auth Module

**File:** `apps/auth-service/src/auth.module.ts`

Registered SessionService and RefreshToken entity:

```typescript
TypeOrmModule.forFeature([User, Tenant, RefreshToken]),

providers: [
  AuthService,
  EmailVerificationService,
  TwoFactorService,
  SessionService, // Added
  OAuthService,
  GoogleStrategy,
  MicrosoftStrategy,
],

exports: [EmailVerificationService, TwoFactorService, SessionService, OAuthService],
```

## 🔒 Security Considerations

### Access Token Lifespan (15 minutes)
- Short-lived to minimize exposure if stolen
- If compromised, damage window is only 15 minutes
- Cannot be revoked (stateless), so short lifespan is critical

### Refresh Token Lifespan (7 days)
- Long-lived for better user experience
- Stored in database, can be revoked anytime
- Forces re-authentication weekly for security

### Token Rotation
- Every refresh generates new access + refresh token pair
- Old refresh token is immediately revoked
- Prevents replay attacks if token is intercepted

### Secure Token Generation
- Uses `crypto.randomBytes(64)` for 128-character hex string
- Cryptographically secure random number generator
- Tokens are hashed (SHA-256) before database storage

### IP Address Tracking
- Stores IP address and user agent for each session
- Can detect suspicious login patterns
- Optional IP validation (disabled by default for flexibility)

### Database Security
- Refresh tokens are hashed, never stored in plain text
- CASCADE delete ensures orphaned tokens are removed
- Indexes prevent brute force token lookups

## 📊 Token Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  Initial Authentication                      │
│  (Register / Login / OAuth)                                 │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
     ┌───────────────────┐
     │ SessionService    │
     │ generateTokenPair()│
     └────────┬──────────┘
              │
              ├─────────────────────────────────────┐
              │                                     │
              ▼                                     ▼
      ┌──────────────┐                    ┌──────────────────┐
      │ Access Token │                    │ Refresh Token    │
      │ (15 minutes) │                    │ (7 days)         │
      │ Stateless    │                    │ Stored in DB     │
      └──────────────┘                    └──────────────────┘
              │                                     │
              │                                     │
              ▼                                     ▼
      ┌──────────────┐                    ┌──────────────────┐
      │ Frontend     │                    │ Frontend         │
      │ localStorage │                    │ httpOnly cookie  │
      │              │                    │ (recommended)    │
      └──────────────┘                    └──────────────────┘
              │                                     │
              │                                     │
              ▼                                     ▼
      ┌──────────────────────────────────────────────────────┐
      │          API Requests with Authorization Header       │
      │          Authorization: Bearer <access_token>         │
      └────────────┬─────────────────────────────────────────┘
                   │
                   │ Access Token Expired?
                   │
                   ▼
           ┌───────────────┐
           │ POST /refresh │
           │ {refreshToken}│
           └───────┬───────┘
                   │
                   ▼
      ┌────────────────────────┐
      │ SessionService         │
      │ refreshAccessToken()   │
      │                        │
      │ 1. Hash refresh token  │
      │ 2. Find in DB          │
      │ 3. Validate expiry     │
      │ 4. Revoke old token    │
      │ 5. Generate new pair   │
      └────────┬───────────────┘
               │
               ▼
   ┌──────────────────────────┐
   │ New Access + Refresh     │
   │ Token Pair Returned      │
   └──────────────────────────┘
```

## 🧪 Testing the Implementation

### 1. Test Register with Refresh Token

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User",
    "companyName": "Test Company",
    "companyEmail": "company@example.com"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...",
  "expiresIn": 900,
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "name": "Test User",
    "role": "tenant_admin",
    "tenantId": "tenant_xxx",
    "companyName": "Test Company"
  }
}
```

### 2. Test Refresh Token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6..."
  }'
```

**Expected Response:**
```json
{
  "token": "NEW_ACCESS_TOKEN",
  "accessToken": "NEW_ACCESS_TOKEN",
  "refreshToken": "NEW_REFRESH_TOKEN",
  "expiresIn": 900,
  "user": null
}
```

**Note:** Old refresh token is now revoked and cannot be used again.

### 3. Test Logout (Revoke Single Session)

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6..."
  }'
```

**Expected Response:**
```json
{
  "message": "Logged out successfully"
}
```

### 4. Test Logout from All Devices

```bash
curl -X POST http://localhost:3000/auth/logout-all \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here"
  }'
```

**Expected Response:**
```json
{
  "message": "Logged out from all devices successfully"
}
```

### 5. Test List Active Sessions

```bash
curl -X GET "http://localhost:3000/auth/sessions?userId=user-uuid-here"
```

**Expected Response:**
```json
{
  "sessions": [
    {
      "id": "session-uuid-1",
      "createdAt": "2025-11-18T11:30:00.000Z",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "expiresAt": "2025-11-25T11:30:00.000Z"
    },
    {
      "id": "session-uuid-2",
      "createdAt": "2025-11-17T14:20:00.000Z",
      "ipAddress": "10.0.0.50",
      "userAgent": "curl/7.68.0",
      "expiresAt": "2025-11-24T14:20:00.000Z"
    }
  ]
}
```

## 🚀 Frontend Integration

### Store Tokens Securely

```typescript
// After login/register
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const { accessToken, refreshToken, expiresIn, user } = await response.json();

// Store access token in memory or localStorage
localStorage.setItem('accessToken', accessToken);

// Store refresh token in httpOnly cookie (more secure)
// Or in localStorage if httpOnly cookie not possible
localStorage.setItem('refreshToken', refreshToken);

// Store user data
localStorage.setItem('user', JSON.stringify(user));
```

### Automatic Token Refresh

```typescript
// Axios interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already tried to refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');

      try {
        // Refresh access token
        const response = await axios.post('/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Update stored tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### Logout Implementation

```typescript
// Logout from current device
async function logout() {
  const refreshToken = localStorage.getItem('refreshToken');

  await fetch('http://localhost:3000/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  localStorage.clear();
  window.location.href = '/login';
}

// Logout from all devices
async function logoutAll() {
  const user = JSON.parse(localStorage.getItem('user'));

  await fetch('http://localhost:3000/auth/logout-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id }),
  });

  localStorage.clear();
  window.location.href = '/login';
}
```

## 📝 Environment Configuration

No new environment variables required. Existing JWT configuration is used:

```env
JWT_SECRET=your-secret-key-change-in-production
```

**Note:** In production, use a strong, randomly generated secret (minimum 32 characters).

## 🎛️ Production Recommendations

### 1. Enable IP Validation (Optional)
Uncomment IP validation in SessionService for stricter security:
```typescript
if (ipAddress && refreshTokenEntity.ipAddress !== ipAddress) {
  throw new UnauthorizedException('IP address mismatch');
}
```

### 2. Set Up Cron Job for Token Cleanup
```typescript
// In a scheduled task (e.g., @nestjs/schedule)
@Cron('0 0 * * *') // Run daily at midnight
async cleanupExpiredTokens() {
  const deleted = await this.sessionService.cleanupExpiredTokens();
  this.logger.log(`Cleaned up ${deleted} expired refresh tokens`);
}
```

### 3. Use httpOnly Cookies for Refresh Tokens
More secure than localStorage:
```typescript
// In auth controller
res.cookie('refreshToken', tokenPair.refreshToken, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

### 4. Implement Rate Limiting
Prevent brute force attacks on refresh endpoint:
```typescript
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 requests per minute
@Post('refresh')
async refreshToken() { ... }
```

### 5. Monitor Suspicious Sessions
Alert on:
- Multiple sessions from different countries
- Rapid session creation from different IPs
- Failed refresh attempts

## ✅ Success Criteria

- [x] RefreshToken entity created with proper indexes
- [x] SessionService implements token generation, refresh, and revocation
- [x] Auth service updated to use SessionService
- [x] OAuth service updated to use SessionService
- [x] Refresh endpoint returns new token pairs
- [x] Token rotation prevents replay attacks
- [x] Users can view and manage active sessions
- [x] Database migration creates refresh_tokens table
- [x] All authentication methods return refresh tokens

## 🔄 Integration with Previous Steps

**Step 201 (Email Verification):**
- Email verification status preserved in session
- Verified users get refresh tokens

**Step 202 (2FA):**
- 2FA verification required before token generation
- Refresh tokens respect 2FA status

**Step 203 (OAuth):**
- OAuth login now returns refresh tokens
- OAuth sessions tracked like local auth sessions

## 📚 Related Files

**Created:**
- `libs/shared/src/entities/refresh-token.entity.ts`
- `apps/auth-service/src/session.service.ts`
- `apps/auth-service/src/dto/refresh-token.dto.ts`
- `migrations/20251118113200-CreateRefreshTokensTable.ts`
- `STEP_204_SESSION_MANAGEMENT.md`

**Modified:**
- `libs/shared/src/entities/index.ts`
- `apps/auth-service/src/auth.service.ts`
- `apps/auth-service/src/oauth.service.ts`
- `apps/auth-service/src/auth.controller.ts`
- `apps/auth-service/src/auth.module.ts`
- `apps/auth-service/src/dto/auth-response.dto.ts`

## 🎓 Key Learnings

1. **Token Security**: Never store refresh tokens in plain text
2. **Token Rotation**: Prevents replay attacks and improves security
3. **Short Access Tokens**: Minimize damage from token theft
4. **Session Management**: Users appreciate visibility into active sessions
5. **UX Balance**: 15-min access tokens + 7-day refresh balances security and convenience

---

**Implementation Status:** ✅ COMPLETE
**Next Step:** Step 205 (Rate Limiting & Brute Force Protection)
**Phase Progress:** 4/20 steps complete in Gate 5: Security
