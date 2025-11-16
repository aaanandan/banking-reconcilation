import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt02NearExactService } from './mt-02-near-exact.service';

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

  // Fuzzy matching endpoints will be added in Steps 28-30
}
