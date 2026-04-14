import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt04InterestService } from './mt-04-interest.service';
import {
  InterestClassificationRequestDto,
  InterestClassificationResponseDto,
} from './dto/classification.dto';
import { TenantContext } from '@app/shared';

/**
 * MT-04 Interest Credits Controller
 * STEP 55: Exception Handler - Interest income classification endpoints
 */
@ApiTags('MT-04 Interest Credits')
@Controller()
export class Mt04InterestController {
  constructor(private readonly mt04Service: Mt04InterestService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for MT-04 service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      service: 'MT-04-Interest',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      capabilities: [
        'interest-classification',
        'keyword-detection',
        'credit-validation',
        'multi-bank-support',
      ],
    };
  }

  @Post('classify')
  @ApiOperation({
    summary: 'Classify unmatched bank transactions as potential interest income',
    description: `MT-04 Exception Handler: Identifies interest with NO ledger entry expected. Interest may be recorded quarterly in ledger.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Interest classified successfully',
    type: InterestClassificationResponseDto,
  })
  classifyInterest(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() request: InterestClassificationRequestDto,
  ): InterestClassificationResponseDto {
    return this.mt04Service.classifyInterest(tenantContext, request);
  }
}
