import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt07DuplicatePostingsService } from './mt-07-duplicate-postings.service';
import {
  DuplicateClassificationRequestDto,
  DuplicateClassificationResponseDto,
} from './dto/classification.dto';

/**
 * MT-07 Duplicate Postings Controller
 * STEP 60.1: Exception Handler - Duplicate detection endpoints
 */
@ApiTags('MT-07 Duplicate Postings')
@Controller()
export class Mt07DuplicatePostingsController {
  constructor(private readonly mt07Service: Mt07DuplicatePostingsService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for MT-07 service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      service: 'MT-07-Duplicate-Postings',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      capabilities: [
        'duplicate-detection',
        'within-bank-grouping',
        'similarity-matching',
        'multi-bank-support',
      ],
    };
  }

  @Post('classify')
  @ApiOperation({
    summary: 'Classify duplicate bank transactions',
    description: `
      MT-07 Exception Handler: Identifies duplicate bank transactions that should be ignored.

      Banking systems sometimes post the same transaction twice.

      Algorithm:
      1. Groups transactions by bank
      2. Finds exact duplicates within same bank
      3. Checks date (within 24 hours), amount (exact), description (>80% similarity)
      4. Returns classification results

      Result: Reduces "unknown" transaction pool by identifying expected duplicates.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Duplicates classified successfully',
    type: DuplicateClassificationResponseDto,
  })
  classifyDuplicates(
    @Body() request: DuplicateClassificationRequestDto,
  ): DuplicateClassificationResponseDto {
    return this.mt07Service.classifyDuplicates(request);
  }
}
