# Grafana Dashboards

This directory contains Grafana dashboard JSON files for the Banking Reconciliation SaaS Platform.

## Status

**Step 223**: ✅ Grafana deployed and configured  
**Step 224**: ⏳ Dashboards will be created next

## Planned Dashboards (Step 224)

### 1. System Overview Dashboard
**File**: `system-overview.json`

**Panels**:
- Total requests/minute (by service)
- Error rate percentage
- Response time (p50, p95, p99)
- Active users
- Database connections
- Memory usage per service
- CPU usage
- Network I/O

### 2. Business Metrics Dashboard
**File**: `business-metrics.json`

**Panels**:
- Reconciliations started (today/week/month)
- Reconciliations completed
- Average match rate percentage
- Transactions processed (total)
- Active tenants
- New tenant registrations
- Subscription conversions
- Revenue metrics (MRR, ARR)

### 3. Database Performance Dashboard
**File**: `database-performance.json`

**Panels**:
- Query duration (p95, p99)
- Slow queries (>1s)
- Connection pool usage
- Active connections
- Locks and deadlocks
- Replication lag (if applicable)
- Table sizes
- Index usage

### 4. Authentication & Security Dashboard
**File**: `authentication-security.json`

**Panels**:
- Login attempts (success/failure)
- Login success rate
- Failed login attempts by tenant
- User registrations
- 2FA enabled users
- Failed 2FA attempts
- Password resets
- Session activity
- Suspicious activity

### 5. Tenant Analytics Dashboard
**File**: `tenant-analytics.json`

**Panels**:
- Active tenants
- Tenants created (timeline)
- Tenants by subscription plan
- Tenant suspension events
- Top tenants by usage
- Tenant quota usage
- API key usage by tenant
- Webhook delivery rate by tenant

### 6. SaaS Platform Dashboard (Optional)
**File**: `saas-platform.json`

**Panels**:
- Subscription metrics
- Stripe events
- Email delivery rate
- Webhook delivery rate
- Feature flag usage
- Onboarding completion rate
- Admin actions log

## Directory Structure

```
monitoring/grafana/dashboards/
├── README.md                          # This file
├── system-overview.json               # Step 224
├── business-metrics.json              # Step 224
├── database-performance.json          # Step 224
├── authentication-security.json       # Step 224
└── tenant-analytics.json              # Step 224
```

## Dashboard Development

### Creating Dashboards

1. **Via Grafana UI** (Recommended for initial creation):
   - Access Grafana at http://localhost:3000
   - Login with admin/admin
   - Create dashboard using UI
   - Export as JSON
   - Save to this directory

2. **Via JSON** (For version control):
   - Create/edit JSON file directly
   - Use Grafana dashboard JSON schema
   - Test by importing in Grafana UI

### Dashboard Best Practices

- Use templating for dynamic tenant/service selection
- Set appropriate time ranges (Last 5m, 15m, 1h, 6h, 24h, 7d, 30d)
- Use consistent color schemes
- Add descriptions to panels
- Set appropriate refresh intervals
- Use variables for flexibility
- Group related metrics

### Variables to Use

Common template variables for all dashboards:
- `$tenant` - Tenant ID filter
- `$service` - Service name filter
- `$interval` - Time interval
- `$environment` - Environment (dev/staging/prod)

## Accessing Dashboards

**Grafana UI**: http://localhost:3000

**Default Credentials**:
- Username: `admin`
- Password: `admin` (change on first login)

**Navigation**:
- Home → Dashboards → Banking Reconciliation folder
- Or use search (Ctrl+K / Cmd+K)

## Metrics Available

From Step 222 (Prometheus instrumentation):

### Authentication Metrics
- `auth_login_attempts_total`
- `auth_login_success_total`
- `auth_login_failure_total`
- `auth_registration_total`

### Tenant Metrics
- `tenants_active_total`
- `tenants_created_total`
- `tenants_suspended_total`

### Subscription Metrics
- `subscriptions_active_total`
- `subscriptions_created_total`
- `subscriptions_cancelled_total`
- `subscription_revenue_total`

### System Metrics
- `http_request_duration_seconds`
- `process_cpu_user_seconds_total`
- `process_resident_memory_bytes`
- `nodejs_heap_size_used_bytes`

See `/apps/auth-service/src/metrics.service.ts` for complete list.

## Next Steps

**Step 224**: Create 5 dashboard JSON files with comprehensive visualizations

## Documentation

- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Queries](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Dashboard JSON Schema](https://grafana.com/docs/grafana/latest/dashboards/json-model/)
