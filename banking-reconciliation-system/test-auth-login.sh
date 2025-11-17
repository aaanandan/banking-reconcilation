#!/bin/bash
# test-auth-login.sh
# Test authentication login endpoint

echo "=================================================="
echo "Testing Auth Service - Login"
echo "=================================================="

# Test credentials
USER_EMAIL="john@testcorp.com"
PASSWORD="SecurePass123!"

echo ""
echo "Sending login request..."
echo "Email: $USER_EMAIL"
echo ""

# Make request
RESPONSE=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "Response:"
echo "$RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$RESPONSE" | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo ""
    echo "✅ Login successful!"
    echo ""
    echo "JWT Token received:"
    echo "$TOKEN"
    echo ""

    # Decode JWT to show payload
    echo "JWT Payload (decoded):"
    JWT_PAYLOAD=$(echo "$TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq '.')
    echo "$JWT_PAYLOAD"
    echo ""

    # Verify tenantId is present
    TENANT_ID=$(echo "$JWT_PAYLOAD" | jq -r '.tenantId')
    USER_ID=$(echo "$JWT_PAYLOAD" | jq -r '.userId')
    ROLE=$(echo "$JWT_PAYLOAD" | jq -r '.role')

    echo "Verification:"
    echo "  ✅ tenantId: $TENANT_ID"
    echo "  ✅ userId: $USER_ID"
    echo "  ✅ role: $ROLE"
    echo ""

    # Save token for authenticated requests
    echo "$TOKEN" > /tmp/auth-token.txt
    echo "Token saved to /tmp/auth-token.txt"
else
    echo ""
    echo "❌ Login failed!"
fi
