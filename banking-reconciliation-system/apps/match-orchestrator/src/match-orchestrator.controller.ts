import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TenantContext } from '@app/shared';
import { MatchOrchestratorService } from './match-orchestrator.service';
import { ReconciliationRequestDto, ProgressUpdateDto } from './dto/reconciliation.dto';

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
      'Executes MT-01 (exact match) followed by MT-02 (fuzzy match) on remaining unmatched transactions. Returns combined results with comprehensive statistics. Progress can be tracked via GET /orchestrate/progress/:reconciliationId endpoint.',
  })
  @ApiResponse({ status: 200, description: 'Reconciliation complete' })
  @ApiResponse({ status: 400, description: 'Invalid request payload' })
  @ApiResponse({ status: 500, description: 'Internal server error or service unavailable' })
  async reconcile(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() request: ReconciliationRequestDto,
  ): Promise<any> {
    // Generate unique reconciliation ID for progress tracking
    const reconciliationId = `recon_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return this.matchOrchestratorService.orchestrateReconciliation(
      tenantContext,
      request,
      reconciliationId,
    );
  }

  @Get('progress/:reconciliationId')
  @ApiOperation({
    summary: 'Get progress status for a reconciliation',
    description:
      'Returns the current progress status of a running or completed reconciliation. Useful for polling-based progress tracking.',
  })
  @ApiParam({
    name: 'reconciliationId',
    description: 'Unique reconciliation ID returned from /reconcile endpoint',
    example: 'recon_1234567890_abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress status found',
    type: ProgressUpdateDto,
  })
  @ApiResponse({ status: 404, description: 'Reconciliation ID not found' })
  getProgress(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Param('reconciliationId') reconciliationId: string,
  ): ProgressUpdateDto {
    const progress = this.matchOrchestratorService.getProgress(tenantContext, reconciliationId);

    if (!progress) {
      throw new NotFoundException(
        `No progress found for reconciliation ID: ${reconciliationId}`,
      );
    }

    return progress;
  }
}
