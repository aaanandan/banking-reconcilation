import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StateManagerServiceService } from './state-manager-service.service';

@ApiTags('State Management')
@Controller('state')
export class StateManagerServiceController {
  constructor(private readonly stateManagerService: StateManagerServiceService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for State Manager Service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return {
      service: 'state-manager-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    };
  }
}
