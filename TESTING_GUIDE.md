# 🧪 Banking Reconciliation Platform - Testing Guide

## Local Testing Instructions

This guide provides step-by-step instructions for testing all features of the Banking Reconciliation SaaS platform locally.

## Prerequisites Verification

Before testing, verify all prerequisites are installed:

```bash
# Check Node.js (should be 18+)
node --version

# Check npm
npm --version

# Check PostgreSQL (should be 15+)
psql --version

# Check Docker (optional for monitoring)
docker --version
docker-compose --version

# Check Git
git --version
```

**Expected versions:**
- Node.js: v18.x or higher
- npm: 9.x or higher
- PostgreSQL: 15.x or higher
- Docker: 20.x or higher

---

## 🚀 Quick Test (15 minutes)

### 1. Setup and Start Services

```bash
# Run the automated setup script
./quick-start.sh

# Start backend (Terminal 1)
cd banking-reconciliation-system
npm run start:dev

# Start frontend (Terminal 2)
cd banking-recon-frontend
npm run dev

# Start monitoring (Terminal 3 - optional)
docker-compose up -d
```

### 2. Test User Registration and Login

**Frontend Testing:**

1. Open browser to http://localhost:5173
2. Click "Sign Up"
3. Fill in registration form:
   - Company: "Test Corp"
   - Email: test@example.com
   - Password: Test123!@#
   - First Name: John
   - Last Name: Doe
   - Plan: Professional
4. Click "Register"
5. Should redirect to dashboard

**API Testing:**

```bash
# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api-test@example.com",
    "password": "Test123!@#",
    "firstName": "API",
    "lastName": "User",
    "companyName": "API Test Corp",
    "plan": "starter"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api-test@example.com",
    "password": "Test123!@#"
  }'

# Save the access_token from response for next steps
export TOKEN="<paste_token_here>"
```

### 3. Test File Upload

**Using Frontend:**

1. Login to http://localhost:5173
2. Click "New Reconciliation"
3. Enter name: "January 2026 Test"
4. Upload bank file (CSV format):
   ```csv
   Date,Description,Amount
   2026-01-15,Payment from Client A,1500.00
   2026-01-16,Vendor Payment,-750.50
   2026-01-17,Refund,200.00
   ```
5. Upload ledger file (CSV format):
   ```csv
   Date,Description,Amount
   2026-01-15,Invoice #1234,1500.00
   2026-01-16,Bill Payment,-750.50
   2026-01-17,Credit Note,200.00
   ```

**Using API:**

```bash
# Create sample files
cat > bank-test.csv << 'EOF'
Date,Description,Amount
2026-01-15,Payment from Client A,1500.00
2026-01-16,Vendor Payment,-750.50
2026-01-17,Refund,200.00
EOF

cat > ledger-test.csv << 'EOF'
Date,Description,Amount
2026-01-15,Invoice #1234,1500.00
2026-01-16,Bill Payment,-750.50
2026-01-17,Credit Note,200.00
EOF

# Create reconciliation
curl -X POST http://localhost:3004/api/reconciliations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Reconciliation",
    "description": "Testing via API"
  }'

# Save reconciliation ID
export RECON_ID="<paste_id_here>"

# Upload bank file
curl -X POST http://localhost:3003/api/bank-files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@bank-test.csv" \
  -F "reconciliationId=$RECON_ID"

# Upload ledger file
curl -X POST http://localhost:3003/api/ledger-files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@ledger-test.csv" \
  -F "reconciliationId=$RECON_ID"
```

### 4. Test Reconciliation Process

**Using Frontend:**

1. After uploading files, proceed to "Column Mapping"
2. Map columns:
   - Date → Date
   - Description → Description
   - Amount → Amount
3. Click "Next"
4. Select date range (optional) or use "Process All"
5. Click "Start Matching"
6. Wait for processing to complete
7. View results:
   - Matched transactions (green)
   - Unmatched transactions (yellow)
   - Suggested matches (blue)
