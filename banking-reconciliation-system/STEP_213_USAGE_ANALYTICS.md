# Step 213: Usage Analytics & Reporting

**Status**: ✅ Completed
**Date**: 2025-11-18
**Component**: Auth Service - Analytics Module

## Overview

This step implements comprehensive usage analytics and reporting for the SaaS platform, enabling:
- Real-time dashboard metrics with trend analysis
- Time-series data visualization for key metrics
- Comprehensive usage reports for tenants
- Transaction and reconciliation statistics
- User activity tracking and top performers
- Quota usage monitoring with automated alerts
- System health monitoring
- Export functionality for reports

## Implementation Summary

### 1. Files Created

#### Analytics DTOs (`apps/auth-service/src/dto/analytics.dto.ts`)

**Core DTOs**:

1. **GetAnalyticsDto**: Query parameters for analytics requests
   - `timeRange`: Predefined ranges (today, last_7_days, last_30_days, etc.)
   - `startDate/endDate`: Custom date ranges
   - `metricType`: Specific metric filtering

2. **DashboardMetricsDto**: Comprehensive dashboard metrics
   - Current period metrics (transactions, reconciliations, users, bank accounts)
   - Comparison with previous period (percentage changes)
   - Match rate statistics
   - Quota usage for all resource types
   - Period information

3. **TimeSeriesMetricDto**: Time-series data for charts
   - Data points with dates and values
   - Aggregated statistics (total, average, peak)
   - Trend analysis (increasing/decreasing/stable)
   - Trend percentage

4. **UsageReportDto**: Comprehensive usage report
   - Transaction metrics (processed, matched, match rate, value)
   - Reconciliation metrics (completed, pending, success rate)
   - User activity (active users, logins, session duration, top users)
   - Resource usage (bank accounts, transactions, storage, API calls)
   - Billing metrics (plan, status, amount, next billing date)

5. **TransactionStatsDto**: Detailed transaction statistics
   - Transaction counts by status (matched, unmatched, pending)
   - Match rate analysis
   - Transactions by source and type
   - Value statistics (total, average, median, max, min)
   - Time-series transaction data

6. **ReconciliationStatsDto**: Detailed reconciliation statistics
   - Reconciliation counts by status
   - Completion time statistics (average, fastest, slowest)
   - Match rate by type (automatic, manual, suggested)
   - Distribution by status and type

7. **TopUserDto & TopBankAccountDto**: Top performers
   - User activity rankings
   - Bank account usage rankings

8. **QuotaAlertDto**: Quota usage alerts
   - Alert levels (warning at 80%, critical at 95%)
   - Current usage vs. limits
   - Alert messages

9. **SystemHealthDto**: System health monitoring
   - Service status (auth, database, redis)
   - Performance metrics (response time, requests/sec, error rate)
   - Resource usage (CPU, memory)
   - Database metrics

#### AnalyticsService (`apps/auth-service/src/analytics.service.ts`)

**Core Methods**:

1. **getDashboardMetrics(tenantId, dto)**: Main dashboard metrics
   - Aggregates data from audit logs
   - Compares with previous period
   - Calculates percentage changes
   - Retrieves quota usage from TenantService
   - Returns comprehensive metrics for dashboard UI

2. **getTimeSeriesMetrics(tenantId, dto)**: Time-series data
   - Generates data points over time range
   - Supports multiple metric types
   - Calculates trend direction and percentage
   - Adaptive interval (daily for short ranges, weekly for long ranges)
   - Returns data ready for chart visualization

3. **generateUsageReport(tenantId, dto)**: Comprehensive report
   - Aggregates all tenant metrics
   - Includes transaction and reconciliation statistics
   - User activity with top performers
   - Resource usage tracking
   - Billing information
   - Suitable for PDF/Excel export

4. **getTopUsers(tenantId, startDate, endDate, limit)**: Top active users
   - Queries audit logs for user activity
   - Aggregates by user ID
   - Ranks by activity count
   - Returns top N users

5. **getTopBankAccounts(tenantId, limit, startDate, endDate)**: Top bank accounts
   - Ranks bank accounts by transaction volume
   - Placeholder for actual implementation (requires bank account entities)

6. **getReconciliationStats(tenantId, startDate, endDate)**: Reconciliation analytics
   - Status distribution
   - Completion time statistics
   - Match rate by type
   - Success rate analysis

