import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import {
  GetAnalyticsDto,
  DashboardMetricsDto,
  TimeSeriesMetricDto,
  UsageReportDto,
  TopEntitiesDto,
  TopBankAccountDto,
  TopUserDto,
  ReconciliationStatsDto,
  TransactionStatsDto,
  SystemHealthDto,
  AnalyticsEventDto,
  QuotaAlertDto,
  ExportReportDto,
} from './dto/analytics.dto';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(ThrottlerGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/:tenantId')
  @ApiOperation({ summary: 'Get dashboard metrics for tenant' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved successfully', type: DashboardMetricsDto })
  @ApiBearerAuth()
  async getDashboardMetrics(
    @Param('tenantId') tenantId: string,
    @Query() dto: GetAnalyticsDto,
  ): Promise<DashboardMetricsDto> {
    return this.analyticsService.getDashboardMetrics(tenantId, dto);
  }

  @Get('time-series/:tenantId')
  @ApiOperation({ summary: 'Get time series metrics for tenant' })
  @ApiResponse({
    status: 200,
    description: 'Time series data retrieved successfully',
    type: [TimeSeriesMetricDto],
  })
  @ApiBearerAuth()
  async getTimeSeriesMetrics(
    @Param('tenantId') tenantId: string,
    @Query() dto: GetAnalyticsDto,
  ): Promise<TimeSeriesMetricDto[]> {
    return this.analyticsService.getTimeSeriesMetrics(tenantId, dto);
  }

  @Get('report/:tenantId')
  @ApiOperation({ summary: 'Generate comprehensive usage report' })
  @ApiResponse({ status: 200, description: 'Usage report generated successfully', type: UsageReportDto })
  @ApiBearerAuth()
  async getUsageReport(
    @Param('tenantId') tenantId: string,
    @Query() dto: GetAnalyticsDto,
  ): Promise<UsageReportDto> {
    return this.analyticsService.generateUsageReport(tenantId, dto);
  }

  @Get('top-bank-accounts/:tenantId')
  @ApiOperation({ summary: 'Get top bank accounts by activity' })
  @ApiResponse({
    status: 200,
    description: 'Top bank accounts retrieved successfully',
    type: [TopBankAccountDto],
  })
  @ApiBearerAuth()
  async getTopBankAccounts(
    @Param('tenantId') tenantId: string,
    @Query() dto: TopEntitiesDto,
  ): Promise<TopBankAccountDto[]> {
    const { startDate, endDate } = this.getDateRange(dto.timeRange);
    return this.analyticsService.getTopBankAccounts(tenantId, dto.limit, startDate, endDate);
  }

  @Get('top-users/:tenantId')
  @ApiOperation({ summary: 'Get top users by activity' })
  @ApiResponse({ status: 200, description: 'Top users retrieved successfully', type: [TopUserDto] })
  @ApiBearerAuth()
  async getTopUsers(
    @Param('tenantId') tenantId: string,
    @Query() dto: TopEntitiesDto,
  ): Promise<TopUserDto[]> {
    const { startDate, endDate } = this.getDateRange(dto.timeRange);
    return this.analyticsService.getTopUsers(tenantId, startDate, endDate, dto.limit);
  }

  @Get('reconciliation-stats/:tenantId')
  @ApiOperation({ summary: 'Get reconciliation statistics' })
  @ApiResponse({
    status: 200,
    description: 'Reconciliation stats retrieved successfully',
    type: ReconciliationStatsDto,
  })
  @ApiBearerAuth()
  async getReconciliationStats(
    @Param('tenantId') tenantId: string,
    @Query() dto: GetAnalyticsDto,
  ): Promise<ReconciliationStatsDto> {
    const { startDate, endDate } = this.getDateRange(dto.timeRange, dto.startDate, dto.endDate);
    return this.analyticsService.getReconciliationStats(tenantId, startDate, endDate);
  }

  @Get('transaction-stats/:tenantId')
  @ApiOperation({ summary: 'Get transaction statistics' })
  @ApiResponse({
    status: 200,
    description: 'Transaction stats retrieved successfully',
    type: TransactionStatsDto,
  })
  @ApiBearerAuth()
  async getTransactionStats(
    @Param('tenantId') tenantId: string,
    @Query() dto: GetAnalyticsDto,
  ): Promise<TransactionStatsDto> {
    const { startDate, endDate } = this.getDateRange(dto.timeRange, dto.startDate, dto.endDate);
    return this.analyticsService.getTransactionStats(tenantId, startDate, endDate);
  }

  @Get('system-health')
  @ApiOperation({ summary: 'Get system health metrics' })
  @ApiResponse({ status: 200, description: 'System health retrieved successfully', type: SystemHealthDto })
  async getSystemHealth(): Promise<SystemHealthDto> {
    return this.analyticsService.getSystemHealth();
  }

  @Get('quota-alerts/:tenantId')
  @ApiOperation({ summary: 'Check quota usage and get alerts' })
  @ApiResponse({ status: 200, description: 'Quota alerts retrieved successfully', type: [QuotaAlertDto] })
  @ApiBearerAuth()
  async getQuotaAlerts(@Param('tenantId') tenantId: string): Promise<QuotaAlertDto[]> {
    return this.analyticsService.checkQuotaAlerts(tenantId);
  }

  @Post('track-event')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Track an analytics event' })
  @ApiResponse({ status: 204, description: 'Event tracked successfully' })
  @ApiBearerAuth()
  async trackEvent(@Body() event: AnalyticsEventDto): Promise<void> {
    await this.analyticsService.trackEvent(event);
  }

  @Post('export-report/:tenantId')
  @ApiOperation({ summary: 'Export analytics report in specified format' })
  @ApiResponse({ status: 200, description: 'Report export initiated successfully' })
  @ApiBearerAuth()
  async exportReport(
    @Param('tenantId') tenantId: string,
    @Body() dto: ExportReportDto,
  ): Promise<{ message: string; downloadUrl?: string }> {
    // In production, this would generate a report file and return a download URL
    // For now, return a placeholder response
    const { startDate, endDate } = this.getDateRange(dto.timeRange, dto.startDate, dto.endDate);

    return {
      message: `Report export initiated for ${dto.format} format`,
      downloadUrl: `/api/downloads/report-${tenantId}-${Date.now()}.${dto.format}`,
    };
  }

  // ==================== Helper Methods ====================

  private getDateRange(
    timeRange?: string,
    customStart?: string,
    customEnd?: string,
  ): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;

      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday.setHours(0, 0, 0, 0));
        endDate = new Date(yesterday.setHours(23, 59, 59, 999));
        break;

      case 'last_7_days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;

      case 'last_30_days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;

      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;

      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;

      case 'custom':
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
}