8. Accept/reject suggestions
9. Download reconciliation report

**Using API:**

```bash
# Start matching process
curl -X POST http://localhost:3004/api/reconciliations/$RECON_ID/start-matching \
  -H "Authorization: Bearer $TOKEN"

# Check status
curl http://localhost:3004/api/reconciliations/$RECON_ID \
  -H "Authorization: Bearer $TOKEN"

# Get results
curl http://localhost:3004/api/reconciliations/$RECON_ID/results \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Test Dashboard Features

Visit http://localhost:5173/dashboard and verify:

- [ ] Total reconciliations count
- [ ] Pending reconciliations count
- [ ] Success rate percentage
- [ ] Recent reconciliations list
- [ ] Charts and graphs display correctly

---

## 🔐 Security Features Testing

### Test 1: Two-Factor Authentication (2FA)

```bash
# Enable 2FA
curl -X POST http://localhost:3001/api/auth/2fa/enable \
  -H "Authorization: Bearer $TOKEN"

# Response includes QR code and secret
# Scan with Google Authenticator or similar app

# Verify 2FA code
curl -X POST http://localhost:3001/api/auth/2fa/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "123456"
  }'
```

### Test 2: OAuth Login

**Frontend:**

1. Go to http://localhost:5173/login
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Should redirect to dashboard

### Test 3: API Key Management

```bash
# Create API key
curl -X POST http://localhost:3001/api/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test API Key",
    "expiresIn": 90
  }'

# Test API key usage
export API_KEY="<paste_key_here>"

curl http://localhost:3004/api/reconciliations \
  -H "X-API-Key: $API_KEY"
```

### Test 4: Audit Logging

```bash
# View audit logs
curl http://localhost:3001/api/audit-logs \
  -H "Authorization: Bearer $TOKEN"

# Filter by action
curl "http://localhost:3001/api/audit-logs?action=LOGIN" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 💳 Billing & Subscription Testing

### Test 1: View Plans

```bash
# Get available plans
curl http://localhost:3002/plans

# Expected response:
# - Free: $0/month
# - Starter: $49/month
# - Professional: $199/month
# - Enterprise: Custom
```

### Test 2: Subscription Management

**Frontend:**

1. Go to http://localhost:5173/billing
2. View current plan
3. Click "Upgrade Plan"
4. Select "Professional"
5. Enter test Stripe card: 4242 4242 4242 4242
6. Expiry: Any future date
7. CVC: Any 3 digits
8. Complete payment
9. Verify subscription upgraded

**API:**

```bash
# Create checkout session
curl -X POST http://localhost:3002/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "professional",
    "tenantId": "tenant_123"
  }'

# Cancel subscription
curl -X POST http://localhost:3002/cancel-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "sub_123"
  }'
```

### Test 3: Quota Enforcement

```bash
# Check current usage
curl http://localhost:3001/api/tenants/quota \
  -H "Authorization: Bearer $TOKEN"

# Test quota limit
# Upload transactions exceeding quota
# Should receive 403 error when limit reached
```

---

## 📊 Monitoring & Observability Testing

### Test 1: Prometheus Metrics

Visit http://localhost:9090 and query:

```promql
# Login attempts
auth_login_attempts_total

# Success rate
rate(auth_login_success_total[5m]) / rate(auth_login_attempts_total[5m])

# Active tenants
tenants_active_total

# API request duration
http_request_duration_seconds_bucket
```

### Test 2: Grafana Dashboards

1. Open http://localhost:3000
2. Login with admin/admin
3. Navigate to dashboards
4. View:
   - System Overview Dashboard
   - Authentication Metrics
   - Business Metrics
   - Error Tracking

### Test 3: Kibana Logs

1. Open http://localhost:5601
2. Go to "Discover"
3. Search for logs:
   ```
   level: "error"
   tenantId: "tenant_123"
   requestId: *
   ```
4. Create visualizations
5. Build custom dashboards

### Test 4: Jaeger Tracing