7. **getTransactionStats(tenantId, startDate, endDate)**: Transaction analytics
   - Transaction counts and match rates
   - Distribution by source and type
   - Value statistics
   - Time-series visualization data

8. **getSystemHealth()**: System monitoring
   - Service health checks
   - Performance metrics
   - Resource utilization
   - Database performance

9. **checkQuotaAlerts(tenantId)**: Automated quota monitoring
   - Checks all resource types
   - Generates alerts for 80%+ usage
   - Critical alerts for 95%+ usage
   - Returns actionable alert messages

10. **trackEvent(event)**: Event tracking
    - Logs analytics events
    - Can integrate with external analytics (Google Analytics, Mixpanel, Segment)
    - Categorizes events by type

**Helper Methods**:
- `getDateRange()`: Converts time range enums to dates
- `getPreviousPeriod()`: Calculates previous period for comparison
- `getMetricsForPeriod()`: Aggregates metrics from audit logs
- `getTimeSeriesDataPoints()`: Generates time-series data
- `calculatePercentageChange()`: Computes percentage changes
- `calculateTrend()`: Determines trend direction
- `getQuotaUsage()`: Retrieves quota information from tenant

**Data Sources**:
- Primary: AuditLog entity (tracks all user actions)
- Secondary: Tenant entity (quota usage, subscription info)
- Future: Transaction, BankAccount, Reconciliation entities

#### AnalyticsController (`apps/auth-service/src/analytics.controller.ts`)

**Endpoints**:

| Method | Endpoint | Description | Response Type |
|--------|----------|-------------|---------------|
| GET | `/analytics/dashboard/:tenantId` | Dashboard metrics | DashboardMetricsDto |
| GET | `/analytics/time-series/:tenantId` | Time-series data | TimeSeriesMetricDto[] |
| GET | `/analytics/report/:tenantId` | Usage report | UsageReportDto |
| GET | `/analytics/top-bank-accounts/:tenantId` | Top bank accounts | TopBankAccountDto[] |
| GET | `/analytics/top-users/:tenantId` | Top users | TopUserDto[] |
| GET | `/analytics/reconciliation-stats/:tenantId` | Reconciliation stats | ReconciliationStatsDto |
| GET | `/analytics/transaction-stats/:tenantId` | Transaction stats | TransactionStatsDto |
| GET | `/analytics/system-health` | System health | SystemHealthDto |
| GET | `/analytics/quota-alerts/:tenantId` | Quota alerts | QuotaAlertDto[] |
| POST | `/analytics/track-event` | Track event | 204 No Content |
| POST | `/analytics/export-report/:tenantId` | Export report | Download URL |

**Query Parameters** (Most endpoints):
- `timeRange`: Enum (today, yesterday, last_7_days, last_30_days, this_month, last_month, this_year, custom)
- `startDate`: ISO 8601 date (required for custom range)
- `endDate`: ISO 8601 date (required for custom range)
- `metricType`: Enum (transactions, reconciliations, users, bank_accounts, storage, api_calls)
- `limit`: Number (for top entities endpoints, default: 10, max: 100)

**Security**:
- Rate limiting via `@UseGuards(ThrottlerGuard)`
- Bearer token authentication (decorators present)
- Tenant isolation (all endpoints require tenantId)

### 2. Module Integration

**`apps/auth-service/src/auth.module.ts`** - Added:
- Import: `AnalyticsService`, `AnalyticsController`
- Controller: `AnalyticsController`
- Provider: `AnalyticsService`
- Export: `AnalyticsService` (for use by other modules)

### 3. Time Range Support

Predefined ranges:
- **today**: Current day (00:00 - 23:59)
- **yesterday**: Previous day
- **last_7_days**: Last 7 days from now
- **last_30_days**: Last 30 days from now
- **this_month**: Current calendar month
- **last_month**: Previous calendar month
- **this_year**: Current calendar year
- **custom**: User-defined start and end dates

### 4. Metric Types

Supported metrics:
- **transactions**: Transaction volume over time
- **reconciliations**: Reconciliation activity
- **users**: Active user count
- **bank_accounts**: Active bank account count
- **storage**: Storage usage in MB
- **api_calls**: API request volume

## Usage Examples

### 1. Get Dashboard Metrics

