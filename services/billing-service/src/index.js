// Step 243: Billing Service Express App
// Banking Reconciliation SaaS Platform

const express = require('express');
const stripeService = require('./stripe.service');
const { checkQuota, getUsageSummary, setTenantPlan } = require('./usage-tracking.service');
const { PRICING_TIERS } = require('./pricing');
const logger = require('./logger');

const app = express();
const PORT = process.env.BILLING_SERVICE_PORT || 3004;

// Raw body for Stripe webhooks — must come before json middleware
app.use('/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'billing-service', timestamp: new Date().toISOString() });
});

// Step 242: Get pricing plans
app.get('/billing/plans', (req, res) => {
  res.json({ plans: PRICING_TIERS });
});

// Step 244: Create subscription — called after Stripe Checkout
app.post('/billing/subscribe', async (req, res) => {
  try {
    const { email, name, tenantId, planKey } = req.body;
    const tier = PRICING_TIERS[planKey];
    if (!tier || !tier.stripePriceId) {
      return res.status(400).json({ error: 'Invalid plan or plan has no price' });
    }

    const customerId = await stripeService.createCustomer(email, name, tenantId);
    const subscription = await stripeService.createSubscription(customerId, tier.stripePriceId, tenantId);
    setTenantPlan(tenantId, planKey);

    logger.info('Subscription created', { tenantId, planKey, subscriptionId: subscription.id });
    res.json({ subscriptionId: subscription.id, customerId, clientSecret: subscription.latest_invoice?.payment_intent?.client_secret });
  } catch (err) {
    logger.error('Subscribe failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Step 245: Upgrade/downgrade subscription
app.post('/billing/change-plan', async (req, res) => {
  try {
    const { subscriptionId, newPlanKey, tenantId } = req.body;
    const tier = PRICING_TIERS[newPlanKey];
    if (!tier || !tier.stripePriceId) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const updated = await stripeService.updateSubscription(subscriptionId, tier.stripePriceId);
    setTenantPlan(tenantId, newPlanKey);

    logger.info('Plan changed', { tenantId, newPlanKey, subscriptionId });
    res.json({ subscription: updated });
  } catch (err) {
    logger.error('Change plan failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Step 245: Cancel subscription
app.post('/billing/cancel', async (req, res) => {
  try {
    const { subscriptionId, tenantId } = req.body;
    await stripeService.cancelSubscription(subscriptionId);
    setTenantPlan(tenantId, 'free');

    logger.info('Subscription cancelled', { tenantId, subscriptionId });
    res.json({ cancelled: true });
  } catch (err) {
    logger.error('Cancel failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Step 248: Check quota before allowing an operation
app.get('/billing/quota/:tenantId/:resource', async (req, res) => {
  const { tenantId, resource } = req.params;
  const allowed = await checkQuota(tenantId, resource);
  res.json({ allowed, tenantId, resource });
});

// Step 247: Get usage summary for a tenant
app.get('/billing/usage/:tenantId', (req, res) => {
  const summary = getUsageSummary(req.params.tenantId);
  res.json(summary);
});

// Step 258: Invoice list
app.get('/billing/invoices/:customerId', async (req, res) => {
  try {
    const invoices = await stripeService.getInvoices(req.params.customerId);
    res.json({ invoices: invoices.data });
  } catch (err) {
    logger.error('Get invoices failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Step 258: Upcoming invoice
app.get('/billing/invoices/:customerId/upcoming', async (req, res) => {
  try {
    const invoice = await stripeService.getUpcomingInvoice(req.params.customerId);
    res.json({ invoice });
  } catch (err) {
    logger.error('Get upcoming invoice failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Step 257: Refund
app.post('/billing/refund', async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;
    const refund = await stripeService.createRefund(paymentIntentId, amount);
    logger.info('Refund created', { refundId: refund.id, amount });
    res.json({ refund });
  } catch (err) {
    logger.error('Refund failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Step 246: Stripe webhook
app.post('/billing/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  try {
    await stripeService.handleWebhook(req.body, signature);
    res.json({ received: true });
  } catch (err) {
    logger.error('Webhook failed', { error: err.message });
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  logger.info('Billing service started', { port: PORT });
});

module.exports = app;