1. Open http://localhost:16686
2. Select service: "auth-service"
3. Find traces
4. View request flow across services
5. Analyze latency

### Test 5: Sentry Error Tracking

```bash
# Trigger error to test Sentry
curl http://localhost:3001/api/test-error \
  -H "Authorization: Bearer $TOKEN"

# Check Sentry dashboard for error report
```

---

## 🔬 Advanced Feature Testing

### Test 1: Matching Algorithms

Test each matching service individually:

```bash
# MT-01: Exact Match
curl -X POST http://localhost:3010/api/match \
  -H "Content-Type: application/json" \
  -d '{
    "bankTransactions": [...],
    "ledgerTransactions": [...]
  }'

# MT-02: Near-Exact Match
curl -X POST http://localhost:3011/api/match \
  -H "Content-Type: application/json" \
  -d '{
    "bankTransactions": [...],
    "ledgerTransactions": [...],
    "tolerance": 0.01
  }'

# Continue for MT-03 through MT-16
```

### Test 2: Learning System

```bash
# View learned patterns
curl http://localhost:3006/api/patterns \
  -H "Authorization: Bearer $TOKEN"

# View entity profiles
curl http://localhost:3006/api/entity-profiles \
  -H "Authorization: Bearer $TOKEN"

# Submit feedback
curl -X POST http://localhost:3006/api/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "match_123",
    "decision": "accept",
    "reason": "Correct match"
  }'
```

### Test 3: Webhook System

```bash
# Create webhook
curl -X POST http://localhost:3001/api/webhooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://webhook.site/your-unique-url",
    "events": ["reconciliation.completed", "match.found"],
    "secret": "webhook_secret_123"
  }'

# Trigger event and check webhook.site for delivery
```

### Test 4: Email Notifications

```bash
# Send test email
curl -X POST http://localhost:3001/api/email/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "template": "reconciliation-complete"
  }'
```

---

## 🧪 Automated Testing

### Backend Tests

```bash
cd banking-reconciliation-system

# Run all tests
npm test

# Run specific test suites
npm test -- tenant-isolation.test.ts
npm test -- jwt-authentication.test.ts
npm test -- quota-enforcement.test.ts
npm test -- security-audit.test.ts

# Run with coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

### Frontend Tests

```bash
cd banking-recon-frontend

# Run all tests
npm test

# Run specific test
npm test -- Login.test.tsx

# Run with coverage
npm run test:coverage

# Run E2E tests (Cypress)
npm run cypress:open
```

### Billing Service Tests

```bash
cd services/billing-service

# Run all 47 tests
npm test

# Test specific feature
npm test -- stripe-integration.test.js
npm test -- subscription-management.test.js
```

---

## 📋 Test Checklist

### Core Functionality
- [ ] User registration works
- [ ] Login with email/password works
- [ ] JWT tokens are issued correctly
- [ ] Dashboard loads and displays data
- [ ] File upload (bank and ledger) works
- [ ] Column mapping interface works
- [ ] Date range selection works
- [ ] Matching process runs successfully
- [ ] Results display correctly
- [ ] Manual matching works
- [ ] Export/download reports works

### Security
- [ ] 2FA enrollment works
- [ ] 2FA verification works
- [ ] OAuth (Google) login works
- [ ] OAuth (Microsoft) login works
- [ ] API key creation works
- [ ] API key authentication works
- [ ] Audit logs are created
- [ ] Rate limiting prevents abuse
- [ ] Invalid tokens are rejected
- [ ] CORS is configured correctly

### Multi-Tenancy
- [ ] Tenant isolation is enforced
- [ ] Users can only see their tenant's data
- [ ] Quota limits are enforced
- [ ] Each tenant has separate database records
- [ ] Cross-tenant access is prevented

### Billing
- [ ] Plans display correctly
- [ ] Checkout flow works (test mode)
- [ ] Subscription creation works
- [ ] Subscription upgrades work
- [ ] Subscription downgrades work
- [ ] Subscription cancellation works
- [ ] Invoice generation works
- [ ] Payment webhooks are processed

### Monitoring
- [ ] Prometheus collects metrics
- [ ] Grafana dashboards display
- [ ] Alerts fire correctly
- [ ] Logs appear in Kibana
- [ ] Traces appear in Jaeger
- [ ] Errors appear in Sentry
- [ ] Slack notifications work (if configured)

### Matching Algorithms
- [ ] MT-01 (Exact) finds matches
- [ ] MT-02 (Near-exact) finds matches
- [ ] MT-03 (Grouping) works
- [ ] MT-04 (One-to-many) works
- [ ] All 16 algorithms process correctly
- [ ] Match scores are reasonable
- [ ] Learning improves over time

### Advanced Features
- [ ] Webhooks deliver events
- [ ] Email notifications send
- [ ] Feature flags toggle correctly
- [ ] Admin dashboard shows system stats
- [ ] Onboarding flow works for new users
- [ ] Analytics track properly

---

## 🐛 Common Test Issues

### Issue 1: Backend won't start

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start it if needed
sudo systemctl start postgresql

# Verify database exists
psql -U postgres -l | grep banking_reconciliation
```

