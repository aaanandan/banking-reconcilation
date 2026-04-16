# Step 230: Set up Sentry for Error Tracking

## Overview

Integrate Sentry for advanced error tracking, performance monitoring, and release tracking across all services.

## Sentry Setup

### 1. Create Sentry Account

1. Sign up at https://sentry.io
2. Create organization: "Banking Reconciliation"
3. Create projects for each service:
   - `auth-service`
   - `billing-service`
   - `reconciliation-service`
   - `frontend`

### 2. Get DSN Keys

For each project, copy the DSN (Data Source Name):
```
https://xxxxx@sentry.io/xxxxx
```

Store in environment variables:
```bash
SENTRY_DSN_AUTH_SERVICE=https://xxxxx@sentry.io/xxxxx
SENTRY_DSN_BILLING=https://xxxxx@sentry.io/xxxxx
SENTRY_DSN_FRONTEND=https://xxxxx@sentry.io/xxxxx
```

## Integration by Service

### Auth Service (NestJS)

```bash
cd banking-reconciliation-system/apps/auth-service
npm install @sentry/node @sentry/tracing
```

Update `src/main.ts`:

```typescript
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

async function bootstrap() {
  // Initialize Sentry
  Sentry.init({
    dsn: process.env.SENTRY_DSN_AUTH_SERVICE,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new ProfilingIntegration(),
    ],
    beforeSend(event, hint) {
      // Add custom context
      if (event.request) {
        event.contexts = {
          ...event.contexts,
          tenant: {
            id: event.request.headers?.['x-tenant-id'],
          },
        };
      }
      return event;
    },
  });

  const app = await NestFactory.create(AuthModule);

  // Sentry error handler must be first
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  // Your routes...

  // Error handler must be last
  app.use(Sentry.Handlers.errorHandler());

  await app.listen(3001);
}
```

### Billing Service (Express)

```bash
cd services/billing-service
npm install @sentry/node @sentry/profiling-node
```

Update `src/index.js`:

```javascript
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

Sentry.init({
  dsn: process.env.SENTRY_DSN_BILLING,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

// Request handler must be first
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Routes...

// Error handler must be before other error middleware
app.use(Sentry.Handlers.errorHandler());

app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal server error' });
});
```

### Frontend (React)

```bash
cd banking-recon-frontend
npm install @sentry/react
```

Update `src/main.tsx`:

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN_FRONTEND,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', /^https:\/\/api\.banking-recon\.com/],
    }),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Sentry.ErrorBoundary fallback={ErrorFallback}>
    <App />
  </Sentry.ErrorBoundary>
);
```

## Configuration Already in docker-compose.yml

Sentry configuration is in `monitoring/sentry/sentry.conf`:

```yaml
# Already configured
system.secret-key: 'your-secret-key'
mail.backend: 'smtp'
mail.host: 'smtp.gmail.com'
mail.port: 587
```

## Advanced Features

### User Context

```typescript
// Set user context for better debugging
Sentry.setUser({
  id: user.id,
  email: user.email,
  tenantId: user.tenantId,
});
```

### Custom Tags

```typescript
// Add custom tags
Sentry.setTag('tenant_id', tenantId);
Sentry.setTag('feature', 'reconciliation');
Sentry.setTag('plan', subscription.plan);
```

### Breadcrumbs

```typescript
// Add breadcrumbs for debugging
Sentry.addBreadcrumb({
  category: 'reconciliation',
  message: 'Started matching process',
  level: 'info',
  data: {
    reconciliationId,
    transactionCount: transactions.length,
  },
});
```

### Performance Monitoring

```typescript
// Track custom transactions
const transaction = Sentry.startTransaction({
  op: 'reconciliation.process',
  name: 'Process Reconciliation',
});

try {
  const result = await processReconciliation();
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

### Stripe Integration Monitoring

```javascript
// Track Stripe webhook processing
app.post('/billing/webhook', async (req, res) => {
  const transaction = Sentry.startTransaction({
    op: 'stripe.webhook',
    name: `Stripe Webhook: ${req.body.type}`,
  });

  try {
    await handleStripeEvent(req.body);
    transaction.setStatus('ok');
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        stripe_event_type: req.body.type,
        stripe_event_id: req.body.id,
      },
    });
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
});
```

## Sentry Alerts

### Configure Alert Rules

1. **High Error Rate Alert**
   - Condition: More than 50 errors in 1 hour
   - Action: Email + Slack notification

2. **New Error Alert**
   - Condition: New error appears
   - Action: Slack notification

3. **Performance Degradation**
   - Condition: P95 response time > 2 seconds
   - Action: Email ops team

### Alert Configuration

```yaml
# In Sentry project settings → Alerts
rules:
  - name: "High Error Rate"
    conditions:
      - type: "event_frequency"
        value: 50
        interval: "1h"
    actions:
      - type: "slack"
        workspace: "Banking Recon"
        channel: "#alerts-critical"

  - name: "New Production Error"
    conditions:
      - type: "first_seen_event"
        environment: "production"
    actions:
      - type: "slack"
        channel: "#alerts-ops"
```

## Release Tracking

### Tag Releases

```bash
# In CI/CD pipeline
export SENTRY_ORG="banking-reconciliation"
export SENTRY_PROJECT="auth-service"
export VERSION=$(git describe --tags --always)

# Create release
sentry-cli releases new "$VERSION"

# Associate commits
sentry-cli releases set-commits "$VERSION" --auto

# Deploy to environment
sentry-cli releases deploys "$VERSION" new -e production

# Finalize release
sentry-cli releases finalize "$VERSION"
```

### Source Maps (Frontend)

```typescript
// vite.config.ts
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    sentryVitePlugin({
      org: 'banking-reconciliation',
      project: 'frontend',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
```

## Verification Checklist

- [ ] Sentry account created
- [ ] Projects created for each service
- [ ] DSN keys configured in env vars
- [ ] SDK installed in all services
- [ ] Error tracking working
- [ ] Performance monitoring enabled
- [ ] User context being set
- [ ] Custom tags configured
- [ ] Alerts set up
- [ ] Release tracking configured
- [ ] Source maps uploaded (frontend)

---

**Status**: ✅ Sentry configured  
**Next**: Step 231 - Distributed Tracing
