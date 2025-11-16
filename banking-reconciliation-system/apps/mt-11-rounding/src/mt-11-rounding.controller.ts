import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt11RoundingService } from './mt-11-rounding.service';
import {
  RoundingClassificationRequestDto,
  RoundingClassificationResponseDto,
} from './dto/classification.dto';

/**
 * MT-11 Rounding Differences Controller
 * STEP 60.4: Exception Handler - Rounding difference detection endpoints
 */
@ApiTags('MT-11 Rounding Differences')
@Controller()
export class Mt11RoundingController {
  constructor(private readonly mt11Service: Mt11RoundingService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for MT-11 service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      service: 'MT-11-Rounding-Differences',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      capabilities: [
        'rounding-difference-detection',
        'threshold-based-classification',
        'keyword-analysis',
        'small-amount-detection',
      ],
    };
  }

  @Post('classify')
  @ApiOperation({
    summary: 'Classify rounding difference transactions',
    description: `
      MT-11 Exception Handler: Identifies bank transactions with small rounding differences.

      Accounting systems may have different decimal precision, causing small rounding discrepancies.

      Algorithm:
      1. Checks for rounding keywords (rounding, adjustment, cent, penny)
      2. Checks if amount is within threshold (default: $0.01)
      3. Returns classification results

      Result: Reduces "unknown" transaction pool by identifying expected rounding differences.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Rounding differences classified successfully',
    type: RoundingClassificationResponseDto,
  })
  classifyRoundingDifferences(
    @Body() request: RoundingClassificationRequestDto,
  ): RoundingClassificationResponseDto {
    return this.mt11Service.classifyRoundingDifferences(request);
  }
}
