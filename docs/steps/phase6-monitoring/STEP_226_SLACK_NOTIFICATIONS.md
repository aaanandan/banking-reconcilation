# Step 226: Configure Slack Notifications in Alertmanager

## Overview

Integrate Alertmanager with Slack to receive real-time notifications for alerts with proper formatting, routing, and escalation.

## Slack Workspace Setup

### 1. Create Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: "Banking Reconciliation Alerts"
4. Select your workspace

### 2. Create Incoming Webhooks

Create separate webhooks for different alert channels:

**Channels to create:**
- `#alerts-critical` - Critical production alerts
- `#alerts-security` - Security-related alerts
- `#alerts-business` - Business metrics alerts
- `#alerts-ops` - Operations and warnings
- `#alerts-info` - Informational alerts

**For each channel:**
1. In Slack app settings → "Incoming Webhooks"
2. Click "Add New Webhook to Workspace"
3. Select the channel
4. Copy the webhook URL

### 3. Store Webhook URLs Securely

```bash
# Create environment file for Alertmanager
cat > monitoring/prometheus/.env.alertmanager << 'EOF'
SLACK_WEBHOOK_CRITICAL=https://hooks.slack.com/services/YOUR/CRITICAL/WEBHOOK
SLACK_WEBHOOK_SECURITY=https://hooks.slack.com/services/YOUR/SECURITY/WEBHOOK
SLACK_WEBHOOK_BUSINESS=https://hooks.slack.com/services/YOUR/BUSINESS/WEBHOOK
SLACK_WEBHOOK_OPS=https://hooks.slack.com/services/YOUR/OPS/WEBHOOK
SLACK_WEBHOOK_INFO=https://hooks.slack.com/services/YOUR/INFO/WEBHOOK
EOF

# Add to .gitignore
echo "monitoring/prometheus/.env.alertmanager" >> .gitignore
```

## Alertmanager Slack Configuration

### 1. Update Alertmanager Configuration

