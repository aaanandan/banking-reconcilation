# Step 217: Admin Dashboard & Management

**Status**: ✅ Completed
**Date**: 2025-01-18

## Overview

Implemented a comprehensive admin dashboard and management system for the Banking Reconciliation SaaS platform. This system provides platform administrators with centralized control, monitoring, and analytics capabilities to manage tenants, users, system health, and business metrics.

## Purpose

The admin dashboard serves as the central command center for platform operations, enabling administrators to:

1. **Monitor Platform Health**: Real-time system metrics, service status, and performance monitoring
2. **Manage Tenants**: View, search, filter, and perform actions on tenant accounts
3. **Track Revenue**: MRR, ARR, churn rate, and revenue forecasting
4. **Analyze Growth**: User/tenant growth rates, cohort analysis, retention metrics
5. **Monitor Usage**: Platform activity, API calls, storage consumption
6. **Audit Actions**: Complete audit trail of all admin operations
7. **Respond to Alerts**: System, security, billing, and usage alerts
8. **Control Settings**: Platform-wide configuration and feature toggles
9. **Export Data**: Generate reports in CSV, JSON, or XLSX formats
10. **Support Operations**: Tenant impersonation for debugging and support

## Key Features

### 1. Dashboard Overview
- **Platform Metrics**: Total/active/suspended/trial/paid tenants
- **User Metrics**: Total/active users, new signups (today/week/month)
- **Revenue Metrics**: MRR, ARR, ARPU, growth rates
- **Conversion Metrics**: Trial conversion rate, churn rate
- **Activity Metrics**: Reconciliations, transactions, API calls
- **System Health**: Status, response times, error rates
- **Feature Adoption**: Flag usage, most-used features

### 2. Tenant Management
- **Search & Filter**: By company name, email, plan, status, trial status
- **Tenant Details**: Complete profile with usage, financial, and health metrics
- **Health Scoring**: 0-100 score based on activity, payment status, usage
- **Risk Assessment**: Low/medium/high risk classification
- **Admin Actions**:
  - Suspend/activate tenant
  - Extend trial period
  - Upgrade/downgrade plan
  - Reset usage quotas
  - Delete user
  - Grant/revoke admin privileges
- **Bulk Operations**: Perform actions on multiple tenants simultaneously
- **Activity Timeline**: Chronological tenant activity history

### 3. User Management
- **User Search**: Find users by email, tenant, status
- **User Details**: Profile, activity, reconciliations, login history
- **User Actions**: Suspend, activate, grant/revoke admin
- **Security**: 2FA status, last login, login count

### 4. System Health Monitoring
- **Service Status**: Individual service health (up/down/degraded)
- **System Metrics**: CPU, memory, disk, active connections
- **Database Health**: Connection pool, query times, slow queries
- **Queue Status**: Email queue size, processing, failed jobs
- **Performance**: API response times, requests per second, error rate

### 5. Revenue Analytics
- **Current Month**: Revenue and growth percentage
- **MRR/ARR**: Monthly/Annual Recurring Revenue with growth rates
- **ARPU/ARPT**: Average Revenue Per User/Tenant
- **Plan Breakdown**: Revenue by plan tier with percentages
- **Churn**: Churn rate and churned revenue
- **Forecasting**: Projected MRR and ARR

### 6. Growth Analytics
- **User Growth**: Total users, new signups, growth rate
- **Tenant Growth**: Total tenants, new signups, growth rate
- **Activation**: Activation rate, time to activation
- **Retention**: Retention rate, churn rate
- **Cohort Analysis**: Monthly cohorts with retention tracking

### 7. Platform Usage
- **Reconciliation Activity**: Total, daily/weekly/monthly volumes
- **Transaction Volume**: Transaction counts and trends
- **API Usage**: Total calls, daily volume, response times
- **Storage**: Total GB used, average per tenant
- **Top Users**: Most active users by activity
- **Top Tenants**: Highest usage tenants

### 8. Audit Logging
- **Complete Trail**: All admin actions logged with details
- **Tracked Information**:
  - Admin user who performed action
  - Action type and target
  - Changes made
  - Reason for action
  - IP address and timestamp
- **Search & Filter**: By admin, target type, date range
- **Compliance**: Meets audit requirements for SOC2, ISO27001

