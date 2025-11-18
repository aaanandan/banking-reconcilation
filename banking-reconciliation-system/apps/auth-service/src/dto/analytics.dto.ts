import { IsEnum, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TimeRangeEnum {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_YEAR = 'this_year',
  CUSTOM = 'custom',
}

export enum MetricTypeEnum {
  TRANSACTIONS = 'transactions',
  RECONCILIATIONS = 'reconciliations',
  USERS = 'users',
  BANK_ACCOUNTS = 'bank_accounts',
  STORAGE = 'storage',
  API_CALLS = 'api_calls',
}

export class GetAnalyticsDto {
  @ApiProperty({ enum: TimeRangeEnum, default: TimeRangeEnum.LAST_30_DAYS })
  @IsEnum(TimeRangeEnum)
  @IsOptional()
  timeRange?: TimeRangeEnum = TimeRangeEnum.LAST_30_DAYS;

  @ApiProperty({ required: false, description: 'Start date for custom range (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date for custom range (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Specific metric type to retrieve' })
  @IsEnum(MetricTypeEnum)
  @IsOptional()
  metricType?: MetricTypeEnum;
}

export class DashboardMetricsDto {
  // Current period metrics
  totalTransactions: number;
  totalReconciliations: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  activeUsers: number;
  activeBankAccounts: number;

  // Comparison with previous period
  transactionsChange: number; // Percentage change
  reconciliationsChange: number;
  matchRateChange: number;

  // Current period stats
  averageMatchRate: number; // Percentage
  totalTransactionValue: number;
  storageUsedMB: number;
  apiCallsCount: number;

  // Quota usage
  quotaUsage: {
    bankAccounts: { used: number; limit: number; percentage: number };
    transactions: { used: number; limit: number; percentage: number };
    storage: { used: number; limit: number; percentage: number };
    users: { used: number; limit: number; percentage: number };
  };

  // Time period
  periodStart: Date;
  periodEnd: Date;
}

export class TimeSeriesDataPointDto {
  date: string; // ISO 8601 date
  value: number;
  label?: string;
}

export class TimeSeriesMetricDto {
  metricName: string;
  metricType: MetricTypeEnum;
  dataPoints: TimeSeriesDataPointDto[];
  total: number;
  average: number;
  peak: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
}

export class UsageReportDto {
  tenantId: string;
  tenantName: string;
  reportPeriod: {
    start: Date;
    end: Date;
  };

  // Transaction metrics
  transactionMetrics: {
    totalProcessed: number;
    totalMatched: number;
    totalUnmatched: number;
    matchRate: number;
    totalValue: number;
    averageTransactionValue: number;
  };

  // Reconciliation metrics
  reconciliationMetrics: {
    totalReconciliations: number;
    completedReconciliations: number;
    pendingReconciliations: number;
    averageCompletionTime: number; // in minutes
    successRate: number;
  };

  // User activity
  userActivity: {
    activeUsers: number;
    totalLogins: number;
    averageSessionDuration: number; // in minutes
    topUsers: Array<{ userId: string; userName: string; activityCount: number }>;
  };

  // Resource usage
  resourceUsage: {
    bankAccountsUsed: number;
    transactionsProcessed: number;
    storageUsedMB: number;
    apiCallsMade: number;
  };

  // Billing metrics
  billingMetrics: {
    currentPlan: string;
    subscriptionStatus: string;
    billingAmount: number;
    nextBillingDate: Date;
  };
}

export class TopEntitiesDto {
  @ApiProperty({ required: false, default: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({ enum: TimeRangeEnum, default: TimeRangeEnum.LAST_30_DAYS })
  @IsEnum(TimeRangeEnum)
  @IsOptional()
  timeRange?: TimeRangeEnum = TimeRangeEnum.LAST_30_DAYS;
}

export class TopBankAccountDto {
  bankAccountId: string;
  bankName: string;
  accountNumber: string;
  transactionCount: number;
  reconciliationCount: number;
  totalValue: number;
  matchRate: number;
}

export class TopUserDto {
  userId: string;
  userName: string;
  email: string;
  loginCount: number;
  transactionsProcessed: number;
  reconciliationsCompleted: number;
  lastActiveDate: Date;
}

export class ReconciliationStatsDto {
  totalReconciliations: number;
  completedReconciliations: number;
  pendingReconciliations: number;
  failedReconciliations: number;

  averageCompletionTimeMinutes: number;
  fastestCompletionTimeMinutes: number;
  slowestCompletionTimeMinutes: number;

  matchRateStatistics: {
    overall: number;
    automatic: number;
    manual: number;
    suggested: number;
  };

  reconciliationsByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;

  reconciliationsByType: Array<{
    type: string;
    count: number;
    averageMatchRate: number;
  }>;
}

export class TransactionStatsDto {
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  pendingTransactions: number;

  matchRate: number;

  transactionsBySource: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;

  transactionsByType: Array<{
    type: string;
    count: number;
    totalValue: number;
  }>;

  valueStatistics: {
    totalValue: number;
    averageValue: number;
    medianValue: number;
    maxValue: number;
    minValue: number;
  };

  transactionsOverTime: TimeSeriesDataPointDto[];
}

export class SystemHealthDto {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number; // in seconds

  services: Array<{
    name: string;
    status: 'up' | 'down' | 'degraded';
    responseTime: number; // in ms
    lastCheck: Date;
  }>;

  performance: {
    averageResponseTime: number; // in ms
    requestsPerSecond: number;
    errorRate: number; // percentage
    cpuUsage: number; // percentage
    memoryUsage: number; // percentage
  };

  databaseMetrics: {
    connectionPoolSize: number;
    activeConnections: number;
    queryPerformance: number; // average ms
    slowQueries: number;
  };
}

export class ExportReportDto {
  @ApiProperty({ enum: ['pdf', 'csv', 'excel', 'json'], default: 'pdf' })
  @IsEnum(['pdf', 'csv', 'excel', 'json'])
  @IsOptional()
  format?: 'pdf' | 'csv' | 'excel' | 'json' = 'pdf';

  @ApiProperty({ enum: TimeRangeEnum, default: TimeRangeEnum.LAST_30_DAYS })
  @IsEnum(TimeRangeEnum)
  @IsOptional()
  timeRange?: TimeRangeEnum = TimeRangeEnum.LAST_30_DAYS;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    required: false,
    description: 'Include specific sections in report',
    type: [String]
  })
  @IsOptional()
  includeSections?: string[];
}

export class AnalyticsEventDto {
  eventType: string;
  eventCategory: 'transaction' | 'reconciliation' | 'user' | 'system' | 'billing';
  userId?: string;
  tenantId: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export class QuotaAlertDto {
  tenantId: string;
  resourceType: 'bankAccounts' | 'users' | 'transactions' | 'storage';
  currentUsage: number;
  limit: number;
  usagePercentage: number;
  alertLevel: 'warning' | 'critical'; // warning: 80%, critical: 95%
  message: string;
  timestamp: Date;
}
