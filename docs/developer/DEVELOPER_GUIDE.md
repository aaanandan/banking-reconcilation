# Developer Guide

Banking Reconciliation Platform — Technical documentation for contributors

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Local Development Setup](#local-development-setup)
3. [Project Structure](#project-structure)
4. [Running Tests](#running-tests)
5. [API Development](#api-development)
6. [Frontend Development](#frontend-development)
7. [Database Migrations](#database-migrations)
8. [Monitoring & Observability](#monitoring--observability)
9. [Deployment](#deployment)
10. [Contributing](#contributing)

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React)  —  banking-recon-frontend/           │
│  - Vite 4.5.0                                           │
│  - React 18.2, TypeScript                               │
│  - Ant Design UI                                        │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP/REST
┌────────────────▼────────────────────────────────────────┐
│  Backend Services  (Node.js/Express)                    │
│  ┌──────────────────┬──────────────────────────────┐  │
│  │ auth-service     │ billing-service              │  │
│  │ :3001            │ :3004                        │  │
│  └──────────────────┴──────────────────────────────┘  │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  Data Layer                                             │
│  ┌──────────────────┬──────────────────────────────┐  │
│  │ PostgreSQL 15    │ Redis (planned)              │  │
│  │ Multi-tenant     │ Session store                │  │
│  └──────────────────┴──────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

Monitoring Stack (Docker Compose):
- Prometheus :9090 — Metrics collection
- Grafana :3000 — Dashboards
- Jaeger :16686 — Distributed tracing
- Elasticsearch :9200 — Log aggregation
- Kibana :5601 — Log visualization
```

---

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Ant Design |
| **Backend** | Node.js 18, Express 4.18 |
| **Database** | PostgreSQL 15 |
| **Metrics** | Prometheus 2.51, prom-client 15.1 |
| **Tracing** | OpenTelemetry, Jaeger 1.56 |
| **Logging** | ELK Stack 8.13 (Elasticsearch, Logstash, Kibana, Filebeat) |
| **Errors** | Sentry |
| **Billing** | Stripe API 14.21 |
| **Containerization** | Docker, Docker Compose |

---

## Local Development Setup

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+
- **Docker** 24+ ([Download](https://www.docker.com/products/docker-desktop))
- **PostgreSQL** 15+ (or use Docker)
- **Git**

### Clone the Repository

```bash
git clone https://github.com/yourorg/banking-reconcilation.git
cd banking-reconcilation
```

---

### Environment Setup

1. **Copy `.env.example` to `.env`:**

```bash
cp .env.example .env
```

2. **Configure environment variables:**

```bash
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=banking_recon

# Services
AUTH_SERVICE_PORT=3001
BILLING_SERVICE_PORT=3004

# Stripe (use test keys)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_STARTER=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PROFESSIONAL=price_xxxxxxxxxxxxxxxxxxxxx

# Monitoring
SENTRY_DSN=https://xxxxxxxxxxxx@sentry.io/xxxxxxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ

# Logging
NODE_ENV=development
LOG_LEVEL=debug
```

---

### Install Dependencies

**Backend services:**
```bash
cd services/auth-service
npm install
cd ../billing-service
npm install
cd ../..
```

**Frontend:**
```bash
cd banking-recon-frontend
npm install
cd ..
```

---

### Start Monitoring Stack

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Prometheus (port 9090)
- Grafana (port 3000)
- Jaeger (port 16686)
- ELK Stack (Kibana on port 5601)

**Verify:**
```bash
docker-compose ps
# All services should show "Up"

curl http://localhost:9090/-/healthy
# Should return: Prometheus is Healthy
```

---

### Start Services

**Terminal 1 — Auth Service:**
```bash
cd services/auth-service
npm run start:dev
# Listening on port 3001
```

**Terminal 2 — Billing Service:**
```bash
cd services/billing-service
npm run start:dev
# Listening on port 3004
```

**Terminal 3 — Frontend:**
```bash
cd banking-recon-frontend
npm run dev
# Vite dev server on http://localhost:5173
```

---

### Verify Setup

1. **Frontend:** http://localhost:5173 → should show login page
2. **Auth API:** http://localhost:3001/health → `{"status":"ok"}`
3. **Billing API:** http://localhost:3004/health → `{"status":"ok"}`
4. **Prometheus:** http://localhost:9090/targets → all targets "UP"
5. **Grafana:** http://localhost:3000 → login with `admin/admin`
6. **Jaeger:** http://localhost:16686 → distributed tracing UI
7. **Kibana:** http://localhost:5601 → log search

---

## Project Structure

```
banking-reconcilation/
├── banking-recon-frontend/          # React SPA
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # Route-level pages
│   │   │   ├── Dashboard/
│   │   │   ├── Reconciliation/
│   │   │   ├── Billing/
│   │   │   └── Settings/
│   │   ├── services/                # API client functions
│   │   └── App.tsx                  # Main app component
│   ├── package.json
│   └── vite.config.ts
│
├── services/
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── index.js             # Express app entry
│   │   │   ├── metrics.js           # Prometheus metrics
│   │   │   └── logger/
│   │   │       └── logger.js        # Structured JSON logger
│   │   └── package.json
│   │
│   └── billing-service/
│       ├── src/
│       │   ├── index.js             # Express app entry
│       │   ├── pricing.js           # Pricing tiers
│       │   ├── stripe.service.js    # Stripe API wrapper
│       │   ├── usage-tracking.service.js
│       │   ├── invoice.service.js
│       │   └── billing-email.service.js
│       ├── tests/
│       │   └── billing.test.js      # 47 test cases
│       └── package.json
│
├── monitoring/
│   ├── prometheus/
│   │   ├── prometheus.yml           # Scrape configs
│   │   ├── alerts/
│   │   │   └── alerts.yml           # 22 alert rules
│   │   └── alertmanager.yml         # Slack routing
│   ├── grafana/
│   │   ├── dashboards/              # 5 JSON dashboards
│   │   └── provisioning/
│   ├── elk/
│   │   ├── logstash/
│   │   │   └── pipeline/
│   │   │       └── logstash.conf    # Log processing
│   │   └── kibana/
│   │       └── dashboards/          # 3 Kibana dashboards
│   ├── sentry/
│   │   └── sentry.js                # Error tracking init
│   └── tracing/
│       └── tracer.js                # OpenTelemetry + Jaeger
│
├── docs/
│   ├── api/
│   │   ├── openapi.yaml             # OpenAPI 3.0 spec
│   │   ├── swagger-ui.html          # API documentation UI
│   │   └── API_EXAMPLES.md          # Code samples
│   ├── user-guide/
│   │   ├── USER_GUIDE.md
│   │   ├── KNOWLEDGE_BASE.md
│   │   ├── FAQ.md
│   │   ├── TROUBLESHOOTING.md
│   │   ├── ADMIN_GUIDE.md
│   │   └── VIDEO_SCRIPTS.md
│   ├── billing/
│   │   └── BILLING.md               # Billing system reference
│   └── developer/
│       └── DEVELOPER_GUIDE.md       # This file
│
├── docker-compose.yml               # Monitoring stack
├── .env.example
├── package.json
└── README.md
```

---

## Running Tests

### Backend Tests

**Billing service:**
```bash
cd services/billing-service
npm test
# 47 tests covering:
#   - Free tier validation
#   - Paid tier signup
#   - Plan upgrade/downgrade
#   - Cancellation
#   - Quota enforcement
#   - Payment failure handling
#   - Refunds
```

**Auth service:**
```bash
cd services/auth-service
npm test
# Tests: login, registration, JWT validation
```

---

### Frontend Tests

```bash
cd banking-recon-frontend
npm test
# Jest + React Testing Library
```

---

### End-to-End Tests (Cypress — planned)

```bash
npm run test:e2e
```

---

## API Development

### Adding a New Endpoint

**Example: Add `GET /billing/usage-history/:tenantId`**

**1. Add route in `services/billing-service/src/index.js`:**

```javascript
app.get('/billing/usage-history/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const { limit = 12 } = req.query; // Default: last 12 months
  
  const history = await getUsageHistory(tenantId, limit);
  res.json({ history });
});
```

**2. Implement business logic:**

```javascript
// src/usage-history.service.js
async function getUsageHistory(tenantId, limit) {
  // Query database for historical usage
  return [...];
}
```

**3. Add test case:**

```javascript
// tests/billing.test.js
assert(history.length === 12, 'Returns 12 months of data');
```

**4. Update OpenAPI spec:**

```yaml
# docs/api/openapi.yaml
paths:
  /billing/usage-history/{tenantId}:
    get:
      summary: Get historical usage
      parameters:
        - name: tenantId
          in: path
          required: true
          schema:
            type: string
```

**5. Commit:**

```bash
git add .
git commit -m "feat: Add usage history endpoint"
```

---

### API Conventions

**Response format:**
```json
{
  "data": [...],        // For lists
  "total": 42,          // Total count (pagination)
  "limit": 20,          // Page size
  "offset": 0           // Page offset
}
```

**Error format:**
```json
{
  "error": "QuotaExceeded",
  "message": "Transaction limit reached. Upgrade to continue."
}
```

**HTTP status codes:**
- `200` — Success
- `201` — Created
- `400` — Bad request (validation error)
- `401` — Unauthorized (missing/invalid JWT)
- `402` — Payment required (quota exceeded)
- `403` — Forbidden (insufficient permissions)
- `404` — Not found
- `500` — Internal server error

---

## Frontend Development

### Component Structure

```tsx
// src/pages/Billing/BillingPage.tsx
import React, { useState, useEffect } from 'react';
import { Card, Button } from 'antd';
import { getBillingPlans, getUsageSummary } from '../../services/billing';

const BillingPage: React.FC = () => {
  const [plans, setPlans] = useState([]);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    async function load() {
      const plansData = await getBillingPlans();
      const usageData = await getUsageSummary('tenant-001');
      setPlans(plansData.plans);
      setUsage(usageData);
    }
    load();
  }, []);

  return (
    <div>
      <h1>Billing</h1>
      {/* Render plans and usage */}
    </div>
  );
};

export default BillingPage;
```

---

### API Client

**Pattern:**
```typescript
// src/services/billing.ts
const API_BASE = 'http://localhost:3004';

export async function getBillingPlans() {
  const res = await fetch(`${API_BASE}/billing/plans`);
  if (!res.ok) throw new Error('Failed to load plans');
  return res.json();
}

export async function getUsageSummary(tenantId: string) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API_BASE}/billing/usage/${tenantId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load usage');
  return res.json();
}
```

---

### Styling

**Use Ant Design components first:**
```tsx
import { Button, Card, Table, Modal } from 'antd';
```

**Custom styles (CSS modules):**
```tsx
import styles from './BillingPage.module.css';

<div className={styles.container}>...</div>
```

---

## Database Migrations

### Creating a Migration

**Planned for Phase 1 (not yet implemented):**

```bash
npx typeorm migration:create -n AddTenantIdToUsers
```

**Migration file:**
```typescript
// migrations/1234567890-AddTenantIdToUsers.ts
export class AddTenantIdToUsers1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('users', new TableColumn({
      name: 'tenantId',
      type: 'uuid',
      isNullable: false
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'tenantId');
  }
}
```

**Run migrations:**
```bash
npm run typeorm migration:run
```

---

## Monitoring & Observability

### Prometheus Metrics

**Accessing metrics:**
```bash
curl http://localhost:3001/metrics
```

**Custom metric example:**
```javascript
// src/metrics.js
const { Counter } = require('prom-client');

const reconciliationsStarted = new Counter({
  name: 'reconciliations_started_total',
  help: 'Total reconciliations started',
  labelNames: ['tenant_id']
});

// Increment in code:
reconciliationsStarted.inc({ tenant_id: 'tenant-001' });
```

---

### Structured Logging

**Pattern:**
```javascript
const logger = require('./logger/logger');

logger.info('Reconciliation started', {
  reconciliationId: 'recon-456',
  tenantId: 'tenant-001',
  fileCount: 2
});
```

**Logs are forwarded to:**
- Stdout (dev)
- Filebeat → Logstash → Elasticsearch (production)

**Query logs in Kibana:**
```
service: "billing-service" AND tenantId: "tenant-001"
```

---

### Distributed Tracing

**Traces propagate via `traceparent` header (W3C TraceContext):**

```javascript
// Automatically instrumented by OpenTelemetry
// View traces at: http://localhost:16686
```

**Manual span:**
```javascript
const { withSpan } = require('../../monitoring/tracing/tracer');

await withSpan('processReconciliation', async (span) => {
  span.setAttribute('tenantId', 'tenant-001');
  span.setAttribute('fileSize', 2048000);
  // ... processing logic
});
```

---

## Deployment

### Docker Build

**Build auth service:**
```bash
cd services/auth-service
docker build -t banking-recon/auth-service:1.0.0 .
```

**Run:**
```bash
docker run -p 3001:3001 \
  -e POSTGRES_HOST=host.docker.internal \
  banking-recon/auth-service:1.0.0
```

---

### Production Deployment (AWS — planned)

**Architecture:**
- **ECS Fargate** for services
- **RDS PostgreSQL** for database
- **Application Load Balancer** for routing
- **CloudWatch** for logs
- **Route 53** for DNS

**CI/CD:**
- GitHub Actions → Build → Push to ECR → Deploy to ECS

---

## Contributing

### Branching Strategy

- `main` — Production-ready code
- `develop` — Integration branch
- `feature/your-feature` — Feature branches
- `fix/bug-description` — Bug fixes

---

### Commit Message Format

Follow **Conventional Commits**:

```
feat: Add usage history endpoint
fix: Correct proration calculation
docs: Update API examples
test: Add quota enforcement tests
chore: Upgrade prom-client to 15.1.3
```

---

### Pull Request Checklist

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] OpenAPI spec updated (if API changed)
- [ ] Documentation updated (if user-facing)
- [ ] Changelog entry added

---

### Code Review Guidelines

**Reviewers check for:**
- Security (no hardcoded secrets, SQL injection, XSS)
- Performance (no N+1 queries, efficient algorithms)
- Multi-tenancy (all queries include `tenantId`)
- Error handling (proper try/catch, user-friendly messages)
- Testing (new code has test coverage)

---

## Additional Resources

- [OpenAPI Spec](../api/openapi.yaml)
- [API Examples](../api/API_EXAMPLES.md)
- [Billing Architecture](../billing/BILLING.md)
- [User Guide](../user-guide/USER_GUIDE.md)

---

**Questions?** Open an issue on GitHub or email dev@banking-recon.com.
