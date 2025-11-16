import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, LessThan } from 'typeorm';
import { LearningQuestion, EntityProfile, User, Reconciliation } from '@app/shared';
import {
  CreateQuestionDto,
  AnswerQuestionDto,
  FilterQuestionsDto,
  QuestionResponseDto,
  QuestionStatsDto,
  QuestionQueueDto,
  QuestionType,
  QuestionPriority,
  QuestionTiming,
} from './dto/question.dto';

/**
 * STEP 48: Question Manager Service
 *
 * Core business logic for question management operations
 */
@Injectable()
export class QuestionManagerServiceService {
  constructor(
    @InjectRepository(LearningQuestion)
    private readonly questionRepo: Repository<LearningQuestion>,
    @InjectRepository(EntityProfile)
    private readonly entityProfileRepo: Repository<EntityProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Reconciliation)
    private readonly reconciliationRepo: Repository<Reconciliation>,
  ) {}

  /**
   * Create a new learning question
   */
  async createQuestion(
    dto: CreateQuestionDto,
  ): Promise<QuestionResponseDto> {
    // Check if question with same questionId already exists
    const existing = await this.questionRepo.findOne({
      where: { questionId: dto.questionId },
    });

    if (existing) {
      throw new ConflictException(
        `Question with ID '${dto.questionId}' already exists`,
      );
    }

    const question = this.questionRepo.create({
      questionId: dto.questionId,
      type: dto.type,
      priority: dto.priority,
      timing: dto.timing,
      question: dto.question,
      context: dto.context,
      suggestedAnswers: dto.suggestedAnswers || [],
      answerType: dto.answerType,
      relatedEntityId: dto.relatedEntityId,
      relatedTransactionIds: dto.relatedTransactionIds || [],
      relatedReconciliationId: dto.relatedReconciliationId,
      triggeredBy: dto.triggeredBy,
      helpText: dto.helpText,
      exampleAnswer: dto.exampleAnswer,
      expiresAt: dto.expiresAt,
    });

    const saved = await this.questionRepo.save(question);
    return this.toQuestionResponse(saved);
  }

  /**
   * Get all questions with optional filters
   */
  async getQuestions(
    filters?: FilterQuestionsDto,
  ): Promise<QuestionResponseDto[]> {
    const queryBuilder = this.questionRepo.createQueryBuilder('question');

    if (filters) {
      if (filters.type) {
        queryBuilder.andWhere('question.type = :type', { type: filters.type });
      }

      if (filters.priority) {
        queryBuilder.andWhere('question.priority = :priority', {
          priority: filters.priority,
        });
      }

      if (filters.timing) {
        queryBuilder.andWhere('question.timing = :timing', {
          timing: filters.timing,
        });
      }

      if (filters.answered !== undefined) {
        if (filters.answered) {
          queryBuilder.andWhere('question.answeredAt IS NOT NULL');
        } else {
          queryBuilder.andWhere('question.answeredAt IS NULL');
        }
      }

      if (filters.relatedEntityId) {
        queryBuilder.andWhere('question.relatedEntityId = :entityId', {
          entityId: filters.relatedEntityId,
        });
      }

      if (filters.relatedReconciliationId) {
        queryBuilder.andWhere('question.relatedReconciliationId = :reconId', {
          reconId: filters.relatedReconciliationId,
        });
      }

      if (filters.triggeredBy) {
        queryBuilder.andWhere('question.triggeredBy = :triggeredBy', {
          triggeredBy: filters.triggeredBy,
        });
      }
    }

    queryBuilder.orderBy('question.priority', 'DESC');
    queryBuilder.addOrderBy('question.createdAt', 'ASC');

    const questions = await queryBuilder.getMany();
    return questions.map((q) => this.toQuestionResponse(q));
  }

  /**
   * Get a question by ID
   */
  async getQuestionById(id: string): Promise<QuestionResponseDto> {
    const question = await this.questionRepo.findOne({ where: { id } });

    if (!question) {
      throw new NotFoundException(`Question with ID '${id}' not found`);
    }

    return this.toQuestionResponse(question);
  }

  /**
   * Get a question by questionId
   */
  async getQuestionByQuestionId(
    questionId: string,
  ): Promise<QuestionResponseDto> {
    const question = await this.questionRepo.findOne({
      where: { questionId },
    });

    if (!question) {
      throw new NotFoundException(
        `Question with questionId '${questionId}' not found`,
      );
    }

    return this.toQuestionResponse(question);
  }

  /**
   * Answer a question
   */
  async answerQuestion(
    id: string,
    dto: AnswerQuestionDto,
  ): Promise<QuestionResponseDto> {
    const question = await this.questionRepo.findOne({ where: { id } });

    if (!question) {
      throw new NotFoundException(`Question with ID '${id}' not found`);
    }

    question.answer = dto.answer;
    question.answeredAt = new Date();

    const updated = await this.questionRepo.save(question);
    return this.toQuestionResponse(updated);
  }

  /**
   * Delete a question
   */
  async deleteQuestion(id: string): Promise<void> {
    const question = await this.questionRepo.findOne({ where: { id } });

    if (!question) {
      throw new NotFoundException(`Question with ID '${id}' not found`);
    }

    await this.questionRepo.remove(question);
  }

  /**
   * Get question statistics
   */
  async getQuestionStats(): Promise<QuestionStatsDto> {
    const allQuestions = await this.questionRepo.find();

    const answered = allQuestions.filter((q) => q.answeredAt !== null).length;
    const unanswered = allQuestions.filter((q) => q.answeredAt === null).length;
    const now = new Date();
    const expired = allQuestions.filter(
      (q) => q.expiresAt && q.expiresAt < now && !q.answeredAt,
    ).length;

    // Count by type
    const byType: Record<QuestionType, number> = {
      [QuestionType.ENTITY_IDENTITY]: 0,
      [QuestionType.ENTITY_RELATIONSHIP]: 0,
      [QuestionType.BUSINESS_PATTERN]: 0,
      [QuestionType.VALUE_PATTERN]: 0,
      [QuestionType.TIMING_PATTERN]: 0,
      [QuestionType.FIELD_PREFERENCE]: 0,
      [QuestionType.EXCEPTION_REASON]: 0,
      [QuestionType.GENERAL_CONTEXT]: 0,
    };

    // Count by priority
    const byPriority: Record<QuestionPriority, number> = {
      [QuestionPriority.CRITICAL]: 0,
      [QuestionPriority.HIGH]: 0,
      [QuestionPriority.MEDIUM]: 0,
      [QuestionPriority.LOW]: 0,
    };

    // Count by timing
    const byTiming: Record<QuestionTiming, number> = {
      [QuestionTiming.IMMEDIATE]: 0,
      [QuestionTiming.STEP_END]: 0,
      [QuestionTiming.SESSION_END]: 0,
      [QuestionTiming.DEFERRED]: 0,
    };

    for (const question of allQuestions) {
      byType[question.type as QuestionType]++;
      byPriority[question.priority as QuestionPriority]++;
      byTiming[question.timing as QuestionTiming]++;
    }

    return {
      total: allQuestions.length,
      answered,
      unanswered,
      expired,
      byType,
      byPriority,
      byTiming,
    };
  }

  /**
   * Get question queue organized by timing
   */
  async getQuestionQueue(): Promise<QuestionQueueDto> {
    const allUnanswered = await this.questionRepo.find({
      where: { answeredAt: IsNull() },
      order: {
        priority: 'DESC',
        createdAt: 'ASC',
      },
    });

    const immediate = allUnanswered
      .filter((q) => q.timing === QuestionTiming.IMMEDIATE)
      .map((q) => this.toQuestionResponse(q));

    const stepEnd = allUnanswered
      .filter((q) => q.timing === QuestionTiming.STEP_END)
      .map((q) => this.toQuestionResponse(q));

    const sessionEnd = allUnanswered
      .filter((q) => q.timing === QuestionTiming.SESSION_END)
      .map((q) => this.toQuestionResponse(q));

    const deferred = allUnanswered
      .filter((q) => q.timing === QuestionTiming.DEFERRED)
      .map((q) => this.toQuestionResponse(q));

    return {
      immediate,
      stepEnd,
      sessionEnd,
      deferred,
    };
  }

  /**
   * Get unanswered questions by timing
   */
  async getUnansweredByTiming(
    timing: QuestionTiming,
  ): Promise<QuestionResponseDto[]> {
    const questions = await this.questionRepo.find({
      where: {
        timing,
        answeredAt: IsNull(),
      },
      order: {
        priority: 'DESC',
        createdAt: 'ASC',
      },
    });

    return questions.map((q) => this.toQuestionResponse(q));
  }

  /**
   * Mark expired questions
   */
  async getExpiredQuestions(): Promise<QuestionResponseDto[]> {
    const now = new Date();
    const questions = await this.questionRepo.find({
      where: {
        expiresAt: LessThan(now),
        answeredAt: IsNull(),
      },
    });

    return questions.map((q) => this.toQuestionResponse(q));
  }

  /**
   * Convert LearningQuestion entity to QuestionResponseDto
   */
  private toQuestionResponse(question: LearningQuestion): QuestionResponseDto {
    return {
      id: question.id,
      questionId: question.questionId,
      type: question.type as QuestionType,
      priority: question.priority as QuestionPriority,
      timing: question.timing as QuestionTiming,
      question: question.question,
      context: question.context,
      suggestedAnswers: question.suggestedAnswers || null,
      answerType: question.answerType as any,
      relatedEntityId: question.relatedEntityId || null,
      relatedTransactionIds: question.relatedTransactionIds || [],
      relatedReconciliationId: question.relatedReconciliationId || null,
      triggeredBy: question.triggeredBy,
      answer: question.answer || null,
      answeredAt: question.answeredAt || null,
      expiresAt: question.expiresAt || null,
      helpText: question.helpText || null,
      exampleAnswer: question.exampleAnswer || null,
      createdAt: question.createdAt,
    };
  }
}
