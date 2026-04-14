// Step 222: Prometheus Metrics for Auth Service
// Banking Reconciliation Platform - Custom Business Metrics

const client = require('prom-client');

// Enable default metrics (process, Node.js runtime metrics)
const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  labels: {
    app: 'auth-service',
    environment: process.env.NODE_ENV || 'development',
  },
});

// ── Authentication Metrics ──────────────────────────────────────────────────

const loginAttemptsCounter = new client.Counter({
  name: 'auth_login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['tenant_id', 'method'],
  registers: [register],
});

const loginSuccessCounter = new client.Counter({
  name: 'auth_login_success_total',
  help: 'Total number of successful logins',
  labelNames: ['tenant_id', 'method'],
  registers: [register],
});

const loginFailureCounter = new client.Counter({
  name: 'auth_login_failure_total',
  help: 'Total number of failed login attempts',
  labelNames: ['tenant_id', 'reason'],
  registers: [register],
});

const registrationCounter = new client.Counter({
  name: 'auth_registration_total',
  help: 'Total number of user registrations',
  labelNames: ['tenant_id', 'plan'],
  registers: [register],
});

// ── Tenant Metrics ──────────────────────────────────────────────────────────

const tenantsActiveGauge = new client.Gauge({
  name: 'tenants_active_total',
  help: 'Total number of active tenants',
  registers: [register],
});

const tenantsCreatedCounter = new client.Counter({
  name: 'tenants_created_total',
  help: 'Total number of tenants created',
  labelNames: ['plan'],
  registers: [register],
});

const tenantsSuspendedCounter = new client.Counter({
  name: 'tenants_suspended_total',
  help: 'Total number of tenants suspended',
  labelNames: ['reason'],
  registers: [register],
});

// ── Subscription Metrics ────────────────────────────────────────────────────

const subscriptionsActiveGauge = new client.Gauge({
  name: 'subscriptions_active_total',
  help: 'Total number of active subscriptions',
  labelNames: ['plan'],
  registers: [register],
});

const subscriptionsCreatedCounter = new client.Counter({
  name: 'subscriptions_created_total',
  help: 'Total number of subscriptions created',
  labelNames: ['plan'],
  registers: [register],
});

const subscriptionsCancelledCounter = new client.Counter({
  name: 'subscriptions_cancelled_total',
  help: 'Total number of subscriptions cancelled',
  labelNames: ['plan', 'reason'],
  registers: [register],
});

const subscriptionRevenueGauge = new client.Gauge({
  name: 'subscription_revenue_total',
  help: 'Total subscription revenue in cents',
  labelNames: ['plan', 'currency'],
  registers: [register],
});

// ── Security Metrics ────────────────────────────────────────────────────────

const twoFAEnabledGauge = new client.Gauge({
  name: 'security_2fa_enabled_total',
  help: 'Total number of users with 2FA enabled',
  registers: [register],
});

const passwordResetCounter = new client.Counter({
  name: 'security_password_reset_total',
  help: 'Total number of password resets',
  labelNames: ['tenant_id'],
  registers: [register],
});

const failed2FACounter = new client.Counter({
  name: 'security_failed_2fa_total',
  help: 'Total number of failed 2FA attempts',
  labelNames: ['tenant_id'],
  registers: [register],
});

// ── API Key Metrics ─────────────────────────────────────────────────────────

const apiKeysActiveGauge = new client.Gauge({
  name: 'api_keys_active_total',
  help: 'Total number of active API keys',
  labelNames: ['tenant_id'],
  registers: [register],
});

const apiKeyRequestsCounter = new client.Counter({
  name: 'api_key_requests_total',
  help: 'Total number of requests via API key',
  labelNames: ['tenant_id', 'api_key_id'],
  registers: [register],
});

// ── Webhook Metrics ─────────────────────────────────────────────────────────

const webhooksDeliveredCounter = new client.Counter({
  name: 'webhooks_delivered_total',
  help: 'Total number of webhooks delivered successfully',
  labelNames: ['tenant_id', 'event_type'],
  registers: [register],
});

const webhooksFailedCounter = new client.Counter({
  name: 'webhooks_failed_total',
  help: 'Total number of failed webhook deliveries',
  labelNames: ['tenant_id', 'event_type', 'reason'],
  registers: [register],
});

// ── Email Metrics ───────────────────────────────────────────────────────────

const emailsSentCounter = new client.Counter({
  name: 'emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['type'],
  registers: [register],
});

const emailsFailedCounter = new client.Counter({
  name: 'emails_failed_total',
  help: 'Total number of failed email deliveries',
  labelNames: ['type', 'reason'],
  registers: [register],
});

// ── HTTP Request Duration Histogram ────────────────────────────────────────

const httpRequestDurationHistogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'app'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// Seed initial gauge values for demo
tenantsActiveGauge.set(12);
subscriptionsActiveGauge.labels('starter').set(5);
subscriptionsActiveGauge.labels('professional').set(4);
subscriptionsActiveGauge.labels('enterprise').set(3);
twoFAEnabledGauge.set(8);
apiKeysActiveGauge.labels('demo').set(15);

module.exports = {
  register,
  loginAttemptsCounter,
  loginSuccessCounter,
  loginFailureCounter,
  registrationCounter,
  tenantsActiveGauge,
  tenantsCreatedCounter,
  tenantsSuspendedCounter,
  subscriptionsActiveGauge,
  subscriptionsCreatedCounter,
  subscriptionsCancelledCounter,
  subscriptionRevenueGauge,
  twoFAEnabledGauge,
  passwordResetCounter,
  failed2FACounter,
  apiKeysActiveGauge,
  apiKeyRequestsCounter,
  webhooksDeliveredCounter,
  webhooksFailedCounter,
  emailsSentCounter,
  emailsFailedCounter,
  httpRequestDurationHistogram,
};
