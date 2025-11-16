import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MatchOrchestratorService } from './match-orchestrator.service';

@ApiTags('Orchestration')
@Controller('orchestrate')
export class MatchOrchestratorController {
  constructor(private readonly matchOrchestratorService: MatchOrchestratorService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for Match Orchestrator Service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return {
      service: 'match-orchestrator',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      workflow: 'MT-01 (exact) → MT-02 (fuzzy)',
      capabilities: [
        'sequential-matching',
        'result-aggregation',
        'multi-bank-support',
        'statistics-calculation',
      ],
    };
  }
}
