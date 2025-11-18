import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Tenant } from '@app/shared/entities/tenant.entity';
import { AuditLog } from '@app/shared/entities/audit-log.entity';
import { TenantService } from './tenant.service';
import {
  GetAnalyticsDto,
  DashboardMetricsDto,
  TimeSeriesMetricDto,
  TimeSeriesDataPointDto,
  UsageReportDto,
  TopBankAccountDto,
  TopUserDto,
  ReconciliationStatsDto,
  TransactionStatsDto,
  SystemHealthDto,
  TimeRangeEnum,
  MetricTypeEnum,
  AnalyticsEventDto,
  QuotaAlertDto,
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private tenantService: TenantService,
  ) {}

  /**
   * Get comprehensive dashboard metrics for a tenant
   */
  async getDashboardMetrics(tenantId: string, dto: GetAnalyticsDto): Promise<DashboardMetricsDto> {
    const tenant = await this.tenantService.findByTenantId(tenantId);
    const { startDate, endDate } = this.getDateRange(dto.timeRange || TimeRangeEnum.LAST_30_DAYS, dto.startDate, dto.endDate);
    const previousPeriod = this.getPreviousPeriod(startDate, endDate);

    // Get current period metrics from audit logs
    const currentMetrics = await this.getMetricsForPeriod(tenantId, startDate, endDate);
    const previousMetrics = await this.getMetricsForPeriod(
      tenantId,
      previousPeriod.start,
      previousPeriod.end,
    );

    // Calculate changes
    const transactionsChange = this.calculatePercentageChange(
      currentMetrics.transactions,
      previousMetrics.transactions,
    );
    const reconciliationsChange = this.calculatePercentageChange(
      currentMetrics.reconciliations,
      previousMetrics.reconciliations,
    );
    const matchRateChange = this.calculatePercentageChange(
      currentMetrics.matchRate,
      previousMetrics.matchRate,
    );

    // Get quota usage
    const quotaUsage = await this.getQuotaUsage(tenant);

    return {
      totalTransactions: currentMetrics.transactions,
      totalReconciliations: currentMetrics.reconciliations,
      matchedTransactions: currentMetrics.matched,
      unmatchedTransactions: currentMetrics.unmatched,
      activeUsers: currentMetrics.activeUsers,
      activeBankAccounts: currentMetrics.activeBankAccounts,

      transactionsChange,
      reconciliationsChange,
      matchRateChange,

      averageMatchRate: currentMetrics.matchRate,
      totalTransactionValue: currentMetrics.totalValue,
      storageUsedMB: tenant.storageUsedMB || 0,
      apiCallsCount: currentMetrics.apiCalls,

      quotaUsage,

      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  /**
   * Get time series data for specific metrics
   */
  async getTimeSeriesMetrics(
    tenantId: string,
    dto: GetAnalyticsDto,
  ): Promise<TimeSeriesMetricDto[]> {
    const { startDate, endDate } = this.getDateRange(dto.timeRange || TimeRangeEnum.LAST_30_DAYS, dto.startDate, dto.endDate);
    const metricTypes = dto.metricType ? [dto.metricType] : Object.values(MetricTypeEnum);

    const metrics: TimeSeriesMetricDto[] = [];

    for (const metricType of metricTypes) {
      const dataPoints = await this.getTimeSeriesDataPoints(
        tenantId,
        metricType,
        startDate,
        endDate,
      );

      const values = dataPoints.map((dp) => dp.value);
      const total = values.reduce((sum, val) => sum + val, 0);
      const average = values.length > 0 ? total / values.length : 0;
      const peak = values.length > 0 ? Math.max(...values) : 0;

      const trend = this.calculateTrend(dataPoints);

      metrics.push({
        metricName: this.getMetricName(metricType),
        metricType,
        dataPoints,
        total,
        average,
        peak,
        trend: trend.direction,
        trendPercentage: trend.percentage,
      });
    }

    return metrics;
  }

  /**
   * Generate comprehensive usage report
   */
  async generateUsageReport(tenantId: string, dto: GetAnalyticsDto): Promise<UsageReportDto> {
    const tenant = await this.tenantService.findByTenantId(tenantId);
    const { startDate, endDate } = this.getDateRange(dto.timeRange || TimeRangeEnum.LAST_30_DAYS, dto.startDate, dto.endDate);

    const metrics = await this.getMetricsForPeriod(tenantId, startDate, endDate);
    const topUsers = await this.getTopUsers(tenantId, startDate, endDate, 5);

    return {
      tenantId,
      tenantName: tenant.companyName || tenant.tenantId,
      reportPeriod: {
        start: startDate,
        end: endDate,
      },

      transactionMetrics: {
        totalProcessed: metrics.transactions,
        totalMatched: metrics.matched,
        totalUnmatched: metrics.unmatched,
        matchRate: metrics.matchRate,
        totalValue: metrics.totalValue,
        averageTransactionValue:
          metrics.transactions > 0 ? metrics.totalValue / metrics.transactions : 0,
      },

      reconciliationMetrics: {
        totalReconciliations: metrics.reconciliations,
        completedReconciliations: metrics.completedReconciliations,
        pendingReconciliations: metrics.pendingReconciliations,
        averageCompletionTime: metrics.averageCompletionTime,
        successRate: metrics.reconciliationSuccessRate,
      },

      userActivity: {
        activeUsers: metrics.activeUsers,
        totalLogins: metrics.totalLogins,
        averageSessionDuration: metrics.averageSessionDuration,
        topUsers: topUsers.map((user) => ({
          userId: user.userId,
          userName: user.userName,
          activityCount: user.transactionsProcessed + user.reconciliationsCompleted,
        })),
      },

      resourceUsage: {
        bankAccountsUsed: tenant.bankAccountsCount || 0,
        transactionsProcessed: tenant.transactionsCount || 0,
        storageUsedMB: tenant.storageUsedMB || 0,
        apiCallsMade: metrics.apiCalls,
      },

      billingMetrics: {
        currentPlan: tenant.plan,
        subscriptionStatus: tenant.subscriptionStatus,
        billingAmount: this.getBillingAmount(tenant.plan),
        nextBillingDate: tenant.nextBillingDate || new Date(),
      },
    };
  }

  /**
   * Get top bank accounts by activity
   */
  async getTopBankAccounts(
    tenantId: string,
    limit: number = 10,
    startDate: Date,
    endDate: Date,
  ): Promise<TopBankAccountDto[]> {
    // Simulated data - replace with actual database queries
    // In production, this would query bank account entities and aggregate transaction data
    this.logger.log(`Getting top ${limit} bank accounts for tenant ${tenantId}`);

    // Mock data for demonstration
    return [];
  }

  /**
   * Get top users by activity
   */
  async getTopUsers(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<TopUserDto[]> {
    // Query audit logs to find most active users
    const userActivity = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.userId', 'userId')
      .addSelect('log.userEmail', 'email')
      .addSelect('COUNT(*)', 'activityCount')
      .addSelect('MAX(log.timestamp)', 'lastActiveDate')
      .where('log.tenantId = :tenantId', { tenantId })
      .andWhere('log.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('log.userId IS NOT NULL')
      .groupBy('log.userId')
      .addGroupBy('log.userEmail')
      .orderBy('activityCount', 'DESC')
      .limit(limit)
      .getRawMany();

    return userActivity.map((user) => ({
      userId: user.userId,
      userName: user.email?.split('@')[0] || 'Unknown',
      email: user.email || '',
      loginCount: 0, // Would need separate tracking
      transactionsProcessed: 0, // Would aggregate from transaction logs
      reconciliationsCompleted: 0, // Would aggregate from reconciliation logs
      lastActiveDate: new Date(user.lastActiveDate),
    }));
  }

  /**
   * Get reconciliation statistics
   */
  async getReconciliationStats(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ReconciliationStatsDto> {
    // Mock implementation - replace with actual database queries
    const metrics = await this.getMetricsForPeriod(tenantId, startDate, endDate);

    return {
      totalReconciliations: metrics.reconciliations,
      completedReconciliations: metrics.completedReconciliations,
      pendingReconciliations: metrics.pendingReconciliations,
      failedReconciliations: 0,

      averageCompletionTimeMinutes: metrics.averageCompletionTime,
      fastestCompletionTimeMinutes: 5,
      slowestCompletionTimeMinutes: 120,

      matchRateStatistics: {
        overall: metrics.matchRate,
        automatic: 85,
        manual: 60,
        suggested: 75,
      },

      reconciliationsByStatus: [
        { status: 'completed', count: metrics.completedReconciliations, percentage: 80 },
        { status: 'pending', count: metrics.pendingReconciliations, percentage: 15 },
        { status: 'failed', count: 0, percentage: 0 },
      ],

      reconciliationsByType: [
        { type: 'automatic', count: Math.floor(metrics.reconciliations * 0.7), averageMatchRate: 85 },
        { type: 'manual', count: Math.floor(metrics.reconciliations * 0.3), averageMatchRate: 60 },
      ],
    };
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TransactionStatsDto> {
    const metrics = await this.getMetricsForPeriod(tenantId, startDate, endDate);
    const timeSeriesData = await this.getTimeSeriesDataPoints(
      tenantId,
      MetricTypeEnum.TRANSACTIONS,
      startDate,
      endDate,
    );

    return {
      totalTransactions: metrics.transactions,
      matchedTransactions: metrics.matched,
      unmatchedTransactions: metrics.unmatched,
      pendingTransactions: 0,

      matchRate: metrics.matchRate,

      transactionsBySource: [
        { source: 'bank_import', count: Math.floor(metrics.transactions * 0.6), percentage: 60 },
        { source: 'manual_entry', count: Math.floor(metrics.transactions * 0.3), percentage: 30 },
        { source: 'api', count: Math.floor(metrics.transactions * 0.1), percentage: 10 },
      ],

      transactionsByType: [
        { type: 'credit', count: Math.floor(metrics.transactions * 0.45), totalValue: metrics.totalValue * 0.55 },
        { type: 'debit', count: Math.floor(metrics.transactions * 0.55), totalValue: metrics.totalValue * 0.45 },
      ],

      valueStatistics: {
        totalValue: metrics.totalValue,
        averageValue: metrics.transactions > 0 ? metrics.totalValue / metrics.transactions : 0,
        medianValue: 500,
        maxValue: 50000,
        minValue: 10,
      },

      transactionsOverTime: timeSeriesData,
    };
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<SystemHealthDto> {
    const uptime = process.uptime();

    return {
      status: 'healthy',
      uptime,

      services: [
        {
          name: 'auth-service',
          status: 'up',
          responseTime: 45,
          lastCheck: new Date(),
        },
        {
          name: 'database',
          status: 'up',
          responseTime: 12,
          lastCheck: new Date(),
        },
        {
          name: 'redis',
          status: 'up',
          responseTime: 8,
          lastCheck: new Date(),
        },
      ],

      performance: {
        averageResponseTime: 120,
        requestsPerSecond: 45,
        errorRate: 0.5,
        cpuUsage: 35,
        memoryUsage: 62,
      },

      databaseMetrics: {
        connectionPoolSize: 10,
        activeConnections: 5,
        queryPerformance: 15,
        slowQueries: 2,
      },
    };
  }

  /**
   * Track analytics event
   */
  async trackEvent(event: AnalyticsEventDto): Promise<void> {
    this.logger.log(
      `Analytics event: ${event.eventType} for tenant ${event.tenantId}`,
    );

    // In production, store in time-series database or analytics platform
    // For now, we can log to audit log
    // Could integrate with services like Google Analytics, Mixpanel, Segment, etc.
  }

  /**
   * Check quotas and generate alerts
   */
  async checkQuotaAlerts(tenantId: string): Promise<QuotaAlertDto[]> {
    const alerts: QuotaAlertDto[] = [];
    const resourceTypes: Array<'bankAccounts' | 'users' | 'transactions' | 'storage'> = [
      'bankAccounts',
      'users',
      'transactions',
      'storage',
    ];

    for (const resourceType of resourceTypes) {
      const quotaCheck = await this.tenantService.checkQuota(tenantId, resourceType, 0);
      const usagePercentage = (quotaCheck.current / quotaCheck.limit) * 100;

      if (usagePercentage >= 80) {
        const alertLevel = usagePercentage >= 95 ? 'critical' : 'warning';
        const message =
          alertLevel === 'critical'
            ? `Critical: ${resourceType} usage at ${usagePercentage.toFixed(1)}%. Upgrade plan soon.`
            : `Warning: ${resourceType} usage at ${usagePercentage.toFixed(1)}%. Consider upgrading.`;

        alerts.push({
          tenantId,
          resourceType,
          currentUsage: quotaCheck.current,
          limit: quotaCheck.limit,
          usagePercentage,
          alertLevel,
          message,
          timestamp: new Date(),
        });
      }
    }

    return alerts;
  }

  // ==================== Private Helper Methods ====================

  private getDateRange(
    timeRange: TimeRangeEnum,
    customStart?: string,
    customEnd?: string,
  ): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (timeRange) {
      case TimeRangeEnum.TODAY:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;

      case TimeRangeEnum.YESTERDAY:
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday.setHours(0, 0, 0, 0));
        endDate = new Date(yesterday.setHours(23, 59, 59, 999));
        break;

      case TimeRangeEnum.LAST_7_DAYS:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;

      case TimeRangeEnum.LAST_30_DAYS:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;

      case TimeRangeEnum.THIS_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case TimeRangeEnum.LAST_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;

      case TimeRangeEnum.THIS_YEAR:
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;

      case TimeRangeEnum.CUSTOM:
        if (!customStart || !customEnd) {
          throw new Error('Custom date range requires startDate and endDate');
        }
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        break;

      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  private getPreviousPeriod(startDate: Date, endDate: Date): { start: Date; end: Date } {
    const duration = endDate.getTime() - startDate.getTime();
    return {
      start: new Date(startDate.getTime() - duration),
      end: new Date(startDate.getTime() - 1),
    };
  }

  private async getMetricsForPeriod(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    // Query audit logs for activity in this period
    const logs = await this.auditLogRepository.find({
      where: {
        tenantId,
        timestamp: Between(startDate, endDate),
      },
    });

    // Aggregate metrics from logs
    const transactions = logs.filter((log) => log.action.includes('transaction')).length;
    const reconciliations = logs.filter((log) => log.action.includes('reconciliation')).length;
    const matched = Math.floor(transactions * 0.75); // Mock 75% match rate
    const unmatched = transactions - matched;
    const matchRate = transactions > 0 ? (matched / transactions) * 100 : 0;

    const activeUsers = new Set(logs.map((log) => log.userId).filter(Boolean)).size;
    const activeBankAccounts = Math.max(1, Math.floor(activeUsers * 1.5)); // Mock data

    return {
      transactions,
      reconciliations,
      matched,
      unmatched,
      matchRate,
      activeUsers,
      activeBankAccounts,
      totalValue: transactions * 1250.50, // Mock average transaction value
      apiCalls: logs.length,
      completedReconciliations: Math.floor(reconciliations * 0.85),
      pendingReconciliations: Math.floor(reconciliations * 0.15),
      averageCompletionTime: 45, // minutes
      reconciliationSuccessRate: 85,
      totalLogins: logs.filter((log) => log.action === 'login').length,
      averageSessionDuration: 35, // minutes
    };
  }

  private async getTimeSeriesDataPoints(
    tenantId: string,
    metricType: MetricTypeEnum,
    startDate: Date,
    endDate: Date,
  ): Promise<TimeSeriesDataPointDto[]> {
    const dataPoints: TimeSeriesDataPointDto[] = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const intervalDays = daysDiff > 90 ? 7 : daysDiff > 30 ? 1 : 1;

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + intervalDays);

      const periodMetrics = await this.getMetricsForPeriod(
        tenantId,
        currentDate,
        nextDate > endDate ? endDate : nextDate,
      );

      let value = 0;
      switch (metricType) {
        case MetricTypeEnum.TRANSACTIONS:
          value = periodMetrics.transactions;
          break;
        case MetricTypeEnum.RECONCILIATIONS:
          value = periodMetrics.reconciliations;
          break;
        case MetricTypeEnum.USERS:
          value = periodMetrics.activeUsers;
          break;
        case MetricTypeEnum.BANK_ACCOUNTS:
          value = periodMetrics.activeBankAccounts;
          break;
        case MetricTypeEnum.API_CALLS:
          value = periodMetrics.apiCalls;
          break;
      }

      dataPoints.push({
        date: currentDate.toISOString().split('T')[0],
        value,
        label: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });

      currentDate = nextDate;
    }

    return dataPoints;
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private calculateTrend(
    dataPoints: TimeSeriesDataPointDto[],
  ): { direction: 'increasing' | 'decreasing' | 'stable'; percentage: number } {
    if (dataPoints.length < 2) {
      return { direction: 'stable', percentage: 0 };
    }

    const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
    const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

    const firstAvg = firstHalf.reduce((sum, dp) => sum + dp.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, dp) => sum + dp.value, 0) / secondHalf.length;

    const change = this.calculatePercentageChange(secondAvg, firstAvg);

    if (Math.abs(change) < 5) {
      return { direction: 'stable', percentage: change };
    }

    return {
      direction: change > 0 ? 'increasing' : 'decreasing',
      percentage: Math.abs(change),
    };
  }

  private async getQuotaUsage(tenant: Tenant): Promise<any> {
    const plan = tenant.plan;
    const quotas = await this.tenantService['getPlanQuotas'](plan);

    const calculatePercentage = (used: number, limit: number) => {
      if (limit === -1) return 0; // Unlimited
      return limit > 0 ? (used / limit) * 100 : 0;
    };

    return {
      bankAccounts: {
        used: tenant.bankAccountsCount || 0,
        limit: quotas.maxBankAccounts,
        percentage: calculatePercentage(tenant.bankAccountsCount || 0, quotas.maxBankAccounts),
      },
      transactions: {
        used: tenant.transactionsCount || 0,
        limit: quotas.maxTransactionsPerMonth,
        percentage: calculatePercentage(
          tenant.transactionsCount || 0,
          quotas.maxTransactionsPerMonth,
        ),
      },
      storage: {
        used: tenant.storageUsedMB || 0,
        limit: quotas.maxStorageMB,
        percentage: calculatePercentage(tenant.storageUsedMB || 0, quotas.maxStorageMB),
      },
      users: {
        used: tenant.usersCount || 0,
        limit: quotas.maxUsers,
        percentage: calculatePercentage(tenant.usersCount || 0, quotas.maxUsers),
      },
    };
  }

  private getMetricName(metricType: MetricTypeEnum): string {
    const names = {
      [MetricTypeEnum.TRANSACTIONS]: 'Transactions',
      [MetricTypeEnum.RECONCILIATIONS]: 'Reconciliations',
      [MetricTypeEnum.USERS]: 'Active Users',
      [MetricTypeEnum.BANK_ACCOUNTS]: 'Bank Accounts',
      [MetricTypeEnum.STORAGE]: 'Storage Usage (MB)',
      [MetricTypeEnum.API_CALLS]: 'API Calls',
    };
    return names[metricType] || metricType;
  }

  private getBillingAmount(plan: string): number {
    const amounts = {
      free: 0,
      starter: 29,
      professional: 99,
      enterprise: 299,
    };
    return amounts[plan.toLowerCase()] || 0;
  }
}
