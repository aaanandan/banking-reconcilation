# Step 228: Configure Log Forwarding to ELK Stack

## Overview

Configure all microservices to forward structured logs to the ELK stack with proper formatting, correlation IDs, and metadata.

## Structured Logging Implementation

### 1. Create Shared Logger Module

For NestJS services, create a shared logger:

`banking-reconciliation-system/libs/shared/src/logger/structured-logger.ts`:

```typescript
export class StructuredLogger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  log(message: string, metadata: Record<string, any> = {}) {
    this.write('info', message, metadata);
  }

  error(message: string, error: Error, metadata: Record<string, any> = {}) {
    this.write('error', message, {
      ...metadata,
      error: error.message,
      stack: error.stack,
    });
  }

  warn(message: string, metadata: Record<string, any> = {}) {
    this.write('warn', message, metadata);
  }

  debug(message: string, metadata: Record<string, any> = {}) {
    this.write('debug', message, metadata);
  }

  private write(level: string, message: string, metadata: Record<string, any>) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.context,
      message,
      ...metadata,
      environment: process.env.NODE_ENV || 'development',
    };

    console.log(JSON.stringify(logEntry));
  }
}
```

### 2. Update Auth Service Logging

`banking-reconciliation-system/apps/auth-service/src/main.ts`:

```typescript
import { StructuredLogger } from '@app/shared/logger/structured-logger';

const logger = new StructuredLogger('auth-service');

async function bootstrap() {
  const app = await NestFactory.create(AuthModule, {
    logger: false, // Disable default logger
  });

  // Log all requests
  app.use((req, res, next) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || generateUUID();
    req.requestId = requestId;

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.log('HTTP Request', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        requestId,
        tenantId: req.user?.tenantId,
        userId: req.user?.id,
        ip: req.ip,
      });
    });

    next();
  });

  await app.listen(3001);
  logger.log('Auth service started', { port: 3001 });
}

bootstrap().catch((error) => {
  logger.error('Failed to start auth service', error);
  process.exit(1);
});
```

### 3. Update Billing Service Logging

`services/billing-service/src/index.js`:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'billing-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.json(),
    }),
  ],
});

// Middleware to log all requests
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || generateUUID();
  
  res.on('finish', () => {
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - startTime,
      requestId,
      tenantId: req.tenantId,
    });
  });
  
  next();
});

// Log Stripe events
app.post('/billing/webhook', async (req, res) => {
  const event = req.body;
  
  logger.info('Stripe webhook received', {
    eventType: event.type,
    eventId: event.id,
    requestId: req.headers['x-request-id'],
  });
  
  // Process event...
});
```

## Log Enrichment Patterns

### Request Correlation

All logs for a single request should share the same `requestId`:

```javascript
// Generate at entry point
const requestId = req.headers['x-request-id'] || uuidv4();
req.requestId = requestId;

// Include in all logs
logger.info('Processing payment', {
  requestId,
  tenantId: req.tenantId,
  amount: payment.amount,
});
```

### Tenant Context

Always include tenant ID for multi-tenant filtering:

```javascript
logger.info('User created', {
  tenantId: user.tenantId,
  userId: user.id,
  requestId: req.requestId,
});
```

### Performance Metrics

Log operation durations for performance analysis:

```javascript
const startTime = Date.now();
await reconciliationService.process();
const duration = Date.now() - startTime;

logger.info('Reconciliation completed', {
  duration,
  transactionCount: result.count,
  tenantId,
  requestId,
});
```

## Service-Specific Log Examples

### Auth Service Events

```typescript
// Login success
logger.log('User login successful', {
  userId: user.id,
  tenantId: user.tenantId,
  method: 'password',
  ip: req.ip,
  requestId: req.requestId,
});

// Login failure
logger.warn('Login attempt failed', {
  email: req.body.email,
  reason: 'invalid_password',
  ip: req.ip,
  requestId: req.requestId,
});

// 2FA verification
logger.log('2FA verification', {
  userId: user.id,
  success: true,
  requestId: req.requestId,
});
```

### Billing Service Events

```javascript
// Subscription created
logger.info('Subscription created', {
  tenantId: subscription.tenantId,
  plan: subscription.plan,
  amount: subscription.amount,
  stripeSubscriptionId: subscription.stripeId,
  requestId,
});

// Payment failed
logger.error('Payment failed', {
  tenantId,
  reason: error.message,
  stripeError: error.code,
  amount,
  requestId,
});
```

### Reconciliation Service Events

```typescript
// Reconciliation started
logger.log('Reconciliation started', {
  reconciliationId,
  tenantId,
  bankFileCount: files.length,
  requestId,
});

// Matching completed
logger.log('Matching pass completed', {
  reconciliationId,
  tenantId,
  pass: 'MT-01',
  matched: result.matchedCount,
  duration: result.duration,
  requestId,
});
```

## Error Logging Best Practices

### Structured Error Logging

```javascript
try {
  await processPayment(payment);
} catch (error) {
  logger.error('Payment processing failed', error, {
    paymentId: payment.id,
    tenantId: payment.tenantId,
    amount: payment.amount,
    errorCode: error.code,
    requestId,
  });
  throw error;
}
```

### Error Classification

```javascript
// High severity - immediate attention
logger.error('Database connection lost', error, {
  severity: 'critical',
  service: 'postgres',
  requestId,
});

// Medium severity - action needed
logger.error('Stripe API timeout', error, {
  severity: 'high',
  retryable: true,
  requestId,
});

// Low severity - informational
logger.error('User input validation failed', error, {
  severity: 'low',
  field: 'email',
  requestId,
});
```

## Docker Container Log Labels

Update `docker-compose.yml` to add logging labels:

```yaml
services:
  auth-service:
    labels:
      - "logging=enabled"
      - "log.service=auth-service"
      - "log.level=info"
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service,env"
```

## Log Sampling for High-Traffic Endpoints

For very high-traffic endpoints, sample logs:

```javascript
// Sample 10% of successful requests
if (res.statusCode < 400 || Math.random() < 0.1) {
  logger.info('HTTP Request', {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    sampled: res.statusCode >= 400 ? false : true,
  });
}
```

## Verification

### Check Logs Appear in Elasticsearch

```bash
# View logs from auth-service
curl "localhost:9200/logs-auth-service-*/_search?size=5&pretty"

# View logs with specific tenant ID
curl -X GET "localhost:9200/logs-*/_search?pretty" \
  -H 'Content-Type: application/json' \
  -d '{
  "query": {
    "match": {
      "tenant_id": "tenant_123"
    }
  }
}'

# View error logs
curl -X GET "localhost:9200/logs-*/_search?pretty" \
  -H 'Content-Type: application/json' \
  -d '{
  "query": {
    "match": {
      "level": "error"
    }
  }
}'
```

### Test Request Correlation

```bash
# Make request with correlation ID
REQUEST_ID=$(uuidv4)
curl -X POST http://localhost:3001/api/auth/login \
  -H "x-request-id: $REQUEST_ID" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}'

# Search logs by request ID
curl -X GET "localhost:9200/logs-*/_search?pretty" \
  -H 'Content-Type: application/json' \
  -d "{
  \"query\": {
    \"match\": {
      \"request_id\": \"$REQUEST_ID\"
    }
  }
}"
```

## Next Steps

- **Step 229**: Create Kibana dashboards for log visualization
- **Step 237**: Set up performance monitoring using log metrics

---

**Status**: ✅ Log forwarding configured  
**Next**: Step 229 - Kibana Dashboards
