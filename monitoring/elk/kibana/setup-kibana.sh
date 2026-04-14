#!/bin/bash
# Step 229: Import Kibana dashboards and index patterns
# Run after Kibana is healthy: ./setup-kibana.sh

KIBANA_URL="${KIBANA_URL:-http://localhost:5601}"
MAX_RETRIES=30
RETRY_INTERVAL=10

echo "Waiting for Kibana to be ready at $KIBANA_URL..."
for i in $(seq 1 $MAX_RETRIES); do
  STATUS=$(curl -s "$KIBANA_URL/api/status" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',{}).get('overall',{}).get('level','unknown'))" 2>/dev/null)
  if [ "$STATUS" = "available" ]; then
    echo "Kibana is ready."
    break
  fi
  echo "  Attempt $i/$MAX_RETRIES — status: $STATUS. Retrying in ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "Importing index patterns..."
curl -s -X POST "$KIBANA_URL/api/saved_objects/_import?overwrite=true" \
  -H "kbn-xsrf: true" \
  -F "file=@$SCRIPT_DIR/index-patterns/banking-logs.json" | python3 -c "import sys,json; d=json.load(sys.stdin); print('  Index patterns:', 'OK' if not d.get('errors') else d)"

echo ""
echo "Importing dashboards..."
for NDJSON in "$SCRIPT_DIR/dashboards/"*.ndjson; do
  NAME=$(basename "$NDJSON" .ndjson)
  RESULT=$(curl -s -X POST "$KIBANA_URL/api/saved_objects/_import?overwrite=true" \
    -H "kbn-xsrf: true" \
    -F "file=@$NDJSON")
  SUCCESS=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(not d.get('errors',True))" 2>/dev/null)
  echo "  $NAME: $SUCCESS"
done

echo ""
echo "Kibana setup complete."
echo "Access Kibana at: $KIBANA_URL"
echo ""
echo "Dashboards available:"
echo "  - Service Logs Overview:  $KIBANA_URL/app/dashboards#/view/service-logs-overview"
echo "  - Error Tracking:         $KIBANA_URL/app/dashboards#/view/error-tracking"
echo "  - Auth Service Logs:      $KIBANA_URL/app/dashboards#/view/auth-service-logs"
