import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt06ConsolidatedDepositsService } from './mt-06-consolidated-deposits.service';
import {
  ConsolidatedDepositRequestDto,
  ConsolidatedDepositResponseDto,
} from './dto/match.dto';
import { TenantContext } from '@app/shared';

/**
 * MT-06 Consolidated Deposits Controller
 * STEP 57: Multi-Bank Matcher - Consolidated deposit matching endpoints
 */
@ApiTags('MT-06 Consolidated Deposits')
@Controller()
export class Mt06ConsolidatedDepositsController {
  constructor(private readonly mt06Service: Mt06ConsolidatedDepositsService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for MT-06 service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      service: 'MT-06-Consolidated-Deposits',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      capabilities: [
        'consolidated-deposit-matching',
        'multi-bank-consolidation',
        'deposit-detection',
        'bank-breakdown-tracking',
      ],
    };
  }

  @Post('find-matches')
  @ApiOperation({
    summary: 'Find consolidated deposit matches (multi-bank → single ledger)',
    description: `
      MT-06 Multi-Bank Matcher: Matches deposits from multiple banks to a single ledger entry.

      Scenario: Company deposits cash at different banks on same day
      Example: HDFC $2K + ICICI $3K + SBI $5K → Ledger $10K

      Algorithm:
      1. Filters for deposit transactions (credit + deposit keywords)
      2. Groups deposits by date (same day)
      3. Calculates sum across all banks
      4. Matches to ledger amounts within tolerance
      5. Returns bank breakdown showing contribution per bank
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Consolidated deposit matches found',
    type: ConsolidatedDepositResponseDto,
  })
  findConsolidatedDeposits(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() request: ConsolidatedDepositRequestDto,
  ): ConsolidatedDepositResponseDto {
    return this.mt06Service.findConsolidatedDeposits(tenantContext, request);
  }
}