### Issue 2: Frontend can't connect to backend

**Symptoms:**
```
Network Error
```

**Solution:**
```bash
# Verify backend is running
curl http://localhost:3001/api/health

# Check .env.local has correct URL
cat banking-recon-frontend/.env.local

# Check CORS is enabled
# File: apps/auth-service/src/main.ts
# Should have: app.enableCors()
```

### Issue 3: Tests fail

**Symptoms:**
```
Test suite failed to run
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Run tests again
npm test
```

### Issue 4: Monitoring stack won't start

**Symptoms:**
```
ERROR: for elasticsearch  Cannot start service
```

**Solution:**
```bash
# Increase Docker memory
# Docker Desktop → Settings → Resources → 4GB+

# On Linux
sudo sysctl -w vm.max_map_count=262144

# Restart Docker
docker-compose down
docker-compose up -d
```

---

## 📊 Performance Testing

### Load Testing with Artillery

```bash
# Install Artillery
npm install -g artillery

# Create test script
cat > load-test.yml << 'EOF'
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
      - post:
          url: '/api/auth/login'
          json:
            email: 'test@example.com'
            password: 'Test123!@#'
EOF

# Run load test
artillery run load-test.yml
```

### Expected Performance

- **Authentication:** < 100ms (p95)
- **File Upload (1MB):** < 500ms
- **Matching (100 transactions):** < 2s
- **Matching (1000 transactions):** < 10s
- **API Response:** < 200ms (p95)

---

## ✅ Test Report Template

After testing, document results:

```markdown
# Test Report - [Date]

## Test Environment
- Node.js: [version]
- PostgreSQL: [version]
- Docker: [version]
- OS: [OS version]

## Test Results

### Functional Tests
- User Registration: ✅ PASS
- Login: ✅ PASS
- File Upload: ✅ PASS
- Matching: ✅ PASS
- [Add more...]

### Performance Tests
- Auth Response Time: [X]ms
- File Upload Time: [X]ms
- Matching Time: [X]s

### Security Tests
- JWT Validation: ✅ PASS
- Tenant Isolation: ✅ PASS
- [Add more...]

## Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Status: Open/Fixed
   - Steps to reproduce:
   
## Recommendations
- [Recommendation 1]
- [Recommendation 2]
```

---

## 🎯 Next Steps After Testing

1. **Production Deployment**
   - See [Production Deployment Guide](./docs/deployment/production-deployment.md)

2. **Security Hardening**
   - Review [Security Checklist](./SECURITY_VULNERABILITY_CHECKLIST.md)

3. **Performance Optimization**
   - Enable caching
   - Set up CDN
   - Optimize database queries

4. **Monitoring Setup**
   - Configure production alerts
   - Set up on-call rotation
   - Create runbooks

---

**Testing completed successfully? Great! Your platform is ready for production! 🚀**
