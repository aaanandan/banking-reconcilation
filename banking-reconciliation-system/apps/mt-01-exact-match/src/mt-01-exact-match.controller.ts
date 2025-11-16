import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt01ExactMatchService } from './mt-01-exact-match.service';

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

  // Matching endpoints will be added in Steps 23-25
}
