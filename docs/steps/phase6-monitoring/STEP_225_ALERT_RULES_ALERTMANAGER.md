# Step 225: Alert Rules & Alertmanager Setup

## Overview

Configure comprehensive alert rules in Prometheus and set up Alertmanager for intelligent alert routing and notification management.

## Alert Rules Configuration

### 1. Create Alert Rules File

Create `monitoring/prometheus/rules/alerts.yml`:

```yaml
groups:
  - name: service_health
    interval: 30s
    rules:
      # Service Down Alerts
      - alert: ServiceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
          category: availability
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.job }} on {{ $labels.instance }} has been down for more than 2 minutes"
          runbook_url: "https://docs.banking-recon.com/runbooks/service-down"

      # High Error Rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
          category: performance
        annotations:
          summary: "High error rate on {{ $labels.job }}"
          description: "Error rate is {{ $value | humanizePercentage }} on {{ $labels.job }}"
          runbook_url: "https://docs.banking-recon.com/runbooks/high-error-rate"

      # High Response Time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: warning
          category: performance
        annotations:
          summary: "High response time on {{ $labels.job }}"
          description: "P95 latency is {{ $value }}s on {{ $labels.job }} (threshold: 2s)"

  - name: authentication_security
    interval: 30s
    rules:
      # High Failed Login Rate
      - alert: HighFailedLoginRate
        expr: rate(auth_login_failure_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
          category: security
        annotations:
          summary: "High failed login rate detected"
          description: "Failed login rate is {{ $value }} per second"
          runbook_url: "https://docs.banking-recon.com/runbooks/high-login-failures"

      # Potential Brute Force Attack
      - alert: PotentialBruteForce
        expr: sum(rate(auth_login_failure_total{tenant_id!=""}[1m])) by (tenant_id) > 50
        for: 2m
        labels:
          severity: critical
          category: security
        annotations:
          summary: "Potential brute force attack on tenant {{ $labels.tenant_id }}"
          description: "{{ $value }} failed logins/minute for tenant {{ $labels.tenant_id }}"
          action: "Consider blocking IP or tenant temporarily"

  - name: business_metrics
    interval: 60s
    rules:
      # Subscription Cancellation Spike
      - alert: SubscriptionCancellationSpike
        expr: rate(subscriptions_cancelled_total[1h]) > rate(subscriptions_cancelled_total[24h]) * 2
        for: 30m
        labels:
          severity: warning
          category: business
        annotations:
          summary: "Subscription cancellation rate spike"
          description: "Cancellation rate is {{ $value | humanize }} (2x normal)"

      # Low Reconciliation Success Rate
      - alert: LowReconciliationSuccessRate
        expr: rate(reconciliation_completed_total[1h]) / rate(reconciliation_started_total[1h]) < 0.8
        for: 30m
        labels:
          severity: warning
          category: business
        annotations:
          summary: "Low reconciliation success rate"
          description: "Success rate is {{ $value | humanizePercentage }}"

  - name: resource_usage
    interval: 30s
    rules:
      # High CPU Usage
      - alert: HighCPUUsage
        expr: rate(process_cpu_seconds_total[5m]) > 0.8
        for: 10m
        labels:
          severity: warning
          category: resources
        annotations:
          summary: "High CPU usage on {{ $labels.job }}"
          description: "CPU usage is {{ $value | humanizePercentage }}"

      # High Memory Usage
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 > 1024
        for: 10m
        labels:
          severity: warning
          category: resources
        annotations:
          summary: "High memory usage on {{ $labels.job }}"
          description: "Memory usage is {{ $value }}MB"

      # Database Connection Pool Exhaustion
      - alert: DatabaseConnectionPoolNearExhaustion
        expr: database_connections_active / database_connections_max > 0.8
        for: 5m
        labels:
          severity: warning
          category: database
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "{{ $value | humanizePercentage }} of connections in use"

  - name: tenant_quotas
    interval: 60s
    rules:
      # Tenant Quota Exceeded
      - alert: TenantQuotaExceeded
        expr: tenant_quota_usage / tenant_quota_limit > 1
        for: 5m
        labels:
          severity: warning
          category: quotas
        annotations:
          summary: "Tenant {{ $labels.tenant_id }} exceeded quota"
          description: "Usage: {{ $value | humanize }} (limit exceeded)"

      # Tenant Approaching Quota
      - alert: TenantApproachingQuota
        expr: tenant_quota_usage / tenant_quota_limit > 0.9
        for: 30m
        labels:
          severity: info
          category: quotas
        annotations:
          summary: "Tenant {{ $labels.tenant_id }} approaching quota limit"
          description: "Usage: {{ $value | humanizePercentage }} of quota"
```

