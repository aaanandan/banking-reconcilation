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
}
