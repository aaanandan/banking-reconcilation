# 48-Hour Launch Monitoring Plan

Banking Reconciliation Platform — Step 279

---

## Monitoring Window

**Start:** Immediately after soft launch complete (Step 278)
**Duration:** 48 continuous hours
**Goal:** Ensure system stability, catch issues early, validate production readiness before full launch

---

## Monitoring Team

### On-Call Rotation (24/7 coverage)

**Shift 1:** 12 AM - 12 PM
- Primary: Engineering Lead
- Secondary: DevOps Engineer

**Shift 2:** 12 PM - 12 AM
- Primary: Backend Engineer
- Secondary: Full-Stack Engineer

**Escalation:**
- P0 (service down): Page immediately via PagerDuty
- P1 (major feature broken): Slack + SMS
- P2 (minor issue): Slack only

---

## Critical Metrics Dashboard

### Grafana Dashboard: "Launch Command Center"

**Panel 1: System Health (1-minute intervals)**
- CPU utilization (target: <70%)
- Memory usage (target: <80%)
- Disk I/O (target: <500 IOPS)
- Network throughput (target: <50 Mbps)

**Panel 2: Application Performance**
- API response time p50/p95/p99 (target p95: <2s)
- Error rate (target: <1%)
- Request throughput (req/s)
- Active WebSocket connections (if applicable)

**Panel 3: Business Metrics**
- Signups (last hour, last 24h, total)
- Active users (last 5 min)
- Reconciliations started (last hour)
- Reconciliations completed (last hour)
- Convergence rate (rolling 1-hour average)

**Panel 4: Database**
- Connection pool usage (target: <80%)
- Query duration p95 (target: <500ms)
- Slow queries (>1s)
- Deadlocks (target: 0)
- Replication lag (target: <5s)

**Panel 5: External Dependencies**
- Stripe API response time (target: <1s)
- Email delivery rate (target: >95%)
- S3 upload success rate (target: >99%)

**Panel 6: Security**
- Failed login attempts (spike detection)
- Rate limit hits (by endpoint)
- Suspicious activity (multiple IPs from same user)

---

## Hourly Checklist (Repeated Every Hour for 48 Hours)

### Hour 0 (Launch):
- [x] All services healthy
- [x] Grafana alerts configured
- [x] PagerDuty rotation active
- [x] Slack #launch-monitoring channel created
- [x] Announce launch in #general

### Every Hour (Hours 1-48):

**System Check (5 min):**
- [ ] Check Grafana dashboard (all panels green)
- [ ] Review error logs in Kibana (filter: `level:error`)
- [ ] Check Sentry for new errors (should be <5/hour)
- [ ] Verify backup ran successfully (if scheduled)

**User Activity (3 min):**
- [ ] Signups this hour: X (target: ≥2/hour avg)
- [ ] Active reconciliations: Y
- [ ] Support tickets opened: Z (target: <3/hour)

**Alert Review (2 min):**
- [ ] Any Prometheus alerts firing? (investigate immediately)
- [ ] Any PagerDuty pages? (acknowledge if false alarm)

**Log to Spreadsheet:**
| Hour | Signups | Reconciliations | Errors | P95 Latency | Notes |
|------|---------|----------------|--------|-------------|-------|
| 0 | 5 | 2 | 0 | 180ms | Launch successful |
| 1 | 3 | 5 | 1 | 210ms | 1 timeout (resolved) |

---

## Alert Thresholds (Prometheus)

### Critical Alerts (Page Immediately)

**alert: ServiceDown**
```yaml
expr: up{job=~"auth-service|billing-service"} == 0
for: 2m
severity: critical
action: Restart service, check logs, notify team
```

**alert: HighErrorRate**
```yaml
expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
for: 5m
severity: critical
action: Check recent deploys, review error logs, rollback if needed
```

**alert: DatabaseDown**
```yaml
expr: pg_up == 0
for: 1m
severity: critical
action: Check RDS console, verify connection pool, failover to replica if needed
```

---

### Warning Alerts (Slack Notification)

**alert: HighLatency**
```yaml
expr: histogram_quantile(0.95, http_request_duration_seconds) > 2
for: 10m
severity: warning
action: Profile slow endpoints, check DB query performance
```

**alert: HighMemoryUsage**
```yaml
expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) < 0.2
for: 15m
severity: warning
action: Investigate memory leak, consider scaling up instance
```

**alert: SlowDatabaseQueries**
```yaml
expr: pg_stat_statements_mean_exec_time_seconds > 1
for: 10m
severity: warning
action: Review slow query log, optimize or add indexes
```

---

## Incident Response Playbook

### If Service Goes Down (P0)

