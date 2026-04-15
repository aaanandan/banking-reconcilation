# Billing & Subscription — Technical Reference

Banking Reconciliation SaaS Platform · Steps 241-260

---

## Pricing Tiers

| Plan         | Price       | Bank Accounts | Tx/month  | Storage  | Users | Advanced Matching | API Access |
|--------------|-------------|---------------|-----------|----------|-------|-------------------|------------|
| Free         | $0          | 1             | 100       | 10 MB    | 1     | No                | No         |
| Starter      | $49/month   | 3             | 1,000     | 100 MB   | 5     | No                | No         |
| Professional | $199/month  | 10            | 10,000    | 1 GB     | 20    | Yes               | Yes        |
| Enterprise   | Custom      | Unlimited     | Unlimited | Unlimited| Unlimited | Yes           | Yes        |

Defined in `services/billing-service/src/pricing.js`.

---

## Architecture

```
React BillingPage (banking-recon-frontend)
         │  Plan selection / usage display
         ▼
billing-service (Express · port 3004)
  ├── pricing.js            — Plan definitions & quota constants
  ├── stripe.service.js     — Stripe API wrapper
  ├── usage-tracking.service.js — In-memory quota store
  ├── invoice.service.js    — Invoice formatting & retrieval
  └── billing-email.service.js  — Email notifications (SMTP stub)
         │
         ▼
  Stripe API (webhooks → /billing/webhook)
```

---

## API Endpoints

### GET /health
Service health check.
```json
{ "status": "ok", "service": "billing-service" }
```

### GET /billing/plans
Returns all pricing tiers with features and Stripe price IDs.

### POST /billing/subscribe
Create a new subscription.

**Request:**
```json
{
  "email": "admin@acme.com",
  "name": "Acme Corp",
  "tenantId": "tenant-001",
  "planKey": "starter"
}
```
**Response:**
```json
{
  "subscriptionId": "sub_xxx",
  "customerId": "cus_xxx",
  "clientSecret": "pi_xxx_secret_xxx"
}
```

### POST /billing/change-plan
Upgrade or downgrade subscription (proration applied automatically).

**Request:**
```json
{
  "subscriptionId": "sub_xxx",
  "newPlanKey": "professional",
  "tenantId": "tenant-001"
}
```

### POST /billing/cancel
Cancel subscription. Tenant reverts to Free plan.

**Request:**
```json
{
  "subscriptionId": "sub_xxx",
  "tenantId": "tenant-001"
}
```

### GET /billing/quota/:tenantId/:resource
Check if a tenant is within quota.

**Resources:** `transactions`, `bankAccounts`, `storage`, `users`

**Response:**
```json
{ "allowed": true, "tenantId": "tenant-001", "resource": "transactions" }
```

### GET /billing/usage/:tenantId
Full usage summary for a tenant.

**Response:**
```json
{
  "plan": "starter",
  "usage": { "transactionsThisMonth": 342, "bankAccounts": 2, "storageMB": 28 },
  "quotas": { "maxTransactionsPerMonth": 1000, "maxBankAccounts": 3, "maxStorageMB": 100 }
}
```

### GET /billing/invoices/:customerId
List past invoices (last 10 by default).

### GET /billing/invoices/:customerId/upcoming
Preview the next billing cycle invoice.

### POST /billing/refund
Issue a full or partial refund.

**Request:**
```json
{ "paymentIntentId": "pi_xxx", "amount": 4900 }
```
Omit `amount` for full refund.

### POST /billing/webhook
Stripe webhook endpoint. Requires raw body and `stripe-signature` header.

**Handled events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## Environment Variables

| Variable                    | Required | Description                                  |
|-----------------------------|----------|----------------------------------------------|
| `STRIPE_SECRET_KEY`         | Yes      | Stripe secret key (sk_live_* or sk_test_*)   |
| `STRIPE_WEBHOOK_SECRET`     | Yes      | Webhook signing secret from Stripe Dashboard |
| `STRIPE_PRICE_STARTER`      | No       | Override Stripe price ID for Starter plan    |
| `STRIPE_PRICE_PROFESSIONAL` | No       | Override Stripe price ID for Professional    |
| `STRIPE_PRICE_ENTERPRISE`   | No       | Override Stripe price ID for Enterprise      |
| `BILLING_SERVICE_PORT`      | No       | Port (default: 3004)                         |
| `EMAIL_FROM`                | No       | Sender address (default: billing@banking-recon.com) |
| `SMTP_HOST`                 | No       | SMTP server for email delivery               |

---

## Quota Enforcement

Quota checks run via `checkQuota(tenantId, resource)` before any quota-limited operation:

```js
const allowed = await checkQuota('tenant-001', 'transactions');
if (!allowed) return res.status(402).json({ error: 'Transaction quota exceeded' });
```

Monthly usage resets on the 1st of each month via `resetMonthlyUsage()` (wire to a cron job).

Enterprise tenants use `-1` for all quotas, which bypasses all checks.

---

## Email Notifications

Triggered by billing lifecycle events:

| Event                   | Email Function                    |
|-------------------------|-----------------------------------|
| Subscription created    | `sendSubscriptionConfirmation`    |
| Plan changed            | `sendPlanChangeNotification`      |
| Subscription cancelled  | `sendCancellationNotification`    |
| Payment succeeded       | `sendPaymentSuccessNotification`  |
| Payment failed          | `sendPaymentFailureNotification`  |
| Quota exceeded          | `sendQuotaExceededNotification`   |
| Refund issued           | `sendRefundNotification`          |

In development (no `SMTP_HOST`), emails are logged to stdout as JSON.

---

## Running Tests

```bash
cd services/billing-service
node tests/billing.test.js
# Expected: 47 passed, 0 failed
```

## Starting the Service

```bash
cd services/billing-service
npm install
npm start       # production
npm run start:dev  # nodemon hot-reload
```
