# On-Call Rotation Setup
**Step 233 — On-Call Rotation**

## Overview
The on-call rotation ensures 24/7 coverage for the Banking Reconciliation platform.

## Rotation Schedule

| Week | Primary On-Call | Secondary (Backup) |
|------|----------------|-------------------|
| Week 1 | Engineer A | Engineer B |
| Week 2 | Engineer B | Engineer C |
| Week 3 | Engineer C | Engineer A |
| Week 4 | (repeat) | |

**Rotation**: Weekly, handover every Monday 09:00 UTC.

## Responsibilities

### Primary On-Call
- Acknowledge alerts within **15 minutes**
- Begin diagnosis within **30 minutes**
- Escalate to secondary if unresolved in **45 minutes**
- Write incident report for P1/P2 incidents

### Secondary On-Call
- Available as backup if primary unavailable
- Support primary on complex issues
- Take over if primary is paged 3+ times in one night

## Alert Channels

| Severity | Channel | Response SLA |
|----------|---------|-------------|
| Critical | PagerDuty → SMS + phone call | 15 min |
| Warning | Slack #alerts-warning | 2 hours |
| Info | Slack #alerts-info | Next business day |
| Security | Slack #security-alerts + PagerDuty | 15 min |

## Escalation Path

```
Alert fires
    ↓
Primary On-Call (15 min SLA)
    ↓ (if no response or unresolved in 45 min)
Secondary On-Call
    ↓ (if unresolved in 90 min)
Engineering Manager
    ↓ (if P1, customer-impacting)
CTO
```

## Handover Checklist

At each rotation handover, outgoing on-call must share:
- [ ] Open incidents and their status
- [ ] Ongoing investigations
- [ ] Known fragile areas in current release
- [ ] Any silenced alerts and reason
- [ ] Changes deployed in the last week

## Tools

| Tool | URL | Purpose |
|------|-----|---------|
| Grafana | http://localhost:3000 | Metrics dashboards |
| Kibana | http://localhost:5601 | Log analysis |
| Prometheus | http://localhost:9090 | Raw metrics & alerts |
| Alertmanager | http://localhost:9093 | Active alert status |
| Jaeger | http://localhost:16686 | Distributed traces |
| Sentry | https://sentry.io | Error tracking |
