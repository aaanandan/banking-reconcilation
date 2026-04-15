# API Examples

Banking Reconciliation Platform — Code samples for common workflows

---

## Table of Contents

1. [Authentication](#authentication)
2. [Reconciliations](#reconciliations)
3. [Billing](#billing)
4. [User Management](#user-management)
5. [Webhooks](#webhooks)

---

## Authentication

### Register a new tenant + admin user

**Request:**
```bash
curl -X POST https://api.banking-recon.com/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "SecureP@ssw0rd",
    "name": "Jane Admin",
    "tenantName": "Acme Corporation"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@acme.com",
    "name": "Jane Admin",
    "role": "tenant_admin",
    "tenantId": "acme-corp-001"
  }
}
```

---

### Login

**Request:**
```bash
curl -X POST https://api.banking-recon.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "SecureP@ssw0rd"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@acme.com",
    "name": "Jane Admin",
    "role": "tenant_admin",
    "tenantId": "acme-corp-001"
  }
}
```

Store the `token` value — include it in subsequent requests as `Authorization: Bearer <token>`.

---

## Reconciliations

### List reconciliations

**Request:**
```bash
curl -X GET "https://api.banking-recon.com/v1/reconciliations?status=completed&limit=10&offset=0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "data": [
    {
      "id": "recon-123",
      "status": "completed",
      "totalTransactions": 1245,
      "matchedCount": 1198,
      "unmatchedCount": 47,
      "convergenceRate": 96.2,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

---

### Create reconciliation (multipart upload)

**Request (curl):**
```bash
curl -X POST https://api.banking-recon.com/v1/reconciliations \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "bankFiles[]=@/path/to/bank_statement.csv" \
  -F "ledgerFile=@/path/to/general_ledger.xlsx" \
  -F 'dateRange={"includeAll":true}'
```

**Request (JavaScript/fetch):**
```javascript
const formData = new FormData();
formData.append('bankFiles', bankFile1); // File object from <input type="file">
formData.append('ledgerFile', ledgerFile);
formData.append('dateRange', JSON.stringify({
  includeAll: false,
  fromDate: '2024-01-01',
  toDate: '2024-01-31'
}));

const response = await fetch('https://api.banking-recon.com/v1/reconciliations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('Reconciliation ID:', result.id);
```

**Response:**
```json
{
  "id": "recon-456",
  "status": "in_progress",
  "totalTransactions": 0,
  "matchedCount": 0,
  "unmatchedCount": 0,
  "convergenceRate": 0,
  "createdAt": "2024-01-20T14:22:00Z"
}
```

Poll `GET /reconciliations/{id}` to check progress.

---

### Get reconciliation by ID

**Request:**
```bash
curl -X GET https://api.banking-recon.com/v1/reconciliations/recon-456 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "id": "recon-456",
  "status": "completed",
  "totalTransactions": 2340,
  "matchedCount": 2251,
  "unmatchedCount": 89,
  "convergenceRate": 96.2,
  "createdAt": "2024-01-20T14:22:00Z",
  "completedAt": "2024-01-20T14:28:34Z"
}
```

---

## Billing

### Get pricing plans

**Request:**
```bash
curl -X GET https://api.banking-recon.com/v1/billing/plans
```

**Response:**
```json
{
  "plans": {
    "free": {
      "name": "Free",
      "price": 0,
      "interval": "month",
      "features": {
        "maxBankAccounts": 1,
        "maxTransactionsPerMonth": 100,
        "maxStorageMB": 10,
        "maxUsers": 1
      }
    },
    "starter": {
      "name": "Starter",
      "price": 49,
      "interval": "month",
      "stripePriceId": "price_starter_monthly",
      "features": {
        "maxBankAccounts": 3,
        "maxTransactionsPerMonth": 1000,
        "maxStorageMB": 100,
        "maxUsers": 5
      }
    }
  }
}
```

---

### Get usage summary

**Request:**
```bash
curl -X GET https://api.banking-recon.com/v1/billing/usage/acme-corp-001 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "plan": "starter",
  "usage": {
    "transactionsThisMonth": 342,
    "bankAccounts": 2,
    "storageMB": 28.4
  },
  "quotas": {
    "maxTransactionsPerMonth": 1000,
    "maxBankAccounts": 3,
    "maxStorageMB": 100
  }
}
```

---

### Check quota before operation

**Request:**
```bash
curl -X GET https://api.banking-recon.com/v1/billing/quota/acme-corp-001/transactions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "allowed": true,
  "tenantId": "acme-corp-001",
  "resource": "transactions"
}
```

If `allowed: false`, the user has exceeded their quota and must upgrade.

---

### Subscribe to a plan

**Request:**
```bash
curl -X POST https://api.banking-recon.com/v1/billing/subscribe \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "name": "Acme Corporation",
    "tenantId": "acme-corp-001",
    "planKey": "professional"
  }'
```

**Response:**
```json
{
  "subscriptionId": "sub_1234567890",
  "customerId": "cus_ABCDEFGHIJ",
  "clientSecret": "pi_1234567890_secret_XXXXXX"
}
```

Use `clientSecret` to complete payment with Stripe.js on the frontend.

---

### Upgrade plan

**Request:**
```bash
curl -X POST https://api.banking-recon.com/v1/billing/change-plan \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "sub_1234567890",
    "newPlanKey": "professional",
    "tenantId": "acme-corp-001"
  }'
```

**Response:**
```json
{
  "subscription": {
    "id": "sub_1234567890",
    "status": "active",
    "current_period_end": 1706745600
  }
}
```

Proration is calculated automatically by Stripe.

---

### Cancel subscription

**Request:**
```bash
curl -X POST https://api.banking-recon.com/v1/billing/cancel \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "sub_1234567890",
    "tenantId": "acme-corp-001"
  }'
