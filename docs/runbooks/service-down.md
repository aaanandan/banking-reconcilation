# Runbook: Service Down
**Step 232 — Create Runbooks**

## Alert
`ServiceDown` — a banking service has been unreachable for >1 minute.

## Severity
**Critical**

## Symptoms
- Prometheus alert firing: `up{job="auth-service"} == 0`
- Grafana System Overview shows service offline
- Users receiving 502/503 errors

## Diagnosis Steps

1. **Check service status**
   ```bash
   # Check Docker containers
   docker compose ps
   # Check logs
   docker compose logs auth-service --tail=100
   # Check process on host
   ps aux | grep node
   ```

2. **Check resource usage**
   ```bash
   docker stats --no-stream
   free -h
   df -h
   ```

3. **Check application logs in Kibana**
   - Open http://localhost:5601
   - Filter: `service: auth-service AND log_level: error`
   - Look for OOM, port conflicts, crash loops

4. **Check Sentry for recent errors**
   - Open https://sentry.io → banking-reconciliation project
   - Filter by service and last 30 minutes

## Resolution Steps

| Cause | Resolution |
|-------|-----------|
| Process crashed | `docker compose restart auth-service` |
| Port conflict | `lsof -i :3001` → kill conflicting process |
| OOM killed | Increase memory limit in docker-compose.yml |
| Bad deployment | Roll back: `git revert HEAD && git push` |
| DB connection | Check postgres is running: `docker compose ps postgres` |

## Escalation
If unresolved in 15 minutes → page on-call engineer.
