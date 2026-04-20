// apps/auth-service/src/billing.controller.ts

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Headers,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { StripeService } from './stripe.service';
import {
  CreateCheckoutSessionDto,
  SubscriptionResponseDto,
  InvoiceResponseDto,
  PaymentMethodResponseDto,
  BillingPortalSessionDto,
} from './dto/billing.dto';

/**
 * BillingController
 *
 * Handles subscription and billing operations with Stripe
 */
@Controller('billing')
@UseGuards(ThrottlerGuard)
export class BillingController {
  constructor(private readonly stripeService: StripeService) {}

  /**
   * Create checkout session for subscription
   */
  @Post('checkout')
  async createCheckout(
    @Body() dto: CreateCheckoutSessionDto,
    @Body('tenantId') tenantId: string,
  ): Promise<{ sessionId: string; url: string }> {
    // NOTE: In production, get tenantId from authenticated user
    return this.stripeService.createCheckoutSession(tenantId, dto);
  }

  /**
   * Get subscription details
   */
  @Get('subscription/:subscriptionId')
  async getSubscription(
    @Param('subscriptionId') subscriptionId: string,
  ): Promise<SubscriptionResponseDto> {
    return this.stripeService.getSubscription(subscriptionId);
  }

  /**
   * Cancel subscription
   */
  @Delete('subscription/:subscriptionId')
  async cancelSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body('immediate') immediate?: boolean,
  ): Promise<{ message: string }> {
    await this.stripeService.cancelSubscription(subscriptionId, immediate);
    return {
      message: immediate
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at the end of the current period',
    };
  }

  /**
   * Reactivate cancelled subscription
   */
  @Post('subscription/:subscriptionId/reactivate')
  async reactivateSubscription(
    @Param('subscriptionId') subscriptionId: string,
  ): Promise<{ message: string }> {
    await this.stripeService.reactivateSubscription(subscriptionId);
    return { message: 'Subscription reactivated' };
  }

  /**
   * Get invoices for tenant
   */
  @Get('invoices/:tenantId')
  async getInvoices(@Param('tenantId') tenantId: string): Promise<InvoiceResponseDto[]> {
    // NOTE: In production, verify user has access to this tenant
    return this.stripeService.getInvoices(tenantId);
  }

  /**
   * Get payment methods for tenant
   */
  @Get('payment-methods/:tenantId')
  async getPaymentMethods(@Param('tenantId') tenantId: string): Promise<PaymentMethodResponseDto[]> {
    // NOTE: In production, verify user has access to this tenant
    return this.stripeService.getPaymentMethods(tenantId);
  }

  /**
   * Create billing portal session
   */
  @Post('portal/:tenantId')
  async createPortalSession(@Param('tenantId') tenantId: string): Promise<BillingPortalSessionDto> {
    // NOTE: In production, verify user has access to this tenant
    return this.stripeService.createBillingPortalSession(tenantId);
  }

  /**
   * Stripe webhook endpoint
   */
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ): Promise<{ received: boolean }> {
    // NOTE: NestJS must be configured to provide raw body for webhook verification
    // See main.ts configuration
    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new Error('Raw body required for webhook verification');
    }

    return this.stripeService.handleWebhook(signature, rawBody);
  }
}
