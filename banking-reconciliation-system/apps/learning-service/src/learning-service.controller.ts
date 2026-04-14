import { Controller, Get, Post, Delete, Body, Param, Query, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TenantContext } from '@app/shared';
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
  UpdateBankBehaviorDto,
  BankBehaviorResponseDto,
  AllBanksBehaviorResponseDto,
  BuildProfileFromTransactionsDto,
  PatternLearningResultDto,
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
  async recordFeedback(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() dto: RecordFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    return this.learningServiceService.recordFeedback(tenantContext, dto);
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
  async getFeedback(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Query() query: GetFeedbackDto,
  ): Promise<FeedbackResponseDto[]> {
    return this.learningServiceService.getFeedback(tenantContext, query);
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
  async getFeedbackById(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('id') id: string,
  ): Promise<FeedbackResponseDto> {
    return this.learningServiceService.getFeedbackById(tenantContext, parseInt(id, 10));
  }

  @Get('feedback/stats/:reconciliationId')
  @ApiOperation({ summary: 'Get feedback statistics for a reconciliation' })
  @ApiParam({ name: 'reconciliationId', description: 'Reconciliation ID' })
  @ApiResponse({
    status: 200,
    description: 'Feedback statistics retrieved',
    type: FeedbackStatsDto,
  })
  async getFeedbackStats(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('reconciliationId') reconciliationId: string,
  ): Promise<FeedbackStatsDto> {
    return this.learningServiceService.getFeedbackStats(tenantContext, reconciliationId);
  }

  @Delete('feedback/:id')
  @ApiOperation({ summary: 'Delete feedback record' })
  @ApiParam({ name: 'id', description: 'Feedback ID' })
  @ApiResponse({ status: 200, description: 'Feedback deleted successfully' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  async deleteFeedback(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.learningServiceService.deleteFeedback(tenantContext, parseInt(id, 10));
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
  async createProfile(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() dto: CreateEntityProfileDto,
  ): Promise<EntityProfileResponseDto> {
    return this.learningServiceService.createProfile(tenantContext, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get all entity profiles' })
  @ApiResponse({
    status: 200,
    description: 'Entity profiles retrieved',
    type: [EntityProfileResponseDto],
  })
  async getAllProfiles(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
  ): Promise<EntityProfileResponseDto[]> {
    return this.learningServiceService.getAllProfiles(tenantContext);
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
  async getProfile(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('entityId') entityId: string,
  ): Promise<EntityProfileResponseDto> {
    return this.learningServiceService.getProfile(tenantContext, entityId);
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
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('entityId') entityId: string,
    @Body() dto: UpdateEntityProfileDto,
  ): Promise<EntityProfileResponseDto> {
    return this.learningServiceService.updateProfile(tenantContext, entityId, dto);
  }

  @Delete('profile/:entityId')
  @ApiOperation({ summary: 'Delete entity profile' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiResponse({ status: 200, description: 'Entity profile deleted successfully' })
  @ApiResponse({ status: 404, description: 'Entity profile not found' })
  async deleteProfile(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('entityId') entityId: string,
  ): Promise<{ success: boolean }> {
    return this.learningServiceService.deleteProfile(tenantContext, entityId);
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
  async getProfileStats(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('entityId') entityId: string,
  ): Promise<EntityProfileStatsDto> {
    return this.learningServiceService.getProfileStats(tenantContext, entityId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 44: PER-BANK BEHAVIOR TRACKING ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Put('profile/:entityId/bank-behavior')
  @ApiOperation({ summary: 'Update per-bank behavior for an entity' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiResponse({
    status: 200,
    description: 'Bank behavior updated successfully',
    type: BankBehaviorResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Entity profile not found' })
  async updateBankBehavior(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('entityId') entityId: string,
    @Body() dto: UpdateBankBehaviorDto,
  ): Promise<BankBehaviorResponseDto> {
    return this.learningServiceService.updateBankBehavior(tenantContext, entityId, dto);
  }

  @Get('profile/:entityId/bank-behavior/:bankId')
  @ApiOperation({ summary: 'Get bank-specific behavior for an entity' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiParam({ name: 'bankId', description: 'Bank ID' })
  @ApiResponse({
    status: 200,
    description: 'Bank behavior retrieved',
    type: BankBehaviorResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Entity profile or bank behavior not found' })
  async getBankBehavior(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('entityId') entityId: string,
    @Param('bankId') bankId: string,
  ): Promise<BankBehaviorResponseDto> {
    return this.learningServiceService.getBankBehavior(tenantContext, entityId, bankId);
  }

  @Get('profile/:entityId/bank-behavior')
  @ApiOperation({ summary: 'Get all bank-specific behaviors for an entity' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiResponse({
    status: 200,
    description: 'All bank behaviors retrieved',
    type: AllBanksBehaviorResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Entity profile not found' })
  async getAllBankBehaviors(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('entityId') entityId: string,
  ): Promise<AllBanksBehaviorResponseDto> {
    return this.learningServiceService.getAllBankBehaviors(tenantContext, entityId);
  }

  @Delete('profile/:entityId/bank-behavior/:bankId')
  @ApiOperation({ summary: 'Delete bank-specific behavior for an entity' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiParam({ name: 'bankId', description: 'Bank ID' })
  @ApiResponse({ status: 200, description: 'Bank behavior deleted successfully' })
  @ApiResponse({ status: 404, description: 'Entity profile or bank behavior not found' })
  async deleteBankBehavior(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('entityId') entityId: string,
    @Param('bankId') bankId: string,
  ): Promise<{ success: boolean }> {
    return this.learningServiceService.deleteBankBehavior(tenantContext, entityId, bankId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 45: PATTERN LEARNING ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('profile/build-from-transactions')
  @ApiOperation({ summary: 'Build or update entity profile from transaction analysis' })
  @ApiResponse({
    status: 201,
    description: 'Profile built/updated successfully from transaction patterns',
    type: PatternLearningResultDto,
  })
  @ApiResponse({ status: 404, description: 'Reconciliation or entity not found' })
  async buildProfileFromTransactions(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() dto: BuildProfileFromTransactionsDto,
  ): Promise<PatternLearningResultDto> {
    return this.learningServiceService.buildProfileFromTransactions(tenantContext, dto);
  }
}
