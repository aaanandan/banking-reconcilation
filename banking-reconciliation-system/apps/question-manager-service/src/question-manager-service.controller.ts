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
    @Body() dto: CreateQuestionDto,
  ): Promise<QuestionResponseDto> {
    return this.questionService.createQuestion(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all questions with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of questions',
    type: [QuestionResponseDto],
  })
  async getQuestions(
    @Query() filters: FilterQuestionsDto,
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.getQuestions(filters);
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
  async getQuestionById(@Param('id') id: string): Promise<QuestionResponseDto> {
    return this.questionService.getQuestionById(id);
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
    @Param('id') id: string,
    @Body() dto: AnswerQuestionDto,
  ): Promise<QuestionResponseDto> {
    return this.questionService.answerQuestion(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a question' })
  @ApiParam({ name: 'id', description: 'Question UUID' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async deleteQuestion(@Param('id') id: string): Promise<void> {
    return this.questionService.deleteQuestion(id);
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
  async getQuestionQueue(): Promise<QuestionQueueDto> {
    return this.questionService.getQuestionQueue();
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
    @Param('timing') timing: QuestionTiming,
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.getUnansweredByTiming(timing);
  }

  @Get('expired/all')
  @ApiOperation({ summary: 'Get all expired unanswered questions' })
  @ApiResponse({
    status: 200,
    description: 'List of expired questions',
    type: [QuestionResponseDto],
  })
  async getExpiredQuestions(): Promise<QuestionResponseDto[]> {
    return this.questionService.getExpiredQuestions();
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
  async getQuestionStats(): Promise<QuestionStatsDto> {
    return this.questionService.getQuestionStats();
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
    @Param('questionId') questionId: string,
  ): Promise<QuestionResponseDto> {
    return this.questionService.getQuestionByQuestionId(questionId);
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
    @Body()
    params: {
      entityName: string;
      reconciliationId: string;
      transactionIds: number[];
      triggeredBy: string;
      context?: string;
    },
  ): Promise<QuestionResponseDto> {
    return this.questionService.generateEntityIdentityQuestion(params);
  }

  @Post('generate/entity-relationship')
  @ApiOperation({ summary: 'Generate an entity relationship question' })
  @ApiResponse({
    status: 201,
    description: 'Question generated successfully',
    type: QuestionResponseDto,
  })
  async generateEntityRelationshipQuestion(
    @Body()
    params: {
      entity1: string;
      entity2: string;
      reconciliationId: string;
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    return this.questionService.generateEntityRelationshipQuestion(params);
  }

  @Post('generate/business-pattern')
  @ApiOperation({ summary: 'Generate a business pattern question' })
  @ApiResponse({
    status: 201,
    description: 'Question generated successfully',
    type: QuestionResponseDto,
  })
  async generateBusinessPatternQuestion(
    @Body()
    params: {
      entityId: string;
      patternObserved: string;
      reconciliationId: string;
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    return this.questionService.generateBusinessPatternQuestion(params);
  }

  @Post('generate/value-pattern')
  @ApiOperation({ summary: 'Generate a value pattern question' })
  @ApiResponse({
    status: 201,
    description: 'Question generated successfully',
    type: QuestionResponseDto,
  })
  async generateValuePatternQuestion(
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
    return this.questionService.generateValuePatternQuestion(params);
  }

  @Post('generate/timing-pattern')
  @ApiOperation({ summary: 'Generate a timing pattern question' })
  @ApiResponse({
    status: 201,
    description: 'Question generated successfully',
    type: QuestionResponseDto,
  })
  async generateTimingPatternQuestion(
    @Body()
    params: {
      entityId: string;
      expectedPattern: string;
      actualDate: string;
      reconciliationId: string;
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    return this.questionService.generateTimingPatternQuestion(params);
  }

  @Post('generate/field-preference')
  @ApiOperation({ summary: 'Generate a field preference question' })
  @ApiResponse({
    status: 201,
    description: 'Question generated successfully',
    type: QuestionResponseDto,
  })
  async generateFieldPreferenceQuestion(
    @Body()
    params: {
      entityId: string;
      fields: string[];
      reconciliationId: string;
      transactionIds: number[];
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    return this.questionService.generateFieldPreferenceQuestion(params);
  }

  @Post('generate/exception-reason')
  @ApiOperation({ summary: 'Generate an exception reason question' })
  @ApiResponse({
    status: 201,
    description: 'Question generated successfully',
    type: QuestionResponseDto,
  })
  async generateExceptionReasonQuestion(
    @Body()
    params: {
      action: string;
      entityId: string;
      reconciliationId: string;
      transactionIds: number[];
      triggeredBy: string;
    },
  ): Promise<QuestionResponseDto> {
    return this.questionService.generateExceptionReasonQuestion(params);
  }

  @Post('generate/general-context')
  @ApiOperation({ summary: 'Generate a general context question' })
  @ApiResponse({
    status: 201,
    description: 'Question generated successfully',
    type: QuestionResponseDto,
  })
  async generateGeneralContextQuestion(
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
    return this.questionService.generateGeneralContextQuestion(params as any);
  }

  @Post('generate/bulk')
  @ApiOperation({ summary: 'Bulk generate multiple questions' })
  @ApiResponse({
    status: 201,
    description: 'Questions generated successfully',
    type: [QuestionResponseDto],
  })
  async bulkGenerateQuestions(
    @Body() questions: CreateQuestionDto[],
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.bulkGenerateQuestions(questions);
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
    @Body() answers: Array<{ id: string; answer: any }>,
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.bulkAnswerQuestions(answers);
  }

  @Delete('bulk/delete')
  @ApiOperation({ summary: 'Bulk delete multiple questions' })
  @ApiResponse({
    status: 200,
    description: 'Questions deleted successfully',
  })
  async bulkDeleteQuestions(
    @Body() body: { ids: string[] },
  ): Promise<{ deleted: number }> {
    return this.questionService.bulkDeleteQuestions(body.ids);
  }

  @Put('bulk/priority')
  @ApiOperation({ summary: 'Bulk update question priority' })
  @ApiResponse({
    status: 200,
    description: 'Priorities updated successfully',
    type: [QuestionResponseDto],
  })
  async bulkUpdatePriority(
    @Body() body: { ids: string[]; priority: string },
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.bulkUpdatePriority(
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
    @Body() body: { ids: string[]; timing: string },
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.bulkUpdateTiming(body.ids, body.timing as any);
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
    @Query('beforeDate') beforeDate?: string,
  ): Promise<{ cleared: number }> {
    const date = beforeDate ? new Date(beforeDate) : undefined;
    return this.questionService.clearAnsweredQuestions(date);
  }

  @Post('expire')
  @ApiOperation({ summary: 'Expire questions by criteria' })
  @ApiResponse({
    status: 200,
    description: 'Questions expired',
  })
  async expireQuestions(
    @Body()
    params: {
      olderThanDays?: number;
      timing?: string;
      type?: string;
    },
  ): Promise<{ expired: number }> {
    return this.questionService.expireQuestions(params as any);
  }

  @Get('queue/metrics')
  @ApiOperation({ summary: 'Get queue metrics' })
  @ApiResponse({
    status: 200,
    description: 'Queue metrics',
  })
  async getQueueMetrics(): Promise<{
    totalUnanswered: number;
    byPriority: Record<string, number>;
    byTiming: Record<string, number>;
    avgTimeToAnswer: number;
    oldestUnanswered: Date | null;
    newestUnanswered: Date | null;
  }> {
    return this.questionService.getQueueMetrics();
  }

  @Get('queue/reorder')
  @ApiOperation({ summary: 'Reorder queue based on priorities' })
  @ApiResponse({
    status: 200,
    description: 'Reordered queue',
    type: [QuestionResponseDto],
  })
  async reorderQueue(): Promise<QuestionResponseDto[]> {
    return this.questionService.reorderQueue();
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
  async getImmediateAttentionQuestions(): Promise<QuestionResponseDto[]> {
    return this.questionService.getImmediateAttentionQuestions();
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
    @Param('reconciliationId') reconciliationId: string,
  ): Promise<{
    total: number;
    answered: number;
    unanswered: number;
    questions: QuestionResponseDto[];
  }> {
    return this.questionService.getQuestionsByReconciliation(reconciliationId);
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
  async getAnswerProcessingSummary(): Promise<{
    totalAnswered: number;
    processedByType: Record<string, number>;
    lastProcessedAt: Date | null;
  }> {
    return this.questionService.getAnswerProcessingSummary();
  }
}
