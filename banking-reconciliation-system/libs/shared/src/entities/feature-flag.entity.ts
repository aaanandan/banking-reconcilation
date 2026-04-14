import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FeatureFlagTypeEnum {
  BOOLEAN = 'boolean',
  PERCENTAGE = 'percentage',
  WHITELIST = 'whitelist',
  EXPERIMENT = 'experiment',
}

export enum FeatureFlagStatusEnum {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  TESTING = 'testing',
}

export enum TargetingStrategyEnum {
  ALL_USERS = 'all_users',
  PERCENTAGE_ROLLOUT = 'percentage_rollout',
  USER_WHITELIST = 'user_whitelist',
  TENANT_WHITELIST = 'tenant_whitelist',
  PLAN_BASED = 'plan_based',
  CUSTOM = 'custom',
}

@Entity('feature_flags')
@Index(['key'], { unique: true })
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  key: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: FeatureFlagTypeEnum, default: FeatureFlagTypeEnum.BOOLEAN })
  type: FeatureFlagTypeEnum;

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @Column({ type: 'enum', enum: FeatureFlagStatusEnum, default: FeatureFlagStatusEnum.DISABLED })
  status: FeatureFlagStatusEnum;

  @Column({ type: 'enum', enum: TargetingStrategyEnum, default: TargetingStrategyEnum.ALL_USERS })
  targetingStrategy: TargetingStrategyEnum;

  // Percentage rollout (0-100)
  @Column({ type: 'int', nullable: true, default: 0 })
  rolloutPercentage?: number;

  // User whitelist (array of user IDs)
  @Column({ type: 'jsonb', nullable: true })
  whitelistedUsers?: string[];

  // Tenant whitelist (array of tenant IDs)
  @Column({ type: 'jsonb', nullable: true })
  whitelistedTenants?: string[];

  // Plan-based access (array of plan names: 'free', 'starter', 'professional', 'enterprise')
  @Column({ type: 'jsonb', nullable: true })
  allowedPlans?: string[];

  // Experiment variants (for A/B testing)
  @Column({ type: 'jsonb', nullable: true })
  experimentVariants?: Array<{
    key: string;
    name: string;
    weight: number;
    metadata?: Record<string, any>;
  }>;

  // Custom metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Usage tracking
  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount: number;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  // User overrides (temporary overrides for specific users/tenants)
  @Column({ type: 'jsonb', nullable: true })
  overrides?: Array<{
    userId?: string;
    tenantId?: string;
    enabled: boolean;
    reason?: string;
    expiresAt?: Date;
  }>;

  // Created by (user ID or 'system')
  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Soft delete
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  /**
   * Check if flag is enabled for a specific context
   */
  isEnabledFor(context: {
    userId?: string;
    tenantId?: string;
    plan?: string;
  }): boolean {
    // Check if flag is globally disabled
    if (!this.enabled) {
      return false;
    }

    // Check for user/tenant overrides
    if (this.overrides && this.overrides.length > 0) {
      const override = this.overrides.find(
        (o) =>
          (o.userId && o.userId === context.userId) ||
          (o.tenantId && o.tenantId === context.tenantId),
      );

      if (override) {
        // Check if override is expired
        if (override.expiresAt && new Date(override.expiresAt) < new Date()) {
          // Override expired, continue with normal evaluation
        } else {
          return override.enabled;
        }
      }
    }

    // Evaluate based on targeting strategy
    switch (this.targetingStrategy) {
      case TargetingStrategyEnum.ALL_USERS:
        return true;

      case TargetingStrategyEnum.PERCENTAGE_ROLLOUT:
        return this.evaluatePercentageRollout(context.userId || context.tenantId || '');

      case TargetingStrategyEnum.USER_WHITELIST:
        return (
          context.userId &&
          this.whitelistedUsers &&
          this.whitelistedUsers.includes(context.userId)
        );

      case TargetingStrategyEnum.TENANT_WHITELIST:
        return (
          context.tenantId &&
          this.whitelistedTenants &&
          this.whitelistedTenants.includes(context.tenantId)
        );

      case TargetingStrategyEnum.PLAN_BASED:
        return (
          context.plan && this.allowedPlans && this.allowedPlans.includes(context.plan)
        );

      default:
        return false;
    }
  }

  /**
   * Evaluate percentage-based rollout using consistent hashing
   */
  private evaluatePercentageRollout(identifier: string): boolean {
    if (!this.rolloutPercentage || this.rolloutPercentage === 0) {
      return false;
    }

    if (this.rolloutPercentage === 100) {
      return true;
    }

    // Use simple hash for consistent percentage evaluation
    const hash = this.simpleHash(identifier + this.key);
    const bucket = hash % 100;

    return bucket < this.rolloutPercentage;
  }

  /**
   * Simple hash function for consistent bucketing
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get experiment variant for A/B testing
   */
  getExperimentVariant(identifier: string): string | null {
    if (this.type !== FeatureFlagTypeEnum.EXPERIMENT || !this.experimentVariants) {
      return null;
    }

    // Use consistent hashing to assign variant
    const hash = this.simpleHash(identifier + this.key);
    const totalWeight = this.experimentVariants.reduce((sum, v) => sum + v.weight, 0);

    if (totalWeight === 0) {
      return null;
    }

    const bucket = hash % totalWeight;
    let cumulativeWeight = 0;

    for (const variant of this.experimentVariants) {
      cumulativeWeight += variant.weight;
      if (bucket < cumulativeWeight) {
        return variant.key;
      }
    }

    return this.experimentVariants[0]?.key || null;
  }

  /**
   * Increment usage counter
   */
  incrementUsage(): void {
    this.usageCount += 1;
    this.lastUsedAt = new Date();
  }

  /**
   * Add temporary override
   */
  addOverride(override: {
    userId?: string;
    tenantId?: string;
    enabled: boolean;
    reason?: string;
    expiresAt?: Date;
  }): void {
    if (!this.overrides) {
      this.overrides = [];
    }

    // Remove existing override for same user/tenant
    this.overrides = this.overrides.filter(
      (o) => o.userId !== override.userId && o.tenantId !== override.tenantId,
    );

    this.overrides.push(override);
  }

  /**
   * Remove override
   */
  removeOverride(userId?: string, tenantId?: string): void {
    if (!this.overrides) {
      return;
    }

    this.overrides = this.overrides.filter(
      (o) => o.userId !== userId && o.tenantId !== tenantId,
    );
  }

  /**
   * Clean expired overrides
   */
  cleanExpiredOverrides(): void {
    if (!this.overrides) {
      return;
    }

    const now = new Date();
    this.overrides = this.overrides.filter(
      (o) => !o.expiresAt || new Date(o.expiresAt) >= now,
    );
  }
}
