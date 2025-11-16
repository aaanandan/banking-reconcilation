import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt09TimingDifferencesService } from './mt-09-timing-differences.service';
import {
  TimingDifferenceMatchRequestDto,
  TimingDifferenceMatchResponseDto,
} from './dto/match.dto';

/**
 * MT-09 Timing Differences Controller
 * STEP 58: Date-Flexible Matcher - Timing difference matching endpoints
 */
@ApiTags('MT-09 Timing Differences')
@Controller()
export class Mt09TimingDifferencesController {
  constructor(private readonly mt09Service: Mt09TimingDifferencesService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for MT-09 service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      service: 'MT-09-Timing-Differences',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      capabilities: [
        'timing-difference-matching',
        'date-flexible-matching',
        'delay-pattern-learning',
        'multi-bank-support',
      ],
    };
  }

  @Post('find-matches')
  @ApiOperation({
    summary: 'Find timing difference matches (relaxed date matching)',
    description: `
      MT-09 Date-Flexible Matcher: Matches transactions with date mismatches.

      Common scenarios:
      - Check clearance delays (3-5 days)
      - Wire transfer delays (1-2 days)
      - Weekend/holiday processing delays

      Algorithm:
      1. Relaxes date matching to ±5 days (configurable)
      2. Requires exact amount match (±0.1% tolerance)
      3. Requires high description similarity (>70%)
      4. Tracks timing patterns for learning
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Timing difference matches found',
    type: TimingDifferenceMatchResponseDto,
  })
  findTimingMatches(
    @Body() request: TimingDifferenceMatchRequestDto,
  ): TimingDifferenceMatchResponseDto {
    return this.mt09Service.findTimingMatches(request);
  }
}
