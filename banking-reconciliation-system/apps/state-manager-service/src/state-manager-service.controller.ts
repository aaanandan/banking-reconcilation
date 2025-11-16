import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { StateManagerServiceService } from './state-manager-service.service';
import { TransactionDto } from '@app/shared';
import {
  CreateReconciliationDto,
  CreateReconciliationResponseDto,
  ReconciliationStateDto,
  UpdateReconciliationDto,
  UpdateReconciliationResponseDto,
} from './dto/reconciliation.dto';
import {
  BulkStoreTransactionsDto,
  BulkStoreTransactionsResponseDto,
  QueryTransactionsDto,
} from './dto/transaction.dto';

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

  // ═══════════════════════════════════════════════════════════
  // TRANSACTION BULK STORAGE ENDPOINTS (Step 18)
  // ═══════════════════════════════════════════════════════════

  @Post('transactions/bulk')
  @ApiOperation({ summary: 'Store normalized transactions in bulk (bank + ledger)' })
  @ApiResponse({
    status: 201,
    description: 'Transactions stored successfully',
    type: BulkStoreTransactionsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Reconciliation not found' })
  @ApiResponse({ status: 400, description: 'Invalid transaction data' })
  async bulkStoreTransactions(
    @Body() bulkDto: BulkStoreTransactionsDto,
  ): Promise<BulkStoreTransactionsResponseDto> {
    return this.stateManagerService.bulkStoreTransactions(bulkDto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Query transactions by various filters' })
  @ApiQuery({ name: 'reconciliationId', required: true, description: 'Reconciliation ID' })
  @ApiQuery({ name: 'source', required: false, enum: ['bank', 'ledger'], description: 'Filter by source' })
  @ApiQuery({ name: 'bankId', required: false, description: 'Filter by bank ID (multi-bank support)' })
  @ApiQuery({ name: 'status', required: false, enum: ['unmatched', 'staged', 'committed', 'manual'], description: 'Filter by status' })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
    type: [TransactionDto],
  })
  async queryTransactions(
    @Query() query: QueryTransactionsDto,
  ): Promise<TransactionDto[]> {
    return this.stateManagerService.queryTransactions(query);
  }
}
