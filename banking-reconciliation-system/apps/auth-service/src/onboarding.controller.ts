import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { OnboardingService } from './onboarding.service';
import {
  OnboardingProgressDto,
  OnboardingStepEnum,
  CompleteStepDto,
  SkipStepDto,
  StartOnboardingDto,
  CompanyInfoDto,
  TrialStatusDto,
  ExtendTrialDto,
  OnboardingMetricsDto,
  OnboardingRecommendationDto,
  OnboardingGuideDto,
  OnboardingChecklistDto,
  ResetOnboardingDto,
} from './dto/onboarding.dto';

@ApiTags('Onboarding')
@Controller('onboarding')
@UseGuards(ThrottlerGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start onboarding for a new tenant' })
  @ApiResponse({ status: 201, description: 'Onboarding started successfully', type: OnboardingProgressDto })
  @ApiBearerAuth()
  async startOnboarding(@Body() dto: StartOnboardingDto): Promise<OnboardingProgressDto> {
    return this.onboardingService.startOnboarding(dto);
  }

  @Get('progress/:tenantId')
  @ApiOperation({ summary: 'Get onboarding progress for a tenant' })
  @ApiResponse({ status: 200, description: 'Progress retrieved successfully', type: OnboardingProgressDto })
  @ApiBearerAuth()
  async getProgress(@Param('tenantId') tenantId: string): Promise<OnboardingProgressDto> {
    return this.onboardingService.getProgress(tenantId);
  }

  @Post('complete-step/:tenantId')
  @ApiOperation({ summary: 'Mark an onboarding step as complete' })
  @ApiResponse({ status: 200, description: 'Step completed successfully', type: OnboardingProgressDto })
  @ApiBearerAuth()
  async completeStep(
    @Param('tenantId') tenantId: string,
    @Body() dto: CompleteStepDto,
  ): Promise<OnboardingProgressDto> {
    return this.onboardingService.completeStep(tenantId, dto);
  }

  @Post('skip-step/:tenantId')
  @ApiOperation({ summary: 'Skip an onboarding step' })
  @ApiResponse({ status: 200, description: 'Step skipped successfully', type: OnboardingProgressDto })
  @ApiBearerAuth()
  async skipStep(
    @Param('tenantId') tenantId: string,
    @Body() dto: SkipStepDto,
  ): Promise<OnboardingProgressDto> {
    return this.onboardingService.skipStep(tenantId, dto);
  }

  @Put('company-info/:tenantId')
  @ApiOperation({ summary: 'Update company information and mark step complete' })
  @ApiResponse({ status: 200, description: 'Company information updated successfully' })
  @ApiBearerAuth()
  async updateCompanyInfo(
    @Param('tenantId') tenantId: string,
    @Body() dto: CompanyInfoDto,
  ): Promise<{ message: string }> {
    await this.onboardingService.updateCompanyInfo(tenantId, dto);
    return { message: 'Company information updated successfully' };
  }

  @Get('checklist/:tenantId')
  @ApiOperation({ summary: 'Get detailed onboarding checklist' })
  @ApiResponse({ status: 200, description: 'Checklist retrieved successfully', type: OnboardingChecklistDto })
  @ApiBearerAuth()
  async getChecklist(@Param('tenantId') tenantId: string): Promise<OnboardingChecklistDto> {
    return this.onboardingService.getChecklist(tenantId);
  }

  @Get('guide/:step')
  @ApiOperation({ summary: 'Get onboarding guide for a specific step' })
  @ApiResponse({ status: 200, description: 'Guide retrieved successfully', type: OnboardingGuideDto })
  async getGuide(@Param('step') step: OnboardingStepEnum): Promise<OnboardingGuideDto> {
    return this.onboardingService.getGuide(step);
  }

  @Get('recommendations/:tenantId')
  @ApiOperation({ summary: 'Get personalized onboarding recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully', type: OnboardingRecommendationDto })
  @ApiBearerAuth()
  async getRecommendations(@Param('tenantId') tenantId: string): Promise<OnboardingRecommendationDto> {
    return this.onboardingService.getRecommendations(tenantId);
  }

  @Get('trial/status/:tenantId')
  @ApiOperation({ summary: 'Get trial status for a tenant' })
  @ApiResponse({ status: 200, description: 'Trial status retrieved successfully', type: TrialStatusDto })
  @ApiBearerAuth()
  async getTrialStatus(@Param('tenantId') tenantId: string): Promise<TrialStatusDto> {
    return this.onboardingService.getTrialStatus(tenantId);
  }

  @Post('trial/extend')
  @ApiOperation({ summary: 'Extend trial period for a tenant (admin only)' })
  @ApiResponse({ status: 200, description: 'Trial extended successfully', type: TrialStatusDto })
  @ApiBearerAuth()
  async extendTrial(@Body() dto: ExtendTrialDto): Promise<TrialStatusDto> {
    return this.onboardingService.extendTrial(dto);
  }

  @Post('convert/:tenantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark tenant as converted to paid plan' })
  @ApiResponse({ status: 204, description: 'Tenant marked as converted' })
  @ApiBearerAuth()
  async markAsConverted(@Param('tenantId') tenantId: string): Promise<void> {
    await this.onboardingService.markAsConverted(tenantId);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get onboarding metrics (admin only)' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully', type: OnboardingMetricsDto })
  @ApiBearerAuth()
  async getMetrics(): Promise<OnboardingMetricsDto> {
    return this.onboardingService.getMetrics();
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset onboarding for a tenant (admin only)' })
  @ApiResponse({ status: 200, description: 'Onboarding reset successfully' })
  @ApiBearerAuth()
  async resetOnboarding(@Body() dto: ResetOnboardingDto): Promise<{ message: string }> {
    await this.onboardingService.resetOnboarding(dto);
    return { message: 'Onboarding reset successfully' };
  }
}
