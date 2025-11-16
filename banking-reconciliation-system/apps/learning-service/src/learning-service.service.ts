import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EntityProfile,
  LearningQuestion,
  UserFeedback,
  User,
  Transaction,
  Reconciliation,
} from '@app/shared';
import {
  RecordFeedbackDto,
  FeedbackResponseDto,
  GetFeedbackDto,
  FeedbackStatsDto,
  FeedbackType,
} from './dto/feedback.dto';
import {
  CreateEntityProfileDto,
  UpdateEntityProfileDto,
  EntityProfileResponseDto,
  EntityProfileStatsDto,
  BankSpecificBehaviorDto,
  UpdateBankBehaviorDto,
  BankBehaviorResponseDto,
  AllBanksBehaviorResponseDto,
  BuildProfileFromTransactionsDto,
  PatternLearningResultDto,
} from './dto/entity-profile.dto';

/**
 * Learning Service
 *
 * Phase 7: Learning Service Implementation
 * Handles entity profile creation, user feedback recording, and pattern learning
 */
@Injectable()
export class LearningServiceService {
  constructor(
    @InjectRepository(EntityProfile)
    private readonly entityProfileRepo: Repository<EntityProfile>,

    @InjectRepository(LearningQuestion)
    private readonly learningQuestionRepo: Repository<LearningQuestion>,

    @InjectRepository(UserFeedback)
    private readonly userFeedbackRepo: Repository<UserFeedback>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,

    @InjectRepository(Reconciliation)
    private readonly reconciliationRepo: Repository<Reconciliation>,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 42: USER FEEDBACK RECORDING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Record user feedback
   * Captures user overrides, rejections, manual matches, and comments
   *
   * @param dto - Feedback data
   * @returns Created feedback record
   */
  async recordFeedback(dto: RecordFeedbackDto): Promise<FeedbackResponseDto> {
    // Create feedback entity
    const feedback = this.userFeedbackRepo.create({
      reconciliationId: dto.reconciliationId,
      transactionId: dto.transactionId,
      feedbackType: dto.feedbackType,
      originalSuggestion: dto.originalSuggestion,
      userChoice: dto.userChoice,
      reason: dto.reason,
      userId: dto.userId,
    });

    // Save to database
    const saved = await this.userFeedbackRepo.save(feedback);

    // Return response
    return {
      id: saved.id,
      reconciliationId: saved.reconciliationId,
      transactionId: saved.transactionId,
      feedbackType: saved.feedbackType,
      originalSuggestion: saved.originalSuggestion,
      userChoice: saved.userChoice,
      reason: saved.reason,
      userId: saved.userId,
      createdAt: saved.createdAt,
    };
  }

  /**
   * Get feedback records with optional filtering
   *
   * @param query - Filter parameters
   * @returns Array of feedback records
   */
  async getFeedback(query: GetFeedbackDto): Promise<FeedbackResponseDto[]> {
    const where: any = {};

    if (query.reconciliationId) {
      where.reconciliationId = query.reconciliationId;
    }
    if (query.transactionId) {
      where.transactionId = query.transactionId;
    }
    if (query.userId) {
      where.userId = query.userId;
    }
    if (query.feedbackType) {
      where.feedbackType = query.feedbackType;
    }

    const feedbacks = await this.userFeedbackRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return feedbacks.map(f => ({
      id: f.id,
      reconciliationId: f.reconciliationId,
      transactionId: f.transactionId,
      feedbackType: f.feedbackType,
      originalSuggestion: f.originalSuggestion,
      userChoice: f.userChoice,
      reason: f.reason,
      userId: f.userId,
      createdAt: f.createdAt,
    }));
  }

  /**
   * Get feedback by ID
   *
   * @param id - Feedback ID
   * @returns Feedback record
   */
  async getFeedbackById(id: number): Promise<FeedbackResponseDto> {
    const feedback = await this.userFeedbackRepo.findOne({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    return {
      id: feedback.id,
      reconciliationId: feedback.reconciliationId,
      transactionId: feedback.transactionId,
      feedbackType: feedback.feedbackType,
      originalSuggestion: feedback.originalSuggestion,
      userChoice: feedback.userChoice,
      reason: feedback.reason,
      userId: feedback.userId,
      createdAt: feedback.createdAt,
    };
  }

  /**
   * Get feedback statistics for a reconciliation
   * Useful for understanding user behavior and algorithm performance
   *
   * @param reconciliationId - Reconciliation ID
   * @returns Feedback statistics
   */
  async getFeedbackStats(reconciliationId: string): Promise<FeedbackStatsDto> {
    const feedbacks = await this.userFeedbackRepo.find({
      where: { reconciliationId },
    });

    const totalFeedback = feedbacks.length;
    const overrideCount = feedbacks.filter(f => f.feedbackType === FeedbackType.OVERRIDE).length;
    const rejectionCount = feedbacks.filter(f => f.feedbackType === FeedbackType.REJECTION).length;
    const manualMatchCount = feedbacks.filter(f => f.feedbackType === FeedbackType.MANUAL_MATCH).length;
    const commentCount = feedbacks.filter(f => f.feedbackType === FeedbackType.COMMENT).length;

    // Calculate override rate
    const overrideRate = totalFeedback > 0 ? overrideCount / totalFeedback : 0;

    // Determine most common type
    const typeCounts = {
      [FeedbackType.OVERRIDE]: overrideCount,
      [FeedbackType.REJECTION]: rejectionCount,
      [FeedbackType.MANUAL_MATCH]: manualMatchCount,
      [FeedbackType.COMMENT]: commentCount,
    };

    const mostCommonType = Object.entries(typeCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b,
    )[0];

    return {
      totalFeedback,
      overrideCount,
      rejectionCount,
      manualMatchCount,
      commentCount,
      overrideRate: Math.round(overrideRate * 100) / 100,
      mostCommonType,
    };
  }

  /**
   * Delete feedback record
   *
   * @param id - Feedback ID
   */
  async deleteFeedback(id: number): Promise<{ success: boolean }> {
    const result = await this.userFeedbackRepo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 43: ENTITY PROFILE CREATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new entity profile
   *
   * @param dto - Entity profile data
   * @returns Created profile
   */
  async createProfile(dto: CreateEntityProfileDto): Promise<EntityProfileResponseDto> {
    // Check if profile already exists
    const existing = await this.entityProfileRepo.findOne({
      where: { entityId: dto.entityId },
    });

    if (existing) {
      throw new ConflictException(`Entity profile for '${dto.entityId}' already exists`);
    }

    // Create new profile
    const profile = this.entityProfileRepo.create({
      entityId: dto.entityId,
      primaryName: dto.primaryName,
      aliases: dto.aliases || [],
      legalName: dto.legalName,
      industry: dto.industry,
      location: dto.location,
      tags: dto.tags || [],
      relatedEntities: [],
      subsidiaries: [],
      totalTransactions: 0,
      successfulMatches: 0,
      manualInterventions: 0,
      userOverrideRate: 0,
      confidence: 0,
    });

    const saved = await this.entityProfileRepo.save(profile);

    return this.toProfileResponse(saved);
  }

  /**
   * Update an existing entity profile
   *
   * @param entityId - Entity ID
   * @param dto - Update data
   * @returns Updated profile
   */
  async updateProfile(
    entityId: string,
    dto: UpdateEntityProfileDto,
  ): Promise<EntityProfileResponseDto> {
    const profile = await this.entityProfileRepo.findOne({
      where: { entityId },
    });

    if (!profile) {
      throw new NotFoundException(`Entity profile '${entityId}' not found`);
    }

    // Update fields
    if (dto.primaryName) profile.primaryName = dto.primaryName;
    if (dto.aliases) profile.aliases = dto.aliases;
    if (dto.legalName !== undefined) profile.legalName = dto.legalName;
    if (dto.industry !== undefined) profile.industry = dto.industry;
    if (dto.location !== undefined) profile.location = dto.location;
    if (dto.tags) profile.tags = dto.tags;
    if (dto.typicalAmountMin !== undefined) profile.typicalAmountMin = dto.typicalAmountMin;
    if (dto.typicalAmountMax !== undefined) profile.typicalAmountMax = dto.typicalAmountMax;
    if (dto.typicalAmountMedian !== undefined) profile.typicalAmountMedian = dto.typicalAmountMedian;
    if (dto.frequencyPattern !== undefined) profile.frequencyPattern = dto.frequencyPattern;
    if (dto.preferredDayOfMonth !== undefined) profile.preferredDayOfMonth = dto.preferredDayOfMonth;

    const updated = await this.entityProfileRepo.save(profile);

    return this.toProfileResponse(updated);
  }

  /**
   * Get entity profile by entityId
   *
   * @param entityId - Entity ID
   * @returns Entity profile
   */
  async getProfile(entityId: string): Promise<EntityProfileResponseDto> {
    const profile = await this.entityProfileRepo.findOne({
      where: { entityId },
    });

    if (!profile) {
      throw new NotFoundException(`Entity profile '${entityId}' not found`);
    }

    return this.toProfileResponse(profile);
  }

  /**
   * Get all entity profiles
   *
   * @returns Array of all profiles
   */
  async getAllProfiles(): Promise<EntityProfileResponseDto[]> {
    const profiles = await this.entityProfileRepo.find({
      order: { totalTransactions: 'DESC' },
    });

    return profiles.map(p => this.toProfileResponse(p));
  }

  /**
   * Delete entity profile
   *
   * @param entityId - Entity ID
   */
  async deleteProfile(entityId: string): Promise<{ success: boolean }> {
    const result = await this.entityProfileRepo.delete({ entityId });

    if (result.affected === 0) {
      throw new NotFoundException(`Entity profile '${entityId}' not found`);
    }

    return { success: true };
  }

  /**
   * Get profile statistics
   *
   * @param entityId - Entity ID
   * @returns Profile statistics
   */
  async getProfileStats(entityId: string): Promise<EntityProfileStatsDto> {
    const profile = await this.entityProfileRepo.findOne({
      where: { entityId },
    });

    if (!profile) {
      throw new NotFoundException(`Entity profile '${entityId}' not found`);
    }

    const matchRate =
      profile.totalTransactions > 0
        ? profile.successfulMatches / profile.totalTransactions
        : 0;

    const avgAmount = profile.typicalAmountMedian || 0;

    return {
      entityId: profile.entityId,
      entityName: profile.primaryName,
      totalTransactions: profile.totalTransactions,
      matchRate: Math.round(matchRate * 100) / 100,
      overrideRate: profile.userOverrideRate,
      avgAmount,
      confidence: profile.confidence,
      frequencyPattern: profile.frequencyPattern || 'unknown',
      aliasCount: profile.aliases ? profile.aliases.length : 0,
    };
  }

  /**
   * Helper: Convert entity profile to response DTO
   */
  private toProfileResponse(profile: EntityProfile): EntityProfileResponseDto {
    return {
      id: profile.id,
      entityId: profile.entityId,
      primaryName: profile.primaryName,
      aliases: profile.aliases,
      legalName: profile.legalName,
      relatedEntities: profile.relatedEntities,
      parentCompany: profile.parentCompany,
      subsidiaries: profile.subsidiaries,
      industry: profile.industry,
      location: profile.location,
      tags: profile.tags,
      typicalAmountMin: profile.typicalAmountMin,
      typicalAmountMax: profile.typicalAmountMax,
      typicalAmountMedian: profile.typicalAmountMedian,
      frequencyPattern: profile.frequencyPattern,
      preferredDayOfMonth: profile.preferredDayOfMonth,
      seasonality: profile.seasonality,
      bankSpecificBehavior: profile.bankSpecificBehavior,
      totalTransactions: profile.totalTransactions,
      successfulMatches: profile.successfulMatches,
      manualInterventions: profile.manualInterventions,
      userOverrideRate: profile.userOverrideRate,
      mostReliableField: profile.mostReliableField,
      fieldReliabilityScores: profile.fieldReliabilityScores,
      confidence: profile.confidence,
      createdAt: profile.createdAt,
      lastUpdated: profile.lastUpdated,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 44: PER-BANK BEHAVIOR TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Update bank-specific behavior for an entity
   */
  async updateBankBehavior(
    entityId: string,
    dto: UpdateBankBehaviorDto,
  ): Promise<BankBehaviorResponseDto> {
    const profile = await this.entityProfileRepo.findOne({
      where: { entityId },
    });

    if (!profile) {
      throw new NotFoundException(`Entity profile '${entityId}' not found`);
    }

    // Initialize bankSpecificBehavior if null
    if (!profile.bankSpecificBehavior) {
      profile.bankSpecificBehavior = {};
    }

    // Update or add bank-specific behavior
    profile.bankSpecificBehavior[dto.bankId] = {
      dateOffset: dto.behavior.dateOffset,
      mostReliableField: dto.behavior.mostReliableField,
      refNumberFormat: dto.behavior.refNumberFormat,
    };

    const updated = await this.entityProfileRepo.save(profile);

    return {
      entityId: updated.entityId,
      bankId: dto.bankId,
      behavior: updated.bankSpecificBehavior[dto.bankId],
      lastUpdated: updated.lastUpdated,
    };
  }

  /**
   * Get bank-specific behavior for an entity at a specific bank
   */
  async getBankBehavior(
    entityId: string,
    bankId: string,
  ): Promise<BankBehaviorResponseDto> {
    const profile = await this.entityProfileRepo.findOne({
      where: { entityId },
    });

    if (!profile) {
      throw new NotFoundException(`Entity profile '${entityId}' not found`);
    }

    if (!profile.bankSpecificBehavior || !profile.bankSpecificBehavior[bankId]) {
      throw new NotFoundException(
        `No bank-specific behavior found for entity '${entityId}' at bank '${bankId}'`,
      );
    }

    return {
      entityId: profile.entityId,
      bankId,
      behavior: profile.bankSpecificBehavior[bankId],
      lastUpdated: profile.lastUpdated,
    };
  }

  /**
   * Get all bank-specific behaviors for an entity
   */
  async getAllBankBehaviors(entityId: string): Promise<AllBanksBehaviorResponseDto> {
    const profile = await this.entityProfileRepo.findOne({
      where: { entityId },
    });

    if (!profile) {
      throw new NotFoundException(`Entity profile '${entityId}' not found`);
    }

    const bankSpecificBehavior = profile.bankSpecificBehavior || {};
    const banksCount = Object.keys(bankSpecificBehavior).length;

    return {
      entityId: profile.entityId,
      bankSpecificBehavior,
      banksCount,
      lastUpdated: profile.lastUpdated,
    };
  }

  /**
   * Delete bank-specific behavior for an entity at a specific bank
   */
  async deleteBankBehavior(
    entityId: string,
    bankId: string,
  ): Promise<{ success: boolean }> {
    const profile = await this.entityProfileRepo.findOne({
      where: { entityId },
    });

    if (!profile) {
      throw new NotFoundException(`Entity profile '${entityId}' not found`);
    }

    if (!profile.bankSpecificBehavior || !profile.bankSpecificBehavior[bankId]) {
      throw new NotFoundException(
        `No bank-specific behavior found for entity '${entityId}' at bank '${bankId}'`,
      );
    }

    // Remove the bank-specific behavior
    delete profile.bankSpecificBehavior[bankId];

    await this.entityProfileRepo.save(profile);

    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 45: PATTERN LEARNING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Build or update entity profile from transaction analysis
   */
  async buildProfileFromTransactions(
    dto: BuildProfileFromTransactionsDto,
  ): Promise<PatternLearningResultDto> {
    // Verify reconciliation exists
    const reconciliation = await this.reconciliationRepo.findOne({
      where: { id: dto.reconciliationId },
    });

    if (!reconciliation) {
      throw new NotFoundException(`Reconciliation '${dto.reconciliationId}' not found`);
    }

    // Find or create entity profile
    let profile = await this.entityProfileRepo.findOne({
      where: { entityId: dto.entityId },
    });

    const isNewProfile = !profile;

    if (!profile) {
      // Create new profile
      if (!dto.entityName) {
        throw new NotFoundException(
          `Entity profile '${dto.entityId}' not found and no entityName provided`,
        );
      }

      profile = this.entityProfileRepo.create({
        entityId: dto.entityId,
        primaryName: dto.entityName,
        aliases: [],
        relatedEntities: [],
        subsidiaries: [],
        tags: [],
        totalTransactions: 0,
        successfulMatches: 0,
        manualInterventions: 0,
        userOverrideRate: 0,
        confidence: 0,
      });
    }

    // Fetch all transactions for this entity in this reconciliation
    // Match by description containing entityId or entityName
    const transactions = await this.transactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.reconciliationId = :reconciliationId', {
        reconciliationId: dto.reconciliationId,
      })
      .andWhere(
        '(transaction.description ILIKE :entityId OR transaction.description ILIKE :entityName)',
        {
          entityId: `%${dto.entityId}%`,
          entityName: `%${profile.primaryName}%`,
        },
      )
      .getMany();

    if (transactions.length === 0) {
      throw new NotFoundException(
        `No transactions found for entity '${dto.entityId}' in reconciliation '${dto.reconciliationId}'`,
      );
    }

    // Analyze transactions and learn patterns
    const patternsLearned = this.analyzeTransactions(transactions);

    // Update profile with learned patterns
    profile.typicalAmountMin = patternsLearned.amountRange.min;
    profile.typicalAmountMax = patternsLearned.amountRange.max;
    profile.typicalAmountMedian = patternsLearned.amountRange.median;
    profile.frequencyPattern = patternsLearned.frequencyPattern;
    if (patternsLearned.preferredDayOfMonth !== undefined) {
      profile.preferredDayOfMonth = patternsLearned.preferredDayOfMonth;
    }

    // Update transaction counts
    profile.totalTransactions += transactions.length;

    // Calculate confidence based on number of transactions
    // More transactions = higher confidence
    const newConfidence = Math.min(0.95, transactions.length / 100);
    profile.confidence = Math.round(newConfidence * 100) / 100;

    // Update field reliability scores based on pattern consistency
    if (patternsLearned.mostReliableFields.length > 0) {
      if (!profile.fieldReliabilityScores) {
        profile.fieldReliabilityScores = {};
      }
      patternsLearned.mostReliableFields.forEach((field) => {
        profile.fieldReliabilityScores[field] = 0.9; // High reliability for consistent fields
      });
      profile.mostReliableField = patternsLearned.mostReliableFields[0];
    }

    // Save updated profile
    const savedProfile = await this.entityProfileRepo.save(profile);

    return {
      entityId: savedProfile.entityId,
      transactionsAnalyzed: transactions.length,
      patternsLearned: {
        amountRange: patternsLearned.amountRange,
        frequencyPattern: patternsLearned.frequencyPattern,
        preferredDayOfMonth: patternsLearned.preferredDayOfMonth,
        mostReliableFields: patternsLearned.mostReliableFields,
      },
      updatedProfile: this.toProfileResponse(savedProfile),
      newConfidence: savedProfile.confidence,
      analyzedAt: new Date(),
    };
  }

  /**
   * Analyze transactions to detect patterns
   */
  private analyzeTransactions(transactions: Transaction[]) {
    // Amount analysis
    const amounts = transactions.map((t) => Math.abs(t.amount)).filter((a) => a > 0);
    amounts.sort((a, b) => a - b);

    const amountMin = amounts[0] || 0;
    const amountMax = amounts[amounts.length - 1] || 0;
    const amountMedian =
      amounts.length > 0
        ? amounts[Math.floor(amounts.length / 2)]
        : 0;

    // Frequency analysis - calculate days between transactions
    const dates = transactions
      .map((t) => new Date(t.date))
      .sort((a, b) => a.getTime() - b.getTime());

    let frequencyPattern = 'unknown';
    if (dates.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        const daysDiff = Math.floor(
          (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24),
        );
        intervals.push(daysDiff);
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

      if (avgInterval < 2) frequencyPattern = 'daily';
      else if (avgInterval < 8) frequencyPattern = 'weekly';
      else if (avgInterval < 16) frequencyPattern = 'bi-weekly';
      else if (avgInterval < 35) frequencyPattern = 'monthly';
      else if (avgInterval < 95) frequencyPattern = 'quarterly';
      else frequencyPattern = 'annual';
    }

    // Preferred day of month
    const daysOfMonth = dates.map((d) => d.getDate());
    const dayFrequency: Record<number, number> = {};
    daysOfMonth.forEach((day) => {
      dayFrequency[day] = (dayFrequency[day] || 0) + 1;
    });

    let preferredDayOfMonth: number | undefined;
    if (Object.keys(dayFrequency).length > 0) {
      const mostFrequentDay = Object.entries(dayFrequency).reduce((a, b) =>
        a[1] > b[1] ? a : b,
      );
      preferredDayOfMonth = parseInt(mostFrequentDay[0], 10);
    }

    // Determine most reliable fields (fields that are consistently present)
    const mostReliableFields: string[] = [];
    const hasDescription = transactions.every((t) => t.description && t.description.length > 0);
    const hasReference = transactions.every((t) => t.optional?.refNumber && t.optional.refNumber.length > 0);

    if (hasDescription) mostReliableFields.push('description');
    if (hasReference) mostReliableFields.push('refNumber');
    // Amount is always reliable if we have transactions
    if (amounts.length > 0) mostReliableFields.push('amount');

    return {
      amountRange: {
        min: Math.round(amountMin * 100) / 100,
        max: Math.round(amountMax * 100) / 100,
        median: Math.round(amountMedian * 100) / 100,
      },
      frequencyPattern,
      preferredDayOfMonth,
      mostReliableFields,
    };
  }
}
