import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TenantContext } from '@app/shared';
import { QuestionManagerServiceService } from './question-manager-service.service';
import {
  CreateQuestionDto,
  AnswerQuestionDto,
  FilterQuestionsDto,
  QuestionResponseDto,
  QuestionStatsDto,
  QuestionQueueDto,
  QuestionTiming,
} from './dto/question.dto';

/**
 * STEP 48: Question Manager Controller
 *
 * REST API endpoints for question management
 */
@ApiTags('Questions')
@Controller('questions')
export class QuestionManagerServiceController {
  constructor(
    private readonly questionService: QuestionManagerServiceService,
  ) {}

  /**
   * HEALTH CHECK
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check for Question Manager Service' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  getHealth() {
    return {
      service: 'question-manager',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      capabilities: [
        'question-creation',
        'question-queueing',
        'answer-processing',
        'question-statistics',
      ],
    };
  }

  /**
   * QUESTION CRUD OPERATIONS
   */
  @Post()
  @ApiOperation({ summary: 'Create a new learning question' })
  @ApiResponse({
    status: 201,
    description: 'Question created successfully',
    type: QuestionResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Question already exists' })
  async createQuestion(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() dto: CreateQuestionDto,
  ): Promise<QuestionResponseDto> {
    return this.questionService.createQuestion(tenantContext, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all questions with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of questions',
    type: [QuestionResponseDto],
  })
  async getQuestions(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Query() filters: FilterQuestionsDto,
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.getQuestions(tenantContext, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a question by ID' })
  @ApiParam({ name: 'id', description: 'Question UUID' })
  @ApiResponse({
    status: 200,
    description: 'Question found',
    type: QuestionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async getQuestionById(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('id') id: string,
  ): Promise<QuestionResponseDto> {
    return this.questionService.getQuestionById(tenantContext, id);
  }

  @Put(':id/answer')
  @ApiOperation({ summary: 'Answer a question' })
  @ApiParam({ name: 'id', description: 'Question UUID' })
  @ApiResponse({
    status: 200,
    description: 'Question answered successfully',
    type: QuestionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async answerQuestion(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('id') id: string,
    @Body() dto: AnswerQuestionDto,
  ): Promise<QuestionResponseDto> {
    return this.questionService.answerQuestion(tenantContext, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a question' })
  @ApiParam({ name: 'id', description: 'Question UUID' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async deleteQuestion(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('id') id: string,
  ): Promise<void> {
    return this.questionService.deleteQuestion(tenantContext, id);
  }

  /**
   * QUESTION QUEUE MANAGEMENT
   */
  @Get('queue/all')
  @ApiOperation({ summary: 'Get question queue organized by timing' })
  @ApiResponse({
    status: 200,
    description: 'Question queue',
    type: QuestionQueueDto,
  })
  async getQuestionQueue(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
  ): Promise<QuestionQueueDto> {
    return this.questionService.getQuestionQueue(tenantContext);
  }

  @Get('queue/:timing')
  @ApiOperation({ summary: 'Get unanswered questions by timing' })
  @ApiParam({
    name: 'timing',
    enum: QuestionTiming,
    description: 'Question timing (immediate, step_end, session_end, deferred)',
  })
  @ApiResponse({
    status: 200,
    description: 'Unanswered questions for the specified timing',
    type: [QuestionResponseDto],
  })
  async getUnansweredByTiming(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('timing') timing: QuestionTiming,
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.getUnansweredByTiming(tenantContext, timing);
  }

  @Get('expired/all')
  @ApiOperation({ summary: 'Get all expired unanswered questions' })
  @ApiResponse({
    status: 200,
    description: 'List of expired questions',
    type: [QuestionResponseDto],
  })
  async getExpiredQuestions(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.getExpiredQuestions(tenantContext);
  }

  /**
   * STATISTICS
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get question statistics' })
  @ApiResponse({
    status: 200,
    description: 'Question statistics',
    type: QuestionStatsDto,
  })
  async getQuestionStats(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
  ): Promise<QuestionStatsDto> {
    return this.questionService.getQuestionStats(tenantContext);
  }

  /**
   * LOOKUP BY QUESTION ID
   */
  @Get('by-question-id/:questionId')
  @ApiOperation({ summary: 'Get a question by questionId (not UUID)' })
  @ApiParam({ name: 'questionId', description: 'Unique question identifier' })
  @ApiResponse({
    status: 200,
    description: 'Question found',
    type: QuestionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async getQuestionByQuestionId(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('questionId') questionId: string,
  ): Promise<QuestionResponseDto> {
    return this.questionService.getQuestionByQuestionId(tenantContext, questionId);
  }

  /**
   * STEP 49: QUESTION GENERATORS
   */
  @Post('generate/entity-identity')
  @ApiOperation({ summary: 'Generate an entity identity question' })
  @ApiResponse({
    status: 201,
    description: 'Question generated successfully',
    type: QuestionResponseDto,
  })
  async generateEntityIdentityQuestion(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body()
    params: {
      entityName: string;
      reconciliationId: string;
      transactionIds: number[];
      triggeredBy: string;
      context?: string;
    },
  ): Promise<QuestionResponseDto> {
    return this.questionService.generateEntityIdentityQuestion(tenantContext, params);
  }

  @Post('generate/entity-relationship')
  @ApiOperation({ summary: 'Generate an entity relationship question' })
  @ApiResponse({
    status: 201,
    description: 'Question generated successfully',
    type: QuestionResponseDto,
  })
  async generateEntityRelationshipQuestion(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body()
    params: {
      entity1: string;
      entity2: string;
      reconciliationId: string;
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    return this.questionService.generateEntityRelationshipQuestion(tenantContext, params);
  }

  @Post('generate/business-pattern')
  @ApiOperation({ summary: 'Generate a business pattern question' })
  @ApiResponse({
    status: 201,
    description: 'Question generated successfully',
    type: QuestionResponseDto,
  })
  async generateBusinessPatternQuestion(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body()
    params: {
      entityId: string;
      patternObserved: string;
      reconciliationId: string;
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    return this.questionService.generateBusinessPatternQuestion(tenantContext, params);
  }

  @Post('generate/value-pattern')
  @ApiOperation({ summary: 'Generate a value pattern question' })
  @ApiResponse({
    status: 201,
    description: 'Question generated successfully',
    type: QuestionResponseDto,
  })
  async generateValuePatternQuestion(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body()
    params: {
      entityId: string;
      amount: number;
      typicalRange: { min: number; max: number };
      reconciliationId: string;
      transactionIds: number[];
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    return this.questionService.generateValuePatternQuestion(tenantContext, params);
  }

  @Post('generate/timing-pattern')
  @ApiOperation({ summary: 'Generate a timing pattern question' })
  @ApiResponse({
    status: 201,
    description: 'Question generated successfully',
    type: QuestionResponseDto,
  })
  async generateTimingPatternQuestion(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body()
    params: {
      entityId: string;
      expectedPattern: string;
      actualDate: string;
      reconciliationId: string;
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    return this.questionService.generateTimingPatternQuestion(tenantContext, params);
  }

  @Post('generate/field-preference')
  @ApiOperation({ summary: 'Generate a field preference question' })
  @ApiResponse({
    status: 201,
    description: 'Question generated successfully',
    type: QuestionResponseDto,
  })
  async generateFieldPreferenceQuestion(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body()
    params: {
      entityId: string;
      fields: string[];
      reconciliationId: string;
      transactionIds: number[];
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    return this.questionService.generateFieldPreferenceQuestion(tenantContext, params);
  }

  @Post('generate/exception-reason')
  @ApiOperation({ summary: 'Generate an exception reason question' })
  @ApiResponse({
    status: 201,
    description: 'Question generated successfully',
    type: QuestionResponseDto,
  })
  async generateExceptionReasonQuestion(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body()
    params: {
      action: string;
      entityId: string;
      reconciliationId: string;
      transactionIds: number[];
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    return this.questionService.generateExceptionReasonQuestion(tenantContext, params);
  }

  @Post('generate/general-context')
  @ApiOperation({ summary: 'Generate a general context question' })
  @ApiResponse({
    status: 201,
    description: 'Question generated successfully',
    type: QuestionResponseDto,
  })
  async generateGeneralContextQuestion(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body()
    params: {
      topic: string;
      question: string;
      reconciliationId: string;
      triggeredBy: string;
      priority?: string;
      timing?: string;
    },
  ): Promise<QuestionResponseDto> {
    return this.questionService.generateGeneralContextQuestion(tenantContext, params as any);
  }

  @Post('generate/bulk')
  @ApiOperation({ summary: 'Bulk generate multiple questions' })
  @ApiResponse({
    status: 201,
    description: 'Questions generated successfully',
    type: [QuestionResponseDto],
  })
  async bulkGenerateQuestions(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() questions: CreateQuestionDto[],
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.bulkGenerateQuestions(tenantContext, questions);
  }

  /**
   * STEP 50: ADVANCED QUEUE MANAGEMENT
   */
  @Put('bulk/answer')
  @ApiOperation({ summary: 'Bulk answer multiple questions' })
  @ApiResponse({
    status: 200,
    description: 'Questions answered successfully',
    type: [QuestionResponseDto],
  })
  async bulkAnswerQuestions(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() answers: Array<{ id: string; answer: any }>,
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.bulkAnswerQuestions(tenantContext, answers);
  }

  @Delete('bulk/delete')
  @ApiOperation({ summary: 'Bulk delete multiple questions' })
  @ApiResponse({
    status: 200,
    description: 'Questions deleted successfully',
  })
  async bulkDeleteQuestions(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() body: { ids: string[] },
  ): Promise<{ deleted: number }> {
    return this.questionService.bulkDeleteQuestions(tenantContext, body.ids);
  }

  @Put('bulk/priority')
  @ApiOperation({ summary: 'Bulk update question priority' })
  @ApiResponse({
    status: 200,
    description: 'Priorities updated successfully',
    type: [QuestionResponseDto],
  })
  async bulkUpdatePriority(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() body: { ids: string[]; priority: string },
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.bulkUpdatePriority(
      tenantContext,
      body.ids,
      body.priority as any,
    );
  }

  @Put('bulk/timing')
  @ApiOperation({ summary: 'Bulk update question timing' })
  @ApiResponse({
    status: 200,
    description: 'Timing updated successfully',
    type: [QuestionResponseDto],
  })
  async bulkUpdateTiming(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() body: { ids: string[]; timing: string },
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.bulkUpdateTiming(tenantContext, body.ids, body.timing as any);
  }

  @Delete('answered/clear')
  @ApiOperation({ summary: 'Clear answered questions' })
  @ApiQuery({
    name: 'beforeDate',
    required: false,
    description: 'Clear questions answered before this date',
  })
  @ApiResponse({
    status: 200,
    description: 'Answered questions cleared',
  })
  async clearAnsweredQuestions(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Query('beforeDate') beforeDate?: string,
  ): Promise<{ cleared: number }> {
    const date = beforeDate ? new Date(beforeDate) : undefined;
    return this.questionService.clearAnsweredQuestions(tenantContext, date);
  }

  @Post('expire')
  @ApiOperation({ summary: 'Expire questions by criteria' })
  @ApiResponse({
    status: 200,
    description: 'Questions expired',
  })
  async expireQuestions(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body()
    params: {
      olderThanDays?: number;
      timing?: string;
      type?: string;
    },
  ): Promise<{ expired: number }> {
    return this.questionService.expireQuestions(tenantContext, params as any);
  }

  @Get('queue/metrics')
  @ApiOperation({ summary: 'Get queue metrics' })
  @ApiResponse({
    status: 200,
    description: 'Queue metrics',
  })
  async getQueueMetrics(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
  ): Promise<{
    totalUnanswered: number;
    byPriority: Record<string, number>;
    byTiming: Record<string, number>;
    avgTimeToAnswer: number;
    oldestUnanswered: Date | null;
    newestUnanswered: Date | null;
  }> {
    return this.questionService.getQueueMetrics(tenantContext);
  }

  @Get('queue/reorder')
  @ApiOperation({ summary: 'Reorder queue based on priorities' })
  @ApiResponse({
    status: 200,
    description: 'Reordered queue',
    type: [QuestionResponseDto],
  })
  async reorderQueue(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.reorderQueue(tenantContext);
  }

  @Get('queue/immediate-attention')
  @ApiOperation({
    summary: 'Get questions requiring immediate attention',
  })
  @ApiResponse({
    status: 200,
    description: 'Immediate attention questions',
    type: [QuestionResponseDto],
  })
  async getImmediateAttentionQuestions(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.getImmediateAttentionQuestions(tenantContext);
  }

  @Get('reconciliation/:reconciliationId')
  @ApiOperation({ summary: 'Get questions by reconciliation ID' })
  @ApiParam({
    name: 'reconciliationId',
    description: 'Reconciliation ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions for reconciliation',
  })
  async getQuestionsByReconciliation(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('reconciliationId') reconciliationId: string,
  ): Promise<{
    total: number;
    answered: number;
    unanswered: number;
    questions: QuestionResponseDto[];
  }> {
    return this.questionService.getQuestionsByReconciliation(tenantContext, reconciliationId);
  }

  /**
   * STEP 51: ANSWER PROCESSING
   */
  @Get('processing/summary')
  @ApiOperation({ summary: 'Get answer processing summary' })
  @ApiResponse({
    status: 200,
    description: 'Answer processing summary',
  })
  async getAnswerProcessingSummary(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
  ): Promise<{
    totalAnswered: number;
    processedByType: Record<string, number>;
    lastProcessedAt: Date | null;
  }> {
    return this.questionService.getAnswerProcessingSummary(tenantContext);
  }
}