## 2. Alertmanager Configuration

### Basic Configuration

Create `monitoring/prometheus/alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m
  # Slack webhook will be added in Step 226

route:
  group_by: ['alertname', 'severity', 'category']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  
  routes:
    # Critical alerts - immediate notification
    - match:
        severity: critical
      receiver: 'critical-alerts'
      group_wait: 0s
      repeat_interval: 5m
      
    # Security alerts - immediate notification
    - match:
        category: security
      receiver: 'security-team'
      group_wait: 0s
      repeat_interval: 15m
      
    # Business alerts - during business hours
    - match:
        category: business
      receiver: 'business-team'
      group_interval: 1h
      repeat_interval: 24h
      
    # Warning alerts - normal routing
    - match:
        severity: warning
      receiver: 'ops-team'
      repeat_interval: 4h
      
    # Info alerts - low priority
    - match:
        severity: info
      receiver: 'info-alerts'
      repeat_interval: 24h

receivers:
  - name: 'default'
    # Placeholder - will configure in Step 226

  - name: 'critical-alerts'
    # Placeholder for Slack/PagerDuty

  - name: 'security-team'
    # Placeholder for security team notifications

  - name: 'business-team'
    # Placeholder for business team notifications

  - name: 'ops-team'
    # Placeholder for ops team notifications

  - name: 'info-alerts'
    # Placeholder for info-level alerts

inhibit_rules:
  # Inhibit warning if critical is firing
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
    
  # Inhibit error alerts if service is down
  - source_match:
      alertname: 'ServiceDown'
    target_match_re:
      severity: 'warning|info'
    equal: ['instance']
```

## 3. Update Prometheus Configuration

Add alert rules to `monitoring/prometheus/prometheus.yml`:

```yaml
# Alert rules
rule_files:
  - 'rules/alerts.yml'

# Alertmanager configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093
```

## 4. Testing Alert Rules

### Test Alert Rule Syntax

```bash
# Validate alert rules
promtool check rules monitoring/prometheus/rules/alerts.yml

# Test specific alert expression
promtool query instant http://localhost:9090 \
  'rate(http_requests_total{status=~"5.."}[5m]) > 0.05'
```

### Trigger Test Alerts

```bash
# Create test script
cat > monitoring/test-alerts.sh << 'EOF'
#!/bin/bash

echo "Testing alert system..."

# Test 1: High error rate
echo "1. Simulating high error rate..."
for i in {1..100}; do
  curl -X GET http://localhost:3001/nonexistent 2>/dev/null
  sleep 0.1
done

# Test 2: Failed logins
echo "2. Simulating failed logins..."
for i in {1..20}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' 2>/dev/null
  sleep 0.5
done

echo "Check Alertmanager UI at http://localhost:9093"
EOF

chmod +x monitoring/test-alerts.sh
```

## 5. Alert Severity Guidelines

### Critical (Immediate Action)
- Service completely down
- Data corruption detected
- Security breach detected
- Payment processing failure
- Database unreachable

### Warning (Action within 1 hour)
- High error rate
- Slow response times
- High resource usage
- Approaching quotas
- Failed background jobs

### Info (Monitor, action if persists)
- Subscription changes
- Usage pattern changes
- Configuration updates
- Planned maintenance

## 6. Verification Checklist

- [ ] Alert rules file created and validated
- [ ] Alertmanager configuration deployed
- [ ] Prometheus can read alert rules
- [ ] Test alerts trigger correctly
- [ ] Alert routing works as expected
- [ ] Inhibit rules prevent alert storms
- [ ] Alert annotations include runbook URLs
- [ ] Severity levels properly assigned

## Next Steps

- **Step 226**: Configure Slack notifications in Alertmanager
- **Step 232**: Create runbooks for all alerts
- **Step 239**: Test alert delivery end-to-end

## Resources

- Prometheus Alerting: https://prometheus.io/docs/alerting/latest/overview/
- Alertmanager Configuration: https://prometheus.io/docs/alerting/latest/configuration/
- Alert Best Practices: https://prometheus.io/docs/practices/alerting/

---

**Status**: ✅ Alert rules configured  
**Next**: Step 226 - Slack Notifications