### 9. Alert Management
- **Alert Types**:
  - Critical: Immediate action required
  - Warning: Should be addressed soon
  - Info: Informational only
- **Alert Categories**:
  - System: Service outages, performance issues
  - Security: Suspicious activity, failed logins
  - Billing: Payment failures, subscription issues
  - Usage: Quota limits, high usage
- **Alert Actions**: View details, resolve, track resolution

### 10. Platform Settings
- **Maintenance Mode**: Enable/disable for platform updates
- **Signup Control**: Enable/disable new registrations
- **Trial Configuration**: Enable/disable trials, set default duration
- **Limits**: Max tenants per plan, max users per tenant
- **Features**: Enabled features, beta features
- **Notifications**: Admin notification email, critical alerts
- **Integrations**: Stripe, email service, analytics status

### 11. Data Export
- **Export Types**:
  - Tenants: All tenant information
  - Users: All user data
  - Revenue: Billing and revenue data
  - Usage: Activity and usage data
  - Audit Logs: Admin action logs
- **Formats**: CSV, JSON, XLSX
- **Date Filters**: Custom date ranges
- **Custom Filters**: Additional filtering options
- **Secure Download**: Time-limited download URLs

### 12. Support Operations
- **Tenant Impersonation**: Generate token to access tenant account
- **Security**: All impersonation logged in audit trail
- **Use Cases**: Debug issues, verify features, customer support
- **Time-Limited**: Tokens expire after configurable duration

## Architecture

### Components

```
apps/auth-service/src/
├── dto/
│   └── admin.dto.ts                    # Admin-related DTOs (15+ types)
├── guards/
│   └── admin.guard.ts                  # Admin authorization guard
├── admin-dashboard.service.ts          # Core admin functionality
└── admin.controller.ts                 # REST API endpoints
```

### Data Transfer Objects (DTOs)

#### AdminDashboardOverviewDto
Complete platform overview with all key metrics.

#### TenantManagementDto
Comprehensive tenant information including:
- Basic info (ID, company, email, plan, status)
- Usage (users, bank accounts, transactions, storage)
- Activity (last login, total reconciliations)
- Financial (monthly spend, lifetime value)
- Health (health score 0-100, risk level)

#### AdminActionEnum
```typescript
enum AdminActionEnum {
  SUSPEND_TENANT = 'suspend_tenant',
  ACTIVATE_TENANT = 'activate_tenant',
  EXTEND_TRIAL = 'extend_trial',
  UPGRADE_PLAN = 'upgrade_plan',
  RESET_QUOTA = 'reset_quota',
  DELETE_USER = 'delete_user',
  GRANT_ADMIN = 'grant_admin',
  REVOKE_ADMIN = 'revoke_admin',
}
```

#### SystemHealthDto
System-wide health metrics:
- Service status
- System metrics (CPU, memory, disk)
- Database health
- Queue status

#### RevenueMetricsDto
Financial analytics:
- Current month revenue and growth
- MRR/ARR with growth rates
- ARPU/ARPT
- Revenue by plan
- Churn metrics
- Forecasts

#### GrowthMetricsDto
Growth analytics:
- User/tenant growth
- Activation and retention
- Cohort analysis

#### PlatformUsageDto
Platform activity:
- Reconciliation and transaction volumes
- API usage
- Storage consumption
- Top users and tenants

#### AdminAuditLogDto
Audit trail entries with complete action details.

### Security

#### AdminGuard
Protects all admin endpoints with:
1. **Authentication Check**: User must be authenticated (via JwtAuthGuard)
2. **Admin Verification**: User must have `isAdmin` flag set to true
3. **Account Status**: User must be active and not suspended
4. **Audit Logging**: All admin access logged with:
   - Admin ID and email
   - HTTP method and path
   - IP address
   - User agent
   - Timestamp

#### Authorization Flow
```
Request → JwtAuthGuard → AdminGuard → Controller
            ↓              ↓
         Verify JWT    Check isAdmin
                       Log Access
```

### Service Architecture

#### AdminDashboardService
Core service providing:
- **Metrics Aggregation**: Combines data from multiple services
- **Health Scoring**: Calculates 0-100 health scores for tenants
- **Risk Assessment**: Classifies tenants as low/medium/high risk
- **Audit Logging**: Records all admin actions
- **Bulk Operations**: Processes actions on multiple tenants
- **Data Export**: Generates export files in multiple formats
- **Impersonation**: Creates secure impersonation tokens

