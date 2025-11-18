import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FeatureFlagService } from './feature-flag.service';
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  FeatureFlagDto,
  CheckFeatureFlagDto,
  FeatureFlagEvaluationDto,
  BulkFeatureFlagsDto,
  BulkFeatureFlagsResponseDto,
  CreateExperimentDto,
  ExperimentResultDto,
  FeatureFlagOverrideDto,
  FeatureFlagStatisticsDto,
  FeatureFlagListDto,
} from './dto/feature-flag.dto';

@ApiTags('Feature Flags')
@Controller('feature-flags')
@UseGuards(ThrottlerGuard)
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new feature flag (admin only)' })
  @ApiResponse({ status: 201, description: 'Feature flag created successfully', type: FeatureFlagDto })
  @ApiBearerAuth()
  async create(@Body() dto: CreateFeatureFlagDto): Promise<FeatureFlagDto> {
    // TODO: Add admin authorization guard
    return this.featureFlagService.create(dto, 'admin'); // Get user ID from auth context
  }

  @Get()
  @ApiOperation({ summary: 'Get all feature flags (admin only)' })
  @ApiResponse({ status: 200, description: 'Feature flags retrieved successfully', type: FeatureFlagListDto })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiBearerAuth()
  async getAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<FeatureFlagListDto> {
    // TODO: Add admin authorization guard
    return this.featureFlagService.getAll(page, pageSize);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get feature flag statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully', type: FeatureFlagStatisticsDto })
  @ApiBearerAuth()
  async getStatistics(): Promise<FeatureFlagStatisticsDto> {
    // TODO: Add admin authorization guard
    return this.featureFlagService.getStatistics();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a feature flag by key (admin only)' })
  @ApiResponse({ status: 200, description: 'Feature flag retrieved successfully', type: FeatureFlagDto })
  @ApiBearerAuth()
  async getByKey(@Param('key') key: string): Promise<FeatureFlagDto> {
    // TODO: Add admin authorization guard
    return this.featureFlagService.getByKey(key);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update a feature flag (admin only)' })
  @ApiResponse({ status: 200, description: 'Feature flag updated successfully', type: FeatureFlagDto })
  @ApiBearerAuth()
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateFeatureFlagDto,
  ): Promise<FeatureFlagDto> {
    // TODO: Add admin authorization guard
    return this.featureFlagService.update(key, dto);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a feature flag (admin only)' })
  @ApiResponse({ status: 204, description: 'Feature flag deleted successfully' })
  @ApiBearerAuth()
  async delete(@Param('key') key: string): Promise<void> {
    // TODO: Add admin authorization guard
    await this.featureFlagService.delete(key);
  }

  @Post('check')
  @ApiOperation({ summary: 'Check if a feature flag is enabled' })
  @ApiResponse({ status: 200, description: 'Feature flag evaluation result', type: FeatureFlagEvaluationDto })
  @ApiBearerAuth()
  async checkFlag(@Body() dto: CheckFeatureFlagDto): Promise<FeatureFlagEvaluationDto> {
    return this.featureFlagService.isEnabled(dto);
  }

  @Post('check/bulk')
  @ApiOperation({ summary: 'Check multiple feature flags at once' })
  @ApiResponse({ status: 200, description: 'Bulk feature flag evaluation result', type: BulkFeatureFlagsResponseDto })
  @ApiBearerAuth()
  async checkBulk(@Body() dto: BulkFeatureFlagsDto): Promise<BulkFeatureFlagsResponseDto> {
    return this.featureFlagService.getBulk(dto);
  }

  @Post('experiments')
  @ApiOperation({ summary: 'Create an A/B test experiment (admin only)' })
  @ApiResponse({ status: 201, description: 'Experiment created successfully', type: FeatureFlagDto })
  @ApiBearerAuth()
  async createExperiment(@Body() dto: CreateExperimentDto): Promise<FeatureFlagDto> {
    // TODO: Add admin authorization guard
    return this.featureFlagService.createExperiment(dto, 'admin'); // Get user ID from auth context
  }

  @Post('experiments/:key/variant')
  @ApiOperation({ summary: 'Get experiment variant for a user/tenant' })
  @ApiResponse({ status: 200, description: 'Experiment variant result', type: ExperimentResultDto })
  @ApiBearerAuth()
  async getExperimentVariant(
    @Param('key') key: string,
    @Body('identifier') identifier: string,
  ): Promise<ExperimentResultDto> {
    return this.featureFlagService.getExperimentVariant(key, identifier);
  }

  @Post('overrides')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Add a temporary override for a user/tenant (admin only)' })
  @ApiResponse({ status: 204, description: 'Override added successfully' })
  @ApiBearerAuth()
  async addOverride(@Body() dto: FeatureFlagOverrideDto): Promise<void> {
    // TODO: Add admin authorization guard
    await this.featureFlagService.addOverride(dto);
  }

  @Delete('overrides/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an override (admin only)' })
  @ApiResponse({ status: 204, description: 'Override removed successfully' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiBearerAuth()
  async removeOverride(
    @Param('key') key: string,
    @Query('userId') userId?: string,
    @Query('tenantId') tenantId?: string,
  ): Promise<void> {
    // TODO: Add admin authorization guard
    await this.featureFlagService.removeOverride(key, userId, tenantId);
  }

  @Post('cleanup/overrides')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clean expired overrides for all flags (admin only)' })
  @ApiResponse({ status: 200, description: 'Expired overrides cleaned' })
  @ApiBearerAuth()
  async cleanExpiredOverrides(): Promise<{ cleaned: number }> {
    // TODO: Add admin authorization guard
    const cleaned = await this.featureFlagService.cleanExpiredOverrides();
    return { cleaned };
  }
}
