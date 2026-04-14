import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AdminActionEnum {
  SUSPEND_TENANT = 'suspend_tenant',
  ACTIVATE_TENANT = 'activate_tenant',
  EXTEND_TRIAL = 'extend_trial',
  UPGRADE_PLAN = 'upgrade_plan',
  RESET_QUOTA = 'reset_quota',
  DELETE_USER = 'delete_user',
  GRANT_ADMIN = 'grant_admin',
  REVOKE_ADMIN = 'revoke_admin',
}

export class AdminDashboardOverviewDto {
  // Platform metrics
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  trialTenants: number;
  paidTenants: number;

  // User metrics
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;

  // Revenue metrics
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerUser: number;

  // Conversion metrics
  trialConversionRate: number;
  churnRate: number;

  // Activity metrics
  totalReconciliations: number;
  totalTransactions: number;
  activeReconciliationsToday: number;

  // System health
  systemStatus: 'healthy' | 'degraded' | 'critical';
  apiResponseTime: number;
  databaseResponseTime: number;
  errorRate: number;

  // Feature adoption
  featureFlagUsage: { flagKey: string; usageCount: number }[];
  mostUsedFeatures: string[];

  // Period
  periodStart: Date;
  periodEnd: Date;
  lastUpdated: Date;
}

export class TenantManagementDto {
  tenantId: string;
  companyName: string;
  email: string;
  plan: string;
  status: string;
  subscriptionStatus: string;
  trialEndDate?: Date;
  createdAt: Date;

  // Usage
  usersCount: number;
  bankAccountsCount: number;
  transactionsCount: number;
  storageUsedMB: number;

  // Activity
  lastLoginAt?: Date;
  totalReconciliations: number;

  // Financial
  monthlySpend: number;
  lifetimeValue: number;

  // Health score (0-100)
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export class TenantActionDto {
  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty({ enum: AdminActionEnum })
  @IsEnum(AdminActionEnum)
  action: AdminActionEnum;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UserManagementDto {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tenantId: string;
  tenantName: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;

  createdAt: Date;
  lastLoginAt?: Date;
  loginCount: number;

  // Activity
  reconciliationsCount: number;
  transactionsCount: number;

  // Flags
  isAdmin: boolean;
  isSuspended: boolean;
}

export class SystemHealthDto {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  timestamp: Date;

  services: Array<{
    name: string;
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
    lastCheck: Date;
    message?: string;
  }>;

  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    activeConnections: number;
    requestsPerSecond: number;
    errorRate: number;
  };

  database: {
    status: 'connected' | 'disconnected';
    connectionPoolSize: number;
    activeConnections: number;
    queryTime: number;
    slowQueries: number;
  };

  queue: {
    emailQueueSize: number;
    emailQueueProcessing: number;
    emailQueueFailed: number;
  };
}

export class RevenueMetricsDto {
  // Current month
  currentMonthRevenue: number;
  currentMonthGrowth: number;

  // MRR
  monthlyRecurringRevenue: number;
  mrrGrowth: number;

  // ARR
  annualRecurringRevenue: number;
  arrGrowth: number;

  // Per customer
  averageRevenuePerUser: number;
  averageRevenuePerTenant: number;

  // By plan
  revenueByPlan: Array<{
    plan: string;
    revenue: number;
    customerCount: number;
    percentage: number;
  }>;

  // Churn
  churnRate: number;
  churnedRevenue: number;

  // Forecast
  projectedMRR: number;
  projectedARR: number;
}

export class GrowthMetricsDto {
  // User growth
  totalUsers: number;
  newUsers: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  userGrowthRate: number;

  // Tenant growth
  totalTenants: number;
  newTenants: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  tenantGrowthRate: number;

  // Activation metrics
  activationRate: number;
  timeToActivation: number; // Average days

  // Retention
  retentionRate: number;
  churnRate: number;

  // Cohort analysis
  cohorts: Array<{
    month: string;
    newTenants: number;
    retained: number;
    retentionRate: number;
  }>;
}

export class PlatformUsageDto {
  // Reconciliation activity
  totalReconciliations: number;
  reconciliationsToday: number;
  reconciliationsThisWeek: number;
  reconciliationsThisMonth: number;
  averageMatchRate: number;

  // Transaction volume
  totalTransactions: number;
  transactionsToday: number;
  transactionsThisWeek: number;
  transactionsThisMonth: number;

  // API usage
  totalApiCalls: number;
  apiCallsToday: number;
  averageResponseTime: number;
  errorRate: number;

  // Storage
  totalStorageUsedGB: number;
  averageStoragePerTenant: number;

  // Top users by activity
  topUsers: Array<{
    userId: string;
    email: string;
    tenantId: string;
    activityCount: number;
  }>;

  // Top tenants by usage
  topTenants: Array<{
    tenantId: string;
    companyName: string;
    usageScore: number;
  }>;
}

export class AdminAuditLogDto {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: 'tenant' | 'user' | 'system' | 'feature_flag';
  targetId: string;
  changes?: Record<string, any>;
  reason?: string;
  ipAddress: string;
  timestamp: Date;
}

export class TenantSearchDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  plan?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  onTrial?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  pageSize?: number;
}

export class TenantListResponseDto {
  tenants: TenantManagementDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class AdminAlertDto {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'system' | 'security' | 'billing' | 'usage';
  title: string;
  message: string;
  actionRequired: boolean;
  actionUrl?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export class AdminSettingsDto {
  // Platform settings
  maintenanceMode: boolean;
  signupsEnabled: boolean;
  trialsEnabled: boolean;
  defaultTrialDays: number;

  // Limits
  maxTenantsPerPlan: Record<string, number>;
  maxUsersPerTenant: number;

  // Features
  enabledFeatures: string[];
  betaFeatures: string[];

  // Notifications
  adminNotificationEmail: string;
  criticalAlertsEnabled: boolean;

  // Integrations
  stripeConnected: boolean;
  emailServiceConnected: boolean;
  analyticsEnabled: boolean;
}

export class UpdateAdminSettingsDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  maintenanceMode?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  signupsEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  trialsEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  defaultTrialDays?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class BulkOperationDto {
  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  tenantIds: string[];

  @ApiProperty({ enum: AdminActionEnum })
  @IsEnum(AdminActionEnum)
  action: AdminActionEnum;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class BulkOperationResultDto {
  totalRequested: number;
  successful: number;
  failed: number;
  results: Array<{
    tenantId: string;
    success: boolean;
    error?: string;
  }>;
}

export class ExportDataDto {
  @ApiProperty({ enum: ['tenants', 'users', 'revenue', 'usage', 'audit_logs'] })
  @IsEnum(['tenants', 'users', 'revenue', 'usage', 'audit_logs'])
  dataType: string;

  @ApiProperty({ enum: ['csv', 'json', 'xlsx'] })
  @IsEnum(['csv', 'json', 'xlsx'])
  format: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  filters?: Record<string, any>;
}
