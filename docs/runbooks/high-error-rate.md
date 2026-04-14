# Runbook: High Error Rate
**Step 232 — Create Runbooks**

## Alert
`HighErrorRate` — HTTP 5xx error rate >5% for 5 minutes.

## Severity
**Critical**

## Diagnosis Steps

1. **Check error rate in Grafana**
   - Dashboard: System Overview → Error Rate gauge
   - Time range: last 15 minutes

2. **Check error logs in Kibana**
   - Dashboard: Error Tracking
   - Filter: `log_level: error AND @timestamp: [now-15m TO now]`

3. **Check Sentry for new issues**
   - New issues created in last 15 minutes?
   - Stack trace pointing to specific endpoint?

4. **Check recent deployments**
   ```bash
   git log --oneline -10
   ```

5. **Check database health**
   ```bash
   docker compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
   ```

## Resolution Steps

| Cause | Resolution |
|-------|-----------|
| Bad code deploy | Roll back immediately |
| DB connection pool exhausted | Restart service, check pool config |
| External API failure | Enable circuit breaker / fallback |
| Memory leak | Restart service, profile heap |
| Config error | Check env vars, restore from backup |

## Escalation
If error rate >20% for >10 minutes → declare incident, page team.
