import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StateManagerServiceService } from './state-manager-service.service';
import {
  CreateReconciliationDto,
  CreateReconciliationResponseDto,
  ReconciliationStateDto,
  UpdateReconciliationDto,
  UpdateReconciliationResponseDto,
} from './dto/reconciliation.dto';

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

  // ═══════════════════════════════════════════════════════════
  // RECONCILIATION CRUD ENDPOINTS (Step 16)
  // ═══════════════════════════════════════════════════════════

  @Post('reconciliation')
  @ApiOperation({ summary: 'Create a new reconciliation session' })
  @ApiResponse({
    status: 201,
    description: 'Reconciliation created successfully',
    type: CreateReconciliationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createReconciliation(
    @Body() createDto: CreateReconciliationDto,
  ): Promise<CreateReconciliationResponseDto> {
    return this.stateManagerService.createReconciliation(createDto);
  }

  @Get('reconciliation/:id')
  @ApiOperation({ summary: 'Get complete reconciliation state' })
  @ApiResponse({
    status: 200,
    description: 'Reconciliation state retrieved successfully',
    type: ReconciliationStateDto,
  })
  @ApiResponse({ status: 404, description: 'Reconciliation not found' })
  async getReconciliation(
    @Param('id') id: string,
  ): Promise<ReconciliationStateDto> {
    return this.stateManagerService.getReconciliation(id);
  }

  @Patch('reconciliation/:id')
  @ApiOperation({ summary: 'Update reconciliation state (progress, status, etc.)' })
  @ApiResponse({
    status: 200,
    description: 'Reconciliation updated successfully',
    type: UpdateReconciliationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Reconciliation not found' })
  async updateReconciliation(
    @Param('id') id: string,
    @Body() updateDto: UpdateReconciliationDto,
  ): Promise<UpdateReconciliationResponseDto> {
    return this.stateManagerService.updateReconciliation(id, updateDto);
  }

  @Delete('reconciliation/:id')
  @ApiOperation({ summary: 'Delete reconciliation session' })
  @ApiResponse({
    status: 200,
    description: 'Reconciliation deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Reconciliation not found' })
  async deleteReconciliation(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.stateManagerService.deleteReconciliation(id);
  }
}