#### Integration Points
- **TenantService**: Tenant management and CRUD
- **AnalyticsService**: Usage and activity metrics
- **OnboardingService**: Trial and onboarding metrics
- **FeatureFlagService**: Feature adoption stats
- **StripeService**: Billing and subscription data
- **AuditLogService**: Audit trail management

## API Endpoints

All endpoints are under `/admin` prefix and require admin authentication.

### Dashboard & Metrics

#### GET /admin/dashboard
Get comprehensive platform overview.

**Response**: `AdminDashboardOverviewDto`

```json
{
  "totalTenants": 150,
  "activeTenants": 120,
  "suspendedTenants": 5,
  "trialTenants": 30,
  "paidTenants": 90,
  "totalUsers": 450,
  "activeUsers": 380,
  "newUsersToday": 5,
  "newUsersThisWeek": 25,
  "newUsersThisMonth": 80,
  "monthlyRecurringRevenue": 12500.00,
  "annualRecurringRevenue": 150000.00,
  "averageRevenuePerUser": 27.78,
  "trialConversionRate": 0.65,
  "churnRate": 0.05,
  "totalReconciliations": 5420,
  "totalTransactions": 125000,
  "activeReconciliationsToday": 87,
  "systemStatus": "healthy",
  "apiResponseTime": 85,
  "databaseResponseTime": 12,
  "errorRate": 0.002,
  "featureFlagUsage": [...],
  "mostUsedFeatures": ["advanced-matching", "auto-reconcile"],
  "periodStart": "2025-01-01T00:00:00Z",
  "periodEnd": "2025-01-31T23:59:59Z",
  "lastUpdated": "2025-01-18T10:30:00Z"
}
```

### Tenant Management

#### GET /admin/tenants
Get paginated tenant list with search and filters.

**Query Parameters**:
- `query`: Text search (company name, email)
- `plan`: Filter by plan (starter/professional/enterprise)
- `status`: Filter by status (active/suspended/inactive)
- `onTrial`: Filter trial tenants (true/false)
- `sortBy`: Sort field (createdAt/monthlySpend/healthScore)
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 50)

**Response**: `TenantListResponseDto`

#### GET /admin/tenants/:tenantId
Get detailed tenant information.

**Response**: `TenantManagementDto`

```json
{
  "tenantId": "tenant_abc123",
  "companyName": "Acme Corp",
  "email": "admin@acme.com",
  "plan": "professional",
  "status": "active",
  "subscriptionStatus": "active",
  "trialEndDate": null,
  "createdAt": "2024-12-01T00:00:00Z",
  "usersCount": 8,
  "bankAccountsCount": 5,
  "transactionsCount": 1250,
  "storageUsedMB": 45.2,
  "lastLoginAt": "2025-01-18T09:15:00Z",
  "totalReconciliations": 87,
  "monthlySpend": 99.00,
  "lifetimeValue": 297.00,
  "healthScore": 85,
  "riskLevel": "low"
}
```

#### POST /admin/tenants/:tenantId/action
Perform admin action on tenant.

**Request Body**: `TenantActionDto`

```json
{
  "action": "extend_trial",
  "reason": "Customer requested demo extension",
  "metadata": {
    "days": 7
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Action 'extend_trial' performed successfully on tenant tenant_abc123"
}
```

#### POST /admin/tenants/bulk
Perform bulk operation on multiple tenants.

**Request Body**: `BulkOperationDto`

```json
{
  "tenantIds": ["tenant_1", "tenant_2", "tenant_3"],
  "action": "reset_quota",
  "reason": "Monthly quota reset"
}
```

**Response**: `BulkOperationResultDto`

```json
{
  "totalRequested": 3,
  "successful": 3,
  "failed": 0,
  "results": [
    { "tenantId": "tenant_1", "success": true },
    { "tenantId": "tenant_2", "success": true },
    { "tenantId": "tenant_3", "success": true }
  ]
}
```

#### GET /admin/tenants/:tenantId/activity
Get tenant activity timeline.

**Query Parameters**:
- `limit`: Number of activities (default: 50)

