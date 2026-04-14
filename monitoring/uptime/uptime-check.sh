#!/bin/bash
# Step 236: Uptime Monitoring
# Banking Reconciliation Platform
# Checks all service health endpoints and logs results

SERVICES=(
  "auth-service|http://localhost:3001/health"
  "prometheus|http://localhost:9090/-/healthy"
  "grafana|http://localhost:3000/api/health"
  "alertmanager|http://localhost:9093/-/healthy"
  "kibana|http://localhost:5601/api/status"
  "elasticsearch|http://localhost:9200/_cluster/health"
  "jaeger|http://localhost:16686/"
)

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ALL_HEALTHY=true

echo "[$TIMESTAMP] Uptime check:"

for ENTRY in "${SERVICES[@]}"; do
  NAME="${ENTRY%%|*}"
  URL="${ENTRY##*|}"

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$URL" 2>/dev/null)
  LATENCY=$(curl -s -o /dev/null -w "%{time_total}" --max-time 5 "$URL" 2>/dev/null)

  if [[ "$HTTP_CODE" =~ ^(200|204)$ ]]; then
    STATUS="UP"
  else
    STATUS="DOWN (HTTP $HTTP_CODE)"
    ALL_HEALTHY=false
  fi

  printf "  %-20s %s  (%.3fs)\n" "$NAME" "$STATUS" "$LATENCY"
done

if $ALL_HEALTHY; then
  echo "[$TIMESTAMP] All services healthy."
  exit 0
else
  echo "[$TIMESTAMP] WARNING: One or more services are DOWN."
  exit 1
fi