**Immediate actions (< 5 min):**
1. Acknowledge PagerDuty alert
2. Check service status: `curl https://app.banking-recon.com/health`
3. Check ECS task status: `aws ecs list-tasks --cluster prod --service-name auth-service`
4. Check CloudWatch logs: Last 10 minutes of errors

**Recovery (5-15 min):**
1. If task crashed: Restart via ECS console
2. If DB connection issue: Check RDS status, verify security group
3. If deployment bug: Rollback to previous version
4. Post in #launch-monitoring with status update

**Post-mortem (within 24 hours):**
- Root cause analysis
- Timeline of events
- Action items to prevent recurrence

---

### If High Error Rate (P1)

**Diagnosis (< 10 min):**
1. Filter errors by endpoint: `grep "status:500" logs/`
2. Check Sentry for stack traces
3. Identify pattern: One endpoint? All endpoints? Specific user?

**Mitigation:**
- If one endpoint: Disable feature flag or return cached response
- If database query: Add fallback or timeout
- If third-party API: Implement circuit breaker

**Communication:**
- Update status page: "We're experiencing elevated error rates. Investigating."
- Email affected users (if identifiable)

---

## User Communication During Monitoring Window

### Status Page (status.banking-recon.com)

**Update every 4 hours or immediately if incident:**

```
✅ All Systems Operational (Last updated: 2:00 PM)

- API: Operational (p95: 180ms)
- Database: Operational
- File Uploads: Operational
- Billing: Operational

Recent Incidents:
- None

Upcoming Maintenance:
- None scheduled
```

**If incident:**
```
⚠️ Investigating — Elevated Error Rates (Last updated: 2:15 PM)

We're investigating reports of intermittent errors during reconciliation uploads. 
Our team is actively working on a fix. No data loss has occurred.

Updates will be posted here every 15 minutes.
```

---

### Proactive User Emails

**Email: 12 Hours After Launch**

```
Subject: 12 Hours In — Thank You!

Hi [First Name],

We launched 12 hours ago and you're part of the first wave. Thank you!

Quick stats:
- 87 signups
- 42 reconciliations completed
- Average time savings: 2.5 hours per reconciliation

Everything running smoothly? Reply and let us know how it's going.

— The Team
```

**Email: 48 Hours After Launch (End of Monitoring Window)**

```
Subject: We Made It! 48 Hours Live

Hi [First Name],

Our first 48 hours are complete. Here's what happened:

📊 Stats:
- 156 total users
- 89 reconciliations completed
- 94.2% average convergence rate
- 99.97% uptime (16 seconds of downtime due to a deploy)

🐛 Bugs Fixed:
- Export timeout for large files (fixed in 4 hours)
- Column mapping issue with Euro currency symbols (fixed same day)

What's Next:
- Full public launch next week
- New feature: Multi-currency support (requested by 12 users)

Thank you for being an early user. Your feedback is shaping the product.

— The Team
```

---

## Metrics to Collect (For Post-Launch Review)

### Performance

- **Uptime:** X hours / 48 hours = Y%
- **Error rate:** Total errors / total requests = Z%
- **p95 latency:** Xms (by endpoint)
- **Peak concurrency:** N users

### User Behavior

- **Signups:** Total, by source (direct, Product Hunt, HN, referral)
- **Activation rate:** % who completed ≥1 reconciliation
- **Retention:** % who returned Day 2
- **Support tickets:** Total, by category (bug, question, feature request)

### Business

- **MRR:** $X from soft launch
- **Conversion rate:** % free → paid
- **Churn:** Users who cancelled (should be 0 in 48h)

---

## Go/No-Go Decision for Full Launch (Step 280)

**After 48 hours, evaluate:**

### GO Criteria (All Must Be True)

- [ ] Uptime ≥99.5% (allows 14.4 min downtime in 48h)
- [ ] Error rate <1% (24-hour average)
- [ ] p95 latency <2s (24-hour average)
- [ ] No P0 incidents lasting >1 hour
- [ ] ≥70% user activation rate
- [ ] NPS ≥60 (from Day 2 survey)
- [ ] ≥10 paid subscriptions

### NO-GO (If Any Are True)

- [ ] Uptime <99%
- [ ] Error rate >2%
- [ ] Unresolved P0 incident
- [ ] Data loss incident (any)
- [ ] Security breach detected

**If NO-GO:**
- Pause signups
- Fix critical issues
- Re-run 48-hour monitoring
- Delay full launch by 1 week

**If GO:**
- Proceed to Step 280 (Full Launch 🚀)

---

*This document is your command center for the next 48 hours. Print it. Pin it. Live it.*
