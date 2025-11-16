import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LearningServiceService } from './learning-service.service';
import {
  RecordFeedbackDto,
  FeedbackResponseDto,
  GetFeedbackDto,
  FeedbackStatsDto,
} from './dto/feedback.dto';

@ApiTags('Learning')
@Controller('learning')
export class LearningServiceController {
  constructor(private readonly learningServiceService: LearningServiceService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for Learning Service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return {
      service: 'learning-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      capabilities: [
        'entity-profiles',
        'user-feedback',
        'pattern-learning',
        'per-bank-tracking',
      ],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 42: USER FEEDBACK ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('feedback')
  @ApiOperation({ summary: 'Record user feedback (override, rejection, manual match, comment)' })
  @ApiResponse({
    status: 201,
    description: 'Feedback recorded successfully',
    type: FeedbackResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async recordFeedback(@Body() dto: RecordFeedbackDto): Promise<FeedbackResponseDto> {
    return this.learningServiceService.recordFeedback(dto);
  }

  @Get('feedback')
  @ApiOperation({ summary: 'Get feedback records with optional filtering' })
  @ApiQuery({ name: 'reconciliationId', required: false, description: 'Filter by reconciliation ID' })
  @ApiQuery({ name: 'transactionId', required: false, description: 'Filter by transaction ID', type: Number })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'feedbackType', required: false, description: 'Filter by feedback type' })
  @ApiResponse({
    status: 200,
    description: 'Feedback records retrieved',
    type: [FeedbackResponseDto],
  })
  async getFeedback(@Query() query: GetFeedbackDto): Promise<FeedbackResponseDto[]> {
    return this.learningServiceService.getFeedback(query);
  }

  @Get('feedback/:id')
  @ApiOperation({ summary: 'Get feedback by ID' })
  @ApiParam({ name: 'id', description: 'Feedback ID' })
  @ApiResponse({
    status: 200,
    description: 'Feedback record retrieved',
    type: FeedbackResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  async getFeedbackById(@Param('id') id: string): Promise<FeedbackResponseDto> {
    return this.learningServiceService.getFeedbackById(parseInt(id, 10));
  }

  @Get('feedback/stats/:reconciliationId')
  @ApiOperation({ summary: 'Get feedback statistics for a reconciliation' })
  @ApiParam({ name: 'reconciliationId', description: 'Reconciliation ID' })
  @ApiResponse({
    status: 200,
    description: 'Feedback statistics retrieved',
    type: FeedbackStatsDto,
  })
  async getFeedbackStats(@Param('reconciliationId') reconciliationId: string): Promise<FeedbackStatsDto> {
    return this.learningServiceService.getFeedbackStats(reconciliationId);
  }

  @Delete('feedback/:id')
  @ApiOperation({ summary: 'Delete feedback record' })
  @ApiParam({ name: 'id', description: 'Feedback ID' })
  @ApiResponse({ status: 200, description: 'Feedback deleted successfully' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  async deleteFeedback(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.learningServiceService.deleteFeedback(parseInt(id, 10));
  }
}
