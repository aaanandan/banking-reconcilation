#!/bin/bash
# test-auth-registration.sh
# Test authentication registration endpoint

echo "=================================================="
echo "Testing Auth Service - Registration"
echo "=================================================="

# Test data
COMPANY_NAME="Test Corporation"
COMPANY_EMAIL="admin@testcorp.com"
USER_NAME="John Doe"
USER_EMAIL="john@testcorp.com"
PASSWORD="SecurePass123!"

echo ""
echo "Sending registration request..."
echo "Company: $COMPANY_NAME"
echo "Admin Email: $USER_EMAIL"
echo ""

# Make request
RESPONSE=$(curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"companyName\": \"$COMPANY_NAME\",
    \"companyEmail\": \"$COMPANY_EMAIL\",
    \"name\": \"$USER_NAME\",
    \"email\": \"USER_EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "Response:"
echo "$RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$RESPONSE" | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo ""
    echo "✅ Registration successful!"
    echo ""
    echo "JWT Token received:"
    echo "$TOKEN"
    echo ""

    # Decode JWT to show payload (base64 decode middle part)
    echo "JWT Payload (decoded):"
    echo "$TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq '.'
    echo ""

    # Save token for login test
    echo "$TOKEN" > /tmp/test-token.txt
    echo "Token saved to /tmp/test-token.txt"
else
    echo ""
    echo "❌ Registration failed!"
fi
