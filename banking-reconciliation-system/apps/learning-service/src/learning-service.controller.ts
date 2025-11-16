import { Controller, Get, Post, Delete, Body, Param, Query, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LearningServiceService } from './learning-service.service';
import {
  RecordFeedbackDto,
  FeedbackResponseDto,
  GetFeedbackDto,
  FeedbackStatsDto,
} from './dto/feedback.dto';
import {
  CreateEntityProfileDto,
  UpdateEntityProfileDto,
  EntityProfileResponseDto,
  EntityProfileStatsDto,
} from './dto/entity-profile.dto';

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

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 43: ENTITY PROFILE ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('profile')
  @ApiOperation({ summary: 'Create new entity profile for a payer/payee' })
  @ApiResponse({
    status: 201,
    description: 'Entity profile created successfully',
    type: EntityProfileResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Entity profile already exists' })
  async createProfile(@Body() dto: CreateEntityProfileDto): Promise<EntityProfileResponseDto> {
    return this.learningServiceService.createProfile(dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get all entity profiles' })
  @ApiResponse({
    status: 200,
    description: 'Entity profiles retrieved',
    type: [EntityProfileResponseDto],
  })
  async getAllProfiles(): Promise<EntityProfileResponseDto[]> {
    return this.learningServiceService.getAllProfiles();
  }

  @Get('profile/:entityId')
  @ApiOperation({ summary: 'Get entity profile by ID' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiResponse({
    status: 200,
    description: 'Entity profile retrieved',
    type: EntityProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Entity profile not found' })
  async getProfile(@Param('entityId') entityId: string): Promise<EntityProfileResponseDto> {
    return this.learningServiceService.getProfile(entityId);
  }

  @Put('profile/:entityId')
  @ApiOperation({ summary: 'Update entity profile' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiResponse({
    status: 200,
    description: 'Entity profile updated successfully',
    type: EntityProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Entity profile not found' })
  async updateProfile(
    @Param('entityId') entityId: string,
    @Body() dto: UpdateEntityProfileDto,
  ): Promise<EntityProfileResponseDto> {
    return this.learningServiceService.updateProfile(entityId, dto);
  }

  @Delete('profile/:entityId')
  @ApiOperation({ summary: 'Delete entity profile' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiResponse({ status: 200, description: 'Entity profile deleted successfully' })
  @ApiResponse({ status: 404, description: 'Entity profile not found' })
  async deleteProfile(@Param('entityId') entityId: string): Promise<{ success: boolean }> {
    return this.learningServiceService.deleteProfile(entityId);
  }

  @Get('profile/:entityId/stats')
  @ApiOperation({ summary: 'Get entity profile statistics' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiResponse({
    status: 200,
    description: 'Profile statistics retrieved',
    type: EntityProfileStatsDto,
  })
  @ApiResponse({ status: 404, description: 'Entity profile not found' })
  async getProfileStats(@Param('entityId') entityId: string): Promise<EntityProfileStatsDto> {
    return this.learningServiceService.getProfileStats(entityId);
  }
}