**Response**:
```json
{
  "activities": [
    {
      "timestamp": "2025-01-18T10:00:00Z",
      "type": "reconciliation",
      "description": "Completed bank reconciliation",
      "metadata": { "reconciliationId": "rec_123", "matchRate": 0.95 }
    },
    {
      "timestamp": "2025-01-18T09:15:00Z",
      "type": "login",
      "description": "User admin@acme.com logged in",
      "metadata": { "userId": "user_456" }
    }
  ]
}
```

### User Management

#### GET /admin/users
Get paginated user list.

**Query Parameters**:
- `query`: Search by email
- `tenantId`: Filter by tenant
- `isActive`: Filter active/inactive
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 50)

**Response**:
```json
{
  "users": [...],
  "total": 450,
  "page": 1,
  "totalPages": 9
}
```

#### GET /admin/users/:userId
Get user details.

**Response**: `UserManagementDto`

### System Health

#### GET /admin/health
Get system health metrics.

**Response**: `SystemHealthDto`

```json
{
  "status": "healthy",
  "uptime": 8640000,
  "timestamp": "2025-01-18T10:30:00Z",
  "services": [
    {
      "name": "auth-service",
      "status": "up",
      "responseTime": 45,
      "lastCheck": "2025-01-18T10:30:00Z"
    },
    {
      "name": "reconciliation-service",
      "status": "up",
      "responseTime": 120,
      "lastCheck": "2025-01-18T10:30:00Z"
    }
  ],
  "metrics": {
    "cpu": 35.5,
    "memory": 62.3,
    "disk": 45.8,
    "activeConnections": 125,
    "requestsPerSecond": 42,
    "errorRate": 0.002
  },
  "database": {
    "status": "connected",
    "connectionPoolSize": 20,
    "activeConnections": 8,
    "queryTime": 12,
    "slowQueries": 2
  },
  "queue": {
    "emailQueueSize": 15,
    "emailQueueProcessing": 3,
    "emailQueueFailed": 1
  }
}
```

### Analytics

#### GET /admin/revenue
Get revenue metrics.

**Response**: `RevenueMetricsDto`

#### GET /admin/growth
Get growth metrics.

**Response**: `GrowthMetricsDto`

#### GET /admin/usage
Get platform usage metrics.

**Response**: `PlatformUsageDto`

### Audit & Alerts

#### GET /admin/audit-logs
Get admin audit logs.

**Query Parameters**:
- `adminId`: Filter by admin user
- `targetType`: Filter by target (tenant/user/system/feature_flag)
- `startDate`: Start date (ISO 8601)
- `endDate`: End date (ISO 8601)
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 50)

**Response**:
```json
{
  "logs": [
    {
      "id": "log_123",
      "adminId": "admin_1",
      "adminEmail": "admin@platform.com",
      "action": "suspend_tenant",
      "targetType": "tenant",
      "targetId": "tenant_abc123",
      "changes": { "status": { "from": "active", "to": "suspended" } },
      "reason": "Payment overdue",
      "ipAddress": "192.168.1.100",
      "timestamp": "2025-01-18T10:00:00Z"
    }
  ],
  "total": 250,
  "page": 1,
  "totalPages": 5
}
```

#### GET /admin/alerts
Get active alerts.

**Query Parameters**:
- `type`: Filter by type (critical/warning/info)
- `category`: Filter by category (system/security/billing/usage)
- `unresolved`: Show only unresolved (default: true)

**Response**:
```json
[
  {
    "id": "alert_123",
    "type": "warning",
    "category": "usage",
    "title": "High Storage Usage",
    "message": "Tenant 'Acme Corp' is using 95% of storage quota",
    "actionRequired": true,
    "actionUrl": "/admin/tenants/tenant_abc123",
    "tenantId": "tenant_abc123",
    "metadata": { "usagePercentage": 95, "quotaGB": 100, "usedGB": 95 },
    "createdAt": "2025-01-18T08:00:00Z",
    "resolvedAt": null,
    "resolvedBy": null
  }
]
```

#### PUT /admin/alerts/:alertId/resolve
Resolve an alert.

**Response**:
```json
{
  "success": true
}
```

### Settings

#### GET /admin/settings
Get platform settings.

**Response**: `AdminSettingsDto`

