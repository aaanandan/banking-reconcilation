import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingChecklist, OnboardingStepEnum, OnboardingStatusEnum } from '@app/shared/entities/onboarding-checklist.entity';
import { Tenant } from '@app/shared/entities/tenant.entity';
import { TenantService } from './tenant.service';
import {
  OnboardingProgressDto,
  OnboardingStepDto,
  CompleteStepDto,
  SkipStepDto,
  StartOnboardingDto,
  CompanyInfoDto,
  TrialStatusDto,
  ExtendTrialDto,
  OnboardingMetricsDto,
  OnboardingRecommendationDto,
  OnboardingGuideDto,
  OnboardingChecklistDto,
  OnboardingChecklistItemDto,
  ResetOnboardingDto,
} from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);
  private readonly DEFAULT_TRIAL_DAYS = 14;

  constructor(
    @InjectRepository(OnboardingChecklist)
    private onboardingRepository: Repository<OnboardingChecklist>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private tenantService: TenantService,
  ) {}

  /**
   * Start onboarding for a new tenant
   */
  async startOnboarding(dto: StartOnboardingDto): Promise<OnboardingProgressDto> {
    this.logger.log(`Starting onboarding for tenant ${dto.tenantId}`);

    // Check if onboarding already exists
    let onboarding = await this.onboardingRepository.findOne({
      where: { tenantId: dto.tenantId },
    });

    if (onboarding) {
      this.logger.log(`Onboarding already exists for tenant ${dto.tenantId}, returning existing progress`);
      return this.getProgress(dto.tenantId);
    }

    // Initialize steps
    const steps = this.initializeSteps();

    // Set trial period
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + this.DEFAULT_TRIAL_DAYS);

    // Create onboarding record
    onboarding = this.onboardingRepository.create({
      tenantId: dto.tenantId,
      currentStep: OnboardingStepEnum.WELCOME,
      overallProgress: 0,
      steps,
      referralSource: dto.referralSource,
      interests: dto.interests,
      companySize: dto.companySize,
      industry: dto.industry,
      trialStartDate,
      trialEndDate,
      isComplete: false,
    });

    await this.onboardingRepository.save(onboarding);

    // Mark welcome step as in progress
    await this.completeStep(dto.tenantId, {
      step: OnboardingStepEnum.WELCOME,
    });

    return this.getProgress(dto.tenantId);
  }

  /**
   * Get onboarding progress for a tenant
   */
  async getProgress(tenantId: string): Promise<OnboardingProgressDto> {
    const onboarding = await this.findOnboarding(tenantId);
    const steps = this.mapStepsToDto(onboarding);
    const completedSteps = steps.filter(s => s.status === OnboardingStatusEnum.COMPLETED).length;

    return {
      tenantId,
      overallProgress: onboarding.overallProgress,
      completedSteps,
      totalSteps: steps.length,
      currentStep: onboarding.currentStep,
      steps,
      isComplete: onboarding.isComplete,
      startedAt: onboarding.startedAt,
      completedAt: onboarding.completedAt,
    };
  }

  /**
   * Complete an onboarding step
   */
  async completeStep(tenantId: string, dto: CompleteStepDto): Promise<OnboardingProgressDto> {
    const onboarding = await this.findOnboarding(tenantId);

    // Update step status
    onboarding.steps[dto.step] = {
      ...onboarding.steps[dto.step],
      status: OnboardingStatusEnum.COMPLETED,
      completedAt: new Date(),
      metadata: dto.metadata,
    };

    // Update current step to next uncompleted step
    const nextStep = this.getNextStep(dto.step);
    if (nextStep && !onboarding.isStepComplete(nextStep)) {
      onboarding.currentStep = nextStep;
    }

    // Calculate progress
    onboarding.overallProgress = onboarding.calculateProgress();

    // Check if all steps complete
    const allStepsComplete = Object.values(OnboardingStepEnum).every(
      step => onboarding.isStepComplete(step) || step === OnboardingStepEnum.COMPLETE
    );

    if (allStepsComplete && !onboarding.isComplete) {
      onboarding.isComplete = true;
      onboarding.completedAt = new Date();
      onboarding.currentStep = OnboardingStepEnum.COMPLETE;
      onboarding.overallProgress = 100;
    }

    await this.onboardingRepository.save(onboarding);

    this.logger.log(`Step ${dto.step} completed for tenant ${tenantId}. Progress: ${onboarding.overallProgress}%`);

    return this.getProgress(tenantId);
  }

  /**
   * Skip an onboarding step
   */
  async skipStep(tenantId: string, dto: SkipStepDto): Promise<OnboardingProgressDto> {
    const onboarding = await this.findOnboarding(tenantId);

    onboarding.steps[dto.step] = {
      ...onboarding.steps[dto.step],
      status: OnboardingStatusEnum.SKIPPED,
      skippedAt: new Date(),
      skipReason: dto.reason,
    };

    // Move to next step
    const nextStep = this.getNextStep(dto.step);
    if (nextStep) {
      onboarding.currentStep = nextStep;
    }

    // Recalculate progress (skipped steps don't count as completed)
    onboarding.overallProgress = onboarding.calculateProgress();

    await this.onboardingRepository.save(onboarding);

    this.logger.log(`Step ${dto.step} skipped for tenant ${tenantId}. Reason: ${dto.reason}`);

    return this.getProgress(tenantId);
  }

  /**
   * Update company information
   */
  async updateCompanyInfo(tenantId: string, dto: CompanyInfoDto): Promise<void> {
    const tenant = await this.tenantService.findByTenantId(tenantId);

    // Update tenant with company info
    tenant.companyName = dto.companyName;
    // You can add more fields to Tenant entity as needed

    await this.tenantRepository.save(tenant);

    // Mark company info step as complete
    await this.completeStep(tenantId, {
      step: OnboardingStepEnum.COMPANY_INFO,
      metadata: dto,
    });

    this.logger.log(`Company info updated for tenant ${tenantId}`);
  }

  /**
   * Get trial status
   */
  async getTrialStatus(tenantId: string): Promise<TrialStatusDto> {
    const onboarding = await this.findOnboarding(tenantId);

    const isOnTrial = onboarding.trialStartDate && onboarding.trialEndDate && !onboarding.convertedToPaid;
    const daysRemaining = onboarding.getTrialDaysRemaining();

    let conversionStatus: 'not_converted' | 'converted' | 'expired' = 'not_converted';
    if (onboarding.convertedToPaid) {
      conversionStatus = 'converted';
    } else if (daysRemaining === 0 && isOnTrial) {
      conversionStatus = 'expired';
    }

    return {
      tenantId,
      isOnTrial,
      trialStartDate: onboarding.trialStartDate,
      trialEndDate: onboarding.trialEndDate,
      daysRemaining,
      trialExtended: onboarding.trialExtended,
      conversionStatus,
    };
  }

  /**
   * Extend trial period
   */
  async extendTrial(dto: ExtendTrialDto): Promise<TrialStatusDto> {
    const onboarding = await this.findOnboarding(dto.tenantId);

    if (!onboarding.trialEndDate) {
      throw new BadRequestException('Tenant is not on trial');
    }

    if (onboarding.convertedToPaid) {
      throw new BadRequestException('Tenant has already converted to paid plan');
    }

    // Extend trial
    const newEndDate = new Date(onboarding.trialEndDate);
    newEndDate.setDate(newEndDate.getDate() + dto.extensionDays);

    onboarding.trialEndDate = newEndDate;
    onboarding.trialExtended = true;
    onboarding.trialExtensionDays += dto.extensionDays;

    await this.onboardingRepository.save(onboarding);

    this.logger.log(`Trial extended by ${dto.extensionDays} days for tenant ${dto.tenantId}. Reason: ${dto.reason}`);

    return this.getTrialStatus(dto.tenantId);
  }

  /**
   * Mark tenant as converted to paid
   */
  async markAsConverted(tenantId: string): Promise<void> {
    const onboarding = await this.findOnboarding(tenantId);

    onboarding.convertedToPaid = true;
    onboarding.convertedAt = new Date();

    await this.onboardingRepository.save(onboarding);

    this.logger.log(`Tenant ${tenantId} converted to paid plan`);
  }

  /**
   * Get onboarding guide for a specific step
   */
  async getGuide(step: OnboardingStepEnum): Promise<OnboardingGuideDto> {
    const guides = this.getOnboardingGuides();
    const guide = guides[step];

    if (!guide) {
      throw new NotFoundException(`Guide not found for step: ${step}`);
    }

    return guide;
  }

  /**
   * Get detailed checklist
   */
  async getChecklist(tenantId: string): Promise<OnboardingChecklistDto> {
    const onboarding = await this.findOnboarding(tenantId);
    const tenant = await this.tenantService.findByTenantId(tenantId);

    const categories = [
      {
        name: 'Getting Started',
        items: [
          {
            id: 'welcome',
            category: 'Getting Started',
            title: 'Welcome to the Platform',
            description: 'Complete the welcome tour',
            isComplete: onboarding.isStepComplete(OnboardingStepEnum.WELCOME),
            isRequired: true,
            actionUrl: '/onboarding/welcome',
            actionLabel: 'Start Tour',
            completedAt: onboarding.steps[OnboardingStepEnum.WELCOME]?.completedAt,
            order: 1,
          },
          {
            id: 'account_setup',
            category: 'Getting Started',
            title: 'Set Up Your Account',
            description: 'Configure your account settings',
            isComplete: onboarding.isStepComplete(OnboardingStepEnum.ACCOUNT_SETUP),
            isRequired: true,
            actionUrl: '/settings/account',
            actionLabel: 'Configure',
            completedAt: onboarding.steps[OnboardingStepEnum.ACCOUNT_SETUP]?.completedAt,
            order: 2,
          },
          {
            id: 'company_info',
            category: 'Getting Started',
            title: 'Add Company Information',
            description: 'Tell us about your company',
            isComplete: onboarding.isStepComplete(OnboardingStepEnum.COMPANY_INFO),
            isRequired: true,
            actionUrl: '/settings/company',
            actionLabel: 'Add Info',
            completedAt: onboarding.steps[OnboardingStepEnum.COMPANY_INFO]?.completedAt,
            order: 3,
          },
        ],
      },
      {
        name: 'Set Up Your Banking',
        items: [
          {
            id: 'bank_account',
            category: 'Set Up Your Banking',
            title: 'Connect Your First Bank Account',
            description: 'Link a bank account to start reconciling',
            isComplete: onboarding.isStepComplete(OnboardingStepEnum.BANK_ACCOUNT_SETUP),
            isRequired: true,
            actionUrl: '/bank-accounts/add',
            actionLabel: 'Add Bank',
            completedAt: onboarding.steps[OnboardingStepEnum.BANK_ACCOUNT_SETUP]?.completedAt,
            order: 4,
          },
          {
            id: 'first_transaction',
            category: 'Set Up Your Banking',
            title: 'Upload Your First Transaction',
            description: 'Import transactions from your bank',
            isComplete: onboarding.isStepComplete(OnboardingStepEnum.FIRST_TRANSACTION),
            isRequired: true,
            actionUrl: '/transactions/import',
            actionLabel: 'Import',
            completedAt: onboarding.steps[OnboardingStepEnum.FIRST_TRANSACTION]?.completedAt,
            order: 5,
          },
          {
            id: 'first_reconciliation',
            category: 'Set Up Your Banking',
            title: 'Complete Your First Reconciliation',
            description: 'Match your first transactions',
            isComplete: onboarding.isStepComplete(OnboardingStepEnum.FIRST_RECONCILIATION),
            isRequired: true,
            actionUrl: '/reconciliations/start',
            actionLabel: 'Start',
            completedAt: onboarding.steps[OnboardingStepEnum.FIRST_RECONCILIATION]?.completedAt,
            order: 6,
          },
        ],
      },
      {
        name: 'Invite Your Team',
        items: [
          {
            id: 'user_invitation',
            category: 'Invite Your Team',
            title: 'Invite Team Members',
            description: 'Add users to collaborate',
            isComplete: onboarding.isStepComplete(OnboardingStepEnum.USER_INVITATION),
            isRequired: false,
            actionUrl: '/settings/team',
            actionLabel: 'Invite',
            completedAt: onboarding.steps[OnboardingStepEnum.USER_INVITATION]?.completedAt,
            order: 7,
          },
        ],
      },
      {
        name: 'Choose Your Plan',
        items: [
          {
            id: 'plan_selection',
            category: 'Choose Your Plan',
            title: 'Select a Subscription Plan',
            description: 'Choose the plan that fits your needs',
            isComplete: onboarding.isStepComplete(OnboardingStepEnum.PLAN_SELECTION),
            isRequired: true,
            actionUrl: '/billing/plans',
            actionLabel: 'View Plans',
            completedAt: onboarding.steps[OnboardingStepEnum.PLAN_SELECTION]?.completedAt,
            order: 8,
          },
          {
            id: 'payment_method',
            category: 'Choose Your Plan',
            title: 'Add Payment Method',
            description: 'Set up your payment method',
            isComplete: onboarding.isStepComplete(OnboardingStepEnum.PAYMENT_METHOD),
            isRequired: tenant.plan !== 'free',
            actionUrl: '/billing/payment',
            actionLabel: 'Add Card',
            completedAt: onboarding.steps[OnboardingStepEnum.PAYMENT_METHOD]?.completedAt,
            order: 9,
          },
        ],
      },
    ];

    const allItems = categories.flatMap(c => c.items);
    const completedItems = allItems.filter(i => i.isComplete).length;
    const overallProgress = Math.round((completedItems / allItems.length) * 100);

    // Calculate category progress
    const categoriesWithProgress = categories.map(category => {
      const categoryCompletedItems = category.items.filter(i => i.isComplete).length;
      const categoryProgress = Math.round((categoryCompletedItems / category.items.length) * 100);
      return {
        ...category,
        progress: categoryProgress,
      };
    });

    return {
      tenantId,
      categories: categoriesWithProgress,
      overallProgress,
      totalItems: allItems.length,
      completedItems,
    };
  }

  /**
   * Get personalized recommendations
   */
  async getRecommendations(tenantId: string): Promise<OnboardingRecommendationDto> {
    const onboarding = await this.findOnboarding(tenantId);
    const tenant = await this.tenantService.findByTenantId(tenantId);
    const trialStatus = await this.getTrialStatus(tenantId);

    const recommendations = [];

    // Check trial expiration
    if (trialStatus.isOnTrial && trialStatus.daysRemaining && trialStatus.daysRemaining <= 3) {
      recommendations.push({
        type: 'upgrade' as const,
        priority: 'high' as const,
        title: `Trial Ending Soon - ${trialStatus.daysRemaining} Days Left`,
        description: 'Upgrade to a paid plan to continue using all features',
        actionUrl: '/billing/plans',
        actionLabel: 'Upgrade Now',
      });
    }

    // Check incomplete required steps
    if (!onboarding.isStepComplete(OnboardingStepEnum.BANK_ACCOUNT_SETUP)) {
      recommendations.push({
        type: 'action' as const,
        priority: 'high' as const,
        title: 'Connect Your Bank Account',
        description: 'You need to connect a bank account to start reconciling transactions',
        actionUrl: '/bank-accounts/add',
        actionLabel: 'Add Bank Account',
      });
    }

    if (!onboarding.isStepComplete(OnboardingStepEnum.FIRST_RECONCILIATION)) {
      recommendations.push({
        type: 'action' as const,
        priority: 'medium' as const,
        title: 'Try Your First Reconciliation',
        description: 'Experience the power of automated transaction matching',
        actionUrl: '/reconciliations/start',
        actionLabel: 'Start Reconciliation',
      });
    }

    // Suggest inviting team members
    if (!onboarding.isStepComplete(OnboardingStepEnum.USER_INVITATION) && tenant.usersCount === 1) {
      recommendations.push({
        type: 'tip' as const,
        priority: 'low' as const,
        title: 'Collaborate with Your Team',
        description: 'Invite team members to work together on reconciliations',
        actionUrl: '/settings/team',
        actionLabel: 'Invite Team',
      });
    }

    // Get suggested next step
    const suggestedNextStep = this.getSuggestedNextStep(onboarding);

    // Calculate estimated time to complete
    const remainingSteps = Object.values(OnboardingStepEnum).filter(
      step => !onboarding.isStepComplete(step) && step !== OnboardingStepEnum.COMPLETE
    ).length;
    const estimatedTimeToComplete = remainingSteps * 5; // Assume 5 minutes per step

    return {
      tenantId,
      recommendations,
      suggestedNextStep,
      estimatedTimeToComplete,
    };
  }

  /**
   * Get onboarding metrics (admin only)
   */
  async getMetrics(): Promise<OnboardingMetricsDto> {
    const allOnboarding = await this.onboardingRepository.find();

    const totalOnboarding = allOnboarding.length;
    const completedOnboarding = allOnboarding.filter(o => o.isComplete).length;
    const abandonedOnboarding = allOnboarding.filter(
      o => !o.isComplete && this.isAbandoned(o)
    ).length;

    // Calculate average completion time
    const completedWithTime = allOnboarding.filter(o => o.isComplete && o.completedAt);
    const completionTimes = completedWithTime.map(o => {
      const diff = o.completedAt!.getTime() - o.startedAt.getTime();
      return diff / (1000 * 60 * 60); // hours
    });
    const averageCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

    const completionRate = totalOnboarding > 0 ? (completedOnboarding / totalOnboarding) * 100 : 0;

    const converted = allOnboarding.filter(o => o.convertedToPaid).length;
    const conversionRate = totalOnboarding > 0 ? (converted / totalOnboarding) * 100 : 0;

    // Step completion rates
    const stepCompletionRates = Object.values(OnboardingStepEnum)
      .filter(step => step !== OnboardingStepEnum.COMPLETE)
      .map(step => {
        const completedStep = allOnboarding.filter(o => o.isStepComplete(step)).length;
        const rate = totalOnboarding > 0 ? (completedStep / totalOnboarding) * 100 : 0;

        return {
          step,
          completionRate: rate,
          averageTimeToComplete: 5, // Mock data - would need to track actual times
        };
      });

    // Common drop-off points (steps with lowest completion rates)
    const commonDropOffPoints = stepCompletionRates
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 3)
      .map(s => ({
        step: s.step,
        dropOffRate: 100 - s.completionRate,
      }));

    return {
      totalOnboarding,
      completedOnboarding,
      abandonedOnboarding,
      averageCompletionTime,
      completionRate,
      conversionRate,
      stepCompletionRates,
      commonDropOffPoints,
    };
  }

  /**
   * Reset onboarding (for testing or special cases)
   */
  async resetOnboarding(dto: ResetOnboardingDto): Promise<void> {
    const onboarding = await this.findOnboarding(dto.tenantId);

    if (dto.keepProgress) {
      // Reset completion status but keep step data
      onboarding.isComplete = false;
      onboarding.completedAt = null;
      onboarding.currentStep = OnboardingStepEnum.WELCOME;
      onboarding.overallProgress = 0;
    } else {
      // Full reset
      onboarding.steps = this.initializeSteps();
      onboarding.isComplete = false;
      onboarding.completedAt = null;
      onboarding.currentStep = OnboardingStepEnum.WELCOME;
      onboarding.overallProgress = 0;
    }

    await this.onboardingRepository.save(onboarding);

    this.logger.log(`Onboarding reset for tenant ${dto.tenantId}. Keep progress: ${dto.keepProgress}`);
  }

  // ==================== Private Helper Methods ====================

  private async findOnboarding(tenantId: string): Promise<OnboardingChecklist> {
    const onboarding = await this.onboardingRepository.findOne({
      where: { tenantId },
    });

    if (!onboarding) {
      throw new NotFoundException(`Onboarding not found for tenant: ${tenantId}`);
    }

    return onboarding;
  }

  private initializeSteps(): Record<OnboardingStepEnum, any> {
    const steps: any = {};

    Object.values(OnboardingStepEnum).forEach(step => {
      if (step !== OnboardingStepEnum.COMPLETE) {
        steps[step] = {
          status: OnboardingStatusEnum.NOT_STARTED,
        };
      }
    });

    return steps;
  }

  private mapStepsToDto(onboarding: OnboardingChecklist): OnboardingStepDto[] {
    const stepDefinitions = this.getStepDefinitions();

    return stepDefinitions.map(def => ({
      step: def.step,
      status: onboarding.steps[def.step]?.status || OnboardingStatusEnum.NOT_STARTED,
      title: def.title,
      description: def.description,
      order: def.order,
      completedAt: onboarding.steps[def.step]?.completedAt,
      isOptional: def.isOptional,
      actionUrl: def.actionUrl,
      actionLabel: def.actionLabel,
    }));
  }

  private getStepDefinitions() {
    return [
      {
        step: OnboardingStepEnum.WELCOME,
        title: 'Welcome',
        description: 'Get started with the platform',
        order: 1,
        isOptional: false,
        actionUrl: '/onboarding/welcome',
        actionLabel: 'Start',
      },
      {
        step: OnboardingStepEnum.ACCOUNT_SETUP,
        title: 'Account Setup',
        description: 'Configure your account settings',
        order: 2,
        isOptional: false,
        actionUrl: '/settings/account',
        actionLabel: 'Set Up',
      },
      {
        step: OnboardingStepEnum.COMPANY_INFO,
        title: 'Company Information',
        description: 'Tell us about your company',
        order: 3,
        isOptional: false,
        actionUrl: '/settings/company',
        actionLabel: 'Add Info',
      },
      {
        step: OnboardingStepEnum.BANK_ACCOUNT_SETUP,
        title: 'Connect Bank Account',
        description: 'Link your first bank account',
        order: 4,
        isOptional: false,
        actionUrl: '/bank-accounts/add',
        actionLabel: 'Connect',
      },
      {
        step: OnboardingStepEnum.USER_INVITATION,
        title: 'Invite Team Members',
        description: 'Add users to your workspace',
        order: 5,
        isOptional: true,
        actionUrl: '/settings/team',
        actionLabel: 'Invite',
      },
      {
        step: OnboardingStepEnum.FIRST_TRANSACTION,
        title: 'Upload Transactions',
        description: 'Import your first transactions',
        order: 6,
        isOptional: false,
        actionUrl: '/transactions/import',
        actionLabel: 'Upload',
      },
      {
        step: OnboardingStepEnum.FIRST_RECONCILIATION,
        title: 'Complete Reconciliation',
        description: 'Match your first transactions',
        order: 7,
        isOptional: false,
        actionUrl: '/reconciliations/start',
        actionLabel: 'Reconcile',
      },
      {
        step: OnboardingStepEnum.PLAN_SELECTION,
        title: 'Choose a Plan',
        description: 'Select your subscription plan',
        order: 8,
        isOptional: false,
        actionUrl: '/billing/plans',
        actionLabel: 'View Plans',
      },
      {
        step: OnboardingStepEnum.PAYMENT_METHOD,
        title: 'Add Payment',
        description: 'Set up your payment method',
        order: 9,
        isOptional: false,
        actionUrl: '/billing/payment',
        actionLabel: 'Add Card',
      },
    ];
  }

  private getNextStep(currentStep: OnboardingStepEnum): OnboardingStepEnum | null {
    const steps = Object.values(OnboardingStepEnum);
    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex === -1 || currentIndex === steps.length - 1) {
      return null;
    }

    return steps[currentIndex + 1];
  }

  private getSuggestedNextStep(onboarding: OnboardingChecklist): OnboardingStepEnum | undefined {
    const stepOrder = this.getStepDefinitions();

    for (const def of stepOrder) {
      if (!onboarding.isStepComplete(def.step)) {
        return def.step;
      }
    }

    return undefined;
  }

  private isAbandoned(onboarding: OnboardingChecklist): boolean {
    // Consider abandoned if no activity for 7 days and not complete
    const daysSinceUpdate = Math.floor(
      (Date.now() - onboarding.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceUpdate > 7 && !onboarding.isComplete;
  }

  private getOnboardingGuides(): Record<OnboardingStepEnum, OnboardingGuideDto> {
    return {
      [OnboardingStepEnum.WELCOME]: {
        step: OnboardingStepEnum.WELCOME,
        title: 'Welcome to Banking Reconciliation',
        description: 'Get started with automated transaction matching',
        content: `
          <h2>Welcome!</h2>
          <p>Welcome to the Banking Reconciliation platform. We'll help you automate your transaction matching and save hours of manual work.</p>
          <h3>What to Expect</h3>
          <ul>
            <li>Connect your bank accounts</li>
            <li>Import transactions automatically</li>
            <li>Match transactions with AI-powered algorithms</li>
            <li>Generate reconciliation reports</li>
          </ul>
        `,
        estimatedTime: 2,
        tips: [
          'Take your time to explore each feature',
          'Use the help center if you get stuck',
          'Invite team members for collaboration',
        ],
        nextStep: OnboardingStepEnum.ACCOUNT_SETUP,
      },
      [OnboardingStepEnum.ACCOUNT_SETUP]: {
        step: OnboardingStepEnum.ACCOUNT_SETUP,
        title: 'Set Up Your Account',
        description: 'Configure your account preferences',
        content: `
          <h2>Account Setup</h2>
          <p>Configure your account settings to personalize your experience.</p>
        `,
        estimatedTime: 5,
        tips: ['Enable two-factor authentication for security', 'Set your timezone correctly'],
        nextStep: OnboardingStepEnum.COMPANY_INFO,
        previousStep: OnboardingStepEnum.WELCOME,
      },
      // Add more guides as needed
      [OnboardingStepEnum.COMPANY_INFO]: {} as any,
      [OnboardingStepEnum.BANK_ACCOUNT_SETUP]: {} as any,
      [OnboardingStepEnum.USER_INVITATION]: {} as any,
      [OnboardingStepEnum.FIRST_TRANSACTION]: {} as any,
      [OnboardingStepEnum.FIRST_RECONCILIATION]: {} as any,
      [OnboardingStepEnum.PLAN_SELECTION]: {} as any,
      [OnboardingStepEnum.PAYMENT_METHOD]: {} as any,
      [OnboardingStepEnum.COMPLETE]: {} as any,
    };
  }
}
