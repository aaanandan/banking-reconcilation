# Step 206: Password Reset & Recovery

## 📍 Phase 5: Security (Weeks 8-10)

**Phase:** Security Enhancements
**Week:** 8 - Authentication Security
**Step:** 206/280 (73.57%)
**Status:** ✅ COMPLETE

## 🎯 Overview

Step 206 implements secure password reset and recovery functionality with email-based verification tokens, allowing users to recover their accounts if they forget their passwords.

### What This Step Does

- Adds password reset fields to User entity (resetPasswordToken, resetPasswordExpires)
- Creates PasswordResetService for secure token generation and validation
- Adds password reset endpoints (forgot-password, reset-password, change-password)
- Creates DTOs for password reset requests
- Implements 1-hour token expiration
- Integrates with brute force protection (resets failed attempts)
- Creates database migration for password reset fields

### Why It's Important

Password reset functionality is essential for:
- **Account Recovery**: Users can regain access to forgotten accounts
- **Security**: Secure token-based verification prevents unauthorized resets
- **User Experience**: Self-service recovery reduces support burden
- **Compliance**: Required for most authentication systems
- **Account Lockout Recovery**: Automatically unlocks accounts on password reset

## 📦 What Was Implemented

### 1. User Entity - Password Reset Fields

**File:** `libs/shared/src/entities/user.entity.ts`

Added password reset token tracking:

```typescript
// ═══════════════════════════════════════════════════════════
// PASSWORD RESET
// ═══════════════════════════════════════════════════════════
@Column({ nullable: true })
resetPasswordToken: string | null;

@Column({ nullable: true, type: 'timestamp' })
resetPasswordExpires: Date | null;
// ═══════════════════════════════════════════════════════════
```

**Fields:**
- `resetPasswordToken`: Hashed token (SHA-256) for security
- `resetPasswordExpires`: Token expiration timestamp (1 hour)

### 2. Password Reset Service

**File:** `apps/auth-service/src/password-reset.service.ts` (250+ lines)

Comprehensive password reset service:

```typescript
@Injectable()
export class PasswordResetService {
  /**
   * Request a password reset - generates token and sends email
   */
  async requestPasswordReset(email: string): Promise<{ message: string }>

  /**
   * Validate a reset token
   */
  async validateResetToken(token: string): Promise<User>

  /**
   * Reset password using valid token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }>

  /**
   * Verify reset token is valid (for frontend validation)
   */
  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }>

  /**
   * Change password for authenticated user
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }>

  /**
   * Clean up expired reset tokens (run via cron)
   */
  async cleanupExpiredTokens(): Promise<number>

  /**
   * Cancel password reset for a user
   */
  async cancelPasswordReset(userId: string): Promise<void>
}
```

**Key Features:**
- **Secure Token Generation**: 32-byte cryptographically secure random tokens
- **Token Hashing**: SHA-256 hashing before database storage
- **1-Hour Expiration**: Tokens automatically expire after 1 hour
- **No User Enumeration**: Doesn't reveal if email exists
- **OAuth Protection**: Prevents password reset for OAuth-only users
- **Brute Force Integration**: Resets failed login attempts on successful reset
- **Automatic Cleanup**: Expired tokens can be purged

### 3. Password Reset DTOs

**File:** `apps/auth-service/src/dto/password-reset.dto.ts`

Request/response DTOs:

```typescript
export class RequestPasswordResetDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  newPassword: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  newPassword: string;
}

export class VerifyResetTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
```

### 4. Auth Controller Endpoints

**File:** `apps/auth-service/src/auth.controller.ts`

Added password reset endpoints:

```typescript
// Request password reset
POST /auth/forgot-password
Body: { email: string }
Response: { message: "If an account exists..." }
Rate Limit: 3 requests/minute

// Verify reset token (optional, for frontend)
GET /auth/verify-reset-token?token={token}
Response: { valid: true, email: "user@example.com" }

// Reset password with token
POST /auth/reset-password
Body: { token: string, newPassword: string }
Response: { message: "Password has been reset successfully." }
Rate Limit: 3 requests/minute

// Change password (authenticated)
POST /auth/change-password
Body: { userId: string, currentPassword: string, newPassword: string }
Response: { message: "Password has been changed successfully." }
```