```json
{
  "maintenanceMode": false,
  "signupsEnabled": true,
  "trialsEnabled": true,
  "defaultTrialDays": 14,
  "maxTenantsPerPlan": {
    "starter": 1000,
    "professional": 5000,
    "enterprise": -1
  },
  "maxUsersPerTenant": 100,
  "enabledFeatures": ["advanced-matching", "auto-reconcile"],
  "betaFeatures": ["ai-suggestions"],
  "adminNotificationEmail": "admin@platform.com",
  "criticalAlertsEnabled": true,
  "stripeConnected": true,
  "emailServiceConnected": true,
  "analyticsEnabled": true
}
```

#### PUT /admin/settings
Update platform settings.

**Request Body**: `UpdateAdminSettingsDto`

```json
{
  "maintenanceMode": true,
  "signupsEnabled": false,
  "metadata": {
    "maintenanceReason": "Database migration",
    "estimatedDuration": "2 hours"
  }
}
```

**Response**:
```json
{
  "success": true,
  "settings": { ... }
}
```

### Data Export

#### POST /admin/export
Export platform data.

**Request Body**: `ExportDataDto`

```json
{
  "dataType": "tenants",
  "format": "csv",
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-01-31T23:59:59Z",
  "filters": {
    "plan": "professional",
    "status": "active"
  }
}
```

**Response**:
```json
{
  "success": true,
  "downloadUrl": "https://platform.com/exports/tenants_20250118_103000.csv",
  "expiresAt": "2025-01-18T11:30:00Z"
}
```

### Feature Flags

#### GET /admin/feature-flags/stats
Get feature flag usage statistics.

**Response**:
```json
{
  "totalFlags": 15,
  "activeFlags": 12,
  "flagsInExperiment": 3,
  "usageByFlag": [
    {
      "flagKey": "advanced-matching",
      "evaluationCount": 5420,
      "enabledCount": 4875
    },
    {
      "flagKey": "auto-reconcile",
      "evaluationCount": 3210,
      "enabledCount": 2890
    }
  ]
}
```

### Support Operations

#### POST /admin/tenants/:tenantId/impersonate
Generate impersonation token for tenant debugging.

**Request Body**:
```json
{
  "userId": "user_456",
  "reason": "Debugging reconciliation issue reported in support ticket #1234"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

## Health Score Calculation

The health score is calculated as follows:

```typescript
function calculateHealthScore(tenant: Tenant): number {
  let score = 100;

  // Penalize inactive status
  if (tenant.status !== 'active') score -= 50;

  // Penalize payment issues
  if (tenant.subscriptionStatus === 'past_due') score -= 30;
  if (tenant.subscriptionStatus === 'canceled') score -= 40;

  // Penalize low activity
  const daysSinceLastLogin = calculateDays(tenant.lastLoginAt);
  if (daysSinceLastLogin > 30) score -= 20;
  if (daysSinceLastLogin > 60) score -= 40;

  // Reward high usage
  if (tenant.transactionsCount > 1000) score += 10;
  if (tenant.reconciliationsCount > 100) score += 10;

  // Penalize high storage usage (approaching quota)
  const storageUsagePercent = (tenant.storageUsedMB / tenant.storageQuotaMB) * 100;
  if (storageUsagePercent > 90) score -= 15;

  return Math.max(0, Math.min(100, score));
}
```

## Risk Level Classification

```typescript
function calculateRiskLevel(healthScore: number, tenant: Tenant): 'low' | 'medium' | 'high' {
  if (healthScore >= 70) return 'low';
  if (healthScore >= 40) return 'medium';
  return 'high';
}
```

## Caching Strategy

AdminDashboardService uses in-memory caching for expensive operations:

- **Dashboard Overview**: 5-minute TTL
- **System Health**: 1-minute TTL
- **Revenue Metrics**: 15-minute TTL
- **Growth Metrics**: 15-minute TTL
- **Platform Usage**: 5-minute TTL

Cache keys are tenant-specific or global depending on the metric.

## Usage Examples

### Example 1: Suspend Tenant for Non-Payment

```bash
# Get tenant details
curl -X GET https://api.platform.com/admin/tenants/tenant_abc123 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Suspend tenant
curl -X POST https://api.platform.com/admin/tenants/tenant_abc123/action \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "suspend_tenant",
    "reason": "Payment overdue - 3 failed payment attempts"
  }'
