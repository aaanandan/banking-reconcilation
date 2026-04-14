import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/shared/entities/user.entity';

/**
 * Admin Guard
 *
 * Ensures only users with admin privileges can access protected routes
 *
 * Requirements:
 * - User must be authenticated (checked by JwtAuthGuard)
 * - User must have isAdmin flag set to true
 * - User account must be active
 *
 * Usage:
 * ```typescript
 * @UseGuards(JwtAuthGuard, AdminGuard)
 * @Get('admin/dashboard')
 * async getAdminDashboard() {
 *   return this.adminService.getDashboard();
 * }
 * ```
 *
 * The guard logs all admin access attempts for security auditing
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // User should already be authenticated by JwtAuthGuard
    if (!user || !user.id) {
      throw new UnauthorizedException('Authentication required');
    }

    // Fetch full user details from database to verify admin status
    const fullUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['tenant'],
    });

    if (!fullUser) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is active
    if (!fullUser.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    // Check if user is suspended
    if (fullUser.isSuspended) {
      throw new ForbiddenException('User account is suspended');
    }

    // Check if user has admin privileges
    if (!fullUser.isAdmin) {
      throw new ForbiddenException(
        'Access denied: Admin privileges required',
      );
    }

    // Attach full user details to request for use in controllers
    request.adminUser = fullUser;

    // Log admin access for security auditing
    this.logAdminAccess(fullUser, request);

    return true;
  }

  /**
   * Log admin access attempts for security auditing
   *
   * This creates an audit trail of all admin actions
   * for compliance and security monitoring
   */
  private logAdminAccess(user: User, request: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      adminId: user.id,
      adminEmail: user.email,
      method: request.method,
      path: request.path,
      ipAddress: this.getClientIp(request),
      userAgent: request.headers['user-agent'],
    };

    // In production, send this to a logging service or database
    // For now, we'll use console.log (should be replaced with proper logging)
    console.log('[ADMIN_ACCESS]', JSON.stringify(logEntry));

    // TODO: In production, store in database or send to logging service
    // await this.auditLogService.logAdminAccess(logEntry);
  }

  /**
   * Extract client IP address from request
   *
   * Checks multiple headers to handle proxies and load balancers
   */
  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }
}