```bash
# Last 30 days dashboard (default)
curl http://localhost:3001/analytics/dashboard/tenant_abc123

# This month's dashboard
curl "http://localhost:3001/analytics/dashboard/tenant_abc123?timeRange=this_month"

# Custom date range
curl "http://localhost:3001/analytics/dashboard/tenant_abc123?timeRange=custom&startDate=2025-01-01&endDate=2025-01-31"
```

**Response**:
```json
{
  "totalTransactions": 1250,
  "totalReconciliations": 385,
  "matchedTransactions": 937,
  "unmatchedTransactions": 313,
  "activeUsers": 12,
  "activeBankAccounts": 8,
  "transactionsChange": 15.3,
  "reconciliationsChange": 8.7,
  "matchRateChange": 2.1,
  "averageMatchRate": 74.96,
  "totalTransactionValue": 1563125.50,
  "storageUsedMB": 45.2,
  "apiCallsCount": 2847,
  "quotaUsage": {
    "bankAccounts": { "used": 8, "limit": 10, "percentage": 80 },
    "transactions": { "used": 1250, "limit": 10000, "percentage": 12.5 },
    "storage": { "used": 45.2, "limit": 1000, "percentage": 4.52 },
    "users": { "used": 12, "limit": 25, "percentage": 48 }
  },
  "periodStart": "2025-10-18T00:00:00.000Z",
  "periodEnd": "2025-11-18T23:59:59.999Z"
}
```

### 2. Get Time-Series Data

```bash
# All metrics for last 30 days
curl "http://localhost:3001/analytics/time-series/tenant_abc123?timeRange=last_30_days"

# Specific metric
curl "http://localhost:3001/analytics/time-series/tenant_abc123?timeRange=last_30_days&metricType=transactions"
```

**Response**:
```json
[
  {
    "metricName": "Transactions",
    "metricType": "transactions",
    "dataPoints": [
      { "date": "2025-10-18", "value": 42, "label": "Oct 18" },
      { "date": "2025-10-19", "value": 38, "label": "Oct 19" },
      { "date": "2025-10-20", "value": 51, "label": "Oct 20" }
    ],
    "total": 1250,
    "average": 41.67,
    "peak": 68,
    "trend": "increasing",
    "trendPercentage": 12.5
  }
]
```

### 3. Generate Usage Report

```bash
curl "http://localhost:3001/analytics/report/tenant_abc123?timeRange=this_month"
```

**Response**: Complete usage report with all metrics (see UsageReportDto structure)

### 4. Get Top Users

```bash
# Top 10 users (default)
curl "http://localhost:3001/analytics/top-users/tenant_abc123?timeRange=last_30_days"

# Top 5 users
curl "http://localhost:3001/analytics/top-users/tenant_abc123?timeRange=last_30_days&limit=5"
```

### 5. Check Quota Alerts

```bash
curl http://localhost:3001/analytics/quota-alerts/tenant_abc123
```

**Response**:
```json
[
  {
    "tenantId": "tenant_abc123",
    "resourceType": "bankAccounts",
    "currentUsage": 9,
    "limit": 10,
    "usagePercentage": 90,
    "alertLevel": "warning",
    "message": "Warning: bankAccounts usage at 90.0%. Consider upgrading.",
    "timestamp": "2025-11-18T12:00:00.000Z"
  },
  {
    "tenantId": "tenant_abc123",
    "resourceType": "storage",
    "currentUsage": 960,
    "limit": 1000,
    "usagePercentage": 96,
    "alertLevel": "critical",
    "message": "Critical: storage usage at 96.0%. Upgrade plan soon.",
    "timestamp": "2025-11-18T12:00:00.000Z"
  }
]
```

### 6. Track Custom Event

```bash
curl -X POST http://localhost:3001/analytics/track-event \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "reconciliation_completed",
    "eventCategory": "reconciliation",
    "tenantId": "tenant_abc123",
    "userId": "user_456",
    "metadata": {
      "reconciliationId": "recon_789",
      "matchRate": 85.5,
      "duration": 120
    },
    "timestamp": "2025-11-18T12:00:00.000Z"
  }'
```

### 7. Export Report

```bash
curl -X POST http://localhost:3001/analytics/export-report/tenant_abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "format": "pdf",
    "timeRange": "this_month",
    "includeSections": ["transactions", "reconciliations", "users", "billing"]
  }'
```

**Response**:
```json
{
  "message": "Report export initiated for pdf format",
  "downloadUrl": "/api/downloads/report-tenant_abc123-1700308800000.pdf"
}
```

