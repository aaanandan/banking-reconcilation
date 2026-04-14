# Incident Response Procedures
**Step 234 — Incident Response Procedures**

## Incident Severity Levels

| Level | Definition | Response Time | Example |
|-------|-----------|--------------|---------|
| P1 — Critical | Platform down, all tenants affected | 15 min | Auth service down |
| P2 — High | Core feature broken, many tenants affected | 30 min | Reconciliation failing |
| P3 — Medium | Non-critical feature degraded | 2 hours | Slow dashboard |
| P4 — Low | Minor issue, workaround available | Next day | Cosmetic UI bug |

## Incident Response Workflow

```
1. DETECT    → Alert fires (Prometheus/Sentry/user report)
2. TRIAGE    → On-call assesses severity within 15 min
3. DECLARE   → Create incident in Slack #incidents channel
4. RESPOND   → Investigate using runbooks
5. MITIGATE  → Apply fix or workaround to restore service
6. RESOLVE   → Confirm service restored, close incident
7. REVIEW    → Write post-mortem within 48 hours (P1/P2)
```

## Incident Declaration (Slack Template)

Post in **#incidents**:
```
🚨 INCIDENT DECLARED — P[1/2/3]

Service:    [affected service]
Impact:     [who is affected and how]
Started:    [time]
On-call:    [@engineer]
Status:     Investigating

Updates every 15 min (P1) / 30 min (P2)
```

## During Incident: Communication Cadence

| Severity | Internal update | Customer update |
|----------|----------------|----------------|
| P1 | Every 15 min in #incidents | Status page update every 30 min |
| P2 | Every 30 min in #incidents | Status page update every 1 hour |
| P3 | Every 2 hours | Optional |

## Mitigation Strategies

| Issue | Fast Mitigation |
|-------|----------------|
| Bad deploy | `git revert HEAD && git push` (triggers CI/CD rollback) |
| Service crash | `docker compose restart [service]` |
| DB overload | Kill long-running queries, enable read-only mode |
| Memory leak | Rolling restart: `docker compose up -d --force-recreate [service]` |
| DDoS | Enable rate limiting, block IPs at proxy level |

## Post-Mortem Template (P1/P2)

```markdown
# Post-Mortem: [Incident Title]
Date: [YYYY-MM-DD]
Severity: P[1/2]
Duration: [X hours Y minutes]
On-call: [name]

## Summary
[2-3 sentence description]

## Timeline
- HH:MM — Alert fired
- HH:MM — On-call acknowledged
- HH:MM — Root cause identified
- HH:MM — Mitigation applied
- HH:MM — Service restored

## Root Cause
[Detailed explanation]

## Impact
- Tenants affected: [N]
- User-facing errors: [N]
- Data loss: [yes/no]

## Resolution
[What was done to fix it]

## Action Items
| Action | Owner | Due Date |
|--------|-------|---------|
| [task] | [name] | [date] |

## Lessons Learned
[What went well / what to improve]
```
