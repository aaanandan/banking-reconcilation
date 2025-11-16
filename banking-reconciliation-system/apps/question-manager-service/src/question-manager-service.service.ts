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
   * STEP 49: Question Generator Methods
   */

  /**
   * Generate an entity identity question
   */
  async generateEntityIdentityQuestion(params: {
    entityName: string;
    reconciliationId: string;
    transactionIds: number[];
    triggeredBy: string;
    context?: string;
  }): Promise<QuestionResponseDto> {
    const questionId = `entity-identity-${params.entityName}-${Date.now()}`;

    const dto: CreateQuestionDto = {
      questionId,
      type: QuestionType.ENTITY_IDENTITY,
      priority: QuestionPriority.HIGH,
      timing: QuestionTiming.STEP_END,
      question: `Is "${params.entityName}" a known payer/payee in your organization?`,
      context:
        params.context ||
        `The name "${params.entityName}" appeared in transaction(s) but is not in our system. Please help us identify this entity.`,
      suggestedAnswers: [
        'Yes, it is a known entity',
        'No, it is external',
        'Not sure, needs research',
      ],
      answerType: 'choice' as any,
      relatedEntityId: params.entityName,
      relatedTransactionIds: params.transactionIds,
      relatedReconciliationId: params.reconciliationId,
      triggeredBy: params.triggeredBy,
      helpText:
        'Identifying entities helps improve automatic matching in future reconciliations.',
      exampleAnswer: 'Yes, it is a known entity',
    };

    return this.createQuestion(dto);
  }

  /**
   * Generate an entity relationship question
   */
  async generateEntityRelationshipQuestion(params: {
    entity1: string;
    entity2: string;
    reconciliationId: string;
    triggeredBy: string;
  }): Promise<QuestionResponseDto> {
    const questionId = `entity-relationship-${params.entity1}-${params.entity2}-${Date.now()}`;

    const dto: CreateQuestionDto = {
      questionId,
      type: QuestionType.ENTITY_RELATIONSHIP,
      priority: QuestionPriority.MEDIUM,
      timing: QuestionTiming.DEFERRED,
      question: `What is the relationship between "${params.entity1}" and "${params.entity2}"?`,
      context: `These entities appear together in transactions. Understanding their relationship helps improve matching accuracy.`,
      suggestedAnswers: [
        'Parent-subsidiary',
        'Same entity (different names)',
        'Partner organizations',
        'Unrelated',
      ],
      answerType: 'choice' as any,
      relatedEntityId: params.entity1,
      relatedReconciliationId: params.reconciliationId,
      triggeredBy: params.triggeredBy,
      helpText:
        'Entity relationships help us understand consolidated transactions and aliases.',
      exampleAnswer: 'Same entity (different names)',
    };

    return this.createQuestion(dto);
  }

  /**
   * Generate a business pattern question
   */
  async generateBusinessPatternQuestion(params: {
    entityId: string;
    patternObserved: string;
    reconciliationId: string;
    triggeredBy: string;
  }): Promise<QuestionResponseDto> {
    const questionId = `business-pattern-${params.entityId}-${Date.now()}`;

    const dto: CreateQuestionDto = {
      questionId,
      type: QuestionType.BUSINESS_PATTERN,
      priority: QuestionPriority.LOW,
      timing: QuestionTiming.SESSION_END,
      question: `Is the following pattern expected for "${params.entityId}"? ${params.patternObserved}`,
      context: `We've observed this pattern in recent transactions and want to confirm if it's normal business behavior.`,
      suggestedAnswers: ['Yes, expected', 'No, unusual', 'Seasonal variation'],
      answerType: 'choice' as any,
      relatedEntityId: params.entityId,
      relatedReconciliationId: params.reconciliationId,
      triggeredBy: params.triggeredBy,
      helpText:
        'Understanding business patterns helps detect anomalies and improve forecasting.',
      exampleAnswer: 'Yes, expected',
    };

    return this.createQuestion(dto);
  }

  /**
   * Generate a value pattern question
   */
  async generateValuePatternQuestion(params: {
    entityId: string;
    amount: number;
    typicalRange: { min: number; max: number };
    reconciliationId: string;
    transactionIds: number[];
    triggeredBy: string;
  }): Promise<QuestionResponseDto> {
    const questionId = `value-pattern-${params.entityId}-${Date.now()}`;

    const dto: CreateQuestionDto = {
      questionId,
      type: QuestionType.VALUE_PATTERN,
      priority: QuestionPriority.HIGH,
      timing: QuestionTiming.IMMEDIATE,
      question: `Transaction amount $${params.amount} for "${params.entityId}" is outside the typical range ($${params.typicalRange.min}-$${params.typicalRange.max}). Is this correct?`,
      context: `This amount is significantly different from historical transactions. Please confirm if this is expected or requires investigation.`,
      suggestedAnswers: ['Correct, expected', 'Error, should be corrected', 'Special case'],
      answerType: 'choice' as any,
      relatedEntityId: params.entityId,
      relatedTransactionIds: params.transactionIds,
      relatedReconciliationId: params.reconciliationId,
      triggeredBy: params.triggeredBy,
      helpText:
        'Unusual amounts may indicate errors or special circumstances that should be documented.',
      exampleAnswer: 'Special case',
    };

    return this.createQuestion(dto);
  }

  /**
   * Generate a timing pattern question
   */
  async generateTimingPatternQuestion(params: {
    entityId: string;
    expectedPattern: string;
    actualDate: string;
    reconciliationId: string;
    triggeredBy: string;
  }): Promise<QuestionResponseDto> {
    const questionId = `timing-pattern-${params.entityId}-${Date.now()}`;

    const dto: CreateQuestionDto = {
      questionId,
      type: QuestionType.TIMING_PATTERN,
      priority: QuestionPriority.MEDIUM,
      timing: QuestionTiming.STEP_END,
      question: `Transaction from "${params.entityId}" on ${params.actualDate} differs from expected ${params.expectedPattern} pattern. Is this normal?`,
      context: `Historical data shows transactions typically follow a ${params.expectedPattern} pattern, but this transaction occurred on ${params.actualDate}.`,
      suggestedAnswers: [
        'Normal variation',
        'Holiday/special event',
        'Error in date',
        'Pattern has changed',
      ],
      answerType: 'choice' as any,
      relatedEntityId: params.entityId,
      relatedReconciliationId: params.reconciliationId,
      triggeredBy: params.triggeredBy,
      helpText:
        'Understanding timing variations helps predict cash flow and detect scheduling errors.',
      exampleAnswer: 'Holiday/special event',
    };

    return this.createQuestion(dto);
  }

  /**
   * Generate a field preference question
   */
  async generateFieldPreferenceQuestion(params: {
    entityId: string;
    fields: string[];
    reconciliationId: string;
    transactionIds: number[];
    triggeredBy: string;
  }): Promise<QuestionResponseDto> {
    const questionId = `field-preference-${params.entityId}-${Date.now()}`;

    const dto: CreateQuestionDto = {
      questionId,
      type: QuestionType.FIELD_PREFERENCE,
      priority: QuestionPriority.MEDIUM,
      timing: QuestionTiming.STEP_END,
      question: `Which field is most reliable for identifying "${params.entityId}"? ${params.fields.join(', ')}`,
      context: `Multiple fields contain identifying information. Knowing which is most reliable improves matching accuracy.`,
      suggestedAnswers: params.fields,
      answerType: 'choice' as any,
      relatedEntityId: params.entityId,
      relatedTransactionIds: params.transactionIds,
      relatedReconciliationId: params.reconciliationId,
      triggeredBy: params.triggeredBy,
      helpText:
        'Field preferences help prioritize matching strategies for this entity.',
      exampleAnswer: params.fields[0],
    };

    return this.createQuestion(dto);
  }

  /**
   * Generate an exception reason question
   */
  async generateExceptionReasonQuestion(params: {
    action: string;
    entityId: string;
    reconciliationId: string;
    transactionIds: number[];
    triggeredBy: string;
  }): Promise<QuestionResponseDto> {
    const questionId = `exception-reason-${params.entityId}-${Date.now()}`;

    const dto: CreateQuestionDto = {
      questionId,
      type: QuestionType.EXCEPTION_REASON,
      priority: QuestionPriority.CRITICAL,
      timing: QuestionTiming.IMMEDIATE,
      question: `Why was manual action taken: "${params.action}" for "${params.entityId}"?`,
      context: `A manual override was applied. Documenting the reason helps improve the system and maintain audit trail.`,
      suggestedAnswers: [
        'System error',
        'Business exception',
        'Data quality issue',
        'Policy change',
      ],
      answerType: 'text' as any,
      relatedEntityId: params.entityId,
      relatedTransactionIds: params.transactionIds,
      relatedReconciliationId: params.reconciliationId,
      triggeredBy: params.triggeredBy,
      helpText:
        'Exception reasons are important for compliance and system improvement.',
      exampleAnswer: 'Business exception - one-time special payment terms',
    };

    return this.createQuestion(dto);
  }

  /**
   * Generate a general context question
   */
  async generateGeneralContextQuestion(params: {
    topic: string;
    question: string;
    reconciliationId: string;
    triggeredBy: string;
    priority?: QuestionPriority;
    timing?: QuestionTiming;
  }): Promise<QuestionResponseDto> {
    const questionId = `general-context-${params.topic}-${Date.now()}`;

    const dto: CreateQuestionDto = {
      questionId,
      type: QuestionType.GENERAL_CONTEXT,
      priority: params.priority || QuestionPriority.LOW,
      timing: params.timing || QuestionTiming.DEFERRED,
      question: params.question,
      context: `Additional context needed to improve reconciliation process.`,
      suggestedAnswers: [],
      answerType: 'text' as any,
      relatedReconciliationId: params.reconciliationId,
      triggeredBy: params.triggeredBy,
      helpText: 'Your input helps us better understand your business processes.',
    };

    return this.createQuestion(dto);
  }

  /**
   * Bulk generate questions
   */
  async bulkGenerateQuestions(
    questions: CreateQuestionDto[],
  ): Promise<QuestionResponseDto[]> {
    const results: QuestionResponseDto[] = [];

    for (const dto of questions) {
      try {
        const created = await this.createQuestion(dto);
        results.push(created);
      } catch (error) {
        // Skip duplicates, continue with others
        if (!(error instanceof ConflictException)) {
          throw error;
        }
      }
    }

    return results;
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
