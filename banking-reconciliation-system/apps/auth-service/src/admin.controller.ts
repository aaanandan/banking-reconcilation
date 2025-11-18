import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import {
  AdminDashboardOverviewDto,
  TenantManagementDto,
  TenantActionDto,
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
  UpdateAdminSettingsDto,
  BulkOperationDto,
  BulkOperationResultDto,
  ExportDataDto,
} from './dto/admin.dto';

/**
 * Admin Controller
 *
 * Provides comprehensive admin dashboard and management endpoints for:
 * - Platform overview and metrics
 * - Tenant management and actions
 * - User management
 * - System health monitoring
 * - Revenue and growth analytics
 * - Audit logging
 * - Platform settings
 * - Bulk operations
 * - Data export
 *
 * All endpoints require admin authentication via AdminGuard
 */
@ApiTags('Admin Dashboard')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  /**
   * Get comprehensive dashboard overview with platform metrics
   *
   * Returns:
   * - Tenant metrics (total, active, trial, paid)
   * - User metrics (total, active, new users)
   * - Revenue metrics (MRR, ARR, ARPU)
   * - Conversion metrics (trial conversion, churn rate)
   * - Activity metrics (reconciliations, transactions)
   * - System health (status, response times, error rate)
   * - Feature adoption metrics
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard overview retrieved successfully',
    type: AdminDashboardOverviewDto,
  })
  async getDashboardOverview(): Promise<AdminDashboardOverviewDto> {
    return this.adminDashboardService.getDashboardOverview();
  }

  /**
   * Get paginated tenant list with search and filters
   *
   * Supports:
   * - Text search (company name, email)
   * - Filters (plan, status, trial status)
   * - Sorting (by various fields)
   * - Pagination
   */
  @Get('tenants')
  @ApiOperation({ summary: 'Get tenant list with search and filters' })
  @ApiResponse({
    status: 200,
    description: 'Tenant list retrieved successfully',
    type: TenantListResponseDto,
  })
  async getTenants(@Query() searchDto: TenantSearchDto): Promise<TenantListResponseDto> {
    return this.adminDashboardService.getTenants(searchDto);
  }

  /**
   * Get detailed tenant information
   *
   * Includes:
   * - Basic tenant info
   * - Usage metrics
   * - Activity data
   * - Financial information
   * - Health score and risk level
   */
  @Get('tenants/:tenantId')
  @ApiOperation({ summary: 'Get tenant details' })
  @ApiResponse({
    status: 200,
    description: 'Tenant details retrieved successfully',
    type: TenantManagementDto,
  })
  async getTenantDetails(@Param('tenantId') tenantId: string): Promise<TenantManagementDto> {
    return this.adminDashboardService.getTenantDetails(tenantId);
  }

  /**
   * Perform admin action on a tenant
   *
   * Supported actions:
   * - suspend_tenant: Suspend tenant access
   * - activate_tenant: Reactivate suspended tenant
   * - extend_trial: Extend trial period
   * - upgrade_plan: Change subscription plan
   * - reset_quota: Reset usage quotas
   * - delete_user: Remove user from tenant
   * - grant_admin: Grant admin privileges
   * - revoke_admin: Remove admin privileges
   *
   * All actions are logged in audit trail
   */
  @Post('tenants/:tenantId/action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform admin action on tenant' })
  @ApiResponse({
    status: 200,
    description: 'Action performed successfully',
  })
  async performTenantAction(
    @Param('tenantId') tenantId: string,
    @Body() actionDto: TenantActionDto,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    const adminId = req.user.id;
    actionDto.tenantId = tenantId; // Ensure tenantId matches URL param

    await this.adminDashboardService.performTenantAction(actionDto, adminId);

    return {
      success: true,
      message: `Action '${actionDto.action}' performed successfully on tenant ${tenantId}`,
    };
  }

  /**
   * Perform bulk operations on multiple tenants
   *
   * Executes the same action on multiple tenants with error handling
   * Returns detailed results for each tenant (success/failure)
   */
  @Post('tenants/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform bulk operation on multiple tenants' })
  @ApiResponse({
    status: 200,
    description: 'Bulk operation completed',
    type: BulkOperationResultDto,
  })
  async performBulkOperation(
    @Body() bulkDto: BulkOperationDto,
    @Request() req: any,
  ): Promise<BulkOperationResultDto> {
    const adminId = req.user.id;
    return this.adminDashboardService.performBulkOperation(bulkDto, adminId);
  }

  /**
   * Get paginated user list with search and filters
   */
  @Get('users')
  @ApiOperation({ summary: 'Get user list with search and filters' })
  @ApiResponse({
    status: 200,
    description: 'User list retrieved successfully',
    type: [UserManagementDto],
  })
  async getUsers(
    @Query('query') query?: string,
    @Query('tenantId') tenantId?: string,
    @Query('isActive') isActive?: boolean,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 50,
  ): Promise<{ users: UserManagementDto[]; total: number; page: number; totalPages: number }> {
    return this.adminDashboardService.getUsers({
      query,
      tenantId,
      isActive,
      page,
      pageSize,
    });
  }

  /**
   * Get detailed user information
   */
  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user details' })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
    type: UserManagementDto,
  })
  async getUserDetails(@Param('userId') userId: string): Promise<UserManagementDto> {
    return this.adminDashboardService.getUserDetails(userId);
  }

  /**
   * Get system health metrics
   *
   * Monitors:
   * - Service status (up/down/degraded)
   * - System metrics (CPU, memory, disk)
   * - Database health
   * - Queue status
   * - Response times and error rates
   */
  @Get('health')
  @ApiOperation({ summary: 'Get system health metrics' })
  @ApiResponse({
    status: 200,
    description: 'System health retrieved successfully',
    type: SystemHealthDto,
  })
  async getSystemHealth(): Promise<SystemHealthDto> {
    return this.adminDashboardService.getSystemHealth();
  }

  /**
   * Get revenue metrics and forecasts
   *
   * Includes:
   * - MRR and ARR with growth rates
   * - ARPU and ARPT
   * - Revenue by plan breakdown
   * - Churn metrics
   * - Revenue forecasts
   */
  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue metrics' })
  @ApiResponse({
    status: 200,
    description: 'Revenue metrics retrieved successfully',
    type: RevenueMetricsDto,
  })
  async getRevenueMetrics(): Promise<RevenueMetricsDto> {
    return this.adminDashboardService.getRevenueMetrics();
  }

  /**
   * Get growth metrics and cohort analysis
   *
   * Includes:
   * - User and tenant growth rates
   * - New signups (today, week, month)
   * - Activation and retention rates
   * - Cohort analysis
   */
  @Get('growth')
  @ApiOperation({ summary: 'Get growth metrics' })
  @ApiResponse({
    status: 200,
    description: 'Growth metrics retrieved successfully',
    type: GrowthMetricsDto,
  })
  async getGrowthMetrics(): Promise<GrowthMetricsDto> {
    return this.adminDashboardService.getGrowthMetrics();
  }

  /**
   * Get platform usage metrics
   *
   * Tracks:
   * - Reconciliation activity
   * - Transaction volume
   * - API usage
   * - Storage consumption
   * - Top users and tenants by activity
   */
  @Get('usage')
  @ApiOperation({ summary: 'Get platform usage metrics' })
  @ApiResponse({
    status: 200,
    description: 'Platform usage retrieved successfully',
    type: PlatformUsageDto,
  })
  async getPlatformUsage(): Promise<PlatformUsageDto> {
    return this.adminDashboardService.getPlatformUsage();
  }

  /**
   * Get admin audit logs
   *
   * Tracks all admin actions with:
   * - Admin user who performed action
   * - Action type and target
   * - Changes made
   * - Reason for action
   * - IP address and timestamp
   */
  @Get('audit-logs')
  @ApiOperation({ summary: 'Get admin audit logs' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    type: [AdminAuditLogDto],
  })
  async getAuditLogs(
    @Query('adminId') adminId?: string,
    @Query('targetType') targetType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 50,
  ): Promise<{ logs: AdminAuditLogDto[]; total: number; page: number; totalPages: number }> {
    return this.adminDashboardService.getAdminAuditLogs({
      adminId,
      targetType,
      startDate,
      endDate,
      page,
      pageSize,
    });
  }

  /**
   * Get active alerts requiring admin attention
   *
   * Alert types:
   * - critical: Immediate action required
   * - warning: Should be addressed soon
   * - info: Informational only
   *
   * Categories:
   * - system: System health issues
   * - security: Security concerns
   * - billing: Payment/subscription issues
   * - usage: Quota/usage alerts
   */
  @Get('alerts')
  @ApiOperation({ summary: 'Get active admin alerts' })
  @ApiResponse({
    status: 200,
    description: 'Alerts retrieved successfully',
    type: [AdminAlertDto],
  })
  async getAlerts(
    @Query('type') type?: 'critical' | 'warning' | 'info',
    @Query('category') category?: 'system' | 'security' | 'billing' | 'usage',
    @Query('unresolved') unresolvedOnly: boolean = true,
  ): Promise<AdminAlertDto[]> {
    return this.adminDashboardService.getAlerts({ type, category, unresolvedOnly });
  }

  /**
   * Resolve an admin alert
   */
  @Put('alerts/:alertId/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve admin alert' })
  @ApiResponse({
    status: 200,
    description: 'Alert resolved successfully',
  })
  async resolveAlert(
    @Param('alertId') alertId: string,
    @Request() req: any,
  ): Promise<{ success: boolean }> {
    const adminId = req.user.id;
    await this.adminDashboardService.resolveAlert(alertId, adminId);
    return { success: true };
  }

  /**
   * Get platform admin settings
   */
  @Get('settings')
  @ApiOperation({ summary: 'Get platform settings' })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
    type: AdminSettingsDto,
  })
  async getSettings(): Promise<AdminSettingsDto> {
    return this.adminDashboardService.getSettings();
  }

  /**
   * Update platform admin settings
   *
   * Configurable settings:
   * - Maintenance mode
   * - Signups enabled/disabled
   * - Trials enabled/disabled
   * - Default trial duration
   */
  @Put('settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update platform settings' })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
  })
  async updateSettings(
    @Body() updateDto: UpdateAdminSettingsDto,
    @Request() req: any,
  ): Promise<{ success: boolean; settings: AdminSettingsDto }> {
    const adminId = req.user.id;
    const settings = await this.adminDashboardService.updateSettings(updateDto, adminId);
    return { success: true, settings };
  }

  /**
   * Export platform data
   *
   * Supported data types:
   * - tenants: All tenant information
   * - users: All user information
   * - revenue: Revenue and billing data
   * - usage: Usage and activity data
   * - audit_logs: Admin action logs
   *
   * Supported formats:
   * - csv: Comma-separated values
   * - json: JSON format
   * - xlsx: Excel spreadsheet
   */
  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export platform data' })
  @ApiResponse({
    status: 200,
    description: 'Data export initiated',
  })
  async exportData(
    @Body() exportDto: ExportDataDto,
    @Request() req: any,
  ): Promise<{ success: boolean; downloadUrl: string; expiresAt: Date }> {
    const adminId = req.user.id;
    const result = await this.adminDashboardService.exportData(exportDto, adminId);
    return result;
  }

  /**
   * Get feature flag usage statistics
   */
  @Get('feature-flags/stats')
  @ApiOperation({ summary: 'Get feature flag usage statistics' })
  @ApiResponse({
    status: 200,
    description: 'Feature flag stats retrieved successfully',
  })
  async getFeatureFlagStats(): Promise<{
    totalFlags: number;
    activeFlags: number;
    flagsInExperiment: number;
    usageByFlag: Array<{ flagKey: string; evaluationCount: number; enabledCount: number }>;
  }> {
    return this.adminDashboardService.getFeatureFlagStats();
  }

  /**
   * Get tenant activity timeline
   *
   * Returns chronological activity for a tenant:
   * - User logins
   * - Reconciliations performed
   * - Plan changes
   * - Quota usage milestones
   */
  @Get('tenants/:tenantId/activity')
  @ApiOperation({ summary: 'Get tenant activity timeline' })
  @ApiResponse({
    status: 200,
    description: 'Activity timeline retrieved successfully',
  })
  async getTenantActivity(
    @Param('tenantId') tenantId: string,
    @Query('limit') limit: number = 50,
  ): Promise<{
    activities: Array<{
      timestamp: Date;
      type: string;
      description: string;
      metadata?: Record<string, any>;
    }>;
  }> {
    return this.adminDashboardService.getTenantActivity(tenantId, limit);
  }

  /**
   * Get impersonation token for tenant debugging
   *
   * Allows admin to impersonate a tenant user for support purposes
   * Action is logged in audit trail
   */
  @Post('tenants/:tenantId/impersonate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate impersonation token' })
  @ApiResponse({
    status: 200,
    description: 'Impersonation token generated',
  })
  async generateImpersonationToken(
    @Param('tenantId') tenantId: string,
    @Body('userId') userId: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ): Promise<{ token: string; expiresIn: number }> {
    const adminId = req.user.id;
    return this.adminDashboardService.generateImpersonationToken(
      tenantId,
      userId,
      reason,
      adminId,
    );
  }
}
