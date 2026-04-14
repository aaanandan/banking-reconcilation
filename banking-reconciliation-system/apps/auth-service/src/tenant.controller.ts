// apps/auth-service/src/tenant.controller.ts

import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { UpdateTenantDto, UpdateTenantSettingsDto, TenantResponseDto, QuotaCheckDto } from './dto/tenant.dto';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * TenantController
 *
 * Endpoints for tenant management and administration
 */
@Controller('tenants')
@UseGuards(ThrottlerGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /**
   * Get tenant by ID
   */
  @Get(':tenantId')
  async getTenant(@Param('tenantId') tenantId: string): Promise<TenantResponseDto> {
    const tenant = await this.tenantService.findByTenantId(tenantId);
    return this.tenantService.toResponseDto(tenant);
  }

  /**
   * Update tenant profile
   */
  @Put(':tenantId/profile')
  async updateProfile(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    const tenant = await this.tenantService.updateProfile(tenantId, dto);
    return this.tenantService.toResponseDto(tenant);
  }

  /**
   * Update tenant settings
   */
  @Put(':tenantId/settings')
  async updateSettings(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantSettingsDto,
  ): Promise<TenantResponseDto> {
    const tenant = await this.tenantService.updateSettings(tenantId, dto);
    return this.tenantService.toResponseDto(tenant);
  }

  /**
   * Check quota for a resource type
   */
  @Get(':tenantId/quotas/:resourceType')
  async checkQuota(
    @Param('tenantId') tenantId: string,
    @Param('resourceType') resourceType: 'bankAccounts' | 'users' | 'transactions' | 'storage',
  ): Promise<QuotaCheckDto> {
    return this.tenantService.checkQuota(tenantId, resourceType);
  }
}