Update `monitoring/prometheus/alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services'

# Templates for Slack messages
templates:
  - '/etc/alertmanager/templates/*.tmpl'

route:
  group_by: ['alertname', 'severity', 'category']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  
  routes:
    # Critical alerts → Slack + PagerDuty
    - match:
        severity: critical
      receiver: 'critical-alerts'
      group_wait: 0s
      repeat_interval: 5m
      continue: true
      
    # Security alerts → Security team
    - match:
        category: security
      receiver: 'security-team'
      group_wait: 0s
      repeat_interval: 15m
      
    # Business alerts → Business team (business hours only)
    - match:
        category: business
      receiver: 'business-team'
      group_interval: 1h
      repeat_interval: 24h
      
    # Operations alerts
    - match:
        severity: warning
      receiver: 'ops-team'
      repeat_interval: 4h
      
    # Info alerts
    - match:
        severity: info
      receiver: 'info-alerts'
      repeat_interval: 24h

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#alerts-ops'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'critical-alerts'
    slack_configs:
      - channel: '#alerts-critical'
        username: 'Banking Recon Alerts'
        icon_emoji: ':rotating_light:'
        color: 'danger'
        title: ':rotating_light: CRITICAL ALERT :rotating_light:'
        title_link: 'http://localhost:9093'
        pretext: '<!channel> Critical alert requires immediate attention'
        text: |-
          {{ range .Alerts }}
          *Alert:* {{ .Labels.alertname }}
          *Severity:* {{ .Labels.severity }}
          *Summary:* {{ .Annotations.summary }}
          *Description:* {{ .Annotations.description }}
          {{ if .Annotations.runbook_url }}*Runbook:* {{ .Annotations.runbook_url }}{{ end }}
          *Started:* {{ .StartsAt.Format "2006-01-02 15:04:05 MST" }}
          {{ end }}
        actions:
          - type: button
            text: 'View in Prometheus :chart_with_upwards_trend:'
            url: 'http://localhost:9090/alerts'
          - type: button
            text: 'View in Grafana :bar_chart:'
            url: 'http://localhost:3000'
        short_fields: false

  - name: 'security-team'
    slack_configs:
      - channel: '#alerts-security'
        username: 'Security Alerts'
        icon_emoji: ':shield:'
        color: '#FF0000'
        title: ':shield: Security Alert'
        pretext: '<!here> Security event detected'
        text: |-
          {{ range .Alerts }}
          *Alert:* {{ .Labels.alertname }}
          *Category:* {{ .Labels.category }}
          *Summary:* {{ .Annotations.summary }}
          *Description:* {{ .Annotations.description }}
          {{ if .Labels.tenant_id }}*Tenant:* {{ .Labels.tenant_id }}{{ end }}
          {{ if .Annotations.action }}*Action Required:* {{ .Annotations.action }}{{ end }}
          {{ end }}

  - name: 'business-team'
    slack_configs:
      - channel: '#alerts-business'
        username: 'Business Metrics'
        icon_emoji: ':chart_with_downwards_trend:'
        color: 'warning'
        title: 'Business Metric Alert'
        text: |-
          {{ range .Alerts }}
          *Metric:* {{ .Labels.alertname }}
          *Summary:* {{ .Annotations.summary }}
          *Details:* {{ .Annotations.description }}
          {{ end }}

  - name: 'ops-team'
    slack_configs:
      - channel: '#alerts-ops'
        username: 'Operations'
        icon_emoji: ':wrench:'
        color: 'warning'
        title: 'Operations Alert'
        text: |-
          {{ range .Alerts }}
          *Alert:* {{ .Labels.alertname }}
          *Service:* {{ .Labels.job }}
          *Summary:* {{ .Annotations.summary }}
          *Description:* {{ .Annotations.description }}
          {{ end }}

  - name: 'info-alerts'
    slack_configs:
      - channel: '#alerts-info'
        username: 'Info Alerts'
        icon_emoji: ':information_source:'
        color: 'good'
        title: 'Information'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

### 2. Create Slack Message Templates

Create `monitoring/prometheus/templates/slack.tmpl`:

```gotmpl
{{ define "slack.title" }}
[{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}] {{ .GroupLabels.SortedPairs.Values | join " " }}
{{ end }}

{{ define "slack.text" }}
{{ range .Alerts }}
{{ if .Annotations.summary }}*Summary:* {{ .Annotations.summary }}{{ end }}
{{ if .Annotations.description }}*Description:* {{ .Annotations.description }}{{ end }}
*Details:*
{{ range .Labels.SortedPairs }} • *{{ .Name }}:* `{{ .Value }}`
{{ end }}
{{ if .Annotations.runbook_url }}*Runbook:* {{ .Annotations.runbook_url }}{{ end }}
{{ end }}
{{ end }}

{{ define "slack.color" }}
{{ if eq .Status "firing" }}
  {{ if eq .CommonLabels.severity "critical" }}danger{{ else if eq .CommonLabels.severity "warning" }}warning{{ else }}good{{ end }}
{{ else }}good{{ end }}
{{ end }}
```

## Docker Compose Integration

### Update docker-compose.yml

```yaml
services:
  alertmanager:
    image: prom/alertmanager:v0.26.0
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/prometheus/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - ./monitoring/prometheus/templates:/etc/alertmanager/templates
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
    restart: unless-stopped
    networks:
      - monitoring

volumes:
  alertmanager-data:

networks:
  monitoring:
    driver: bridge
```

## Testing Slack Notifications

### 1. Test Alert Sending

```bash
# Send test alert via amtool
docker exec -it alertmanager amtool alert add \
  test_alert \
  alertname=TestAlert \
  severity=warning \
  summary="This is a test alert" \
  description="Testing Slack integration"

# Check alert status
docker exec -it alertmanager amtool alert query
```

### 2. Manual Webhook Test

```bash
# Test critical alert webhook
curl -X POST "${SLACK_WEBHOOK_CRITICAL}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "🔴 Test Critical Alert",
    "attachments": [{
      "color": "danger",
      "title": "Test Alert",
      "text": "This is a test of the critical alerts channel",
      "footer": "Banking Reconciliation Monitoring"
    }]
  }'
