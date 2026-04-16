# Step 212: Subscription & Billing Integration (Stripe)

**Status**: ✅ Completed
**Date**: 2025-11-18
**Component**: Auth Service - Billing Module

## Overview

This step implements complete subscription and billing functionality using Stripe, enabling the SaaS platform to:
- Accept subscription payments for different plans (Starter, Professional, Enterprise)
- Manage customer subscriptions (create, cancel, reactivate)
- Process webhooks for automated subscription lifecycle management
- Provide billing portal for customers to manage payment methods
- Track invoices and payment history

## Implementation Summary

### 1. Stripe SDK Integration

**Package**: `stripe` npm package

**Installation**:
```bash
npm install stripe
```

**API Version**: `2024-11-20.acacia`

### 2. Files Created/Modified

#### DTOs (`apps/auth-service/src/dto/billing.dto.ts`)

- **CreateCheckoutSessionDto**: Request for creating Stripe checkout session
- **SubscriptionResponseDto**: Subscription details response
- **InvoiceResponseDto**: Invoice information
- **PaymentMethodResponseDto**: Payment method details
- **BillingPortalSessionDto**: Billing portal session URL
- **CreateUsageRecordDto**: Usage-based billing (future use)

#### StripeService (`apps/auth-service/src/stripe.service.ts`)

**Core Functionality**:

1. **Customer Management**
   - `getOrCreateCustomer(tenantId)`: Creates or retrieves Stripe customer for tenant
   - Links Stripe customer ID to tenant entity

2. **Checkout & Subscriptions**
   - `createCheckoutSession(tenantId, dto)`: Creates Stripe checkout session for subscription
   - `getSubscription(subscriptionId)`: Retrieves subscription details
   - `cancelSubscription(subscriptionId, immediate)`: Cancels subscription
   - `reactivateSubscription(subscriptionId)`: Reactivates cancelled subscription

3. **Pricing Management**
   - Plan pricing defined in service (can be moved to config/database):
     - **Starter**: $29/month, $290/year (2 months free)
     - **Professional**: $99/month, $990/year (2 months free)
     - **Enterprise**: $299/month, $2990/year (2 months free)
   - Dynamic price creation with lookup keys for idempotency

4. **Billing Portal**
   - `createBillingPortalSession(tenantId)`: Creates session for Stripe-hosted billing portal
   - Allows customers to update payment methods, view invoices, cancel subscriptions

5. **Invoice & Payment Methods**
   - `getInvoices(tenantId, limit)`: Retrieves customer invoices
   - `getPaymentMethods(tenantId)`: Lists payment methods on file

6. **Webhook Handling**
   - `handleWebhook(signature, rawBody)`: Processes Stripe webhook events
   - Verifies webhook signature for security
   - Handles events:
     - `checkout.session.completed`: Updates tenant with subscription
     - `customer.subscription.updated`: Syncs subscription status to tenant
     - `customer.subscription.deleted`: Downgrades tenant to free plan
     - `invoice.paid`: Logs successful payment
     - `invoice.payment_failed`: Logs payment failure

**Integration Points**:
- Uses `TenantService` to update tenant subscription information
- Updates tenant plan, status, and Stripe IDs based on webhook events
- Activates/suspends tenants based on subscription status

#### BillingController (`apps/auth-service/src/billing.controller.ts`)

**Endpoints**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/billing/checkout` | Create checkout session for subscription |
| GET | `/billing/subscription/:subscriptionId` | Get subscription details |
| DELETE | `/billing/subscription/:subscriptionId` | Cancel subscription |
| POST | `/billing/subscription/:subscriptionId/reactivate` | Reactivate cancelled subscription |
| GET | `/billing/invoices/:tenantId` | Get invoices for tenant |
| GET | `/billing/payment-methods/:tenantId` | Get payment methods for tenant |
| POST | `/billing/portal/:tenantId` | Create billing portal session |
| POST | `/billing/webhook` | Stripe webhook endpoint |

**Security**:
- Rate limiting enabled via `@UseGuards(ThrottlerGuard)`
- Webhook signature verification
- Raw body required for webhook verification (configured in main.ts)

**Notes**:
- Production endpoints should verify user authentication
- Currently accepts tenantId in request body (should come from authenticated user)

#### Module Integration (`apps/auth-service/src/auth.module.ts`)

**Changes**:
- Added `StripeService` to providers
- Added `BillingController` to controllers
- Exported `StripeService` for use by other modules

### 3. Environment Configuration

**Added to `.env.example`**:

```bash
# Stripe Configuration (for subscription billing)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret
# Get your Stripe keys from: https://dashboard.stripe.com/apikeys
# Configure webhook secret from: https://dashboard.stripe.com/webhooks
```

**Required Configuration**:
1. Create Stripe account at https://stripe.com
2. Get API keys from https://dashboard.stripe.com/apikeys
3. Set up webhook endpoint at https://dashboard.stripe.com/webhooks
   - Endpoint URL: `https://your-domain.com/billing/webhook`
   - Events to subscribe:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Subscription Plans

