// apps/auth-service/src/stripe.service.ts

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { TenantService } from './tenant.service';
import {
  CreateCheckoutSessionDto,
  SubscriptionResponseDto,
  InvoiceResponseDto,
  PaymentMethodResponseDto,
  BillingPortalSessionDto,
} from './dto/billing.dto';

/**
 * StripeService
 *
 * Handles all Stripe billing and subscription operations
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  // Plan pricing (in cents)
  private readonly planPrices = {
    starter: {
      monthly: 2900, // $29/month
      yearly: 29000, // $290/year (2 months free)
    },
    professional: {
      monthly: 9900, // $99/month
      yearly: 99000, // $990/year (2 months free)
    },
    enterprise: {
      monthly: 29900, // $299/month
      yearly: 299000, // $2990/year (2 months free)
    },
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly tenantService: TenantService,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured');
    }
    this.stripe = new Stripe(apiKey || 'sk_test_dummy', {
      apiVersion: '2024-11-20.acacia',
    });
  }

  /**
   * Create or get Stripe customer for tenant
   */
  async getOrCreateCustomer(tenantId: string): Promise<string> {
    const tenant = await this.tenantService.findByTenantId(tenantId);

    // Return existing customer if already created
    if (tenant.stripeCustomerId) {
      return tenant.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await this.stripe.customers.create({
      email: tenant.email,
      name: tenant.companyName,
      metadata: {
        tenantId: tenant.tenantId,
        internalId: tenant.id,
      },
    });

    // Save customer ID to tenant
    await this.tenantService.findByTenantId(tenantId);
    tenant.stripeCustomerId = customer.id;
    await this.tenantService.updateProfile(tenantId, {});

    this.logger.log(`Created Stripe customer ${customer.id} for tenant ${tenantId}`);
    return customer.id;
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(
    tenantId: string,
    dto: CreateCheckoutSessionDto,
  ): Promise<{ sessionId: string; url: string }> {
    const customerId = await this.getOrCreateCustomer(tenantId);
    const billingPeriod = dto.billingPeriod || 'monthly';

    // Get price amount
    const amount = this.planPrices[dto.plan]?.[billingPeriod];
    if (!amount) {
      throw new BadRequestException(`Invalid plan: ${dto.plan}`);
    }

    // Create or get price in Stripe
    const priceId = await this.getOrCreatePrice(dto.plan, billingPeriod, amount);

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: dto.successUrl || `${this.configService.get('FRONTEND_URL')}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: dto.cancelUrl || `${this.configService.get('FRONTEND_URL')}/billing/cancel`,
      metadata: {
        tenantId,
        plan: dto.plan,
        billingPeriod,
      },
    });

    this.logger.log(`Created checkout session ${session.id} for tenant ${tenantId}`);
    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  /**
   * Get or create Stripe price
   */
  private async getOrCreatePrice(
    plan: string,
    billingPeriod: string,
    amount: number,
  ): Promise<string> {
    // In production, you would store price IDs in config/database
    // For now, create prices on-the-fly (idempotent with lookup_key)
    const lookupKey = `${plan}_${billingPeriod}`;

    try {
      const prices = await this.stripe.prices.list({
        lookup_keys: [lookupKey],
        limit: 1,
      });

      if (prices.data.length > 0) {
        return prices.data[0].id;
      }
    } catch (error) {
      this.logger.warn(`Price lookup failed: ${error.message}`);
    }

    // Create new price
    const price = await this.stripe.prices.create({
      currency: 'usd',
      unit_amount: amount,
      recurring: {
        interval: billingPeriod === 'yearly' ? 'year' : 'month',
      },
      product_data: {
        name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        description: `Banking Reconciliation ${plan} subscription`,
      },
      lookup_key: lookupKey,
    });

    return price.id;
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionResponseDto> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

    return {
      id: subscription.id,
      status: subscription.status,
      plan: subscription.metadata?.plan || 'unknown',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      amount: subscription.items.data[0]?.price.unit_amount || 0,
      currency: subscription.items.data[0]?.price.currency || 'usd',
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, immediate: boolean = false): Promise<void> {
    if (immediate) {
      await this.stripe.subscriptions.cancel(subscriptionId);
      this.logger.log(`Cancelled subscription ${subscriptionId} immediately`);
    } else {
      await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      this.logger.log(`Scheduled subscription ${subscriptionId} for cancellation at period end`);
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    this.logger.log(`Reactivated subscription ${subscriptionId}`);
  }

  /**
   * Get invoices for customer
   */
  async getInvoices(tenantId: string, limit: number = 10): Promise<InvoiceResponseDto[]> {
    const customerId = await this.getOrCreateCustomer(tenantId);

    const invoices = await this.stripe.invoices.list({
      customer: customerId,
      limit,
    });

    return invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number || '',
      status: invoice.status || 'draft',
      amount: invoice.amount_due,
      currency: invoice.currency,
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : new Date(),
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : null,
      invoiceUrl: invoice.hosted_invoice_url || '',
    }));
  }

  /**
   * Get payment methods for customer
   */
  async getPaymentMethods(tenantId: string): Promise<PaymentMethodResponseDto[]> {
    const customerId = await this.getOrCreateCustomer(tenantId);

    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data.map((pm) => ({
      id: pm.id,
      type: pm.type,
      card: pm.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          }
        : undefined,
    }));
  }

  /**
   * Create billing portal session
   */
  async createBillingPortalSession(tenantId: string): Promise<BillingPortalSessionDto> {
    const customerId = await this.getOrCreateCustomer(tenantId);

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${this.configService.get('FRONTEND_URL')}/billing`,
    });

    return {
      url: session.url,
    };
  }

  /**
   * Handle Stripe webhook event
   */
  async handleWebhook(
    signature: string,
    rawBody: Buffer,
  ): Promise<{ received: boolean; event?: string }> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Processing webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true, event: event.type };
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const tenantId = session.metadata?.tenantId;
    const plan = session.metadata?.plan;

    if (!tenantId || !plan) {
      this.logger.warn('Missing metadata in checkout session');
      return;
    }

    const subscriptionId = session.subscription as string;

    // Update tenant with subscription
    await this.tenantService.updatePlan(tenantId, {
      plan,
      stripeSubscriptionId: subscriptionId,
    });

    this.logger.log(`Checkout completed for tenant ${tenantId}, plan: ${plan}`);
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;

    if (!tenantId) {
      this.logger.warn('Missing tenantId in subscription metadata');
      return;
    }

    // Update tenant status based on subscription status
    const tenant = await this.tenantService.findByTenantId(tenantId);

    if (subscription.status === 'active') {
      if (tenant.status !== 'active') {
        await this.tenantService.activate(tenantId);
      }
    } else if (subscription.status === 'past_due' || subscription.status === 'canceled') {
      await this.tenantService.suspend(tenantId, `Subscription ${subscription.status}`);
    }

    this.logger.log(`Subscription updated for tenant ${tenantId}: ${subscription.status}`);
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;

    if (!tenantId) {
      this.logger.warn('Missing tenantId in subscription metadata');
      return;
    }

    // Downgrade to free plan
    await this.tenantService.updatePlan(tenantId, {
      plan: 'free',
    });

    this.logger.log(`Subscription deleted for tenant ${tenantId}, downgraded to free`);
  }

  /**
   * Handle invoice paid
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Invoice paid: ${invoice.id}`);
    // Could send payment confirmation email here
  }

  /**
   * Handle invoice payment failed
   */
  private async handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
    this.logger.warn(`Invoice payment failed: ${invoice.id}`);
    // Could send payment failure notification here
  }
}