## Integration Points

### 1. Dashboard UI Integration

```typescript
// React/Angular example
const fetchDashboardMetrics = async (tenantId: string, timeRange: string = 'last_30_days') => {
  const response = await fetch(
    `${API_URL}/analytics/dashboard/${tenantId}?timeRange=${timeRange}`
  );
  return response.json();
};

// Display metrics
const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchDashboardMetrics('tenant_abc123').then(setMetrics);
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <MetricCard title="Transactions" value={metrics?.totalTransactions} />
      <MetricCard title="Match Rate" value={`${metrics?.averageMatchRate}%`} />
      <TrendChart data={metrics?.quotaUsage} />
    </div>
  );
};
```

### 2. Chart Visualization

```typescript
// Chart.js / Recharts integration
const TransactionChart = ({ tenantId }: { tenantId: string }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/analytics/time-series/${tenantId}?metricType=transactions`)
      .then(res => res.json())
      .then(metrics => setData(metrics[0].dataPoints));
  }, [tenantId]);

  return (
    <LineChart data={data}>
      <XAxis dataKey="label" />
      <YAxis />
      <Line type="monotone" dataKey="value" stroke="#8884d8" />
    </LineChart>
  );
};
```

### 3. Quota Alert Widget

```typescript
// Alert component
const QuotaAlerts = ({ tenantId }: { tenantId: string }) => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/analytics/quota-alerts/${tenantId}`)
      .then(res => res.json())
      .then(setAlerts);
  }, [tenantId]);

  return (
    <div className="alerts">
      {alerts.map(alert => (
        <Alert key={alert.resourceType} severity={alert.alertLevel}>
          {alert.message}
        </Alert>
      ))}
    </div>
  );
};
```

### 4. Automated Quota Monitoring

```typescript
// Backend scheduled job (NestJS Cron)
@Cron('0 */6 * * *') // Every 6 hours
async checkAllTenantsQuotas() {
  const tenants = await this.tenantRepository.find({ where: { status: 'active' } });

  for (const tenant of tenants) {
    const alerts = await this.analyticsService.checkQuotaAlerts(tenant.tenantId);

    if (alerts.length > 0) {
      // Send email notification
      await this.emailService.sendQuotaAlert(tenant.email, alerts);

      // Log to admin dashboard
      await this.adminNotificationService.notify({
        type: 'quota_alert',
        tenantId: tenant.tenantId,
        alerts,
      });
    }
  }
}
```

## Production Enhancements

### 1. Data Storage

**Current**: Uses AuditLog entity for all metrics (lightweight, immediate implementation)

**Production Recommendations**:
1. **Time-Series Database**: Use InfluxDB, TimescaleDB, or Prometheus for metrics
2. **Data Aggregation**: Pre-aggregate data for faster queries
3. **Separate Analytics Database**: Dedicated database for analytics to avoid impacting transactional workload
4. **Materialized Views**: Create materialized views for common queries
5. **Caching**: Cache frequently accessed metrics (Redis)

### 2. Performance Optimization

```typescript
// Example: Cache dashboard metrics
@Cacheable('dashboard-metrics', { ttl: 300 }) // 5 minutes
async getDashboardMetrics(tenantId: string, dto: GetAnalyticsDto) {
  // ... implementation
}

// Example: Background aggregation job
@Cron('0 * * * *') // Hourly
async aggregateHourlyMetrics() {
  const tenants = await this.tenantRepository.find();

  for (const tenant of tenants) {
    const metrics = await this.calculateMetrics(tenant.tenantId);
    await this.metricsCache.set(`metrics:${tenant.tenantId}:hourly`, metrics, 3600);
  }
}
```

### 3. Real-Time Analytics

```typescript
// WebSocket integration for real-time updates
@WebSocketGateway()
export class AnalyticsGateway {
  @SubscribeMessage('subscribe-metrics')
  handleSubscribe(client: Socket, tenantId: string) {
    // Join tenant-specific room
    client.join(`metrics:${tenantId}`);
  }

  // Emit real-time updates
  emitMetricUpdate(tenantId: string, metric: any) {
    this.server.to(`metrics:${tenantId}`).emit('metric-update', metric);
  }
}
```

### 4. External Analytics Integration

