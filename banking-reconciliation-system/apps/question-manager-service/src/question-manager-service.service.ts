import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, LessThan } from 'typeorm';
import { LearningQuestion, EntityProfile, User, Reconciliation, TenantAwareRepository } from '@app/shared';
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
  private readonly logger = new Logger(QuestionManagerServiceService.name);

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
    tenantContext: { tenantId: string; userId: string; role: string },
    dto: CreateQuestionDto,
  ): Promise<QuestionResponseDto> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Creating new question: ${dto.questionId}`);

    const questionRepo = new TenantAwareRepository(this.questionRepo, tenantContext.tenantId);

    // Check if question with same questionId already exists
    const existing = await questionRepo.findOne({
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
      tenantId: tenantContext.tenantId,
    });

    const saved = await questionRepo.save(question);
    return this.toQuestionResponse(saved);
  }

  /**
   * Get all questions with optional filters
   */
  async getQuestions(
    tenantContext: { tenantId: string; userId: string; role: string },
    filters?: FilterQuestionsDto,
  ): Promise<QuestionResponseDto[]> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Getting questions with filters`);

    const queryBuilder = this.questionRepo.createQueryBuilder('question');
    queryBuilder.where('question.tenantId = :tenantId', { tenantId: tenantContext.tenantId });

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
  async getQuestionById(
    tenantContext: { tenantId: string; userId: string; role: string },
    id: string,
  ): Promise<QuestionResponseDto> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Getting question by ID: ${id}`);

    const questionRepo = new TenantAwareRepository(this.questionRepo, tenantContext.tenantId);
    const question = await questionRepo.findOne({ where: { id } });

    if (!question) {
      throw new NotFoundException(`Question with ID '${id}' not found`);
    }

    return this.toQuestionResponse(question);
  }

  /**
   * Get a question by questionId
   */
  async getQuestionByQuestionId(
    tenantContext: { tenantId: string; userId: string; role: string },
    questionId: string,
  ): Promise<QuestionResponseDto> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Getting question by questionId: ${questionId}`);

    const questionRepo = new TenantAwareRepository(this.questionRepo, tenantContext.tenantId);
    const question = await questionRepo.findOne({
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
   * Answer a question (STEP 51: Enhanced with validation and processing)
   */
  async answerQuestion(
    tenantContext: { tenantId: string; userId: string; role: string },
    id: string,
    dto: AnswerQuestionDto,
  ): Promise<QuestionResponseDto> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Answering question: ${id}`);

    const questionRepo = new TenantAwareRepository(this.questionRepo, tenantContext.tenantId);
    const question = await questionRepo.findOne({ where: { id } });

    if (!question) {
      throw new NotFoundException(`Question with ID '${id}' not found`);
    }

    // Validate answer based on answer type
    this.validateAnswer(question, dto.answer);

    question.answer = dto.answer;
    question.answeredAt = new Date();

    const updated = await questionRepo.save(question);

    // Post-process the answer (apply learnings)
    await this.processAnswer(tenantContext, updated);

    return this.toQuestionResponse(updated);
  }

  /**
   * Delete a question
   */
  async deleteQuestion(
    tenantContext: { tenantId: string; userId: string; role: string },
    id: string,
  ): Promise<void> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Deleting question: ${id}`);

    const questionRepo = new TenantAwareRepository(this.questionRepo, tenantContext.tenantId);
    const question = await questionRepo.findOne({ where: { id } });

    if (!question) {
      throw new NotFoundException(`Question with ID '${id}' not found`);
    }

    await this.questionRepo.remove(question);
  }

  /**
   * Get question statistics
   */
  async getQuestionStats(
    tenantContext: { tenantId: string; userId: string; role: string },
  ): Promise<QuestionStatsDto> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Getting question statistics`);

    const questionRepo = new TenantAwareRepository(this.questionRepo, tenantContext.tenantId);
    const allQuestions = await questionRepo.find();

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
  async getQuestionQueue(
    tenantContext: { tenantId: string; userId: string; role: string },
  ): Promise<QuestionQueueDto> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Getting question queue`);

    const questionRepo = new TenantAwareRepository(this.questionRepo, tenantContext.tenantId);
    const allUnanswered = await questionRepo.find({
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
    tenantContext: { tenantId: string; userId: string; role: string },
    timing: QuestionTiming,
  ): Promise<QuestionResponseDto[]> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Getting unanswered questions by timing: ${timing}`);

    const questionRepo = new TenantAwareRepository(this.questionRepo, tenantContext.tenantId);
    const questions = await questionRepo.find({
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
  async getExpiredQuestions(
    tenantContext: { tenantId: string; userId: string; role: string },
  ): Promise<QuestionResponseDto[]> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Getting expired questions`);

    const now = new Date();
    const questions = await this.questionRepo
      .createQueryBuilder('question')
      .where('question.tenantId = :tenantId', { tenantId: tenantContext.tenantId })
      .andWhere('question.expiresAt < :now', { now })
      .andWhere('question.answeredAt IS NULL')
      .getMany();

    return questions.map((q) => this.toQuestionResponse(q));
  }

  /**
   * STEP 49: Question Generator Methods
   */

  /**
   * Generate an entity identity question
   */
  async generateEntityIdentityQuestion(
    tenantContext: { tenantId: string; userId: string; role: string },
    params: {
      entityName: string;
      reconciliationId: string;
      transactionIds: number[];
      triggeredBy: string;
      context?: string;
    },
  ): Promise<QuestionResponseDto> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Generating entity identity question for: ${params.entityName}`);

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

    return this.createQuestion(tenantContext, dto);
  }

  /**
   * Generate an entity relationship question
   */
  async generateEntityRelationshipQuestion(
    tenantContext: { tenantId: string; userId: string; role: string },
    params: {
      entity1: string;
      entity2: string;
      reconciliationId: string;
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Generating entity relationship question: ${params.entity1} and ${params.entity2}`);

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

    return this.createQuestion(tenantContext, dto);
  }

  /**
   * Generate a business pattern question
   */
  async generateBusinessPatternQuestion(
    tenantContext: { tenantId: string; userId: string; role: string },
    params: {
      entityId: string;
      patternObserved: string;
      reconciliationId: string;
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Generating business pattern question for: ${params.entityId}`);

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

    return this.createQuestion(tenantContext, dto);
  }

  /**
   * Generate a value pattern question
   */
  async generateValuePatternQuestion(
    tenantContext: { tenantId: string; userId: string; role: string },
    params: {
      entityId: string;
      amount: number;
      typicalRange: { min: number; max: number };
      reconciliationId: string;
      transactionIds: number[];
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Generating value pattern question for: ${params.entityId}`);

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

    return this.createQuestion(tenantContext, dto);
  }

  /**
   * Generate a timing pattern question
   */
  async generateTimingPatternQuestion(
    tenantContext: { tenantId: string; userId: string; role: string },
    params: {
      entityId: string;
      expectedPattern: string;
      actualDate: string;
      reconciliationId: string;
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Generating timing pattern question for: ${params.entityId}`);

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

    return this.createQuestion(tenantContext, dto);
  }

  /**
   * Generate a field preference question
   */
  async generateFieldPreferenceQuestion(
    tenantContext: { tenantId: string; userId: string; role: string },
    params: {
      entityId: string;
      fields: string[];
      reconciliationId: string;
      transactionIds: number[];
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Generating field preference question for: ${params.entityId}`);

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

    return this.createQuestion(tenantContext, dto);
  }

  /**
   * Generate an exception reason question
   */
  async generateExceptionReasonQuestion(
    tenantContext: { tenantId: string; userId: string; role: string },
    params: {
      action: string;
      entityId: string;
      reconciliationId: string;
      transactionIds: number[];
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Generating exception reason question for: ${params.entityId}`);

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

    return this.createQuestion(tenantContext, dto);
  }

  /**
   * Generate a general context question
   */
  async generateGeneralContextQuestion(
    tenantContext: { tenantId: string; userId: string; role: string },
    params: {
      topic: string;
      question: string;
      reconciliationId: string;
      triggeredBy: string;
      priority?: QuestionPriority;
      timing?: QuestionTiming;
    },
  ): Promise<QuestionResponseDto> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Generating general context question: ${params.topic}`);

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

    return this.createQuestion(tenantContext, dto);
  }

  /**
   * Bulk generate questions
   */
  async bulkGenerateQuestions(
    tenantContext: { tenantId: string; userId: string; role: string },
    questions: CreateQuestionDto[],
  ): Promise<QuestionResponseDto[]> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Bulk generating ${questions.length} questions`);

    const results: QuestionResponseDto[] = [];

    for (const dto of questions) {
      try {
        const created = await this.createQuestion(tenantContext, dto);
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
   * STEP 51: Answer Processing and Validation Methods
   */

  /**
   * Validate answer based on expected answer type
   */
  private validateAnswer(question: LearningQuestion, answer: any): void {
    const answerType = question.answerType;

    // Type validation
    if (answerType === 'text') {
      if (typeof answer !== 'string' || answer.trim().length === 0) {
        throw new ConflictException(
          `Expected text answer, received: ${typeof answer}`,
        );
      }
    }

    if (answerType === 'number') {
      if (typeof answer !== 'number' && isNaN(Number(answer))) {
        throw new ConflictException(
          `Expected number answer, received: ${typeof answer}`,
        );
      }
    }

    if (answerType === 'boolean') {
      if (typeof answer !== 'boolean') {
        throw new ConflictException(
          `Expected boolean answer, received: ${typeof answer}`,
        );
      }
    }

    if (answerType === 'choice') {
      const suggestedAnswers = question.suggestedAnswers || [];
      if (suggestedAnswers.length > 0 && !suggestedAnswers.includes(answer)) {
        throw new ConflictException(
          `Answer must be one of: ${suggestedAnswers.join(', ')}`,
        );
      }
    }
  }

  /**
   * Process answer and apply learnings
   */
  private async processAnswer(
    tenantContext: { tenantId: string; userId: string; role: string },
    question: LearningQuestion,
  ): Promise<void> {
    const answer = question.answer;

    // Process based on question type
    switch (question.type) {
      case 'entity_identity':
        await this.processEntityIdentityAnswer(tenantContext, question, answer);
        break;

      case 'entity_relationship':
        await this.processEntityRelationshipAnswer(tenantContext, question, answer);
        break;

      case 'field_preference':
        await this.processFieldPreferenceAnswer(tenantContext, question, answer);
        break;

      case 'exception_reason':
        await this.processExceptionReasonAnswer(tenantContext, question, answer);
        break;

      // Other question types can be logged for future processing
      default:
        // No specific processing for other types yet
        break;
    }
  }

  /**
   * Process entity identity answer
   */
  private async processEntityIdentityAnswer(
    tenantContext: { tenantId: string; userId: string; role: string },
    question: LearningQuestion,
    answer: any,
  ): Promise<void> {
    if (!question.relatedEntityId) return;

    const entityId = question.relatedEntityId;
    const profileRepo = new TenantAwareRepository(this.entityProfileRepo, tenantContext.tenantId);

    // If answer is "Yes, it is a known entity", create or update profile
    if (
      answer === 'Yes, it is a known entity' ||
      answer.toString().toLowerCase().includes('known')
    ) {
      let profile = await profileRepo.findOne({
        where: { entityId },
      });

      if (!profile) {
        // Create new profile
        profile = this.entityProfileRepo.create({
          entityId,
          primaryName: entityId,
          totalTransactions: 0,
          successfulMatches: 0,
          userOverrideRate: 0,
          confidence: 0.5,
          tenantId: tenantContext.tenantId,
        });

        await profileRepo.save(profile);
      }
    }
  }

  /**
   * Process entity relationship answer
   */
  private async processEntityRelationshipAnswer(
    tenantContext: { tenantId: string; userId: string; role: string },
    question: LearningQuestion,
    answer: any,
  ): Promise<void> {
    if (!question.relatedEntityId) return;

    const profileRepo = new TenantAwareRepository(this.entityProfileRepo, tenantContext.tenantId);

    // If entities are the same (aliases), update profile
    if (
      answer === 'Same entity (different names)' ||
      answer.toString().toLowerCase().includes('same entity')
    ) {
      const profile = await profileRepo.findOne({
        where: { entityId: question.relatedEntityId },
      });

      if (profile && question.context) {
        // Extract second entity name from context or question
        const match = question.question.match(/"([^"]+)" and "([^"]+)"/);
        if (match && match[2]) {
          const alias = match[2];
          if (!profile.aliases) {
            profile.aliases = [];
          }
          if (!profile.aliases.includes(alias)) {
            profile.aliases.push(alias);
            await profileRepo.save(profile);
          }
        }
      }
    }
  }

  /**
   * Process field preference answer
   */
  private async processFieldPreferenceAnswer(
    tenantContext: { tenantId: string; userId: string; role: string },
    question: LearningQuestion,
    answer: any,
  ): Promise<void> {
    if (!question.relatedEntityId) return;

    const profileRepo = new TenantAwareRepository(this.entityProfileRepo, tenantContext.tenantId);
    const profile = await profileRepo.findOne({
      where: { entityId: question.relatedEntityId },
    });

    if (profile) {
      // Update mostReliableField based on answer
      const selectedField = answer.toString();
      profile.mostReliableField = selectedField;
      await profileRepo.save(profile);
    }
  }

  /**
   * Process exception reason answer
   */
  private async processExceptionReasonAnswer(
    tenantContext: { tenantId: string; userId: string; role: string },
    question: LearningQuestion,
    answer: any,
  ): Promise<void> {
    // Log exception reasons for audit trail
    // In a real system, this might update a separate audit log table
    // or trigger notifications to admins
    this.logger.log(
      `[Tenant: ${tenantContext.tenantId}] Exception recorded for ${question.relatedEntityId}: ${answer}`,
    );
  }

  /**
   * Get answer processing summary
   */
  async getAnswerProcessingSummary(
    tenantContext: { tenantId: string; userId: string; role: string },
  ): Promise<{
    totalAnswered: number;
    processedByType: Record<QuestionType, number>;
    lastProcessedAt: Date | null;
  }> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Getting answer processing summary`);

    const questionRepo = new TenantAwareRepository(this.questionRepo, tenantContext.tenantId);
    const answered = await questionRepo.find({
      where: { answeredAt: Not(IsNull()) },
    });

    const processedByType: Record<QuestionType, number> = {
      [QuestionType.ENTITY_IDENTITY]: 0,
      [QuestionType.ENTITY_RELATIONSHIP]: 0,
      [QuestionType.BUSINESS_PATTERN]: 0,
      [QuestionType.VALUE_PATTERN]: 0,
      [QuestionType.TIMING_PATTERN]: 0,
      [QuestionType.FIELD_PREFERENCE]: 0,
      [QuestionType.EXCEPTION_REASON]: 0,
      [QuestionType.GENERAL_CONTEXT]: 0,
    };

    let lastProcessedAt: Date | null = null;

    for (const q of answered) {
      processedByType[q.type as QuestionType]++;
      if (q.answeredAt && (!lastProcessedAt || q.answeredAt > lastProcessedAt)) {
        lastProcessedAt = q.answeredAt;
      }
    }

    return {
      totalAnswered: answered.length,
      processedByType,
      lastProcessedAt,
    };
  }

  /**
   * STEP 50: Advanced Queue Management Methods
   */

  /**
   * Bulk answer multiple questions
   */
  async bulkAnswerQuestions(
    tenantContext: { tenantId: string; userId: string; role: string },
    answers: Array<{ id: string; answer: any }>,
  ): Promise<QuestionResponseDto[]> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Bulk answering ${answers.length} questions`);

    const results: QuestionResponseDto[] = [];

    for (const item of answers) {
      try {
        const updated = await this.answerQuestion(tenantContext, item.id, {
          answer: item.answer,
        });
        results.push(updated);
      } catch (error) {
        // Skip not found, continue with others
        if (!(error instanceof NotFoundException)) {
          throw error;
        }
      }
    }

    return results;
  }

  /**
   * Bulk delete multiple questions
   */
  async bulkDeleteQuestions(
    tenantContext: { tenantId: string; userId: string; role: string },
    ids: string[],
  ): Promise<{ deleted: number }> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Bulk deleting ${ids.length} questions`);

    let deleted = 0;

    for (const id of ids) {
      try {
        await this.deleteQuestion(tenantContext, id);
        deleted++;
      } catch (error) {
        // Skip not found, continue with others
        if (!(error instanceof NotFoundException)) {
          throw error;
        }
      }
    }

    return { deleted };
  }

  /**
   * Bulk update question priority
   */
  async bulkUpdatePriority(
    tenantContext: { tenantId: string; userId: string; role: string },
    ids: string[],
    priority: QuestionPriority,
  ): Promise<QuestionResponseDto[]> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Bulk updating priority for ${ids.length} questions`);

    const questionRepo = new TenantAwareRepository(this.questionRepo, tenantContext.tenantId);
    const results: QuestionResponseDto[] = [];

    for (const id of ids) {
      const question = await questionRepo.findOne({ where: { id } });
      if (question) {
        question.priority = priority;
        const updated = await questionRepo.save(question);
        results.push(this.toQuestionResponse(updated));
      }
    }

    return results;
  }

  /**
   * Bulk update question timing
   */
  async bulkUpdateTiming(
    tenantContext: { tenantId: string; userId: string; role: string },
    ids: string[],
    timing: QuestionTiming,
  ): Promise<QuestionResponseDto[]> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Bulk updating timing for ${ids.length} questions`);

    const questionRepo = new TenantAwareRepository(this.questionRepo, tenantContext.tenantId);
    const results: QuestionResponseDto[] = [];

    for (const id of ids) {
      const question = await questionRepo.findOne({ where: { id } });
      if (question) {
        question.timing = timing;
        const updated = await questionRepo.save(question);
        results.push(this.toQuestionResponse(updated));
      }
    }

    return results;
  }

  /**
   * Clear answered questions (archive or delete)
   */
  async clearAnsweredQuestions(
    tenantContext: { tenantId: string; userId: string; role: string },
    beforeDate?: Date,
  ): Promise<{ cleared: number }> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Clearing answered questions`);

    const queryBuilder = this.questionRepo.createQueryBuilder('question');
    queryBuilder.where('question.tenantId = :tenantId', { tenantId: tenantContext.tenantId });
    queryBuilder.andWhere('question.answeredAt IS NOT NULL');

    if (beforeDate) {
      queryBuilder.andWhere('question.answeredAt < :beforeDate', {
        beforeDate,
      });
    }

    const questions = await queryBuilder.getMany();
    await this.questionRepo.remove(questions);

    return { cleared: questions.length };
  }

  /**
   * Expire questions by criteria
   */
  async expireQuestions(
    tenantContext: { tenantId: string; userId: string; role: string },
    params: {
      olderThanDays?: number;
      timing?: QuestionTiming;
      type?: QuestionType;
    },
  ): Promise<{ expired: number }> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Expiring questions by criteria`);

    const queryBuilder = this.questionRepo.createQueryBuilder('question');
    queryBuilder.where('question.tenantId = :tenantId', { tenantId: tenantContext.tenantId });
    queryBuilder.andWhere('question.answeredAt IS NULL');

    if (params.olderThanDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - params.olderThanDays);
      queryBuilder.andWhere('question.createdAt < :cutoffDate', { cutoffDate });
    }

    if (params.timing) {
      queryBuilder.andWhere('question.timing = :timing', {
        timing: params.timing,
      });
    }

    if (params.type) {
      queryBuilder.andWhere('question.type = :type', { type: params.type });
    }

    const questions = await queryBuilder.getMany();

    // Set expiration date to now for these questions
    const now = new Date();
    for (const question of questions) {
      question.expiresAt = now;
    }

    await this.questionRepo.save(questions);

    return { expired: questions.length };
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(
    tenantContext: { tenantId: string; userId: string; role: string },
  ): Promise<{
    totalUnanswered: number;
    byPriority: Record<QuestionPriority, number>;
    byTiming: Record<QuestionTiming, number>;
    avgTimeToAnswer: number; // in hours
    oldestUnanswered: Date | null;
    newestUnanswered: Date | null;
  }> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Getting queue metrics`);

    const questionRepo = new TenantAwareRepository(this.questionRepo, tenantContext.tenantId);
    const unanswered = await questionRepo.find({
      where: { answeredAt: IsNull() },
    });

    const byPriority: Record<QuestionPriority, number> = {
      [QuestionPriority.CRITICAL]: 0,
      [QuestionPriority.HIGH]: 0,
      [QuestionPriority.MEDIUM]: 0,
      [QuestionPriority.LOW]: 0,
    };

    const byTiming: Record<QuestionTiming, number> = {
      [QuestionTiming.IMMEDIATE]: 0,
      [QuestionTiming.STEP_END]: 0,
      [QuestionTiming.SESSION_END]: 0,
      [QuestionTiming.DEFERRED]: 0,
    };

    for (const q of unanswered) {
      byPriority[q.priority as QuestionPriority]++;
      byTiming[q.timing as QuestionTiming]++;
    }

    // Calculate average time to answer for answered questions
    const answered = await questionRepo.find({
      where: { answeredAt: Not(IsNull()) },
    });

    let totalTimeToAnswer = 0;
    for (const q of answered) {
      if (q.answeredAt) {
        const diff = q.answeredAt.getTime() - q.createdAt.getTime();
        totalTimeToAnswer += diff;
      }
    }

    const avgTimeToAnswer =
      answered.length > 0
        ? totalTimeToAnswer / answered.length / (1000 * 60 * 60)
        : 0; // in hours

    // Find oldest and newest unanswered
    const oldestUnanswered =
      unanswered.length > 0
        ? unanswered.reduce((oldest, q) =>
            q.createdAt < oldest.createdAt ? q : oldest,
          ).createdAt
        : null;

    const newestUnanswered =
      unanswered.length > 0
        ? unanswered.reduce((newest, q) =>
            q.createdAt > newest.createdAt ? q : newest,
          ).createdAt
        : null;

    return {
      totalUnanswered: unanswered.length,
      byPriority,
      byTiming,
      avgTimeToAnswer: Math.round(avgTimeToAnswer * 100) / 100,
      oldestUnanswered,
      newestUnanswered,
    };
  }

  /**
   * Reorder queue based on updated priorities
   */
  async reorderQueue(
    tenantContext: { tenantId: string; userId: string; role: string },
  ): Promise<QuestionResponseDto[]> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Reordering queue`);

    const questionRepo = new TenantAwareRepository(this.questionRepo, tenantContext.tenantId);
    const unanswered = await questionRepo.find({
      where: { answeredAt: IsNull() },
      order: {
        priority: 'DESC',
        createdAt: 'ASC',
      },
    });

    return unanswered.map((q) => this.toQuestionResponse(q));
  }

  /**
   * Get questions requiring immediate attention
   */
  async getImmediateAttentionQuestions(
    tenantContext: { tenantId: string; userId: string; role: string },
  ): Promise<QuestionResponseDto[]> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Getting immediate attention questions`);

    const questions = await this.questionRepo
      .createQueryBuilder('question')
      .where('question.tenantId = :tenantId', { tenantId: tenantContext.tenantId })
      .andWhere('question.answeredAt IS NULL')
      .andWhere('(question.timing = :immediate OR question.priority = :critical)', {
        immediate: QuestionTiming.IMMEDIATE,
        critical: QuestionPriority.CRITICAL,
      })
      .orderBy('question.priority', 'DESC')
      .addOrderBy('question.createdAt', 'ASC')
      .getMany();

    return questions.map((q) => this.toQuestionResponse(q));
  }

  /**
   * Get questions by reconciliation with queue status
   */
  async getQuestionsByReconciliation(
    tenantContext: { tenantId: string; userId: string; role: string },
    reconciliationId: string,
  ): Promise<{
    total: number;
    answered: number;
    unanswered: number;
    questions: QuestionResponseDto[];
  }> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Getting questions for reconciliation: ${reconciliationId}`);

    const questionRepo = new TenantAwareRepository(this.questionRepo, tenantContext.tenantId);
    const questions = await questionRepo.find({
      where: { relatedReconciliationId: reconciliationId },
      order: {
        priority: 'DESC',
        createdAt: 'ASC',
      },
    });

    const answered = questions.filter((q) => q.answeredAt !== null).length;
    const unanswered = questions.filter((q) => q.answeredAt === null).length;

    return {
      total: questions.length,
      answered,
      unanswered,
      questions: questions.map((q) => this.toQuestionResponse(q)),
    };
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
