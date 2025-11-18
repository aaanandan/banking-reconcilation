import { SetMetadata } from '@nestjs/common';

export const FEATURE_FLAG_KEY = 'featureFlag';

/**
 * Decorator to protect routes with feature flags
 *
 * @example
 * ```typescript
 * @FeatureFlag('new-dashboard')
 * @Get('dashboard')
 * async getDashboard() {
 *   return this.dashboardService.getNew();
 * }
 * ```
 */
export const FeatureFlag = (flagKey: string) => SetMetadata(FEATURE_FLAG_KEY, flagKey);