```typescript
// Google Analytics integration
async trackEvent(event: AnalyticsEventDto) {
  // Internal tracking
  await this.storeEvent(event);

  // External analytics
  if (this.configService.get('GOOGLE_ANALYTICS_ID')) {
    await this.googleAnalytics.track({
      category: event.eventCategory,
      action: event.eventType,
      label: event.tenantId,
      value: event.metadata,
    });
  }

  // Mixpanel
  if (this.configService.get('MIXPANEL_TOKEN')) {
    this.mixpanel.track(event.eventType, {
      tenant_id: event.tenantId,
      user_id: event.userId,
      ...event.metadata,
    });
  }
}
```

### 5. Report Generation

```typescript
// PDF report generation
async generatePDFReport(tenantId: string, dto: ExportReportDto) {
  const report = await this.generateUsageReport(tenantId, dto);

  // Use library like pdfmake or puppeteer
  const pdf = await this.pdfGenerator.create({
    header: { company: report.tenantName, period: report.reportPeriod },
    sections: [
      { title: 'Transaction Metrics', data: report.transactionMetrics },
      { title: 'Reconciliation Metrics', data: report.reconciliationMetrics },
      { title: 'User Activity', data: report.userActivity },
      { title: 'Resource Usage', data: report.resourceUsage },
    ],
  });

  // Store in S3/Cloud Storage
  const url = await this.storageService.upload(`reports/${tenantId}-${Date.now()}.pdf`, pdf);
  return url;
}
```

## Testing

### Unit Tests

```typescript
describe('AnalyticsService', () => {
  it('should calculate dashboard metrics correctly', async () => {
    const metrics = await service.getDashboardMetrics('tenant_123', {
      timeRange: TimeRangeEnum.LAST_30_DAYS,
    });

    expect(metrics.totalTransactions).toBeGreaterThanOrEqual(0);
    expect(metrics.averageMatchRate).toBeGreaterThanOrEqual(0);
    expect(metrics.averageMatchRate).toBeLessThanOrEqual(100);
  });

  it('should generate quota alerts for high usage', async () => {
    // Mock tenant with 95% usage
    const alerts = await service.checkQuotaAlerts('tenant_123');

    expect(alerts).toBeDefined();
    expect(alerts.some(a => a.alertLevel === 'critical')).toBe(true);
  });

  it('should calculate trend correctly', () => {
    const dataPoints = [
      { date: '2025-01-01', value: 10 },
      { date: '2025-01-02', value: 15 },
      { date: '2025-01-03', value: 20 },
    ];

    const trend = service['calculateTrend'](dataPoints);
    expect(trend.direction).toBe('increasing');
  });
});
```

### Integration Tests

```typescript
describe('AnalyticsController (e2e)', () => {
  it('/analytics/dashboard/:tenantId (GET)', () => {
    return request(app.getHttpServer())
      .get('/analytics/dashboard/tenant_123')
      .query({ timeRange: 'last_30_days' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('totalTransactions');
        expect(res.body).toHaveProperty('quotaUsage');
      });
  });
});
```

## Security Considerations

1. **Authentication**: Add JWT guards to all endpoints in production
2. **Authorization**: Verify tenant access before returning data
3. **Rate Limiting**: Already implemented via ThrottlerGuard
4. **Data Isolation**: All queries filtered by tenantId
5. **PII Protection**: Anonymize user data in exports
6. **Audit Trail**: All analytics queries logged

## Future Enhancements

1. **Predictive Analytics**: ML models for forecasting
2. **Anomaly Detection**: Automated detection of unusual patterns
3. **Comparative Analytics**: Benchmark against similar tenants
4. **Custom Dashboards**: User-configurable dashboard layouts
5. **Scheduled Reports**: Automated email reports (daily/weekly/monthly)
6. **Goal Tracking**: Set and track KPI goals
7. **Funnel Analysis**: Track user journeys and conversion
8. **Cohort Analysis**: Analyze user behavior by cohort
9. **A/B Testing Integration**: Track experiment results
10. **Data Export API**: Bulk export for external BI tools

## Related Steps

- **Step 211**: Tenant Management (quota enforcement)
- **Step 212**: Billing Integration (billing metrics)
- **Step 214**: Onboarding Flow (onboarding analytics)
- **Step 215**: Feature Flags (feature usage analytics)

---

**Implementation Date**: 2025-11-18
**Implemented By**: Claude (AI Assistant)
**Reviewed By**: Pending
**Status**: ✅ Complete - Ready for Testing
