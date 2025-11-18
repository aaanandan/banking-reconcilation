import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between, IsNull, Not } from 'typeorm';
import { Tenant } from '@app/shared/entities/tenant.entity';
import { User } from '@app/shared/entities/user.entity';
import { AuditLog } from '@app/shared/entities/audit-log.entity';
import { TenantService } from './tenant.service';
import { AnalyticsService } from './analytics.service';
import { OnboardingService } from './onboarding.service';
import { FeatureFlagService } from './feature-flag.service';
import {
  AdminDashboardOverviewDto,
  TenantManagementDto,
  TenantActionDto,
  AdminActionEnum,
  UserManagementDto,
  SystemHealthDto,
  RevenueMetricsDto,
  GrowthMetricsDto,
  PlatformUsageDto,
  AdminAuditLogDto,
  TenantSearchDto,
  TenantListResponseDto,
  AdminAlertDto,
  AdminSettingsDto,
  BulkOperationDto,
  BulkOperationResultDto,
} from './dto/admin.dto';

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private tenantService: TenantService,
    private analyticsService: AnalyticsService,
    private onboardingService: OnboardingService,
    private featureFlagService: FeatureFlagService,
  ) {}

  /**
   * Get comprehensive dashboard overview
   */
  async getDashboardOverview(): Promise<AdminDashboardOverviewDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Tenant metrics
    const totalTenants = await this.tenantRepository.count();
    const activeTenants = await this.tenantRepository.count({ where: { status: 'active' } });
    const suspendedTenants = await this.tenantRepository.count({ where: { status: 'suspended' } });

    const trialsQuery = await this.tenantRepository
      .createQueryBuilder('tenant')
      .where('tenant.plan = :plan', { plan: 'free' })
      .andWhere('tenant.subscriptionStatus = :status', { status: 'trialing' })
      .getCount();
    const trialTenants = trialsQuery;

    const paidTenants = totalTenants - trialTenants - suspendedTenants;

    // User metrics
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { isActive: true } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await this.userRepository.count({
      where: { createdAt: MoreThan(today) },
    });

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await this.userRepository.count({
      where: { createdAt: MoreThan(weekAgo) },
    });

    const newUsersThisMonth = await this.userRepository.count({
      where: { createdAt: MoreThan(startOfMonth) },
    });

    // Revenue metrics
    const revenueMetrics = await this.calculateRevenueMetrics();

    // Conversion metrics
    const onboardingMetrics = await this.onboardingService.getMetrics();
    const trialConversionRate = onboardingMetrics.conversionRate;
    const churnRate = await this.calculateChurnRate();

    // Activity metrics (would integrate with actual reconciliation service)
    const totalReconciliations = 0; // Placeholder
    const totalTransactions = 0; // Placeholder
    const activeReconciliationsToday = 0; // Placeholder

    // System health
    const systemHealth = await this.analyticsService.getSystemHealth();

    // Feature adoption
    const flagStats = await this.featureFlagService.getStatistics();
    const featureFlagUsage = flagStats.mostUsedFlags;

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      trialTenants,
      paidTenants,

      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,

      monthlyRecurringRevenue: revenueMetrics.monthlyRecurringRevenue,
      annualRecurringRevenue: revenueMetrics.annualRecurringRevenue,
      averageRevenuePerUser: revenueMetrics.averageRevenuePerUser,

      trialConversionRate,
      churnRate,

      totalReconciliations,
      totalTransactions,
      activeReconciliationsToday,

      systemStatus: systemHealth.status,
      apiResponseTime: systemHealth.performance.averageResponseTime,
      databaseResponseTime: systemHealth.databaseMetrics.queryPerformance,
      errorRate: systemHealth.performance.errorRate,

      featureFlagUsage,
      mostUsedFeatures: featureFlagUsage.map(f => f.flagKey).slice(0, 5),

      periodStart: startOfMonth,
      periodEnd: now,
      lastUpdated: now,
    };
  }

  /**
   * Get tenant list with filtering and pagination
   */
  async getTenants(dto: TenantSearchDto): Promise<TenantListResponseDto> {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const query = this.tenantRepository.createQueryBuilder('tenant');

    // Apply filters
    if (dto.query) {
      query.andWhere(
        '(tenant.companyName ILIKE :query OR tenant.email ILIKE :query OR tenant.tenantId ILIKE :query)',
        { query: `%${dto.query}%` },
      );
    }

    if (dto.plan) {
      query.andWhere('tenant.plan = :plan', { plan: dto.plan });
    }

    if (dto.status) {
      query.andWhere('tenant.status = :status', { status: dto.status });
    }

    if (dto.onTrial !== undefined) {
      if (dto.onTrial) {
        query.andWhere('tenant.subscriptionStatus = :status', { status: 'trialing' });
      } else {
        query.andWhere('tenant.subscriptionStatus != :status', { status: 'trialing' });
      }
    }

    // Sorting
    const sortBy = dto.sortBy || 'createdAt';
    query.orderBy(`tenant.${sortBy}`, 'DESC');

    // Pagination
    query.skip(skip).take(pageSize);

    const [tenants, total] = await query.getManyAndCount();

    // Map to DTOs
    const tenantDtos = await Promise.all(
      tenants.map(tenant => this.mapTenantToManagementDto(tenant)),
    );

    return {
      tenants: tenantDtos,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get user list with filtering
   */
  async getUsers(page: number = 1, pageSize: number = 50): Promise<UserManagementDto[]> {
    const users = await this.userRepository.find({
      take: pageSize,
      skip: (page - 1) * pageSize,
      order: { createdAt: 'DESC' },
    });

    return Promise.all(users.map(user => this.mapUserToManagementDto(user)));
  }

  /**
   * Perform admin action on tenant
   */
  async performTenantAction(dto: TenantActionDto, adminId: string): Promise<void> {
    const tenant = await this.tenantService.findByTenantId(dto.tenantId);

    switch (dto.action) {
      case AdminActionEnum.SUSPEND_TENANT:
        tenant.status = 'suspended';
        await this.tenantRepository.save(tenant);
        break;

      case AdminActionEnum.ACTIVATE_TENANT:
        tenant.status = 'active';
        await this.tenantRepository.save(tenant);
        break;

      case AdminActionEnum.EXTEND_TRIAL:
        const days = dto.metadata?.days || 7;
        await this.onboardingService.extendTrial({
          tenantId: dto.tenantId,
          extensionDays: days,
          reason: dto.reason || 'Admin extension',
        });
        break;

      case AdminActionEnum.UPGRADE_PLAN:
        const newPlan = dto.metadata?.plan;
        if (!newPlan) {
          throw new BadRequestException('Plan is required for upgrade action');
        }
        await this.tenantService.updateTenant(dto.tenantId, { plan: newPlan });
        break;

      case AdminActionEnum.RESET_QUOTA:
        tenant.transactionsCount = 0;
        tenant.storageUsedMB = 0;
        await this.tenantRepository.save(tenant);
        break;

      default:
        throw new BadRequestException(`Unsupported action: ${dto.action}`);
    }

    // Log admin action
    await this.logAdminAction(adminId, dto.action, 'tenant', dto.tenantId, dto.reason);

    this.logger.log(`Admin action performed: ${dto.action} on tenant ${dto.tenantId} by ${adminId}`);
  }

  /**
   * Bulk operation on tenants
   */
  async performBulkOperation(dto: BulkOperationDto, adminId: string): Promise<BulkOperationResultDto> {
    const results: BulkOperationResultDto['results'] = [];
    let successful = 0;
    let failed = 0;

    for (const tenantId of dto.tenantIds) {
      try {
        await this.performTenantAction(
          {
            tenantId,
            action: dto.action,
            reason: dto.reason,
          },
          adminId,
        );

        results.push({ tenantId, success: true });
        successful++;
      } catch (error) {
        results.push({
          tenantId,
          success: false,
          error: error.message,
        });
        failed++;
      }
    }

    return {
      totalRequested: dto.tenantIds.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(): Promise<RevenueMetricsDto> {
    return this.calculateRevenueMetrics();
  }

  /**
   * Get growth metrics
   */
  async getGrowthMetrics(): Promise<GrowthMetricsDto> {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // User growth
    const totalUsers = await this.userRepository.count();
    const newUsersToday = await this.userRepository.count({ where: { createdAt: MoreThan(today) } });
    const newUsersThisWeek = await this.userRepository.count({ where: { createdAt: MoreThan(weekAgo) } });
    const newUsersThisMonth = await this.userRepository.count({ where: { createdAt: MoreThan(monthAgo) } });

    // Tenant growth
    const totalTenants = await this.tenantRepository.count();
    const newTenantsToday = await this.tenantRepository.count({ where: { createdAt: MoreThan(today) } });
    const newTenantsThisWeek = await this.tenantRepository.count({ where: { createdAt: MoreThan(weekAgo) } });
    const newTenantsThisMonth = await this.tenantRepository.count({ where: { createdAt: MoreThan(monthAgo) } });

    const onboardingMetrics = await this.onboardingService.getMetrics();

    return {
      totalUsers,
      newUsers: {
        today: newUsersToday,
        thisWeek: newUsersThisWeek,
        thisMonth: newUsersThisMonth,
      },
      userGrowthRate: totalUsers > 0 ? (newUsersThisMonth / totalUsers) * 100 : 0,

      totalTenants,
      newTenants: {
        today: newTenantsToday,
        thisWeek: newTenantsThisWeek,
        thisMonth: newTenantsThisMonth,
      },
      tenantGrowthRate: totalTenants > 0 ? (newTenantsThisMonth / totalTenants) * 100 : 0,

      activationRate: onboardingMetrics.completionRate,
      timeToActivation: onboardingMetrics.averageCompletionTime / 24, // Convert to days

      retentionRate: 100 - onboardingMetrics.completionRate,
      churnRate: await this.calculateChurnRate(),

      cohorts: [], // Would implement cohort analysis
    };
  }

  /**
   * Get platform usage metrics
   */
  async getPlatformUsage(): Promise<PlatformUsageDto> {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Would integrate with actual reconciliation/transaction services
    return {
      totalReconciliations: 0,
      reconciliationsToday: 0,
      reconciliationsThisWeek: 0,
      reconciliationsThisMonth: 0,
      averageMatchRate: 0,

      totalTransactions: 0,
      transactionsToday: 0,
      transactionsThisWeek: 0,
      transactionsThisMonth: 0,

      totalApiCalls: 0,
      apiCallsToday: 0,
      averageResponseTime: 0,
      errorRate: 0,

      totalStorageUsedGB: 0,
      averageStoragePerTenant: 0,

      topUsers: [],
      topTenants: [],
    };
  }

  /**
   * Get admin audit logs
   */
  async getAdminAuditLogs(limit: number = 100): Promise<AdminAuditLogDto[]> {
    const logs = await this.auditLogRepository.find({
      where: {
        action: Not(IsNull()),
      },
      order: { timestamp: 'DESC' },
      take: limit,
    });

    return logs.map(log => ({
      id: log.id,
      adminId: log.userId || 'system',
      adminEmail: log.userEmail || 'system',
      action: log.action,
      targetType: 'system' as const,
      targetId: log.tenantId || '',
      changes: log.metadata,
      reason: log.metadata?.reason,
      ipAddress: log.ipAddress || '',
      timestamp: log.timestamp,
    }));
  }

  /**
   * Get system alerts
   */
  async getAlerts(): Promise<AdminAlertDto[]> {
    const alerts: AdminAlertDto[] = [];

    // Check for tenants nearing quota limits
    const tenants = await this.tenantRepository.find({ where: { status: 'active' } });

    for (const tenant of tenants) {
      const quotaAlerts = await this.analyticsService.checkQuotaAlerts(tenant.tenantId);

      quotaAlerts.forEach(alert => {
        if (alert.alertLevel === 'critical') {
          alerts.push({
            id: `quota-${tenant.tenantId}-${alert.resourceType}`,
            type: 'critical',
            category: 'usage',
            title: `Quota Critical: ${tenant.companyName}`,
            message: alert.message,
            actionRequired: true,
            tenantId: tenant.tenantId,
            metadata: alert,
            createdAt: new Date(),
          });
        }
      });
    }

    return alerts;
  }

  // ==================== Private Helper Methods ====================

  private async mapTenantToManagementDto(tenant: Tenant): Promise<TenantManagementDto> {
    return {
      tenantId: tenant.tenantId,
      companyName: tenant.companyName || tenant.tenantId,
      email: tenant.email || '',
      plan: tenant.plan,
      status: tenant.status,
      subscriptionStatus: tenant.subscriptionStatus,
      trialEndDate: tenant.nextBillingDate,
      createdAt: tenant.createdAt,

      usersCount: tenant.usersCount || 0,
      bankAccountsCount: tenant.bankAccountsCount || 0,
      transactionsCount: tenant.transactionsCount || 0,
      storageUsedMB: tenant.storageUsedMB || 0,

      lastLoginAt: tenant.lastLoginAt,
      totalReconciliations: 0, // Would query reconciliation service

      monthlySpend: this.getMonthlySpend(tenant.plan),
      lifetimeValue: this.getMonthlySpend(tenant.plan) * 12, // Simple calculation

      healthScore: this.calculateHealthScore(tenant),
      riskLevel: this.calculateRiskLevel(tenant),
    };
  }

  private async mapUserToManagementDto(user: User): Promise<UserManagementDto> {
    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantId: user.tenantId || '',
      tenantName: '', // Would join with tenant
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,

      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      loginCount: 0, // Would track separately

      reconciliationsCount: 0,
      transactionsCount: 0,

      isAdmin: user.role === 'admin',
      isSuspended: !user.isActive,
    };
  }

  private async calculateRevenueMetrics(): Promise<RevenueMetricsDto> {
    const tenants = await this.tenantRepository.find({ where: { status: 'active' } });

    const planPrices = {
      free: 0,
      starter: 29,
      professional: 99,
      enterprise: 299,
    };

    let monthlyRevenue = 0;
    const revenueByPlan = {
      free: { plan: 'free', revenue: 0, customerCount: 0, percentage: 0 },
      starter: { plan: 'starter', revenue: 0, customerCount: 0, percentage: 0 },
      professional: { plan: 'professional', revenue: 0, customerCount: 0, percentage: 0 },
      enterprise: { plan: 'enterprise', revenue: 0, customerCount: 0, percentage: 0 },
    };

    tenants.forEach(tenant => {
      const price = planPrices[tenant.plan] || 0;
      monthlyRevenue += price;

      if (revenueByPlan[tenant.plan]) {
        revenueByPlan[tenant.plan].revenue += price;
        revenueByPlan[tenant.plan].customerCount += 1;
      }
    });

    const totalUsers = await this.userRepository.count();

    return {
      currentMonthRevenue: monthlyRevenue,
      currentMonthGrowth: 0, // Would calculate from historical data

      monthlyRecurringRevenue: monthlyRevenue,
      mrrGrowth: 0,

      annualRecurringRevenue: monthlyRevenue * 12,
      arrGrowth: 0,

      averageRevenuePerUser: totalUsers > 0 ? monthlyRevenue / totalUsers : 0,
      averageRevenuePerTenant: tenants.length > 0 ? monthlyRevenue / tenants.length : 0,

      revenueByPlan: Object.values(revenueByPlan).map(r => ({
        ...r,
        percentage: monthlyRevenue > 0 ? (r.revenue / monthlyRevenue) * 100 : 0,
      })),

      churnRate: 0, // Would calculate from historical data
      churnedRevenue: 0,

      projectedMRR: monthlyRevenue * 1.1, // Simple 10% growth projection
      projectedARR: monthlyRevenue * 12 * 1.1,
    };
  }

  private async calculateChurnRate(): Promise<number> {
    // Simplified calculation - would use historical data
    return 5; // 5% placeholder
  }

  private getMonthlySpend(plan: string): number {
    const prices = {
      free: 0,
      starter: 29,
      professional: 99,
      enterprise: 299,
    };
    return prices[plan] || 0;
  }

  private calculateHealthScore(tenant: Tenant): number {
    let score = 100;

    // Deduct points for various factors
    if (tenant.status !== 'active') score -= 50;
    if (tenant.subscriptionStatus === 'past_due') score -= 30;
    if (!tenant.lastLoginAt) score -= 20;

    // Add points for engagement
    if ((tenant.transactionsCount || 0) > 100) score += 10;
    if ((tenant.usersCount || 0) > 1) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateRiskLevel(tenant: Tenant): 'low' | 'medium' | 'high' {
    const score = this.calculateHealthScore(tenant);

    if (score >= 70) return 'low';
    if (score >= 40) return 'medium';
    return 'high';
  }

  private async logAdminAction(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    reason?: string,
  ): Promise<void> {
    await this.auditLogRepository.save({
      userId: adminId,
      action: `admin_${action}`,
      tenantId: targetId,
      resource: targetType,
      metadata: { reason },
      timestamp: new Date(),
    });
  }
}
