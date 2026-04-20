# Step 229: Create Kibana Dashboards for Log Analysis

## Overview

Create comprehensive Kibana dashboards to visualize logs, detect patterns, troubleshoot issues, and monitor application health.

## Dashboard Overview

We'll create 5 main dashboards:
1. **System Overview** - High-level metrics and health
2. **Error Analysis** - Error tracking and debugging
3. **Performance Monitoring** - Response times and throughput
4. **Security Audit** - Security events and anomalies
5. **Tenant Analytics** - Per-tenant usage and activity

## Setting Up Kibana

### 1. Create Index Patterns

```bash
# Access Kibana
open http://localhost:5601

# Or via API
curl -X POST "localhost:5601/api/saved_objects/index-pattern/logs-*" \
  -H 'kbn-xsrf: true' \
  -H 'Content-Type: application/json' \
  -d '{
  "attributes": {
    "title": "logs-*",
    "timeFieldName": "@timestamp"
  }
}'
```

### 2. Dashboard 1: System Overview

**Panels to create:**

1. **Request Volume (Line Chart)**
   - Visualization: Line
   - Y-axis: Count
   - X-axis: @timestamp
   - Split series: service.keyword

2. **Error Rate (Metric)**
   - Visualization: Metric
   - Aggregation: Count
   - Filter: level:error

3. **Service Health (Table)**
   - Columns: service, count, avg response time
   - Group by: service.keyword

4. **Top Errors (Table)**
   - Columns: message, count, service
   - Group by: message.keyword
   - Filter: level:error
   - Top 10

5. **Request Distribution by Status Code (Pie)**
   - Slice by: statusCode
   - Size: Count

### 3. Dashboard 2: Error Analysis

**Search Query**: `level:error OR level:fatal`

**Panels:**

1. **Error Timeline**
   - Line chart of errors over time
   - Split by service

2. **Error Details Table**
   - Fields: timestamp, service, message, error, tenant_id, request_id
   - Sortable
   - Expandable for stack traces

3. **Top Error Messages**
   - Tag cloud
   - Field: message.keyword

4. **Errors by Tenant**
   - Bar chart
   - X-axis: tenant_id.keyword
   - Y-axis: Count

5. **Error Stack Traces**
   - Data table
   - Fields: error, error_stack
   - Filter for unique errors

### 4. Dashboard 3: Performance Monitoring

**Panels:**

1. **Average Response Time**
   - Line chart
   - Y-axis: Average of duration
   - X-axis: @timestamp
   - Split: service.keyword

2. **P95 Response Time**
   - Line chart
   - Y-axis: 95th percentile of duration
   - X-axis: @timestamp

3. **Slow Requests (>2s)**
   - Data table
   - Filter: duration > 2000
   - Fields: service, path, duration, tenant_id

4. **Throughput (requests/min)**
   - Metric
   - Rate of count per minute

5. **Response Time Distribution**
   - Histogram
   - Field: duration
   - Interval: 100ms

### 5. Dashboard 4: Security Audit

**Search Query**: `level:warn OR level:error OR path:*login* OR path:*auth*`

**Panels:**

1. **Failed Login Attempts**
   - Line chart over time
   - Filter: message:*login*failed*

2. **Failed Logins by IP**
   - Data table
   - Group by: ip.keyword
   - Count

3. **Suspicious Activity**
   - Tag cloud
   - Field: message.keyword
   - Filter: level:warn AND category:security

4. **Authentication Events**
   - Timeline
   - Filter: service:auth-service

5. **Rate Limiting Triggers**
   - Metric
   - Filter: message:*rate*limit*

### 6. Dashboard 5: Tenant Analytics

**Panels:**

1. **Requests per Tenant**
   - Bar chart
   - X-axis: tenant_id.keyword
   - Y-axis: Count

2. **Tenant Activity Timeline**
   - Heat map
   - Rows: tenant_id.keyword
   - Columns: @timestamp
   - Cell color: Count

3. **Top Active Tenants**
   - Metric
   - Top 5 tenants by request count

4. **Tenant Error Rate**
   - Data table
   - Columns: tenant_id, errors, total requests, error rate
   - Calculated field: errors / total * 100

5. **Tenant Service Usage**
   - Stacked bar chart
   - X-axis: tenant_id.keyword
   - Stack: service.keyword

## Create Saved Searches

### 1. Production Errors

```
level:error AND environment:production AND NOT message:*test*
```

### 2. Slow Requests

```
duration:>2000
```

### 3. Security Events

```
(level:warn OR level:error) AND (service:auth-service OR message:*security* OR message:*login*)
```

### 4. Tenant Activity

```
tenant_id:* AND NOT tenant_id:""
```

## Create Alerts (Watcher)

### Alert on High Error Rate

```json
{
  "trigger": {
    "schedule": {
      "interval": "5m"
    }
  },
  "input": {
    "search": {
      "request": {
        "indices": ["logs-*"],
        "body": {
          "query": {
            "bool": {
              "filter": [
                {
                  "range": {
                    "@timestamp": {
                      "gte": "now-5m"
                    }
                  }
                },
                {
                  "match": {
                    "level": "error"
                  }
                }
              ]
            }
          }
        }
      }
    }
  },
  "condition": {
    "compare": {
      "ctx.payload.hits.total": {
        "gt": 50
      }
    }
  },
  "actions": {
    "log_error": {
      "logging": {
        "text": "High error rate detected: {{ctx.payload.hits.total}} errors in 5 minutes"
      }
    }
  }
}
```

## Visualization Best Practices

### Color Coding

- **Green**: Success, healthy, normal
- **Yellow**: Warning, elevated
- **Red**: Error, critical, failed
- **Blue**: Info, neutral metrics

### Time Ranges

- Default: Last 15 minutes
- Quick select: 1h, 4h, 24h, 7d
- Auto-refresh: Every 30 seconds

### Filters

Save common filters:
- Production only: `environment:production`
- Specific tenant: `tenant_id:tenant_123`
- Specific service: `service:auth-service`

## Export/Import Dashboards

### Export Dashboard

```bash
# Export via API
curl -X GET "localhost:5601/api/kibana/dashboards/export?dashboard=DASHBOARD_ID" \
  -H 'kbn-xsrf: true' > dashboard-export.json
```

### Import Dashboard

```bash
# Import via API
curl -X POST "localhost:5601/api/kibana/dashboards/import" \
  -H 'kbn-xsrf: true' \
  -H 'Content-Type: application/json' \
  -d @dashboard-export.json
```

## Verification

- [ ] All 5 dashboards created
- [ ] Index patterns configured
- [ ] Saved searches working
- [ ] Visualizations displaying data
- [ ] Filters working correctly
- [ ] Time ranges appropriate
- [ ] Auto-refresh enabled
- [ ] Alerts configured

## Next Steps

- **Step 230**: Set up Sentry for error tracking
- **Step 232**: Link dashboards in runbooks

---

**Status**: ✅ Kibana dashboards created  
**Next**: Step 230 - Sentry Error Tracking