```

### Example 2: Extend Trial for Promising Lead

```bash
curl -X POST https://api.platform.com/admin/tenants/tenant_xyz789/action \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "extend_trial",
    "reason": "Customer requested extension for evaluation",
    "metadata": {
      "days": 14
    }
  }'
```

### Example 3: Bulk Quota Reset

```bash
curl -X POST https://api.platform.com/admin/tenants/bulk \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantIds": ["tenant_1", "tenant_2", "tenant_3"],
    "action": "reset_quota",
    "reason": "Monthly quota reset for all professional plan tenants"
  }'
```

### Example 4: Export Active Tenants Report

```bash
curl -X POST https://api.platform.com/admin/export \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dataType": "tenants",
    "format": "xlsx",
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-01-31T23:59:59Z",
    "filters": {
      "status": "active",
      "plan": "professional"
    }
  }'
```

### Example 5: Impersonate Tenant for Support

```bash
curl -X POST https://api.platform.com/admin/tenants/tenant_abc123/impersonate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_456",
    "reason": "Support ticket #5678 - User reports reconciliation not working"
  }'
```

## Frontend Integration

### Dashboard Component Example

```typescript
// admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { AdminService } from './admin.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  overview: AdminDashboardOverviewDto;
  alerts: AdminAlertDto[] = [];

  constructor(private adminService: AdminService) {}

  async ngOnInit() {
    this.overview = await this.adminService.getDashboardOverview();
    this.alerts = await this.adminService.getAlerts({
      type: 'critical',
      unresolvedOnly: true
    });
  }
}
```

### Tenant Management Example

```typescript
// tenant-management.component.ts
async suspendTenant(tenantId: string) {
  const reason = prompt('Enter reason for suspension:');

  try {
    await this.adminService.performTenantAction(tenantId, {
      action: 'suspend_tenant',
      reason: reason
    });

    this.toastr.success('Tenant suspended successfully');
    this.refreshTenants();
  } catch (error) {
    this.toastr.error('Failed to suspend tenant: ' + error.message);
  }
}
```

## Testing

### Unit Tests

```typescript
// admin-dashboard.service.spec.ts
describe('AdminDashboardService', () => {
  let service: AdminDashboardService;

  it('should calculate health score correctly', () => {
    const tenant = createMockTenant({ status: 'active', transactionsCount: 1500 });
    const score = service['calculateHealthScore'](tenant);
    expect(score).toBeGreaterThan(80);
  });

  it('should perform bulk operations with error handling', async () => {
    const result = await service.performBulkOperation({
      tenantIds: ['tenant_1', 'invalid_tenant'],
      action: 'reset_quota',
      reason: 'Test'
    }, 'admin_1');

    expect(result.successful).toBe(1);
    expect(result.failed).toBe(1);
  });
});
```

### Integration Tests

```typescript
// admin.controller.spec.ts
describe('AdminController (e2e)', () => {
  it('/admin/dashboard (GET) requires admin auth', () => {
    return request(app.getHttpServer())
      .get('/admin/dashboard')
      .expect(401); // Unauthorized without token
  });

  it('/admin/dashboard (GET) returns overview', () => {
    return request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('totalTenants');
        expect(res.body).toHaveProperty('monthlyRecurringRevenue');
      });
  });
});
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT with admin privileges
2. **Authorization**: AdminGuard verifies `isAdmin` flag on every request
3. **Audit Logging**: All admin actions logged with user, IP, and timestamp
4. **Rate Limiting**: Admin endpoints have separate, more permissive rate limits
5. **IP Whitelisting**: Consider restricting admin access to specific IP ranges
6. **2FA Requirement**: Recommend requiring 2FA for admin users
7. **Session Timeout**: Admin sessions should have shorter timeout (e.g., 1 hour)
8. **Impersonation Control**: Impersonation tokens are:
   - Time-limited (1 hour default)
   - Logged in audit trail
   - Include reason for access

## Monitoring & Alerting

### Metrics to Monitor

- Admin login frequency
- Failed admin authentication attempts
- Bulk operation usage
- Data export frequency
- Impersonation usage
- Alert resolution time
- Dashboard load time

### Alerts to Configure

