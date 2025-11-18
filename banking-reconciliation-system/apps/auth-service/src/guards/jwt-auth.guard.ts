import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

/**
 * JWT Authentication Guard
 *
 * Validates JWT tokens for protected routes
 * Uses Passport JWT strategy for token validation
 *
 * Usage:
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('protected')
 * async getProtectedResource(@Request() req) {
 *   // req.user is populated by JWT strategy
 *   return { userId: req.user.id };
 * }
 * ```
 *
 * Can be used with other guards:
 * ```typescript
 * @UseGuards(JwtAuthGuard, AdminGuard)
 * @Get('admin')
 * async getAdminResource() {
 *   return this.adminService.getData();
 * }
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Custom error handling for JWT validation
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return user;
    }

    // If there's an error or no user, throw unauthorized
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }

    return user;
  }
}
