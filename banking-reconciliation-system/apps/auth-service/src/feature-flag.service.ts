import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { FeatureFlag, FeatureFlagTypeEnum, FeatureFlagStatusEnum, TargetingStrategyEnum } from '@app/shared/entities/feature-flag.entity';
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  FeatureFlagDto,
  CheckFeatureFlagDto,
  FeatureFlagEvaluationDto,
  BulkFeatureFlagsDto,
  BulkFeatureFlagsResponseDto,
  FeatureFlagUsageDto,
  CreateExperimentDto,
  ExperimentResultDto,
  ExperimentMetricsDto,
  FeatureFlagOverrideDto,
  FeatureFlagStatisticsDto,
  FeatureFlagListDto,
} from './dto/feature-flag.dto';

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);
  private readonly flagCache = new Map<string, FeatureFlag>();
  private cacheLastUpdated: Date = new Date();
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor(
    @InjectRepository(FeatureFlag)
    private featureFlagRepository: Repository<FeatureFlag>,
  ) {
    // Initialize cache
    this.refreshCache();
  }

  /**
   * Create a new feature flag
   */
  async create(dto: CreateFeatureFlagDto, createdBy?: string): Promise<FeatureFlagDto> {
    // Check if flag with this key already exists
    const existing = await this.featureFlagRepository.findOne({
      where: { key: dto.key, deletedAt: IsNull() },
    });

    if (existing) {
      throw new ConflictException(`Feature flag with key '${dto.key}' already exists`);
    }

    const flag = this.featureFlagRepository.create({
      ...dto,
      status: dto.enabled ? FeatureFlagStatusEnum.ENABLED : FeatureFlagStatusEnum.DISABLED,
      createdBy,
    });

    await this.featureFlagRepository.save(flag);
    await this.refreshCache();

    this.logger.log(`Feature flag created: ${flag.key}`);

    return this.mapToDto(flag);
  }

  /**
   * Update a feature flag
   */
  async update(key: string, dto: UpdateFeatureFlagDto): Promise<FeatureFlagDto> {
    const flag = await this.findByKey(key);

    // Update fields
    Object.assign(flag, dto);

    // Update status based on enabled field
    if (dto.enabled !== undefined) {
      flag.status = dto.enabled ? FeatureFlagStatusEnum.ENABLED : FeatureFlagStatusEnum.DISABLED;
    }

    await this.featureFlagRepository.save(flag);
    await this.refreshCache();

    this.logger.log(`Feature flag updated: ${flag.key}`);

    return this.mapToDto(flag);
  }

  /**
   * Delete a feature flag (soft delete)
   */
  async delete(key: string): Promise<void> {
    const flag = await this.findByKey(key);

    flag.deletedAt = new Date();
    await this.featureFlagRepository.save(flag);
    await this.refreshCache();

    this.logger.log(`Feature flag deleted: ${flag.key}`);
  }

  /**
   * Get a feature flag by key
   */
  async getByKey(key: string): Promise<FeatureFlagDto> {
    const flag = await this.findByKey(key);
    return this.mapToDto(flag);
  }

  /**
   * Get all feature flags
   */
  async getAll(page: number = 1, pageSize: number = 50): Promise<FeatureFlagListDto> {
    const [flags, total] = await this.featureFlagRepository.findAndCount({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      flags: flags.map((f) => this.mapToDto(f)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Check if a feature flag is enabled for a given context
   */
  async isEnabled(dto: CheckFeatureFlagDto): Promise<FeatureFlagEvaluationDto> {
    const flag = await this.getCachedFlag(dto.flagKey);

    if (!flag) {
      this.logger.warn(`Feature flag not found: ${dto.flagKey}`);
      return {
        flagKey: dto.flagKey,
        enabled: false,
        reason: 'Flag not found',
      };
    }

    const context = {
      userId: dto.userId,
      tenantId: dto.tenantId,
      plan: dto.plan,
    };

    const enabled = flag.isEnabledFor(context);

    // Increment usage counter (async, don't wait)
    this.incrementUsageAsync(flag.id);

    let reason = this.getEvaluationReason(flag, context, enabled);
    let variant: string | undefined;

    // Get experiment variant if this is an experiment
    if (flag.type === FeatureFlagTypeEnum.EXPERIMENT && enabled) {
      const identifier = dto.userId || dto.tenantId || '';
      variant = flag.getExperimentVariant(identifier) || undefined;
    }

    return {
      flagKey: dto.flagKey,
      enabled,
      reason,
      variant,
      metadata: flag.metadata,
    };
  }

  /**
   * Get multiple feature flags at once (bulk evaluation)
   */
  async getBulk(dto: BulkFeatureFlagsDto): Promise<BulkFeatureFlagsResponseDto> {
    const flags: Record<string, FeatureFlagEvaluationDto> = {};

    // Get all flags or specified flags
    const flagKeys = dto.flagKeys || Array.from(this.flagCache.keys());

    for (const flagKey of flagKeys) {
      const evaluation = await this.isEnabled({
        flagKey,
        userId: dto.userId,
        tenantId: dto.tenantId,
        plan: dto.plan,
      });

      flags[flagKey] = evaluation;
    }

    return {
      flags,
      evaluatedAt: new Date(),
    };
  }

  /**
   * Create an A/B test experiment
   */
  async createExperiment(dto: CreateExperimentDto, createdBy?: string): Promise<FeatureFlagDto> {
    // Validate variant weights sum to 100
    const totalWeight = dto.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      throw new BadRequestException('Variant weights must sum to 100');
    }

    const flag = await this.create(
      {
        key: dto.key,
        name: dto.name,
        description: dto.description,
        type: FeatureFlagTypeEnum.EXPERIMENT,
        enabled: true,
        targetingStrategy: dto.targetingStrategy || TargetingStrategyEnum.ALL_USERS,
        rolloutPercentage: dto.trafficAllocation,
        metadata: {
          variants: dto.variants,
        },
      },
      createdBy,
    );

    // Update with experiment variants
    const flagEntity = await this.findByKey(dto.key);
    flagEntity.experimentVariants = dto.variants.map((v) => ({
      key: v.key,
      name: v.name,
      weight: v.weight,
      metadata: v.metadata,
    }));
    await this.featureFlagRepository.save(flagEntity);

    return this.mapToDto(flagEntity);
  }

  /**
   * Get experiment result for a user/tenant
   */
  async getExperimentVariant(experimentKey: string, identifier: string): Promise<ExperimentResultDto> {
    const flag = await this.getCachedFlag(experimentKey);

    if (!flag) {
      throw new NotFoundException(`Experiment not found: ${experimentKey}`);
    }

    if (flag.type !== FeatureFlagTypeEnum.EXPERIMENT) {
      throw new BadRequestException(`Flag ${experimentKey} is not an experiment`);
    }

    if (!flag.enabled) {
      return {
        experimentKey,
        variant: 'control',
        reason: 'Experiment is disabled',
      };
    }

    const variant = flag.getExperimentVariant(identifier);

    if (!variant) {
      return {
        experimentKey,
        variant: 'control',
        reason: 'No variant assigned',
      };
    }

    const variantData = flag.experimentVariants?.find((v) => v.key === variant);

    return {
      experimentKey,
      variant,
      variantMetadata: variantData?.metadata,
      reason: 'Variant assigned via consistent hashing',
    };
  }

  /**
   * Add override for specific user/tenant
   */
  async addOverride(dto: FeatureFlagOverrideDto): Promise<void> {
    const flag = await this.findByKey(dto.flagKey);

    flag.addOverride({
      userId: dto.userId,
      tenantId: dto.tenantId,
      enabled: dto.enabled,
      reason: dto.reason,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });

    await this.featureFlagRepository.save(flag);
    await this.refreshCache();

    this.logger.log(`Override added for flag ${dto.flagKey}: user=${dto.userId}, tenant=${dto.tenantId}, enabled=${dto.enabled}`);
  }

  /**
   * Remove override
   */
  async removeOverride(flagKey: string, userId?: string, tenantId?: string): Promise<void> {
    const flag = await this.findByKey(flagKey);

    flag.removeOverride(userId, tenantId);

    await this.featureFlagRepository.save(flag);
    await this.refreshCache();

    this.logger.log(`Override removed for flag ${flagKey}: user=${userId}, tenant=${tenantId}`);
  }

  /**
   * Get feature flag statistics
   */
  async getStatistics(): Promise<FeatureFlagStatisticsDto> {
    const flags = await this.featureFlagRepository.find({
      where: { deletedAt: IsNull() },
    });

    const totalFlags = flags.length;
    const enabledFlags = flags.filter((f) => f.status === FeatureFlagStatusEnum.ENABLED).length;
    const disabledFlags = flags.filter((f) => f.status === FeatureFlagStatusEnum.DISABLED).length;
    const testingFlags = flags.filter((f) => f.status === FeatureFlagStatusEnum.TESTING).length;

    const flagsByType: Record<FeatureFlagTypeEnum, number> = {
      [FeatureFlagTypeEnum.BOOLEAN]: 0,
      [FeatureFlagTypeEnum.PERCENTAGE]: 0,
      [FeatureFlagTypeEnum.WHITELIST]: 0,
      [FeatureFlagTypeEnum.EXPERIMENT]: 0,
    };

    flags.forEach((flag) => {
      flagsByType[flag.type]++;
    });

    const flagsByStrategy: Record<TargetingStrategyEnum, number> = {
      [TargetingStrategyEnum.ALL_USERS]: 0,
      [TargetingStrategyEnum.PERCENTAGE_ROLLOUT]: 0,
      [TargetingStrategyEnum.USER_WHITELIST]: 0,
      [TargetingStrategyEnum.TENANT_WHITELIST]: 0,
      [TargetingStrategyEnum.PLAN_BASED]: 0,
      [TargetingStrategyEnum.CUSTOM]: 0,
    };

    flags.forEach((flag) => {
      flagsByStrategy[flag.targetingStrategy]++;
    });

    const mostUsedFlags = flags
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map((f) => ({
        flagKey: f.key,
        usageCount: f.usageCount,
      }));

    return {
      totalFlags,
      enabledFlags,
      disabledFlags,
      testingFlags,
      flagsByType,
      flagsByStrategy,
      mostUsedFlags,
    };
  }

  /**
   * Clean expired overrides for all flags
   */
  async cleanExpiredOverrides(): Promise<number> {
    const flags = await this.featureFlagRepository.find({
      where: { deletedAt: IsNull() },
    });

    let cleanedCount = 0;

    for (const flag of flags) {
      const beforeCount = flag.overrides?.length || 0;
      flag.cleanExpiredOverrides();
      const afterCount = flag.overrides?.length || 0;

      if (beforeCount !== afterCount) {
        await this.featureFlagRepository.save(flag);
        cleanedCount += beforeCount - afterCount;
      }
    }

    if (cleanedCount > 0) {
      await this.refreshCache();
      this.logger.log(`Cleaned ${cleanedCount} expired overrides`);
    }

    return cleanedCount;
  }

  // ==================== Private Helper Methods ====================

  private async findByKey(key: string): Promise<FeatureFlag> {
    const flag = await this.featureFlagRepository.findOne({
      where: { key, deletedAt: IsNull() },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag not found: ${key}`);
    }

    return flag;
  }

  private async getCachedFlag(key: string): Promise<FeatureFlag | null> {
    // Refresh cache if it's stale
    const now = new Date();
    if (now.getTime() - this.cacheLastUpdated.getTime() > this.CACHE_TTL) {
      await this.refreshCache();
    }

    return this.flagCache.get(key) || null;
  }

  private async refreshCache(): Promise<void> {
    const flags = await this.featureFlagRepository.find({
      where: { deletedAt: IsNull() },
    });

    this.flagCache.clear();
    flags.forEach((flag) => {
      this.flagCache.set(flag.key, flag);
    });

    this.cacheLastUpdated = new Date();
    this.logger.debug(`Feature flag cache refreshed: ${flags.length} flags loaded`);
  }

  private async incrementUsageAsync(flagId: string): Promise<void> {
    // Fire and forget - don't wait for this
    this.featureFlagRepository
      .increment({ id: flagId }, 'usageCount', 1)
      .catch((error) => {
        this.logger.error(`Failed to increment usage count: ${error.message}`);
      });

    // Also update last used timestamp
    this.featureFlagRepository
      .update({ id: flagId }, { lastUsedAt: new Date() })
      .catch((error) => {
        this.logger.error(`Failed to update lastUsedAt: ${error.message}`);
      });
  }

  private getEvaluationReason(
    flag: FeatureFlag,
    context: { userId?: string; tenantId?: string; plan?: string },
    enabled: boolean,
  ): string {
    if (!flag.enabled) {
      return 'Flag is globally disabled';
    }

    // Check for overrides
    if (flag.overrides && flag.overrides.length > 0) {
      const override = flag.overrides.find(
        (o) =>
          (o.userId && o.userId === context.userId) ||
          (o.tenantId && o.tenantId === context.tenantId),
      );

      if (override) {
        if (override.expiresAt && new Date(override.expiresAt) < new Date()) {
          return 'Override expired, evaluated normally';
        }
        return `Override applied: ${override.reason || 'Manual override'}`;
      }
    }

    if (!enabled) {
      switch (flag.targetingStrategy) {
        case TargetingStrategyEnum.PERCENTAGE_ROLLOUT:
          return `User not in rollout percentage (${flag.rolloutPercentage}%)`;
        case TargetingStrategyEnum.USER_WHITELIST:
          return 'User not in whitelist';
        case TargetingStrategyEnum.TENANT_WHITELIST:
          return 'Tenant not in whitelist';
        case TargetingStrategyEnum.PLAN_BASED:
          return `Plan '${context.plan}' not allowed`;
        default:
          return 'Targeting criteria not met';
      }
    }

    switch (flag.targetingStrategy) {
      case TargetingStrategyEnum.ALL_USERS:
        return 'Enabled for all users';
      case TargetingStrategyEnum.PERCENTAGE_ROLLOUT:
        return `User in rollout percentage (${flag.rolloutPercentage}%)`;
      case TargetingStrategyEnum.USER_WHITELIST:
        return 'User in whitelist';
      case TargetingStrategyEnum.TENANT_WHITELIST:
        return 'Tenant in whitelist';
      case TargetingStrategyEnum.PLAN_BASED:
        return `Plan '${context.plan}' allowed`;
      default:
        return 'Enabled';
    }
  }

  private mapToDto(flag: FeatureFlag): FeatureFlagDto {
    return {
      id: flag.id,
      key: flag.key,
      name: flag.name,
      description: flag.description,
      type: flag.type,
      enabled: flag.enabled,
      status: flag.status,
      targetingStrategy: flag.targetingStrategy,
      rolloutPercentage: flag.rolloutPercentage,
      whitelistedUsers: flag.whitelistedUsers,
      whitelistedTenants: flag.whitelistedTenants,
      allowedPlans: flag.allowedPlans,
      metadata: flag.metadata,
      usageCount: flag.usageCount,
      createdAt: flag.createdAt,
      updatedAt: flag.updatedAt,
      createdBy: flag.createdBy,
    };
  }
}
