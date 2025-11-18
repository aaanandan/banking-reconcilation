import { IsString, IsBoolean, IsOptional, IsEnum, IsArray, IsNumber, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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

export class CreateFeatureFlagDto {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: FeatureFlagTypeEnum, default: FeatureFlagTypeEnum.BOOLEAN })
  @IsEnum(FeatureFlagTypeEnum)
  @IsOptional()
  type?: FeatureFlagTypeEnum = FeatureFlagTypeEnum.BOOLEAN;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean = false;

  @ApiProperty({ enum: TargetingStrategyEnum, default: TargetingStrategyEnum.ALL_USERS })
  @IsEnum(TargetingStrategyEnum)
  @IsOptional()
  targetingStrategy?: TargetingStrategyEnum = TargetingStrategyEnum.ALL_USERS;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  rolloutPercentage?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  whitelistedUsers?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  whitelistedTenants?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedPlans?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateFeatureFlagDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ required: false })
  @IsEnum(TargetingStrategyEnum)
  @IsOptional()
  targetingStrategy?: TargetingStrategyEnum;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  rolloutPercentage?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  whitelistedUsers?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  whitelistedTenants?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedPlans?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class FeatureFlagDto {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: FeatureFlagTypeEnum;
  enabled: boolean;
  status: FeatureFlagStatusEnum;
  targetingStrategy: TargetingStrategyEnum;
  rolloutPercentage?: number;
  whitelistedUsers?: string[];
  whitelistedTenants?: string[];
  allowedPlans?: string[];
  metadata?: Record<string, any>;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export class CheckFeatureFlagDto {
  @ApiProperty()
  @IsString()
  flagKey: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  plan?: string;
}

export class FeatureFlagEvaluationDto {
  flagKey: string;
  enabled: boolean;
  reason: string;
  variant?: string;
  metadata?: Record<string, any>;
}

export class BulkFeatureFlagsDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  plan?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  flagKeys?: string[];
}

export class BulkFeatureFlagsResponseDto {
  flags: Record<string, FeatureFlagEvaluationDto>;
  evaluatedAt: Date;
}

export class FeatureFlagUsageDto {
  flagKey: string;
  totalChecks: number;
  enabledChecks: number;
  disabledChecks: number;
  uniqueUsers: number;
  uniqueTenants: number;
  checksByDate: Array<{
    date: string;
    checks: number;
    enabled: number;
    disabled: number;
  }>;
}

export class ExperimentVariantDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  weight: number;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateExperimentDto {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [ExperimentVariantDto] })
  @ValidateNested({ each: true })
  @Type(() => ExperimentVariantDto)
  variants: ExperimentVariantDto[];

  @ApiProperty({ required: false })
  @IsEnum(TargetingStrategyEnum)
  @IsOptional()
  targetingStrategy?: TargetingStrategyEnum;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  trafficAllocation?: number;
}

export class ExperimentResultDto {
  experimentKey: string;
  variant: string;
  variantMetadata?: Record<string, any>;
  reason: string;
}

export class ExperimentMetricsDto {
  experimentKey: string;
  totalParticipants: number;
  variantDistribution: Array<{
    variant: string;
    count: number;
    percentage: number;
  }>;
  conversionMetrics: Array<{
    variant: string;
    conversions: number;
    conversionRate: number;
  }>;
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'running' | 'paused' | 'completed';
}

export class FeatureFlagOverrideDto {
  @ApiProperty()
  @IsString()
  flagKey: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  expiresAt?: string;
}

export class FeatureFlagAuditLogDto {
  id: string;
  flagKey: string;
  action: 'created' | 'updated' | 'enabled' | 'disabled' | 'deleted';
  performedBy: string;
  changes?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}

export class FeatureFlagListDto {
  flags: FeatureFlagDto[];
  total: number;
  page: number;
  pageSize: number;
}

export class FeatureFlagStatisticsDto {
  totalFlags: number;
  enabledFlags: number;
  disabledFlags: number;
  testingFlags: number;
  flagsByType: Record<FeatureFlagTypeEnum, number>;
  flagsByStrategy: Record<TargetingStrategyEnum, number>;
  mostUsedFlags: Array<{
    flagKey: string;
    usageCount: number;
  }>;
}
