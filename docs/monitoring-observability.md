# Monitoring & Observability — Documentation
**Step 240 — Documentation**

## Overview

The Banking Reconciliation platform uses a full observability stack covering metrics, logs, traces, and error tracking.

## Stack Summary

| Component | Tool | Version | Port | Purpose |
|-----------|------|---------|------|---------|
| Metrics collection | Prometheus | v2.51.0 | 9090 | Scrapes /metrics endpoints |
| Alert routing | Alertmanager | v0.27.0 | 9093 | Routes alerts to Slack |
| Metrics visualisation | Grafana | v10.4.1 | 3000 | Dashboards |
| Log shipping | Filebeat | v8.13.0 | — | Forwards logs to Logstash |
| Log processing | Logstash | v8.13.0 | 5044 | Parses and routes logs |
| Log storage/search | Elasticsearch | v8.13.0 | 9200 | Stores and indexes logs |
| Log visualisation | Kibana | v8.13.0 | 5601 | Log dashboards |
| Error tracking | Sentry | Cloud | — | Captures exceptions |
| Distributed tracing | Jaeger | v1.56 | 16686 | Trace cross-service calls |

## Quick Start

```bash
# Start entire observability stack
docker compose up -d

# Check all service health
./monitoring/uptime/uptime-check.sh

# Import Kibana dashboards
./monitoring/elk/kibana/setup-kibana.sh

# Fire test alerts (verify Slack integration)
./monitoring/test-alerts.sh
```

## Grafana Dashboards

| Dashboard | UID | URL | Refresh |
|-----------|-----|-----|---------|
| System Overview | system-overview | /d/system-overview | 10s |
| Business Metrics | business-metrics | /d/business-metrics | 30s |
| Auth & Security | authentication-security | /d/authentication-security | 10s |
| Database Perf | database-performance | /d/database-performance | 30s |
| Tenant Analytics | tenant-analytics | /d/tenant-analytics | 30s |

Login: `admin` / `admin`

## Alert Rules Summary

| Group | Rules | Channel |
|-------|-------|---------|
| application_health | HighErrorRate, SlowResponseTime, ServiceDown, HighRequestRate | #alerts-critical / #alerts-warning |
| authentication_security | HighLoginFailureRate, SuspiciousLoginActivity, Low2FAAdoption, HighPasswordResetRate | #security-alerts |
| business_metrics | HighTenantSuspensionRate, SubscriptionChurnSpike, NoNewTenants, LowActiveSubscriptions | #business-alerts |
| infrastructure | HighMemoryUsage, HighCPUUsage, HighEventLoopLag | #alerts-warning |
| database | HighDatabaseConnections, SlowDatabaseQueries | #alerts-warning |
| webhooks | HighWebhookFailureRate, WebhookDeliveryStalled | #alerts-warning |
| email | HighEmailFailureRate, NoEmailsSent | #alerts-info |
| api_keys | SuspiciousAPIKeyActivity | #security-alerts |

## Kibana Dashboards

| Dashboard | Purpose |
|-----------|---------|
| Service Logs Overview | Log volume + level distribution across all services |
| Error Tracking | Filtered view of error/warn logs |
| Auth Service Logs | HTTP request logs for auth-service |

Import via: `./monitoring/elk/kibana/setup-kibana.sh`

## Service Instrumentation

### Metrics (22 custom + defaults)
Exposed at `http://localhost:3001/metrics`

Custom counters: `auth_login_attempts_total`, `auth_login_success_total`, `auth_login_failure_total`, `auth_registration_total`, `tenants_created_total`, `tenants_suspended_total`, `subscriptions_created_total`, `subscriptions_cancelled_total`, `security_password_reset_total`, `security_failed_2fa_total`, `api_key_requests_total`, `webhooks_delivered_total`, `webhooks_failed_total`, `emails_sent_total`, `emails_failed_total`

Custom gauges: `tenants_active_total`, `subscriptions_active_total`, `subscription_revenue_total`, `security_2fa_enabled_total`, `api_keys_active_total`

Custom histogram: `http_request_duration_seconds` (14 buckets)

### Logging (structured JSON)
All logs output as JSON: `{"timestamp":"...","level":"info","service":"auth-service","message":"..."}`
Forwarded: Service → Filebeat → Logstash → Elasticsearch → Kibana

### Tracing (OpenTelemetry)
- Exporter: Jaeger at `http://localhost:14268/api/traces`
- Auto-instrumented: HTTP, Express, pg
- Propagation: W3C TraceContext headers
- Response headers: `X-Trace-Id`, `X-Span-Id`

### Error Tracking (Sentry)
- Set `SENTRY_DSN` environment variable
- Automatic Express error capture
- Tenant context attached to each event
- PII scrubbed (password, token, secret fields)

## Environment Variables

See `.env.example` for all required variables:
- `SLACK_WEBHOOK_URL` — Alertmanager Slack notifications
- `SENTRY_DSN` — Sentry error tracking
- `JAEGER_ENDPOINT` — Jaeger trace collector (default: `http://localhost:14268/api/traces`)
- `NODE_ENV` — development / staging / production

## Runbooks

- [Service Down](./runbooks/service-down.md)
- [High Error Rate](./runbooks/high-error-rate.md)
- [High Login Failures](./runbooks/high-login-failures.md)

## On-Call

- [On-Call Rotation](./oncall/on-call-rotation.md)
- [Incident Response](./oncall/incident-response.md)

## SLA

- [SLA Definitions](./sla/sla-definitions.md)
