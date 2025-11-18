// apps/auth-service/src/tenant.service.ts

import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '@app/shared/entities/tenant.entity';
import {
  UpdateTenantDto,
  UpdateTenantSettingsDto,
  UpdateTenantQuotasDto,
  UpdateTenantPlanDto,
  TenantResponseDto,
  QuotaCheckDto,
} from './dto/tenant.dto';

/**
 * TenantService
 *
 * Manages tenant operations, quotas, usage tracking, and settings
 */
@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Get tenant by ID
   */
  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  /**
   * Get tenant by tenantId
   */
  async findByTenantId(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }
    return tenant;
  }

  /**
   * Update tenant profile
   */
  async updateProfile(tenantId: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findByTenantId(tenantId);

    if (dto.companyName) tenant.companyName = dto.companyName;
    if (dto.email) tenant.email = dto.email;
    if (dto.domain !== undefined) tenant.domain = dto.domain;

    return this.tenantRepository.save(tenant);
  }

  /**
   * Update tenant settings
   */
  async updateSettings(tenantId: string, dto: UpdateTenantSettingsDto): Promise<Tenant> {
    const tenant = await this.findByTenantId(tenantId);

    tenant.settings = {
      ...tenant.settings,
      ...dto,
    };

    return this.tenantRepository.save(tenant);
  }

  /**
   * Update tenant quotas (admin only)
   */
  async updateQuotas(tenantId: string, dto: UpdateTenantQuotasDto): Promise<Tenant> {
    const tenant = await this.findByTenantId(tenantId);

    tenant.quotas = {
      ...tenant.quotas,
      ...dto,
    };

    this.logger.log(`Updated quotas for tenant ${tenantId}`);
    return this.tenantRepository.save(tenant);
  }

  /**
   * Update tenant plan
   */
  async updatePlan(tenantId: string, dto: UpdateTenantPlanDto): Promise<Tenant> {
    const tenant = await this.findByTenantId(tenantId);

    tenant.plan = dto.plan;
    if (dto.stripeSubscriptionId) {
      tenant.stripeSubscriptionId = dto.stripeSubscriptionId;
    }

    // Update quotas based on plan
    tenant.quotas = this.getPlanQuotas(dto.plan);

    this.logger.log(`Updated plan for tenant ${tenantId} to ${dto.plan}`);
    return this.tenantRepository.save(tenant);
  }

  /**
   * Check if tenant can add a resource
   */
  async checkQuota(tenantId: string, resourceType: 'bankAccounts' | 'users' | 'transactions' | 'storage', amount: number = 1): Promise<QuotaCheckDto> {
    const tenant = await this.findByTenantId(tenantId);

    let current = 0;
    let limit = 0;
    let quotaType = '';

    switch (resourceType) {
      case 'bankAccounts':
        current = tenant.currentUsage.bankAccounts;
        limit = tenant.quotas.maxBankAccounts;
        quotaType = 'Bank Accounts';
        break;
      case 'users':
        current = tenant.currentUsage.users;
        limit = tenant.quotas.maxUsers;
        quotaType = 'Users';
        break;
      case 'transactions':
        current = tenant.currentUsage.transactionsThisMonth;
        limit = tenant.quotas.maxTransactionsPerMonth;
        quotaType = 'Transactions Per Month';
        break;
      case 'storage':
        current = tenant.currentUsage.storageMB;
        limit = tenant.quotas.maxStorageMB;
        quotaType = 'Storage (MB)';
        break;
    }

    const canAdd = (current + amount) <= limit;
    const remaining = Math.max(0, limit - current);

    return {
      canAdd,
      current,
      limit,
      remaining,
      quotaType,
    };
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(tenantId: string, resourceType: 'bankAccounts' | 'users' | 'transactions' | 'storage', amount: number = 1): Promise<void> {
    const tenant = await this.findByTenantId(tenantId);

    // Check quota before incrementing
    const quotaCheck = await this.checkQuota(tenantId, resourceType, amount);
    if (!quotaCheck.canAdd) {
      throw new ForbiddenException(
        `Quota exceeded: ${quotaCheck.quotaType}. ` +
        `Current: ${quotaCheck.current}, Limit: ${quotaCheck.limit}`,
      );
    }

    switch (resourceType) {
      case 'bankAccounts':
        tenant.currentUsage.bankAccounts += amount;
        break;
      case 'users':
        tenant.currentUsage.users += amount;
        break;
      case 'transactions':
        tenant.currentUsage.transactionsThisMonth += amount;
        break;
      case 'storage':
        tenant.currentUsage.storageMB += amount;
        break;
    }

    await this.tenantRepository.save(tenant);
    this.logger.log(`Incremented ${resourceType} for tenant ${tenantId} by ${amount}`);
  }

  /**
   * Decrement usage counter
   */
  async decrementUsage(tenantId: string, resourceType: 'bankAccounts' | 'users' | 'transactions' | 'storage', amount: number = 1): Promise<void> {
    const tenant = await this.findByTenantId(tenantId);

    switch (resourceType) {
      case 'bankAccounts':
        tenant.currentUsage.bankAccounts = Math.max(0, tenant.currentUsage.bankAccounts - amount);
        break;
      case 'users':
        tenant.currentUsage.users = Math.max(0, tenant.currentUsage.users - amount);
        break;
      case 'transactions':
        tenant.currentUsage.transactionsThisMonth = Math.max(0, tenant.currentUsage.transactionsThisMonth - amount);
        break;
      case 'storage':
        tenant.currentUsage.storageMB = Math.max(0, tenant.currentUsage.storageMB - amount);
        break;
    }

    await this.tenantRepository.save(tenant);
    this.logger.log(`Decremented ${resourceType} for tenant ${tenantId} by ${amount}`);
  }

  /**
   * Reset monthly transaction counter
   */
  async resetMonthlyTransactions(tenantId: string): Promise<void> {
    const tenant = await this.findByTenantId(tenantId);
    tenant.currentUsage.transactionsThisMonth = 0;
    await this.tenantRepository.save(tenant);
    this.logger.log(`Reset monthly transactions for tenant ${tenantId}`);
  }

  /**
   * Suspend tenant
   */
  async suspend(tenantId: string, reason?: string): Promise<Tenant> {
    const tenant = await this.findByTenantId(tenantId);
    tenant.status = 'suspended';
    await this.tenantRepository.save(tenant);
    this.logger.warn(`Suspended tenant ${tenantId}. Reason: ${reason || 'Not specified'}`);
    return tenant;
  }

  /**
   * Activate tenant
   */
  async activate(tenantId: string): Promise<Tenant> {
    const tenant = await this.findByTenantId(tenantId);
    tenant.status = 'active';
    await this.tenantRepository.save(tenant);
    this.logger.log(`Activated tenant ${tenantId}`);
    return tenant;
  }

  /**
   * Get plan quotas
   */
  private getPlanQuotas(plan: string) {
    const quotas = {
      free: {
        maxBankAccounts: 1,
        maxTransactionsPerMonth: 100,
        maxStorageMB: 10,
        maxUsers: 1,
      },
      starter: {
        maxBankAccounts: 3,
        maxTransactionsPerMonth: 1000,
        maxStorageMB: 100,
        maxUsers: 5,
      },
      professional: {
        maxBankAccounts: 10,
        maxTransactionsPerMonth: 10000,
        maxStorageMB: 1000,
        maxUsers: 25,
      },
      enterprise: {
        maxBankAccounts: -1, // unlimited
        maxTransactionsPerMonth: -1,
        maxStorageMB: -1,
        maxUsers: -1,
      },
    };

    return quotas[plan] || quotas.free;
  }

  /**
   * Convert tenant to response DTO
   */
  toResponseDto(tenant: Tenant): TenantResponseDto {
    return {
      id: tenant.id,
      tenantId: tenant.tenantId,
      companyName: tenant.companyName,
      email: tenant.email,
      domain: tenant.domain,
      status: tenant.status,
      plan: tenant.plan,
      trialEndsAt: tenant.trialEndsAt,
      subscriptionEndsAt: tenant.subscriptionEndsAt,
      quotas: tenant.quotas,
      currentUsage: tenant.currentUsage,
      settings: tenant.settings,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }
}
