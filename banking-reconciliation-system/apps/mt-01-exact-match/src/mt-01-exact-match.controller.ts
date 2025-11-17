import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt01ExactMatchService } from './mt-01-exact-match.service';
import { MatchRequestDto, MatchResponseDto } from './dto/match.dto';
import { TenantContext } from '@app/shared';

@ApiTags('Matching')
@Controller('match')
export class Mt01ExactMatchController {
  constructor(private readonly mt01ExactMatchService: Mt01ExactMatchService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for MT-01 Exact Match Service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return {
      service: 'mt-01-exact-match',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      algorithm: 'exact-match',
    };
  }

  @Post('exact')
  @ApiOperation({ summary: 'Find exact matches between bank and ledger transactions' })
  @ApiResponse({ status: 200, description: 'Match candidates returned', type: MatchResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request payload' })
  findExactMatches(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() request: MatchRequestDto,
  ): MatchResponseDto {
    return this.mt01ExactMatchService.findExactMatches(tenantContext, request);
  }
}
