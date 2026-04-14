// Step 222: Auth Service with Prometheus metrics endpoint
// Step 228: Structured JSON logging for ELK forwarding
// Step 230: Sentry error tracking
// Step 231: Distributed tracing (OpenTelemetry + Jaeger)
// Banking Reconciliation Platform

// Tracing must be initialised before all other requires
const { initTracing, tracingMiddleware } = require('../../monitoring/tracing/tracer');
initTracing();

const express = require('express');
const logger = require('./logger/logger');
const { initSentry, sentryRequestHandler, sentryErrorHandler, captureException } = require('../../monitoring/sentry/sentry');
const {
  register,
  loginAttemptsCounter,
  loginSuccessCounter,
  loginFailureCounter,
  registrationCounter,
  tenantsCreatedCounter,
  subscriptionsCreatedCounter,
  webhooksDeliveredCounter,
  emailsSentCounter,
  httpRequestDurationHistogram,
} = require('./metrics');

// Initialise Sentry before express app (Step 230)
initSentry();

const app = express();
const PORT = process.env.PORT || 3001;

// Sentry request handler — must be first middleware
app.use(sentryRequestHandler());
// Distributed tracing middleware — adds X-Trace-Id / X-Span-Id headers (Step 231)
app.use(tracingMiddleware());
app.use(express.json());

// Structured JSON request logging (Step 228 — feeds Filebeat → Logstash → ES)
app.use(logger.httpMiddleware());

// HTTP request duration middleware
app.use((req, res, next) => {
  const end = httpRequestDurationHistogram.startTimer({
    method: req.method,
    route: req.path,
    app: 'auth-service',
  });
  res.on('finish', () => {
    end({ status_code: res.statusCode });
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

// Prometheus metrics endpoint (Step 222)
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// Simulate auth events for demo metrics
app.post('/auth/login', (req, res) => {
  const tenantId = req.body.tenantId || 'demo-tenant';
  loginAttemptsCounter.inc({ tenant_id: tenantId, method: 'password' });
  const success = Math.random() > 0.1;
  if (success) {
    loginSuccessCounter.inc({ tenant_id: tenantId, method: 'password' });
    res.json({ success: true, token: 'jwt-token-here' });
  } else {
    loginFailureCounter.inc({ tenant_id: tenantId, reason: 'invalid_credentials' });
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

app.post('/auth/register', (req, res) => {
  const tenantId = req.body.tenantId || 'new-tenant';
  registrationCounter.inc({ tenant_id: tenantId, plan: 'starter' });
  tenantsCreatedCounter.inc({ plan: 'starter' });
  subscriptionsCreatedCounter.inc({ plan: 'starter' });
  emailsSentCounter.inc({ type: 'welcome' });
  webhooksDeliveredCounter.inc({ tenant_id: tenantId, event_type: 'tenant.created' });
  res.json({ success: true, tenantId });
});

// Sentry error handler — must be last middleware
app.use(sentryErrorHandler());

// Generic error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  captureException(err, { path: req.path, method: req.method });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info('Auth Service started', { port: PORT });
  logger.info('Metrics endpoint ready', { url: `http://localhost:${PORT}/metrics` });
});
