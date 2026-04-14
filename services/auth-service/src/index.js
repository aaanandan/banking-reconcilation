// Step 222: Auth Service with Prometheus metrics endpoint
// Banking Reconciliation Platform

const express = require('express');
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

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
  console.log(`Metrics available at http://localhost:${PORT}/metrics`);
  console.log(`Health check at http://localhost:${PORT}/health`);
});
