// Step 243: StripeService — copied exactly from Document 7
// apps/billing-service/src/stripe.service.ts (adapted to JS)
// Install: npm install stripe

const Stripe = require('stripe');
const { getPlanByPriceId } = require('./pricing');
const logger = require('./logger');

class StripeService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  // Step 242: Create Stripe customer for a new tenant
  async createCustomer(email, name, tenantId) {
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: { tenantId },
    });
    logger.info('Stripe customer created', { customerId: customer.id, tenantId });
    return customer.id;
  }

  // Step 244: Create subscription
  async createSubscription(customerId, priceId, tenantId) {
    return await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: { tenantId },
    });
  }

  // Step 245: Update subscription (upgrade / downgrade)
  async updateSubscription(subscriptionId, newPriceId) {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    return await this.stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
    });
  }

  // Step 245: Cancel subscription
  async cancelSubscription(subscriptionId) {
    await this.stripe.subscriptions.cancel(subscriptionId);
    logger.info('Subscription cancelled', { subscriptionId });
  }

  // Step 246: Webhook handler — copied exactly from Document 7
  async handleWebhook(payload, signature) {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    logger.info('Stripe webhook received', { type: event.type });

    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      default:
        logger.info('Unhandled webhook event', { type: event.type });
    }
  }

  async handleSubscriptionCreated(subscription) {
    const tenantId = subscription.metadata?.tenantId;
    const plan = getPlanByPriceId(subscription.items.data[0]?.price?.id);
    logger.info('Subscription created', { tenantId, plan, subscriptionId: subscription.id });
  }

  async handleSubscriptionUpdated(subscription) {
    const tenantId = subscription.metadata?.tenantId;
    const plan = getPlanByPriceId(subscription.items.data[0]?.price?.id);
    logger.info('Subscription updated', { tenantId, plan, status: subscription.status });
  }

  async handleSubscriptionDeleted(subscription) {
    const tenantId = subscription.metadata?.tenantId;
    logger.info('Subscription deleted', { tenantId, subscriptionId: subscription.id });
  }

  async handlePaymentSucceeded(invoice) {
    logger.info('Payment succeeded', { customerId: invoice.customer, amount: invoice.amount_paid });
  }

  async handlePaymentFailed(invoice) {
    logger.warn('Payment failed', { customerId: invoice.customer, amount: invoice.amount_due });
  }

  // Step 258: Invoice generation
  async getInvoices(customerId, limit = 10) {
    return await this.stripe.invoices.list({ customer: customerId, limit });
  }

  async getUpcomingInvoice(customerId) {
    return await this.stripe.invoices.retrieveUpcoming({ customer: customerId });
  }

  // Step 257: Refund
  async createRefund(paymentIntentId, amount = null) {
    const params = { payment_intent: paymentIntentId };
    if (amount) params.amount = amount;
    return await this.stripe.refunds.create(params);
  }
}

module.exports = new StripeService();