```

### 3. Verify Alert Routing

Create test script `monitoring/test-slack-alerts.sh`:

```bash
#!/bin/bash

echo "Testing Slack alert routing..."

# Test critical alert
echo "1. Testing critical alert..."
docker exec prometheus promtool push metrics \
  localhost:9090 <<EOF
test_metric{severity="critical"} 1
EOF

# Test security alert
echo "2. Testing security alert..."
docker exec prometheus promtool push metrics \
  localhost:9090 <<EOF
auth_login_failure_total{tenant_id="test"} 100
EOF

# Test business alert
echo "3. Testing business alert..."
docker exec prometheus promtool push metrics \
  localhost:9090 <<EOF
subscriptions_cancelled_total 50
EOF

echo ""
echo "Check Slack channels for alerts:"
echo "  - #alerts-critical"
echo "  - #alerts-security"
echo "  - #alerts-business"
```

## Slack Best Practices

### Channel Organization

```
#alerts-critical     → P0/P1 incidents, requires immediate action
#alerts-security     → Security events, potential threats
#alerts-business     → Revenue, churn, usage patterns
#alerts-ops          → Warnings, performance, resource usage
#alerts-info         → Deployments, config changes, FYI
#alerts-resolved     → Archive of resolved alerts
```

### Notification Guidelines

**Critical Alerts:**
- Use `<!channel>` mention
- Include direct links to dashboards
- Add runbook URLs
- Repeat every 5 minutes until resolved

**Security Alerts:**
- Use `<!here>` mention
- Include tenant/user context
- Provide recommended actions
- Notify immediately

**Business Alerts:**
- No mentions (DM oncall person)
- Send during business hours
- Include trend analysis
- Repeat every 24 hours

### Message Formatting Tips

```
✅ Good: "[CRITICAL] Auth Service Down - 50 users affected"
❌ Bad: "Alert: up{job='auth-service'} == 0"

✅ Good: "High failed logins (125/min) from IP 1.2.3.4 - Possible attack"
❌ Bad: "rate(auth_login_failure_total[1m]) > 50"

✅ Good: "Subscription cancellations up 200% (15 today vs 5 avg)"
❌ Bad: "subscriptions_cancelled_total alert"
```

## Troubleshooting

### Alerts Not Appearing in Slack

1. Check Alertmanager logs:
```bash
docker logs alertmanager
```

2. Verify webhook URL:
```bash
# Test webhook directly
curl -X POST $SLACK_WEBHOOK_CRITICAL \
  -H "Content-Type: application/json" \
  -d '{"text":"Test"}'
```

3. Check Alertmanager UI:
```
http://localhost:9093
```

### Wrong Channel Routing

1. Check alert labels match route matchers
2. Verify receiver configuration
3. Test with `amtool config routes test`

## Verification Checklist

- [ ] Slack app created and configured
- [ ] Webhook URLs created for all channels
- [ ] Alertmanager configuration updated
- [ ] Message templates created
- [ ] Docker Compose updated
- [ ] Test alerts sent successfully
- [ ] Alerts appear in correct channels
- [ ] Message formatting looks good
- [ ] Links in messages work
- [ ] Critical alerts use @channel
- [ ] Resolved alerts clear properly

## Next Steps

- **Step 227**: Deploy ELK Stack for centralized logging
- **Step 232**: Create detailed runbooks linked from alerts
- **Step 233**: Set up on-call rotation in Slack

## Resources

- Alertmanager Slack Config: https://prometheus.io/docs/alerting/latest/configuration/#slack_config
- Slack Incoming Webhooks: https://api.slack.com/messaging/webhooks
- Message Formatting: https://api.slack.com/reference/surfaces/formatting

---

**Status**: ✅ Slack notifications configured  
**Next**: Step 227 - ELK Stack Deployment
