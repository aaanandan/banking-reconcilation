import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt03BankFeesService } from './mt-03-bank-fees.service';
import {
  ClassificationRequestDto,
  ClassificationResponseDto,
} from './dto/classification.dto';
import { TenantContext } from '@app/shared';

/**
 * MT-03 Bank Fees Controller
 * STEP 54: Exception Handler - Bank fee classification endpoints
 */
@ApiTags('MT-03 Bank Fees & Charges')
@Controller()
export class Mt03BankFeesController {
  constructor(private readonly mt03Service: Mt03BankFeesService) {}

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check for MT-03 service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      service: 'MT-03-Bank-Fees',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      capabilities: [
        'bank-fee-classification',
        'keyword-detection',
        'amount-validation',
        'multi-bank-support',
      ],
    };
  }

  /**
   * Classify bank transactions as potential fees
   */
  @Post('classify')
  @ApiOperation({
    summary: 'Classify unmatched bank transactions as potential fees',
    description: `
      MT-03 Exception Handler: Identifies bank fees with NO ledger entry expected

      Process:
      1. Receives unmatched bank transactions (after MT-01 & MT-02)
      2. Detects fee keywords in descriptions
      3. Validates amounts are in typical fee range
      4. Returns classification results with confidence scores

      Result: Reduces "unknown" transaction pool by identifying expected bank-only fees
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Bank fees classified successfully',
    type: ClassificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  classifyFees(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() request: ClassificationRequestDto,
  ): ClassificationResponseDto {
    return this.mt03Service.classifyBankFees(tenantContext, request);
  }
}