```

**Response:**
```json
{
  "cancelled": true
}
```

Tenant retains access until the end of the current billing period, then reverts to Free.

---

### List invoices

**Request:**
```bash
curl -X GET https://api.banking-recon.com/v1/billing/invoices/cus_ABCDEFGHIJ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "invoices": [
    {
      "id": "in_1234567890",
      "number": "ACME-001",
      "status": "paid",
      "amountDue": 19900,
      "amountPaid": 19900,
      "currency": "usd",
      "periodStart": "2024-01-01T00:00:00Z",
      "periodEnd": "2024-01-31T23:59:59Z",
      "hostedInvoiceUrl": "https://invoice.stripe.com/i/acct_xxx/in_xxx",
      "invoicePdf": "https://pay.stripe.com/invoice/acct_xxx/in_xxx/pdf"
    }
  ]
}
```

---

## User Management

### Invite a user

**Request:**
```bash
curl -X POST https://api.banking-recon.com/v1/users/invite \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "accountant@acme.com",
    "role": "accountant"
  }'
```

**Response:**
```json
{
  "invitationId": "inv-789",
  "email": "accountant@acme.com",
  "role": "accountant",
  "status": "pending",
  "expiresAt": "2024-01-27T14:22:00Z"
}
```

User receives an email with a setup link.

---

## Webhooks

### Stripe webhook example (Node.js/Express)

Your application receives webhooks from Stripe when billing events occur.

**Handler code:**
```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Raw body for Stripe signature verification
app.post('/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log(`Payment succeeded for ${invoice.customer}`);
      // Send receipt email, update tenant status, etc.
      break;
    
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log(`Payment failed for ${failedInvoice.customer}`);
      // Send dunning email, downgrade tenant, etc.
      break;
    
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      console.log(`Subscription cancelled: ${subscription.id}`);
      // Revert tenant to Free plan
      break;
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

app.listen(3004, () => console.log('Webhook handler running on port 3004'));
```

**Configure webhook in Stripe Dashboard:**
1. Go to **Developers → Webhooks → Add endpoint**
2. URL: `https://yourdomain.com/billing/webhook`
3. Select events: `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.*`
4. Copy the signing secret to `.env` as `STRIPE_WEBHOOK_SECRET`

---

## Error Handling

All error responses follow this format:

```json
{
  "error": "InvalidCredentials",
  "message": "The email or password you entered is incorrect."
}
```

Common HTTP status codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Resource created |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing or invalid token) |
| 402 | Payment required (quota exceeded) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 409 | Conflict (e.g., email already registered) |
| 500 | Internal server error |

---

*For the full API specification see [OpenAPI Schema](openapi.yaml) or [Swagger UI](swagger-ui.html).*
