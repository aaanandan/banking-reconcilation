// apps/auth-service/src/audit-log.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditLog,
  AuditEventType,
  AuditEventCategory,
  AuditSeverity,
} from '@app/shared/entities/audit-log.entity';

/**
 * Interface for creating audit log entries
 */
export interface CreateAuditLogDto {
  tenantId?: string | null;
  userId?: string | null;
  eventType: string;
  eventCategory: string;
  severity: string;
  description: string;
  metadata?: Record<string, any>;
  httpMethod?: string;
  httpPath?: string;
  httpStatusCode?: number;
  responseTime?: number;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  country?: string;
  city?: string;
  isSuspicious?: boolean;
  isSuccessful?: boolean;
  failureReason?: string;
  resourceType?: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  sessionId?: string;
}

/**
 * Interface for querying audit logs
 */
export interface AuditLogQuery {
  tenantId?: string;
  userId?: string;
  eventType?: string;
  eventCategory?: string;
  severity?: string;
  ipAddress?: string;
  startDate?: Date;
  endDate?: Date;
  isSuspicious?: boolean;
  isSuccessful?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * AuditLogService
 *
 * Centralized service for creating and querying audit logs.
 * Provides comprehensive audit trail for security and compliance.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Create a new audit log entry
   */
  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        tenantId: dto.tenantId || undefined,
        userId: dto.userId || undefined,
        eventType: dto.eventType,
        action: dto.eventType, // Set action to match eventType for backwards compatibility
        eventCategory: dto.eventCategory,
        severity: dto.severity,
        description: dto.description,
        metadata: dto.metadata || undefined,
        httpMethod: dto.httpMethod || undefined,
        httpPath: dto.httpPath || undefined,
        httpStatusCode: dto.httpStatusCode || undefined,
        responseTime: dto.responseTime || undefined,
        ipAddress: dto.ipAddress || undefined,
        userAgent: dto.userAgent || undefined,
        deviceId: dto.deviceId || undefined,
        country: dto.country || undefined,
        city: dto.city || undefined,
        isSuspicious: dto.isSuspicious || false,
        isSuccessful: dto.isSuccessful !== undefined ? dto.isSuccessful : true,
        failureReason: dto.failureReason || undefined,
        resourceType: dto.resourceType || undefined,
        resourceId: dto.resourceId || undefined,
        oldValues: dto.oldValues || undefined,
        newValues: dto.newValues || undefined,
        sessionId: dto.sessionId || undefined,
        timestamp: new Date(), // Set timestamp to match createdAt
      });

      const savedLog = await this.auditLogRepository.save(auditLog);

      // Also log to application logs for critical events
      if (dto.severity === AuditSeverity.CRITICAL || dto.severity === AuditSeverity.ERROR) {
        this.logger.error(`AUDIT: ${dto.eventType} - ${dto.description}`, {
          userId: dto.userId,
          tenantId: dto.tenantId,
          metadata: dto.metadata,
        });
      } else if (dto.isSuspicious) {
        this.logger.warn(`SUSPICIOUS ACTIVITY: ${dto.eventType} - ${dto.description}`, {
          userId: dto.userId,
          ipAddress: dto.ipAddress,
        });
      }

      return savedLog;
    } catch (error) {
      // Don't let audit logging failures break the application
      this.logger.error('Failed to create audit log', error.stack);
      throw error;
    }
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(params: {
    userId?: string;
    tenantId?: string;
    eventType: AuditEventType;
    isSuccessful: boolean;
    ipAddress?: string;
    userAgent?: string;
    failureReason?: string;
    metadata?: Record<string, any>;
  }): Promise<AuditLog> {
    return this.log({
      userId: params.userId,
      tenantId: params.tenantId,
      eventType: params.eventType,
      eventCategory: AuditEventCategory.AUTHENTICATION,
      severity: params.isSuccessful ? AuditSeverity.INFO : AuditSeverity.WARNING,
      description: this.getAuthEventDescription(params.eventType, params.isSuccessful),
      isSuccessful: params.isSuccessful,
      failureReason: params.failureReason,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
      isSuspicious: !params.isSuccessful && this.isSuspiciousAuth(params),
    });
  }

  /**
   * Log API key events
   */
  async logApiKeyEvent(params: {
    userId: string;
    tenantId: string;
    eventType: AuditEventType;
    apiKeyId?: string;
    apiKeyName?: string;
    isSuccessful: boolean;
    ipAddress?: string;
    metadata?: Record<string, any>;
  }): Promise<AuditLog> {
    return this.log({
      userId: params.userId,
      tenantId: params.tenantId,
      eventType: params.eventType,
      eventCategory: AuditEventCategory.SECURITY,
      severity: AuditSeverity.INFO,
      description: `API Key ${params.eventType.replace('api_key_', '')} - ${params.apiKeyName || params.apiKeyId}`,
      isSuccessful: params.isSuccessful,
      ipAddress: params.ipAddress,
      resourceType: 'api_key',
      resourceId: params.apiKeyId,
      metadata: params.metadata,
    });
  }

  /**
   * Log security events (account lockout, suspicious activity, etc.)
   */
  async logSecurityEvent(params: {
    userId?: string;
    tenantId?: string;
    eventType: AuditEventType;
    severity: AuditSeverity;
    description: string;
    ipAddress?: string;
    userAgent?: string;
    isSuspicious?: boolean;
    metadata?: Record<string, any>;
  }): Promise<AuditLog> {
    return this.log({
      userId: params.userId,
      tenantId: params.tenantId,
      eventType: params.eventType,
      eventCategory: AuditEventCategory.SECURITY,
      severity: params.severity,
      description: params.description,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      isSuspicious: params.isSuspicious || true,
      metadata: params.metadata,
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(params: {
    userId: string;
    tenantId: string;
    resourceType: string;
    resourceId: string;
    action: string;
    ipAddress?: string;
    metadata?: Record<string, any>;
  }): Promise<AuditLog> {
    return this.log({
      userId: params.userId,
      tenantId: params.tenantId,
      eventType: `${params.resourceType}_${params.action}`,
      eventCategory: AuditEventCategory.DATA_ACCESS,
      severity: AuditSeverity.INFO,
      description: `${params.action} ${params.resourceType}`,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      ipAddress: params.ipAddress,
      metadata: params.metadata,
    });
  }

  /**
   * Log configuration changes
   */
  async logConfigChange(params: {
    userId: string;
    tenantId: string;
    resourceType: string;
    resourceId: string;
    oldValues: Record<string, any>;
    newValues: Record<string, any>;
    description: string;
    ipAddress?: string;
  }): Promise<AuditLog> {
    return this.log({
      userId: params.userId,
      tenantId: params.tenantId,
      eventType: AuditEventType.SETTINGS_CHANGED,
      eventCategory: AuditEventCategory.CONFIGURATION,
      severity: AuditSeverity.INFO,
      description: params.description,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      oldValues: params.oldValues,
      newValues: params.newValues,
      ipAddress: params.ipAddress,
    });
  }

  /**
   * Query audit logs with filters
   */
  async query(query: AuditLogQuery): Promise<{ logs: AuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log');

    // Apply filters
    if (query.tenantId) {
      queryBuilder.andWhere('audit_log.tenantId = :tenantId', { tenantId: query.tenantId });
    }

    if (query.userId) {
      queryBuilder.andWhere('audit_log.userId = :userId', { userId: query.userId });
    }

    if (query.eventType) {
      queryBuilder.andWhere('audit_log.eventType = :eventType', { eventType: query.eventType });
    }

    if (query.eventCategory) {
      queryBuilder.andWhere('audit_log.eventCategory = :eventCategory', {
        eventCategory: query.eventCategory,
      });
    }

    if (query.severity) {
      queryBuilder.andWhere('audit_log.severity = :severity', { severity: query.severity });
    }

    if (query.ipAddress) {
      queryBuilder.andWhere('audit_log.ipAddress = :ipAddress', { ipAddress: query.ipAddress });
    }

    if (query.isSuspicious !== undefined) {
      queryBuilder.andWhere('audit_log.isSuspicious = :isSuspicious', {
        isSuspicious: query.isSuspicious,
      });
    }

    if (query.isSuccessful !== undefined) {
      queryBuilder.andWhere('audit_log.isSuccessful = :isSuccessful', {
        isSuccessful: query.isSuccessful,
      });
    }

    if (query.startDate) {
      queryBuilder.andWhere('audit_log.createdAt >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('audit_log.createdAt <= :endDate', { endDate: query.endDate });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const limit = query.limit || 100;
    const offset = query.offset || 0;

    queryBuilder.orderBy('audit_log.createdAt', 'DESC').skip(offset).take(limit);

    // Include relations
    queryBuilder.leftJoinAndSelect('audit_log.user', 'user');
    queryBuilder.leftJoinAndSelect('audit_log.tenant', 'tenant');

    const logs = await queryBuilder.getMany();

    return { logs, total };
  }

  /**
   * Get suspicious activities
   */
  async getSuspiciousActivities(
    tenantId?: string,
    limit: number = 50,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return this.query({
      tenantId,
      isSuspicious: true,
      limit,
    });
  }

  /**
   * Get failed login attempts for a user
   */
  async getFailedLoginAttempts(
    userId: string,
    hours: number = 24,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    return this.query({
      userId,
      eventType: AuditEventType.LOGIN_FAILURE,
      startDate,
    });
  }

  /**
   * Archive old audit logs (for data retention)
   */
  async archiveOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .update(AuditLog)
      .set({ isArchived: true })
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('isArchived = :isArchived', { isArchived: false })
      .execute();

    this.logger.log(`Archived ${result.affected} audit logs older than ${daysToKeep} days`);

    return result.affected || 0;
  }

  /**
   * Delete archived logs (hard delete for compliance)
   */
  async deleteArchivedLogs(): Promise<number> {
    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .from(AuditLog)
      .where('isArchived = :isArchived', { isArchived: true })
      .execute();

    this.logger.log(`Deleted ${result.affected} archived audit logs`);

    return result.affected || 0;
  }

  /**
   * Helper: Get description for auth events
   */
  private getAuthEventDescription(eventType: AuditEventType, isSuccessful: boolean): string {
    const action = eventType.replace(/_/g, ' ').toLowerCase();
    return isSuccessful ? `Successful ${action}` : `Failed ${action}`;
  }

  /**
   * Helper: Determine if auth event is suspicious
   */
  private isSuspiciousAuth(params: {
    eventType: AuditEventType;
    isSuccessful: boolean;
    metadata?: Record<string, any>;
  }): boolean {
    // Mark as suspicious if multiple failures
    if (!params.isSuccessful) {
      const failureTypes = [
        AuditEventType.LOGIN_FAILURE,
        AuditEventType.TWO_FACTOR_FAILED,
        AuditEventType.PASSWORD_RESET_FAILED,
      ];

      if (failureTypes.includes(params.eventType)) {
        return true;
      }
    }

    // Additional heuristics can be added here
    // e.g., unusual IP addresses, unusual times, etc.

    return false;
  }

  /**
   * Get audit statistics
   */
  async getStatistics(
    tenantId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    suspiciousEvents: number;
    eventsByType: Record<string, number>;
    eventsByCategory: Record<string, number>;
  }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log');

    if (tenantId) {
      queryBuilder.where('audit_log.tenantId = :tenantId', { tenantId });
    }

    if (startDate) {
      queryBuilder.andWhere('audit_log.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('audit_log.createdAt <= :endDate', { endDate });
    }

    const [totalEvents, successfulEvents, failedEvents, suspiciousEvents] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.clone().andWhere('audit_log.isSuccessful = :isSuccessful', { isSuccessful: true }).getCount(),
      queryBuilder.clone().andWhere('audit_log.isSuccessful = :isSuccessful', { isSuccessful: false }).getCount(),
      queryBuilder.clone().andWhere('audit_log.isSuspicious = :isSuspicious', { isSuspicious: true }).getCount(),
    ]);

    // Get events by type
    const eventsByTypeResult = await queryBuilder
      .clone()
      .select('audit_log.eventType', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit_log.eventType')
      .getRawMany();

    const eventsByType: Record<string, number> = {};
    eventsByTypeResult.forEach((row) => {
      eventsByType[row.eventType] = parseInt(row.count, 10);
    });

    // Get events by category
    const eventsByCategoryResult = await queryBuilder
      .clone()
      .select('audit_log.eventCategory', 'eventCategory')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit_log.eventCategory')
      .getRawMany();

    const eventsByCategory: Record<string, number> = {};
    eventsByCategoryResult.forEach((row) => {
      eventsByCategory[row.eventCategory] = parseInt(row.count, 10);
    });

    return {
      totalEvents,
      successfulEvents,
      failedEvents,
      suspiciousEvents,
      eventsByType,
      eventsByCategory,
    };
  }
}
