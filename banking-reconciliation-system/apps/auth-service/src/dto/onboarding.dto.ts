import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum OnboardingStepEnum {
  WELCOME = 'welcome',
  ACCOUNT_SETUP = 'account_setup',
  COMPANY_INFO = 'company_info',
  BANK_ACCOUNT_SETUP = 'bank_account_setup',
  USER_INVITATION = 'user_invitation',
  FIRST_TRANSACTION = 'first_transaction',
  FIRST_RECONCILIATION = 'first_reconciliation',
  PLAN_SELECTION = 'plan_selection',
  PAYMENT_METHOD = 'payment_method',
  COMPLETE = 'complete',
}

export enum OnboardingStatusEnum {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

export class OnboardingStepDto {
  @ApiProperty({ enum: OnboardingStepEnum })
  step: OnboardingStepEnum;

  @ApiProperty({ enum: OnboardingStatusEnum })
  status: OnboardingStatusEnum;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  order: number;

  @ApiProperty({ required: false })
  completedAt?: Date;

  @ApiProperty({ required: false })
  isOptional?: boolean;

  @ApiProperty({ required: false })
  actionUrl?: string;

  @ApiProperty({ required: false })
  actionLabel?: string;
}

export class OnboardingProgressDto {
  tenantId: string;
  overallProgress: number; // 0-100 percentage
  completedSteps: number;
  totalSteps: number;
  currentStep: OnboardingStepEnum;
  steps: OnboardingStepDto[];
  isComplete: boolean;
  startedAt: Date;
  completedAt?: Date;
}

export class CompleteStepDto {
  @ApiProperty({ enum: OnboardingStepEnum })
  @IsEnum(OnboardingStepEnum)
  step: OnboardingStepEnum;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SkipStepDto {
  @ApiProperty({ enum: OnboardingStepEnum })
  @IsEnum(OnboardingStepEnum)
  step: OnboardingStepEnum;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class StartOnboardingDto {
  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  referralSource?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  interests?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  companySize?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  industry?: string;
}

export class CompanyInfoDto {
  @ApiProperty()
  @IsString()
  companyName: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  companySize?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class InviteUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  role: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lastName?: string;
}

export class OnboardingChecklistItemDto {
  id: string;
  category: string;
  title: string;
  description: string;
  isComplete: boolean;
  isRequired: boolean;
  actionUrl?: string;
  actionLabel?: string;
  completedAt?: Date;
  order: number;
}

export class OnboardingChecklistDto {
  tenantId: string;
  categories: {
    name: string;
    items: OnboardingChecklistItemDto[];
    progress: number; // 0-100
  }[];
  overallProgress: number;
  totalItems: number;
  completedItems: number;
}

export class OnboardingGuideDto {
  step: OnboardingStepEnum;
  title: string;
  description: string;
  content: string; // HTML or Markdown
  videoUrl?: string;
  estimatedTime: number; // in minutes
  tips: string[];
  nextStep?: OnboardingStepEnum;
  previousStep?: OnboardingStepEnum;
}

export class TrialStatusDto {
  tenantId: string;
  isOnTrial: boolean;
  trialStartDate?: Date;
  trialEndDate?: Date;
  daysRemaining?: number;
  trialExtended: boolean;
  conversionStatus: 'not_converted' | 'converted' | 'expired';
}

export class ExtendTrialDto {
  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty()
  @IsString()
  extensionDays: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class WelcomeEmailDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  includeGettingStartedGuide?: boolean;
}

export class OnboardingMetricsDto {
  totalOnboarding: number;
  completedOnboarding: number;
  abandonedOnboarding: number;
  averageCompletionTime: number; // in hours
  completionRate: number; // percentage
  conversionRate: number; // trial to paid
  stepCompletionRates: {
    step: OnboardingStepEnum;
    completionRate: number;
    averageTimeToComplete: number; // in minutes
  }[];
  commonDropOffPoints: {
    step: OnboardingStepEnum;
    dropOffRate: number;
  }[];
}

export class OnboardingRecommendationDto {
  tenantId: string;
  recommendations: {
    type: 'action' | 'tip' | 'upgrade';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionUrl?: string;
    actionLabel?: string;
  }[];
  suggestedNextStep?: OnboardingStepEnum;
  estimatedTimeToComplete?: number; // minutes remaining
}

export class ResetOnboardingDto {
  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  keepProgress?: boolean;
}