| Plan | Monthly | Yearly | Max Banks | Max Transactions/mo | Max Storage | Max Users |
|------|---------|--------|-----------|---------------------|-------------|-----------|
| **Free** | $0 | $0 | 1 | 100 | 10 MB | 1 |
| **Starter** | $29 | $290 | 3 | 1,000 | 100 MB | 5 |
| **Professional** | $99 | $990 | 10 | 10,000 | 1 GB | 25 |
| **Enterprise** | $299 | $2,990 | Unlimited | Unlimited | Unlimited | Unlimited |

**Yearly Discount**: 2 months free (16% savings)

## Testing

### Manual Testing

1. **Create Checkout Session**:
```bash
curl -X POST http://localhost:3001/billing/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant_abc123",
    "plan": "professional",
    "billingPeriod": "monthly"
  }'
```

Expected response:
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

2. **Get Subscription**:
```bash
curl http://localhost:3001/billing/subscription/sub_123456
```

3. **Cancel Subscription**:
```bash
curl -X DELETE http://localhost:3001/billing/subscription/sub_123456 \
  -H "Content-Type: application/json" \
  -d '{"immediate": false}'
```

4. **Create Billing Portal Session**:
```bash
curl -X POST http://localhost:3001/billing/portal/tenant_abc123
```

5. **Test Webhook** (use Stripe CLI):
```bash
stripe listen --forward-to localhost:3001/billing/webhook
stripe trigger checkout.session.completed
```

### Integration Testing

Use Stripe test mode:
- Test card: `4242 4242 4242 4242` (Visa)
- Expiration: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## Webhook Lifecycle

```
User subscribes → checkout.session.completed
                ↓
          Tenant plan updated
          Subscription ID saved
                ↓
Monthly billing → invoice.paid
                ↓
          Tenant remains active
                ↓
User cancels → customer.subscription.updated (cancel_at_period_end: true)
                ↓
          Period ends → customer.subscription.deleted
                ↓
          Tenant downgraded to free
```

## Production Considerations

### Security

1. **API Key Management**:
   - Never commit Stripe secret keys to version control
   - Use environment variables
   - Rotate keys periodically
   - Use restricted keys where possible

2. **Webhook Security**:
   - Always verify webhook signatures
   - Use HTTPS for webhook endpoint
   - Implement idempotency (handle duplicate events)
   - Log all webhook events for debugging

3. **Authentication**:
   - Add authentication guards to all billing endpoints
   - Verify users can only access their tenant's billing data
   - Implement role-based access (only tenant admins can manage billing)

### Monitoring

1. **Stripe Dashboard**: Monitor subscriptions, failed payments, churned customers
2. **Application Logs**: Track webhook events, errors, subscription changes
3. **Alerts**: Set up alerts for payment failures, webhook errors, subscription cancellations

### Error Handling

1. **Payment Failures**:
   - Send email notifications
   - Grace period before suspension
   - Retry failed payments automatically (Stripe Smart Retries)

2. **Webhook Failures**:
   - Stripe retries webhooks automatically
   - Implement idempotency to handle duplicates
   - Manual sync mechanism for missed events

### Compliance

1. **PCI DSS**: Stripe handles card data (PCI compliant by default)
2. **Tax Collection**: Configure Stripe Tax for automatic tax calculation
3. **Invoicing**: Stripe handles invoice generation and email
4. **Data Retention**: Configure data retention policies in Stripe dashboard

## Next Steps

### Immediate Enhancements

1. **Authentication**: Add JWT guards to billing endpoints
2. **Authorization**: Verify tenant access before operations
3. **Email Notifications**: Send emails for subscription events
4. **Usage Tracking**: Implement metered billing for transaction volume
5. **Plan Limits**: Integrate with TenantService quota enforcement

### Future Features

1. **Proration**: Handle mid-cycle plan changes
2. **Trials**: Offer 14-day free trials
3. **Coupons**: Support promotional codes
4. **Team Plans**: Add per-seat pricing
5. **Annual Discounts**: Offer custom annual pricing
6. **Payment Method Updates**: Prompt for expired cards
7. **Dunning**: Automated payment retry and recovery
8. **Subscription Analytics**: Revenue metrics, MRR, churn rate

## References

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Node.js Library](https://github.com/stripe/stripe-node)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Billing Best Practices](https://stripe.com/docs/billing/subscriptions/best-practices)

## Related Steps

- **Step 211**: Tenant Management & Administration (quota enforcement)
- **Step 213**: Usage Analytics & Reporting (track billing metrics)
- **Step 214**: Tenant Onboarding Flow (trial → paid conversion)

---

**Implementation Date**: 2025-11-18
**Implemented By**: Claude (AI Assistant)
**Reviewed By**: Pending
**Status**: ✅ Complete - Ready for Testing
