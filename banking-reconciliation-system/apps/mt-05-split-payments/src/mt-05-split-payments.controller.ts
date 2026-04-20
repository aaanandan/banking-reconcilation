import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt05SplitPaymentsService } from './mt-05-split-payments.service';
import {
  SplitPaymentMatchRequestDto,
  SplitPaymentMatchResponseDto,
} from './dto/match.dto';
import { TenantContext } from '@app/shared';

/**
 * MT-05 Split Payments Controller
 * STEP 56: Complex Matcher - Split payment matching endpoints
 */
@ApiTags('MT-05 Split Payments')
@Controller()
export class Mt05SplitPaymentsController {
  constructor(private readonly mt05Service: Mt05SplitPaymentsService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for MT-05 service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      service: 'MT-05-Split-Payments',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      capabilities: [
        'split-payment-matching',
        'group-transaction-detection',
        'sum-validation',
        'multi-bank-consolidation',
      ],
    };
  }

  @Post('find-matches')
  @ApiOperation({
    summary: 'Find split payment matches (multiple bank → single ledger)',
    description: `
      MT-05 Complex Matcher: Matches multiple bank transactions to a single ledger entry.

      Scenario: One invoice paid in multiple installments
      Example: Bank $500 + $500 + $500 → Ledger $1,500

      Algorithm:
      1. Groups bank transactions by similarity (description, date)
      2. Calculates sum for each group
      3. Matches sum to ledger amounts within tolerance
      4. Returns consolidated matches with confidence scores
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Split payment matches found',
    type: SplitPaymentMatchResponseDto,
  })
  findSplitPayments(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() request: SplitPaymentMatchRequestDto,
  ): SplitPaymentMatchResponseDto {
    return this.mt05Service.findSplitPayments(tenantContext, request);
  }
}
