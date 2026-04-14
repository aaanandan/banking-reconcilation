// apps/auth-service/src/dto/tenant.dto.ts

import { IsString, IsEmail, IsOptional, IsEnum, IsObject, IsNumber, IsArray, Min, Max } from 'class-validator';

/**
 * DTO for updating tenant profile
 */
export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  domain?: string;
}

/**
 * DTO for updating tenant settings
 */
export class UpdateTenantSettingsDto {
  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  dateFormat?: string;

  @IsArray()
  @IsOptional()
  features?: string[];
}

/**
 * DTO for updating tenant quotas (admin only)
 */
export class UpdateTenantQuotasDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxBankAccounts?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxTransactionsPerMonth?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxStorageMB?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxUsers?: number;
}

/**
 * DTO for updating tenant plan
 */
export class UpdateTenantPlanDto {
  @IsEnum(['free', 'starter', 'professional', 'enterprise'])
  plan: string;

  @IsString()
  @IsOptional()
  stripeSubscriptionId?: string;
}

/**
 * DTO for tenant response
 */
export class TenantResponseDto {
  id: string;
  tenantId: string;
  companyName: string;
  email: string;
  domain: string | null;
  status: string;
  plan: string;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
  quotas: {
    maxBankAccounts: number;
    maxTransactionsPerMonth: number;
    maxStorageMB: number;
    maxUsers: number;
  };
  currentUsage: {
    bankAccounts: number;
    transactionsThisMonth: number;
    storageMB: number;
    users: number;
  };
  settings: {
    timezone: string;
    currency: string;
    dateFormat: string;
    features: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for quota check response
 */
export class QuotaCheckDto {
  canAdd: boolean;
  current: number;
  limit: number;
  remaining: number;
  quotaType: string;
}
