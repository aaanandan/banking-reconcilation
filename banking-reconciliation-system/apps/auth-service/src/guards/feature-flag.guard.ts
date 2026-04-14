import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_FLAG_KEY } from '../decorators/feature-flag.decorator';
import { FeatureFlagService } from '../feature-flag.service';

/**
 * Guard to check if a feature flag is enabled for the current user/tenant
 *
 * Usage with @FeatureFlag decorator:
 * ```typescript
 * @UseGuards(FeatureFlagGuard)
 * @FeatureFlag('new-dashboard')
 * @Get('dashboard')
 * async getDashboard() {
 *   return this.dashboardService.getNew();
 * }
 * ```
 */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureFlagService: FeatureFlagService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const flagKey = this.reflector.get<string>(FEATURE_FLAG_KEY, context.getHandler());

    if (!flagKey) {
      // No feature flag specified, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Extract user/tenant from request (adjust based on your auth implementation)
    const userId = request.user?.id || request.user?.userId;
    const tenantId = request.user?.tenantId || request.headers['x-tenant-id'];
    const plan = request.user?.plan || request.headers['x-plan'];

    // Check if feature flag is enabled
    const evaluation = await this.featureFlagService.isEnabled({
      flagKey,
      userId,
      tenantId,
      plan,
    });

    if (!evaluation.enabled) {
      throw new ForbiddenException(
        `Feature '${flagKey}' is not available. Reason: ${evaluation.reason}`,
      );
    }

    // Attach evaluation result to request for later use
    request.featureFlagEvaluation = evaluation;

    return true;
  }
}
