import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt08ReversalsService } from './mt-08-reversals.service';
import {
  ReversalPairingRequestDto,
  ReversalPairingResponseDto,
} from './dto/pairing.dto';
import { TenantContext } from '@app/shared';

/**
 * MT-08 Reversals & Corrections Controller
 * STEP 60.2: Exception Handler - Reversal pair detection endpoints
 */
@ApiTags('MT-08 Reversals')
@Controller()
export class Mt08ReversalsController {
  constructor(private readonly mt08Service: Mt08ReversalsService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for MT-08 service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      service: 'MT-08-Reversals',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      capabilities: [
        'reversal-detection',
        'opposite-amount-matching',
        'keyword-analysis',
        'self-cancelling-pairs',
      ],
    };
  }

  @Post('find-pairs')
  @ApiOperation({
    summary: 'Find reversal pairs in bank transactions',
    description: `
      MT-08 Exception Handler: Identifies reversals and corrections that cancel each other out.

      Banking systems sometimes post a transaction and then reverse it (error corrections).

      Algorithm:
      1. Checks for opposite amounts (sum close to $0)
      2. Checks date proximity (within 3 days)
      3. Checks for reversal keywords (reversal, correction, cancel, void, etc.)
      4. Returns pairs that net to zero

      Result: Both transactions removed from "unknown" pool - explains why no ledger match exists.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Reversal pairs found successfully',
    type: ReversalPairingResponseDto,
  })
  findReversalPairs(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() request: ReversalPairingRequestDto,
  ): ReversalPairingResponseDto {
    return this.mt08Service.findReversalPairs(tenantContext, request);
  }
}
