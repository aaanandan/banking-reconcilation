import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt02NearExactService } from './mt-02-near-exact.service';
import { FuzzyMatchRequestDto, FuzzyMatchResponseDto } from './dto/fuzzy-match.dto';

@ApiTags('Matching')
@Controller('match')
export class Mt02NearExactController {
  constructor(private readonly mt02NearExactService: Mt02NearExactService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for MT-02 Near-Exact Match Service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return {
      service: 'mt-02-near-exact',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      algorithm: 'fuzzy-match',
      capabilities: ['date-tolerance', 'amount-tolerance', 'description-similarity'],
    };
  }

  @Post('fuzzy')
  @ApiOperation({ summary: 'Find fuzzy matches between bank and ledger transactions' })
  @ApiResponse({ status: 200, description: 'Fuzzy match candidates returned', type: FuzzyMatchResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request payload' })
  findFuzzyMatches(@Body() request: FuzzyMatchRequestDto): FuzzyMatchResponseDto {
    return this.mt02NearExactService.findFuzzyMatches(request);
  }
}
