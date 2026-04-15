// Step 271: Load Testing — k6 script
// Banking Reconciliation SaaS Platform
//
// Run with:
//   k6 run --vus 100 --duration 10m load-test.js
//
// Or with custom thresholds:
//   k6 run --vus 50 --duration 5m --thresholds http_req_duration=p(95)<2000 load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ─────────────────────────────────────────────────────────────────────────────
// Custom Metrics
// ─────────────────────────────────────────────────────────────────────────────
const loginSuccessRate = new Rate('login_success_rate');
const apiResponseTime = new Trend('api_response_time');
const apiErrorRate = new Rate('api_error_rate');
const billingSummaryErrors = new Counter('billing_summary_errors');

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────
export const options = {
  // Load profile: ramp up to 100 VUs over 2 minutes, sustain for 8 minutes, ramp down
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 concurrent users
    { duration: '8m', target: 100 },   // Sustain 100 users for 8 minutes
    { duration: '1m', target: 0 },     // Ramp down
  ],

  // Thresholds — test fails if any threshold is breached
  thresholds: {
    'http_req_duration': ['p(95)<2000'],       // 95% of requests < 2s
    'http_req_failed': ['rate<0.01'],          // <1% error rate
    'login_success_rate': ['rate>0.95'],       // >95% successful logins
    'api_error_rate': ['rate<0.02'],           // <2% API errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const BILLING_URL = __ENV.BILLING_URL || 'http://localhost:3004';

// ─────────────────────────────────────────────────────────────────────────────
// Test Scenario
// ─────────────────────────────────────────────────────────────────────────────
export default function () {
  // ───────────────────────────────────────────────
  // 1. Health Check
  // ───────────────────────────────────────────────
  let healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check status 200': (r) => r.status === 200,
    'health check returns ok': (r) => JSON.parse(r.body).status === 'ok',
  });

  sleep(0.5);

  // ───────────────────────────────────────────────
  // 2. User Login
  // ───────────────────────────────────────────────
  const tenantId = `tenant-load-test-${__VU}`;
  const loginPayload = JSON.stringify({
    email: `user${__VU}@loadtest.com`,
    password: 'TestPassword123',
    tenantId: tenantId,
  });

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginSuccess = check(loginRes, {
    'login status 200 or 401': (r) => [200, 401].includes(r.status), // 401 is ok (user doesn't exist in test)
  });

  loginSuccessRate.add(loginSuccess);
  apiResponseTime.add(loginRes.timings.duration);

  if (loginRes.status !== 200) {
    apiErrorRate.add(1);
  } else {
    apiErrorRate.add(0);
  }

  sleep(1);

  // ───────────────────────────────────────────────
  // 3. User Registration (fallback if login failed)
  // ───────────────────────────────────────────────
  if (loginRes.status === 401) {
    const registerPayload = JSON.stringify({
      email: `user${__VU}@loadtest.com`,
      password: 'TestPassword123',
      name: `Load Test User ${__VU}`,
      tenantId: tenantId,
    });

    const registerRes = http.post(`${BASE_URL}/auth/register`, registerPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(registerRes, {
      'register status 200 or 409': (r) => [200, 409].includes(r.status), // 409 = already exists
    });

    apiResponseTime.add(registerRes.timings.duration);
  }

  sleep(1);

  // ───────────────────────────────────────────────
  // 4. Billing — Get Pricing Plans
  // ───────────────────────────────────────────────
  const plansRes = http.get(`${BILLING_URL}/billing/plans`);
  check(plansRes, {
    'plans status 200': (r) => r.status === 200,
    'plans return 4 tiers': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Object.keys(body.plans || {}).length >= 4;
      } catch {
        return false;
      }
    },
  });

  apiResponseTime.add(plansRes.timings.duration);

  sleep(1);

  // ───────────────────────────────────────────────
  // 5. Billing — Get Usage Summary
  // ───────────────────────────────────────────────
  const usageRes = http.get(`${BILLING_URL}/billing/usage/${tenantId}`);
  const usageSuccess = check(usageRes, {
    'usage status 200': (r) => r.status === 200,
    'usage has plan field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.plan === 'string';
      } catch {
        return false;
      }
    },
  });

  if (!usageSuccess) {
    billingSummaryErrors.add(1);
  }

  apiResponseTime.add(usageRes.timings.duration);

  sleep(1);

  // ───────────────────────────────────────────────
  // 6. Billing — Check Quota
  // ───────────────────────────────────────────────
  const quotaRes = http.get(`${BILLING_URL}/billing/quota/${tenantId}/transactions`);
  check(quotaRes, {
    'quota status 200': (r) => r.status === 200,
    'quota returns allowed field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.allowed === 'boolean';
      } catch {
        return false;
      }
    },
  });

  apiResponseTime.add(quotaRes.timings.duration);

  sleep(2);

  // ───────────────────────────────────────────────
  // 7. Prometheus Metrics Endpoint
  // ───────────────────────────────────────────────
  const metricsRes = http.get(`${BASE_URL}/metrics`);
  check(metricsRes, {
    'metrics status 200': (r) => r.status === 200,
    'metrics return Prometheus format': (r) => r.body.includes('# HELP'),
  });

  sleep(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Teardown (runs once after test completion)
// ─────────────────────────────────────────────────────────────────────────────
export function teardown(data) {
  console.log('Load test complete. Review summary above.');
}
