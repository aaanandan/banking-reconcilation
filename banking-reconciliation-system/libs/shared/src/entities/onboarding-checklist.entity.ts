import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

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

@Entity('onboarding_checklists')
@Index(['tenantId'])
export class OnboardingChecklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 255 })
  @Index()
  tenantId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255, nullable: true })
  userId?: string;

  // Overall progress
  @Column({ name: 'overall_progress', type: 'int', default: 0 })
  overallProgress: number; // 0-100 percentage

  @Column({ name: 'current_step', type: 'enum', enum: OnboardingStepEnum, default: OnboardingStepEnum.WELCOME })
  currentStep: OnboardingStepEnum;

  @Column({ name: 'is_complete', type: 'boolean', default: false })
  isComplete: boolean;

  // Individual step statuses (JSON column)
  @Column({ name: 'steps', type: 'jsonb', default: {} })
  steps: Record<OnboardingStepEnum, {
    status: OnboardingStatusEnum;
    completedAt?: Date;
    skippedAt?: Date;
    skipReason?: string;
    metadata?: Record<string, any>;
  }>;

  // Onboarding metadata
  @Column({ name: 'referral_source', type: 'varchar', length: 255, nullable: true })
  referralSource?: string;

  @Column({ name: 'interests', type: 'jsonb', nullable: true })
  interests?: string[];

  @Column({ name: 'company_size', type: 'varchar', length: 100, nullable: true })
  companySize?: string;

  @Column({ name: 'industry', type: 'varchar', length: 100, nullable: true })
  industry?: string;

  // Trial information
  @Column({ name: 'trial_start_date', type: 'timestamp', nullable: true })
  trialStartDate?: Date;

  @Column({ name: 'trial_end_date', type: 'timestamp', nullable: true })
  trialEndDate?: Date;

  @Column({ name: 'trial_extended', type: 'boolean', default: false })
  trialExtended: boolean;

  @Column({ name: 'trial_extension_days', type: 'int', default: 0 })
  trialExtensionDays: number;

  @Column({ name: 'converted_to_paid', type: 'boolean', default: false })
  convertedToPaid: boolean;

  @Column({ name: 'converted_at', type: 'timestamp', nullable: true })
  convertedAt?: Date;

  // Timestamps
  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper method to check if step is complete
  isStepComplete(step: OnboardingStepEnum): boolean {
    return this.steps[step]?.status === OnboardingStatusEnum.COMPLETED;
  }

  // Helper method to get completed steps count
  getCompletedStepsCount(): number {
    return Object.values(this.steps).filter(
      (step) => step.status === OnboardingStatusEnum.COMPLETED
    ).length;
  }

  // Helper method to calculate progress
  calculateProgress(): number {
    const totalSteps = Object.keys(OnboardingStepEnum).length;
    const completedSteps = this.getCompletedStepsCount();
    return Math.round((completedSteps / totalSteps) * 100);
  }

  // Helper method to get days remaining in trial
  getTrialDaysRemaining(): number {
    if (!this.trialEndDate) return 0;
    const now = new Date();
    const diffTime = this.trialEndDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
}
