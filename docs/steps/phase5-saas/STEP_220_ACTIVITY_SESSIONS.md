# Step 220: Activity Tracking & User Sessions (Entities)

**Status**: ✅ Entities Completed
**Date**: 2025-01-18

## Overview

Created comprehensive entities for user activity tracking and session management. These provide the foundation for security monitoring, compliance, user analytics, and device trust management.

## Entities Created

### 1. UserActivity Entity
Tracks all user actions in the system.

**Purpose**:
- Security monitoring and threat detection
- Compliance (GDPR, SOC2, ISO27001)
- User behavior analytics
- Audit trails
- Suspicious activity detection

**Key Fields**:
- `activityType`: 40+ activity types (login, logout, file operations, billing, etc.)
- `userId`, `tenantId`: User and tenant association
- `resourceType`, `resourceId`: Resource affected by activity
- `requestMethod`, `requestPath`, `responseStatus`: HTTP request details
- `ipAddress`, `country`, `city`: Location tracking
- `userAgent`, `deviceType`, `browser`, `operatingSystem`: Device information
- `deviceFingerprint`: Hashed device identifier
- `sessionId`: Associated session
- `success`, `errorMessage`: Success/failure tracking
- `isSuspicious`, `riskScore`: Security flags
- `metadata`: Activity-specific data
- `durationMs`: Performance tracking

**40+ Activity Types**:
- Authentication: login, logout, login_failed, password_changed, 2FA events
- User management: user_created, user_updated, profile_updated
- Reconciliation: created, started, completed, match_approved/rejected
- Files: uploaded, downloaded, deleted, data_exported/imported
- Billing: subscription events, payment_method events
- Settings: updated, webhook/API key management
- Security: suspicious_activity, session_terminated, device events

**Methods**:
- `markSuspicious()`: Flag activity as suspicious
- `getSummary()`: Get activity description
- `isMobileDevice()`: Check if from mobile
- `isRecent()`: Check if within X minutes

### 2. UserSession Entity
Enhanced session tracking with device trust and security monitoring.

**Purpose**:
- Session lifecycle management
- Device fingerprinting and trust
- Location-based anomaly detection
- Multi-device support
- "Remember me" functionality
- Security monitoring

**Key Fields**:
- `userId`, `tenantId`: User and tenant association
- `sessionToken`: Hashed session identifier
- `status`: active/expired/terminated/suspicious
- `ipAddress`, `country`, `city`, `timezone`: Location
- `userAgent`, `deviceType`, `deviceName`: Device information
- `browser`, `browserVersion`, `operatingSystem`, `osVersion`: Browser/OS details
- `deviceFingerprint`: Hashed device ID
- `isTrustedDevice`, `trustedAt`: Device trust
- `rememberMe`: Extended session flag
- `expiresAt`: Session expiry
- `lastActivityAt`: Last activity timestamp
- `activityCount`, `apiCallsCount`: Activity counters
- `isSuspicious`, `riskScore`: Security flags
- `loginMethod`: password/oauth/sso/api_key
- `twoFactorVerified`: 2FA status
- `metadata`: Additional data

**Methods**:
- `isActive()`: Check if session is active
- `isExpired()`: Check if expired
- `updateActivity()`: Update last activity
- `incrementApiCalls()`: Track API usage
- `terminate()`: End session
- `markSuspicious()`: Flag as suspicious
- `trustDevice()`: Mark device as trusted
- `revokeTrust()`: Revoke device trust
- `extend()`: Extend session expiry
- `getDuration()`: Get session duration
- `getIdleTime()`: Get idle time
- `hasIpChanged()`: Detect IP changes
- `hasLocationChanged()`: Detect location changes
- `getSummary()`: Get session description

## Use Cases

### Security Monitoring
```typescript
// Detect suspicious login attempts
const recentFailedLogins = await activityRepo.find({
  where: {
    activityType: ActivityTypeEnum.LOGIN_FAILED,
    ipAddress: '1.2.3.4',
    createdAt: MoreThan(new Date(Date.now() - 3600000)) // Last hour
  }
});

if (recentFailedLogins.length > 5) {
  // Block IP or trigger 2FA
}
```

### Device Trust
```typescript
// Check if device is trusted
const trustedSessions = await sessionRepo.find({
  where: {
    userId: user.id,
    deviceFingerprint: currentFingerprint,
    isTrustedDevice: true
  }
});

if (trustedSessions.length > 0) {
  // Skip 2FA for trusted device
}
```

### Session Management
```typescript
// Get all active sessions for user
const activeSessions = await sessionRepo.find({
  where: {
    userId: user.id,
    status: SessionStatusEnum.ACTIVE
  },
  order: { lastActivityAt: 'DESC' }
});

// Allow user to terminate sessions from other devices
```

### Compliance Reporting
```typescript
// Get user activity for compliance audit
const userActivities = await activityRepo.find({
  where: {
    userId: user.id,
    createdAt: Between(startDate, endDate)
  },
  order: { createdAt: 'DESC' }
});

// Export for GDPR data request
```

### Analytics
```typescript
// Track feature usage
const fileUploads = await activityRepo.count({
  where: {
    tenantId: tenant.id,
    activityType: ActivityTypeEnum.FILE_UPLOADED,
    createdAt: MoreThan(startOfMonth)
  }
});

// Calculate average session duration
```

## Database Indexes

**UserActivity**:
- `(userId, createdAt)` - User activity timeline
- `(tenantId, activityType)` - Tenant activity by type
- `(ipAddress, createdAt)` - IP-based tracking
- `createdAt` - Chronological queries

**UserSession**:
- `(userId, status)` - User's active sessions
- `sessionToken` - Quick session lookup
- `deviceFingerprint` - Device recognition
- `expiresAt` - Cleanup expired sessions

## Files Created

1. `libs/shared/src/entities/user-activity.entity.ts` - UserActivity entity (280+ lines)
2. `libs/shared/src/entities/user-session.entity.ts` - UserSession entity (320+ lines)
3. `STEP_220_ACTIVITY_SESSIONS.md` - This documentation

## Files Modified

1. `libs/shared/src/entities/index.ts` - Added entity exports

## Next Steps

To complete Step 220, implement:
1. **ActivityTrackingService** - Activity logging and analytics
2. **SessionManagerService** - Session lifecycle management
3. **ActivityController** - REST endpoints for activity logs
4. **SessionController** - REST endpoints for session management
5. **Activity Middleware** - Automatic activity tracking
6. **Device Fingerprinting** - Client-side fingerprinting
7. **Suspicious Activity Detection** - AI/ML-based detection
8. **Cleanup Jobs** - Archive old activities and sessions

## Integration Points

- **Authentication**: Track login/logout events
- **API Calls**: Auto-track all API requests
- **Security**: Detect suspicious patterns
- **Compliance**: GDPR data export
- **Analytics**: User behavior insights
- **Admin Dashboard**: Activity monitoring

## Benefits

✅ **Security**: Detect and prevent suspicious activity
✅ **Compliance**: GDPR, SOC2, ISO27001 audit trails
✅ **Analytics**: User behavior insights
✅ **Device Trust**: Reduce friction for trusted devices
✅ **Session Management**: Multi-device support
✅ **Forensics**: Complete activity timeline

This provides the data foundation for comprehensive security monitoring, compliance, and user analytics!
