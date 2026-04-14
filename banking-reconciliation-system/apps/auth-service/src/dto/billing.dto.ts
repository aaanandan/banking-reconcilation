// apps/auth-service/src/dto/billing.dto.ts

import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

/**
 * DTO for creating a checkout session
 */
export class CreateCheckoutSessionDto {
  @IsEnum(['starter', 'professional', 'enterprise'])
  plan: string;

  @IsEnum(['monthly', 'yearly'])
  @IsOptional()
  billingPeriod?: string;

  @IsString()
  @IsOptional()
  successUrl?: string;

  @IsString()
  @IsOptional()
  cancelUrl?: string;
}

/**
 * DTO for subscription response
 */
export class SubscriptionResponseDto {
  id: string;
  status: string;
  plan: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
}

/**
 * DTO for invoice response
 */
export class InvoiceResponseDto {
  id: string;
  number: string;
  status: string;
  amount: number;
  currency: string;
  dueDate: Date;
  paidAt: Date | null;
  invoiceUrl: string;
}

/**
 * DTO for payment method response
 */
export class PaymentMethodResponseDto {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

/**
 * DTO for billing portal session
 */
export class BillingPortalSessionDto {
  url: string;
}

/**
 * DTO for usage record (for metered billing)
 */
export class CreateUsageRecordDto {
  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  action?: 'increment' | 'set';
}
