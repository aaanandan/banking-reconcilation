// Step 272: Stress Testing — k6 script
// Banking Reconciliation SaaS Platform
//
// Run with:
//   k6 run stress-test.js
//
// Stress test: progressively increase load until system breaks
// Goal: identify breaking point, recovery behavior, error modes

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time_ms');

export const options = {
  // Stress test profile: ramp up aggressively to find breaking point
  stages: [
    { duration: '2m', target: 50 },      // Warm up to 50 VUs
    { duration: '3m', target: 100 },     // Moderate load
    { duration: '3m', target: 200 },     // Heavy load
    { duration: '3m', target: 400 },     // Stress load
    { duration: '3m', target: 600 },     // Breaking point
    { duration: '2m', target: 800 },     // Beyond breaking point
    { duration: '5m', target: 0 },       // Recovery: ramp down to 0 and observe
  ],

  // No strict thresholds — we want to see where it breaks
  thresholds: {
    'errors': ['rate<0.5'],  // Allow up to 50% error rate (we're stress testing to failure)
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const BILLING_URL = __ENV.BILLING_URL || 'http://localhost:3004';

export default function () {
  // Randomize workload pattern
  const scenario = Math.random();

  if (scenario < 0.33) {
    // Scenario 1: Auth workload (login attempts)
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({
        email: `stress-user-${__VU}@test.com`,
        password: 'StressTestPass123',
        tenantId: `stress-tenant-${__VU % 100}`, // 100 unique tenants
      }),
      { headers: { 'Content-Type': 'application/json' }, timeout: '10s' }
    );

    const success = check(loginRes, {
      'login responded': (r) => r.status > 0, // Any response (even error) is ok
    });

    errorRate.add(!success || loginRes.status >= 500);
    if (loginRes.timings.duration) {
      responseTime.add(loginRes.timings.duration);
    }
  } else if (scenario < 0.67) {
    // Scenario 2: Billing API workload (usage queries)
    const tenantId = `stress-tenant-${__VU % 100}`;
    const usageRes = http.get(`${BILLING_URL}/billing/usage/${tenantId}`, {
      timeout: '10s',
    });

    const success = check(usageRes, {
      'usage responded': (r) => r.status > 0,
    });

    errorRate.add(!success || usageRes.status >= 500);
    if (usageRes.timings.duration) {
      responseTime.add(usageRes.timings.duration);
    }
  } else {
    // Scenario 3: Mixed API calls (plans + quota check)
    const batch = http.batch([
      ['GET', `${BILLING_URL}/billing/plans`, null, { timeout: '10s' }],
      ['GET', `${BILLING_URL}/billing/quota/stress-tenant-${__VU}/transactions`, null, { timeout: '10s' }],
    ]);

    batch.forEach((res) => {
      const success = check(res, {
        'batch item responded': (r) => r.status > 0,
      });

      errorRate.add(!success || res.status >= 500);
      if (res.timings.duration) {
        responseTime.add(res.timings.duration);
      }
    });
  }

  sleep(0.1); // Minimal sleep — stress the system
}

export function handleSummary(data) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('STRESS TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Failed Requests: ${data.metrics.http_req_failed ? data.metrics.http_req_failed.values.passes : 0}`);
  console.log(`Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%`);
  console.log(`Response Time (p95): ${data.metrics.response_time_ms.values['p(95)'].toFixed(0)} ms`);
  console.log(`Response Time (p99): ${data.metrics.response_time_ms.values['p(99)'].toFixed(0)} ms`);
  console.log(`Response Time (max): ${data.metrics.response_time_ms.values.max.toFixed(0)} ms`);
  console.log('═══════════════════════════════════════════════════════════\n');

  return {
    'stress-test-summary.json': JSON.stringify(data, null, 2),
  };
}
