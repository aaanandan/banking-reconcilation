import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EntityProfile,
  LearningQuestion,
  UserFeedback,
  User,
} from '@app/shared';
import {
  RecordFeedbackDto,
  FeedbackResponseDto,
  GetFeedbackDto,
  FeedbackStatsDto,
  FeedbackType,
} from './dto/feedback.dto';

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
  // FUTURE STEPS (43-45)
  // ═══════════════════════════════════════════════════════════════════════════
  // - Step 43: Entity profile creation
  // - Step 44: Per-bank behavior tracking
  // - Step 45: Pattern learning
}
