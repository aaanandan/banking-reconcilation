# Runbook: High Login Failure Rate / Suspicious Activity
**Step 232 — Create Runbooks**

## Alerts
- `HighLoginFailureRate` — failure rate >20% for 5 minutes
- `SuspiciousLoginActivity` — >10 failures/second for 2 minutes

## Severity
**Warning / Critical**

## Diagnosis Steps

1. **Check Auth Security dashboard in Grafana**
   - Top Tenants by Failed Logins panel
   - Login Activity timeseries

2. **Identify attacking IPs in Kibana**
   ```
   service: auth-service AND log_message: "Invalid credentials"
   ```
   Group by `req.ip`

3. **Check if specific tenants are targeted**
   - Grafana: filter by tenant_id

## Resolution Steps

| Scenario | Resolution |
|----------|-----------|
| Brute-force attack | Add rate limiting (express-rate-limit) |
| Credential stuffing | Enable CAPTCHA, alert affected tenants |
| Legitimate spike | Investigate with tenant, check for automation |
| Internal test | Whitelist test IPs, adjust alert threshold |

## Escalation
If >100 failures/second → block at WAF level, page security team.