### 5. Updated Auth Module

**File:** `apps/auth-service/src/auth.module.ts`

Registered PasswordResetService:

```typescript
providers: [
  AuthService,
  EmailVerificationService,
  TwoFactorService,
  SessionService,
  BruteForceProtectionService,
  PasswordResetService, // Added
  OAuthService,
  GoogleStrategy,
  MicrosoftStrategy,
],
exports: [
  EmailVerificationService,
  TwoFactorService,
  SessionService,
  BruteForceProtectionService,
  PasswordResetService, // Added
  OAuthService,
],
```

### 6. Database Migration

**File:** `migrations/20251118115500-AddPasswordResetFields.ts`

Adds password reset fields to users table:

```typescript
export class AddPasswordResetFields20251118115500 {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('users', new TableColumn({
      name: 'resetPasswordToken',
      type: 'varchar',
      length: '255',
      isNullable: true,
    }));

    await queryRunner.addColumn('users', new TableColumn({
      name: 'resetPasswordExpires',
      type: 'timestamp',
      isNullable: true,
    }));
  }
}
```

## 🔒 Security Considerations

### Token Security

**Token Generation:**
- Uses `crypto.randomBytes(32)` for 64-character hex string
- Cryptographically secure random number generator
- Hashed with SHA-256 before database storage
- Never stored in plain text

**Token Expiration:**
- 1-hour expiration window
- Prevents stale tokens from being exploited
- Automatic cleanup of expired tokens

### No User Enumeration

```typescript
// Don't reveal whether user exists
if (!user) {
  logger.warn(`Password reset requested for non-existent email: ${email}`);
  return {
    message: 'If an account with that email exists, a password reset link has been sent.',
  };
}
```

**Benefits:**
- Attackers can't determine valid email addresses
- Same response for existing and non-existing users
- Logs suspicious activity for monitoring

### OAuth User Protection

```typescript
// Check if user is OAuth-only (no password to reset)
if (!user.passwordHash && user.authProvider !== 'local') {
  logger.warn(`Password reset requested for OAuth-only user: ${user.email}`);
  return { message: 'If an account exists...' };
}
```

**Prevents:**
- Password reset for OAuth-only accounts
- Confusion for users who signed up via Google/Microsoft

### Brute Force Integration

```typescript
// Reset failed login attempts on successful password reset
user.failedLoginAttempts = 0;
user.lastFailedLoginAt = null;
user.accountLockedUntil = null;
```

**Benefits:**
- Users who forgot password can recover from lockout
- Fresh start after successful verification
- Legitimate recovery path

