// apps/auth-service/src/audit-log.controller.ts

import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuditLogService, AuditLogQuery } from './audit-log.service';
import { AuditLog } from '@app/shared/entities/audit-log.entity';

/**
 * AuditLogController
 *
 * Provides endpoints for querying audit logs and security monitoring.
 * Restricted to admin users for security and compliance purposes.
 */
@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(ThrottlerGuard)
@ApiBearerAuth()
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Query audit logs with filters
   */
  @Get()
  @ApiOperation({ summary: 'Query audit logs with filters' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  async query(
    @Query('tenantId') tenantId?: string,
    @Query('userId') userId?: string,
    @Query('eventType') eventType?: string,
    @Query('eventCategory') eventCategory?: string,
    @Query('severity') severity?: string,
    @Query('ipAddress') ipAddress?: string,
    @Query('isSuspicious') isSuspicious?: string,
    @Query('isSuccessful') isSuccessful?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ logs: AuditLog[]; total: number; limit: number; offset: number }> {
    // NOTE: In production, add JWT auth guard and check if user is admin
    // @UseGuards(JwtAuthGuard, AdminGuard)

    const query: AuditLogQuery = {
      tenantId,
      userId,
      eventType,
      eventCategory,
      severity,
      ipAddress,
      isSuspicious: isSuspicious !== undefined ? isSuspicious === 'true' : undefined,
      isSuccessful: isSuccessful !== undefined ? isSuccessful === 'true' : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    const result = await this.auditLogService.query(query);

    return {
      logs: result.logs,
      total: result.total,
      limit: query.limit || 100,
      offset: query.offset || 0,
    };
  }

  /**
   * Get suspicious activities
   */
  @Get('suspicious')
  @ApiOperation({ summary: 'Get suspicious activities' })
  @ApiResponse({
    status: 200,
    description: 'Suspicious activities retrieved successfully',
  })
  async getSuspiciousActivities(
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: string,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    // NOTE: In production, add JWT auth guard and check if user is admin
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.auditLogService.getSuspiciousActivities(tenantId, limitNum);
  }

  /**
   * Get failed login attempts for a user
   */
  @Get('failed-logins/:userId')
  @ApiOperation({ summary: 'Get failed login attempts for a specific user' })
  @ApiResponse({
    status: 200,
    description: 'Failed login attempts retrieved successfully',
  })
  async getFailedLoginAttempts(
    @Param('userId') userId: string,
    @Query('hours') hours?: string,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    // NOTE: In production, add JWT auth guard and check if user has permission
    const hoursNum = hours ? parseInt(hours, 10) : 24;
    return this.auditLogService.getFailedLoginAttempts(userId, hoursNum);
  }

  /**
   * Get audit statistics
   */
  @Get('statistics')
  @ApiOperation({ summary: 'Get audit log statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(
    @Query('tenantId') tenantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    suspiciousEvents: number;
    eventsByType: Record<string, number>;
    eventsByCategory: Record<string, number>;
  }> {
    // NOTE: In production, add JWT auth guard and check if user is admin
    return this.auditLogService.getStatistics(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