- Multiple failed admin login attempts (possible brute force)
- Bulk operation affecting > 100 tenants
- Admin action on sensitive operations (data export, impersonation)
- Critical alerts remaining unresolved > 1 hour

## Performance Optimizations

1. **Caching**: Expensive aggregations cached with appropriate TTLs
2. **Pagination**: All list endpoints paginated to prevent large responses
3. **Async Operations**: Long-running operations (bulk ops, exports) run async
4. **Database Indexes**: Add indexes on frequently queried fields:
   - `tenants.status`
   - `tenants.plan`
   - `tenants.created_at`
   - `users.is_admin`
   - `audit_logs.admin_id`
   - `audit_logs.timestamp`
5. **Query Optimization**: Use database views for complex aggregations

## Future Enhancements

### Phase 2
- [ ] Real-time dashboard updates via WebSocket
- [ ] Custom dashboard widgets and layouts
- [ ] Saved searches and filters
- [ ] Scheduled reports via email
- [ ] Advanced cohort analysis
- [ ] Predictive churn modeling
- [ ] Custom alert rules and thresholds

### Phase 3
- [ ] Multi-admin role hierarchy (super admin, support admin, etc.)
- [ ] Tenant communication tools (in-app messaging)
- [ ] Automated workflows (suspend after X failed payments)
- [ ] Integration with support ticketing systems
- [ ] Advanced analytics dashboards with charts
- [ ] A/B test management interface
- [ ] Cost analysis and profitability metrics

## Dependencies

### NPM Packages
```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/typeorm": "^10.0.0",
  "typeorm": "^0.3.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

### Internal Dependencies
- TenantService (tenant management)
- AnalyticsService (usage metrics)
- OnboardingService (trial metrics)
- FeatureFlagService (feature stats)
- StripeService (billing data)
- AuditLogService (audit trails)

## Configuration

### Environment Variables

```bash
# Admin Settings
ADMIN_SESSION_TIMEOUT=3600 # 1 hour
ADMIN_IMPERSONATION_TIMEOUT=3600 # 1 hour
ADMIN_NOTIFICATION_EMAIL=admin@platform.com

# Cache TTLs (seconds)
CACHE_TTL_DASHBOARD=300 # 5 minutes
CACHE_TTL_HEALTH=60 # 1 minute
CACHE_TTL_REVENUE=900 # 15 minutes

# Export Settings
EXPORT_MAX_ROWS=100000
EXPORT_URL_EXPIRY=3600 # 1 hour
```

## Files Created

1. `apps/auth-service/src/dto/admin.dto.ts` - Admin DTOs (500+ lines)
2. `apps/auth-service/src/admin-dashboard.service.ts` - Core service (500+ lines)
3. `apps/auth-service/src/admin.controller.ts` - REST endpoints (470+ lines)
4. `apps/auth-service/src/guards/admin.guard.ts` - Authorization guard (100+ lines)
5. `STEP_217_ADMIN_DASHBOARD.md` - This documentation

## Files Modified

1. `apps/auth-service/src/auth.module.ts` - Added admin components

## Database Schema

No new tables required. Uses existing entities:
- `users` (admin flag check)
- `tenants` (tenant management)
- `audit_logs` (admin actions)
- `onboarding_checklists` (trial metrics)
- `feature_flags` (feature stats)

Consider adding index:
```sql
CREATE INDEX idx_users_is_admin ON users(is_admin) WHERE is_admin = true;
```

## Conclusion

Step 217 provides a complete admin dashboard and management system with:
- ✅ Comprehensive platform metrics and analytics
- ✅ Tenant and user management capabilities
- ✅ System health monitoring
- ✅ Revenue and growth analytics
- ✅ Audit logging and compliance
- ✅ Alert management
- ✅ Platform settings control
- ✅ Bulk operations
- ✅ Data export
- ✅ Support operations (impersonation)
- ✅ Security (AdminGuard)
- ✅ Performance (caching)
- ✅ Complete API documentation

The admin dashboard is production-ready and provides all necessary tools for effective SaaS platform management.

---

**Next Steps**:
- Step 218: Continue with next implementation phase
- Consider adding frontend admin dashboard UI
- Set up monitoring and alerting for admin operations
- Configure IP whitelisting for admin access
- Implement automated backup and disaster recovery