## 📊 Password Reset Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  User Forgot Password                        │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
     ┌──────────────────┐
     │ POST             │
     │ /forgot-password │
     │ {email}          │
     └────────┬─────────┘
              │
              ▼
     ┌──────────────────┐
     │ Find User by     │
     │ Email            │
     └────────┬─────────┘
              │
              ├─── User not found? ──> Return success (don't reveal)
              │
              ├─── OAuth-only user? ──> Return success (don't reveal)
              │
              ▼ ✓ Valid local user
     ┌──────────────────┐
     │ Generate Secure  │
     │ Reset Token      │
     │ (64 chars hex)   │
     └────────┬─────────┘
              │
              ▼
     ┌──────────────────┐
     │ Hash Token       │
     │ (SHA-256)        │
     └────────┬─────────┘
              │
              ▼
     ┌──────────────────┐
     │ Save to Database │
     │ + Set Expiry     │
     │ (1 hour)         │
     └────────┬─────────┘
              │
              ▼
     ┌──────────────────┐
     │ Send Email with  │
     │ Reset Link       │
     │ (TODO: integrate)│
     └────────┬─────────┘
              │
              ▼
     ┌──────────────────┐
     │ Return Success   │
     │ Message          │
     └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            User Clicks Link in Email                         │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
     ┌──────────────────┐
     │ Frontend Shows   │
     │ Reset Form       │
     └────────┬─────────┘
              │
              ▼
     ┌──────────────────┐
     │ Optional:        │
     │ GET /verify-     │
     │ reset-token      │
     └────────┬─────────┘
              │
              ▼
     ┌──────────────────┐
     │ User Enters New  │
     │ Password         │
     └────────┬─────────┘
              │
              ▼
     ┌──────────────────┐
     │ POST             │
     │ /reset-password  │
     │ {token, password}│
     └────────┬─────────┘
              │
              ▼
     ┌──────────────────┐
     │ Hash Token &     │
     │ Find in DB       │
     └────────┬─────────┘
              │
              ├─── Token not found? ──> 400 Bad Request
              │
              ├─── Token expired? ──> 400 Bad Request
              │
              ▼ ✓ Valid token
     ┌──────────────────┐
     │ Hash New         │
     │ Password         │
     │ (bcrypt)         │
     └────────┬─────────┘
              │
              ▼
     ┌──────────────────┐
     │ Update Password  │
     │ Clear Token      │
     │ Reset Lockout    │
     └────────┬─────────┘
              │
              ▼
     ┌──────────────────┐
     │ Return Success   │
     │ Redirect to Login│
     └──────────────────┘
```

## 🧪 Testing the Implementation

### 1. Test Password Reset Request

```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Expected Response:**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

**Check Logs (Development):**
```
Password reset token generated for user: user@example.com
Reset token for user@example.com: abcd1234...
```

### 2. Test Token Verification

```bash
curl -X GET "http://localhost:3000/auth/verify-reset-token?token=abcd1234..."
```

**Expected Response (Valid Token):**
```json
{
  "valid": true,
  "email": "user@example.com"
}
```

**Expected Response (Invalid/Expired Token):**
```json
{
  "valid": false
}
```

### 3. Test Password Reset

```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abcd1234...",
    "newPassword": "NewSecurePassword123!"
  }'
```

**Expected Response:**
```json
{
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

### 4. Test Login with New Password

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "NewSecurePassword123!"
  }'
```

**Expected:** Successful login with tokens

### 5. Test Change Password (Authenticated)

```bash
curl -X POST http://localhost:3000/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "currentPassword": "CurrentPassword123!",
    "newPassword": "NewerPassword123!"
  }'
```

**Expected Response:**
```json
{
  "message": "Password has been changed successfully."
}
```

### 6. Test Non-Existent Email

```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com"
  }'
```

**Expected:** Same response (security - don't reveal)
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### 7. Test OAuth User

```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "oauth-user@example.com"
  }'
```

**Expected:** Same response (security - don't reveal OAuth status)

### 8. Test Expired Token

```bash
# Wait 1 hour, or modify token expiry to 1 minute for testing
# Then try to reset password
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "expired-token",
    "newPassword": "NewPassword123!"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "message": "Reset token has expired"
}
```

## 🎛️ Frontend Integration

### Password Reset Flow

```typescript
// 1. Request password reset
async function forgotPassword(email: string) {
  const response = await fetch('http://localhost:3000/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  // Show success message to user
  alert(data.message);
}

// 2. Verify token when user lands on reset page
async function verifyResetToken(token: string) {
  const response = await fetch(
    `http://localhost:3000/auth/verify-reset-token?token=${token}`,
  );

  const data = await response.json();

  if (!data.valid) {
    // Show error: "This reset link is invalid or has expired"
    return false;
  }

  // Show email to user for confirmation
  console.log(`Resetting password for: ${data.email}`);
  return true;
}

// 3. Reset password
async function resetPassword(token: string, newPassword: string) {
  const response = await fetch('http://localhost:3000/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });

  if (response.ok) {
    const data = await response.json();
    alert(data.message);
    // Redirect to login page
    window.location.href = '/login';
  } else {
    const error = await response.json();
    alert(error.message);
  }
}

// 4. Change password (authenticated users)
async function changePassword(currentPassword: string, newPassword: string) {
  const user = JSON.parse(localStorage.getItem('user'));

  const response = await fetch('http://localhost:3000/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify({
      userId: user.id,
      currentPassword,
      newPassword,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    alert(data.message);
  } else {
    const error = await response.json();
    alert(error.message);
  }
}
```

### Email Template (TODO)

```html
<!-- Password Reset Email -->
<html>
  <body>
    <h2>Password Reset Request</h2>
    <p>Hi {{firstName}},</p>
    <p>You requested to reset your password. Click the link below to reset it:</p>
    <a href="{{frontendUrl}}/reset-password?token={{resetToken}}">
      Reset Password
    </a>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  </body>
</html>
```

## 📝 Configuration

### Token Expiration

Edit `password-reset.service.ts`:

```typescript
// Change from 1 hour to different duration
user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

// Examples:
// 30 minutes: 30 * 60 * 1000
// 2 hours: 2 * 60 * 60 * 1000
// 24 hours: 24 * 60 * 60 * 1000
```

**Recommendations:**
- **Strict**: 30 minutes
- **Standard**: 1 hour (current)
- **Lenient**: 2-4 hours

### Password Requirements

Edit `password-reset.dto.ts`:

```typescript
@IsString()
@MinLength(8)  // ← Change minimum length
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)  // Add complexity requirements
@IsNotEmpty()
newPassword: string;
```

## 🎛️ Production Recommendations

### 1. Integrate Email Service

Replace TODO in `password-reset.service.ts`:

```typescript
// TODO: Send password reset email
await this.emailService.sendPasswordResetEmail(user.email, resetToken);
```

Use services like:
- SendGrid
- AWS SES
- Mailgun
- Postmark

### 2. Set Up Cron Job for Token Cleanup

```typescript
import { Cron } from '@nestjs/schedule';

@Cron('0 0 * * *') // Run daily at midnight
async cleanupExpiredTokens() {
  const deleted = await this.passwordResetService.cleanupExpiredTokens();
  this.logger.log(`Cleaned up ${deleted} expired password reset tokens`);
}
```

### 3. Add Rate Limiting

Already applied (3 requests/minute) on:
- `/forgot-password`
- `/reset-password`

### 4. Monitor Suspicious Activity

Add alerting for:
- Multiple reset requests from same IP
- Reset requests for non-existent emails
- Expired token usage attempts

### 5. Remove Development Logging

Remove this in production:

```typescript
// REMOVE IN PRODUCTION!
if (process.env.NODE_ENV === 'development') {
  this.logger.debug(`Reset token for ${user.email}: ${resetToken}`);
}
```

## ✅ Success Criteria

- [x] User entity has password reset fields
- [x] PasswordResetService generates secure tokens
- [x] Tokens are hashed before database storage
- [x] Tokens expire after 1 hour
- [x] Password reset doesn't reveal user existence
- [x] OAuth users can't reset passwords
- [x] Failed login attempts are reset on successful password reset
- [x] Change password validates current password
- [x] Rate limiting applied to reset endpoints
- [x] Database migration creates required fields

## 🔄 Integration with Previous Steps

**Step 201 (Email Verification):**
- Uses similar token generation approach
- Will send password reset emails when email service integrated

**Step 205 (Brute Force Protection):**
- Password reset clears account lockout
- Resets failed login attempt counter
- Provides legitimate recovery path

**Step 203 (OAuth):**
- Prevents password reset for OAuth-only users
- Different auth providers handled correctly

## 📚 Related Files

**Created:**
- `apps/auth-service/src/password-reset.service.ts`
- `apps/auth-service/src/dto/password-reset.dto.ts`
- `migrations/20251118115500-AddPasswordResetFields.ts`
- `STEP_206_PASSWORD_RESET_RECOVERY.md`

**Modified:**
- `libs/shared/src/entities/user.entity.ts`
- `apps/auth-service/src/auth.controller.ts`
- `apps/auth-service/src/auth.module.ts`

## 🎓 Key Learnings

1. **No User Enumeration**: Always return same message regardless of email existence
2. **Token Hashing**: Never store plain tokens in database
3. **Short Expiration**: 1-hour window balances security and usability
4. **OAuth Protection**: Prevent confusion by blocking OAuth user password resets
5. **Integration**: Password reset should clear account lockouts

---

**Implementation Status:** ✅ COMPLETE
**Next Step:** Step 207 (API Key Management)
**Phase Progress:** 6/20 steps complete in Gate 5: Security
