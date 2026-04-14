#!/bin/bash
# Step 239: Test Alerts
# Banking Reconciliation Platform
# Fires test alerts to verify Alertmanager → Slack pipeline

ALERTMANAGER_URL="${ALERTMANAGER_URL:-http://localhost:9093}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Testing Alertmanager at $ALERTMANAGER_URL..."
echo ""

# Helper to fire a test alert
fire_alert() {
  local name="$1"
  local severity="$2"
  local category="$3"
  local summary="$4"

  echo "Firing test alert: $name ($severity)..."
  curl -s -X POST "$ALERTMANAGER_URL/api/v2/alerts" \
    -H "Content-Type: application/json" \
    -d "[{
      \"labels\": {
        \"alertname\": \"$name\",
        \"severity\": \"$severity\",
        \"category\": \"$category\",
        \"service\": \"auth-service\",
        \"cluster\": \"banking-reconciliation-local\",
        \"environment\": \"test\"
      },
      \"annotations\": {
        \"summary\": \"[TEST] $summary\",
        \"description\": \"This is a test alert fired at $TIMESTAMP. Safe to ignore.\",
        \"runbook\": \"This is a test — no action required\"
      },
      \"startsAt\": \"$TIMESTAMP\",
      \"endsAt\": \"$(date -u -d '+5 minutes' +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v+5M +"%Y-%m-%dT%H:%M:%SZ")\"
    }]" && echo " ✅ Sent" || echo " ❌ Failed"
}

# Test each severity level
fire_alert "TestCriticalAlert"  "critical"  "application" "Critical test alert"
sleep 1
fire_alert "TestWarningAlert"   "warning"   "performance" "Warning test alert"
sleep 1
fire_alert "TestSecurityAlert"  "critical"  "security"    "Security test alert"
sleep 1
fire_alert "TestBusinessAlert"  "warning"   "business"    "Business test alert"
sleep 1
fire_alert "TestInfoAlert"      "info"      "application" "Info test alert"

echo ""
echo "✅ Test alerts fired. Check:"
echo "   Alertmanager: $ALERTMANAGER_URL/#/alerts"
echo "   Slack channels: #alerts-critical, #alerts-warning, #security-alerts, #business-alerts, #alerts-info"
echo ""
echo "Alerts will auto-resolve in 5 minutes."
