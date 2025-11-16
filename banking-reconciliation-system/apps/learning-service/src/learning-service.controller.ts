import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LearningServiceService } from './learning-service.service';

@ApiTags('Learning')
@Controller('learning')
export class LearningServiceController {
  constructor(private readonly learningServiceService: LearningServiceService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for Learning Service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return {
      service: 'learning-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      capabilities: [
        'entity-profiles',
        'user-feedback',
        'pattern-learning',
        'per-bank-tracking',
      ],
    };
  }
}
