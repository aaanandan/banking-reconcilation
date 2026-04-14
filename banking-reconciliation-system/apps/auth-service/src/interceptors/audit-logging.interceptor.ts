// apps/auth-service/src/interceptors/audit-logging.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditLogService } from '../audit-log.service';
import { AuditEventCategory, AuditSeverity } from '@app/shared/entities/audit-log.entity';

/**
 * AuditLoggingInterceptor
 *
 * Automatically logs HTTP requests and responses for audit trail.
 * Captures request details, response status, timing, and errors.
 */
@Injectable()
export class AuditLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLoggingInterceptor.name);

  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const startTime = Date.now();

    // Extract request information
    const httpMethod = request.method;
    const httpPath = request.url;
    const ipAddress = this.getIpAddress(request);
    const userAgent = request.headers['user-agent'];

    // Extract user/tenant info if available (set by auth guards)
    const userId = request.user?.userId || request.userId || null;
    const tenantId = request.user?.tenantId || request.tenantId || null;
    const sessionId = request.headers['x-request-id'] || null;

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Only log specific endpoints (not health checks, static files, etc.)
        if (this.shouldLog(httpMethod, httpPath)) {
          this.createAuditLog({
            userId,
            tenantId,
            httpMethod,
            httpPath,
            statusCode,
            responseTime,
            ipAddress,
            userAgent,
            sessionId,
            isSuccessful: statusCode < 400,
          });
        }
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Log errors
        if (this.shouldLog(httpMethod, httpPath)) {
          this.createAuditLog({
            userId,
            tenantId,
            httpMethod,
            httpPath,
            statusCode,
            responseTime,
            ipAddress,
            userAgent,
            sessionId,
            isSuccessful: false,
            failureReason: error.message,
            metadata: {
              errorName: error.name,
              errorStack: error.stack?.split('\n').slice(0, 3), // First 3 lines only
            },
          });
        }

        throw error;
      }),
    );
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(params: {
    userId: string | null;
    tenantId: string | null;
    httpMethod: string;
    httpPath: string;
    statusCode: number;
    responseTime: number;
    ipAddress: string;
    userAgent: string;
    sessionId: string | null;
    isSuccessful: boolean;
    failureReason?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.auditLogService.log({
        userId: params.userId,
        tenantId: params.tenantId,
        eventType: this.getEventType(params.httpMethod, params.httpPath),
        eventCategory: this.getEventCategory(params.httpPath),
        severity: this.getSeverity(params.statusCode),
        description: `${params.httpMethod} ${params.httpPath} - ${params.statusCode}`,
        httpMethod: params.httpMethod,
        httpPath: params.httpPath,
        httpStatusCode: params.statusCode,
        responseTime: params.responseTime,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        sessionId: params.sessionId,
        isSuccessful: params.isSuccessful,
        failureReason: params.failureReason,
        metadata: params.metadata,
        isSuspicious: this.isSuspicious(params),
      });
    } catch (error) {
      // Don't let audit logging break the request
      this.logger.error('Failed to create audit log', error.stack);
    }
  }

  /**
   * Determine if request should be logged
   */
  private shouldLog(method: string, path: string): boolean {
    // Don't log health checks
    if (path.includes('/health') || path.includes('/metrics')) {
      return false;
    }

    // Don't log static files
    if (path.match(/\.(js|css|png|jpg|svg|ico|woff|ttf)$/)) {
      return false;
    }

    // Don't log OPTIONS requests (CORS preflight)
    if (method === 'OPTIONS') {
      return false;
    }

    return true;
  }

  /**
   * Get event type based on HTTP method and path
   */
  private getEventType(method: string, path: string): string {
    // Authentication endpoints
    if (path.includes('/auth/login')) return 'http_login';
    if (path.includes('/auth/register')) return 'http_register';
    if (path.includes('/auth/logout')) return 'http_logout';
    if (path.includes('/auth/refresh')) return 'http_refresh_token';
    if (path.includes('/auth/2fa')) return 'http_2fa';
    if (path.includes('/auth/forgot-password')) return 'http_password_reset';
    if (path.includes('/auth/oauth')) return 'http_oauth';

    // API key endpoints
    if (path.includes('/api-keys')) return 'http_api_key_management';

    // Generic HTTP operations
    return `http_${method.toLowerCase()}`;
  }

  /**
   * Get event category based on path
   */
  private getEventCategory(path: string): string {
    if (path.includes('/auth')) return AuditEventCategory.AUTHENTICATION;
    if (path.includes('/api-keys')) return AuditEventCategory.SECURITY;
    if (path.includes('/users') || path.includes('/tenants')) {
      return AuditEventCategory.CONFIGURATION;
    }

    return AuditEventCategory.DATA_ACCESS;
  }

  /**
   * Get severity based on HTTP status code
   */
  private getSeverity(statusCode: number): string {
    if (statusCode >= 500) return AuditSeverity.ERROR;
    if (statusCode >= 400) return AuditSeverity.WARNING;
    return AuditSeverity.INFO;
  }

  /**
   * Determine if request is suspicious
   */
  private isSuspicious(params: {
    statusCode: number;
    httpPath: string;
    failureReason?: string;
  }): boolean {
    // Failed authentication attempts
    if (params.statusCode === 401 && params.httpPath.includes('/auth')) {
      return true;
    }

    // Multiple 403 Forbidden responses
    if (params.statusCode === 403) {
      return true;
    }

    // SQL injection attempts (basic detection)
    if (params.httpPath.toLowerCase().match(/(union|select|insert|delete|drop|;|--)/)) {
      return true;
    }

    return false;
  }

  /**
   * Extract real IP address from request
   */
  private getIpAddress(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }
}
