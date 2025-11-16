import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MatchOrchestratorService } from './match-orchestrator.service';
import { ReconciliationRequestDto } from './dto/reconciliation.dto';

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

  @Post('reconcile')
  @ApiOperation({
    summary: 'Orchestrate sequential reconciliation workflow',
    description:
      'Executes MT-01 (exact match) followed by MT-02 (fuzzy match) on remaining unmatched transactions. Returns combined results with comprehensive statistics.',
  })
  @ApiResponse({ status: 200, description: 'Reconciliation complete' })
  @ApiResponse({ status: 400, description: 'Invalid request payload' })
  @ApiResponse({ status: 500, description: 'Internal server error or service unavailable' })
  async reconcile(@Body() request: ReconciliationRequestDto): Promise<any> {
    return this.matchOrchestratorService.orchestrateReconciliation(request);
  }
}
