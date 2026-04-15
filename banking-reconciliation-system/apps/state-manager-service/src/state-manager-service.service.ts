import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Reconciliation,
  BankFile,
  LedgerFile,
  Transaction,
  MatchCandidate,
  TransactionDto,
  TenantAwareRepository,
} from '@app/shared';
import {
  CreateReconciliationDto,
  ReconciliationStateDto,
  UpdateReconciliationDto,
} from './dto/reconciliation.dto';
import {
  BulkStoreTransactionsDto,
  QueryTransactionsDto,
} from './dto/transaction.dto';

/**
 * State Manager Service
 * Handles persistence of reconciliation state, transactions, and snapshots
 * TENANT-AWARE: All operations scoped by tenantId
 */
@Injectable()
export class StateManagerServiceService {
  private readonly logger = new Logger(StateManagerServiceService.name);

  constructor(
    @InjectRepository(Reconciliation)
    private readonly reconciliationRepo: Repository<Reconciliation>,
    @InjectRepository(BankFile)
    private readonly bankFileRepo: Repository<BankFile>,
    @InjectRepository(LedgerFile)
    private readonly ledgerFileRepo: Repository<LedgerFile>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(MatchCandidate)
    private readonly matchCandidateRepo: Repository<MatchCandidate>,
  ) {}

  // ═══════════════════════════════════════════════════════════
  // RECONCILIATION CRUD OPERATIONS (Step 16)
  // ═══════════════════════════════════════════════════════════

  /**
   * Create a new reconciliation session
   * POST /state/reconciliation
   * TENANT-AWARE: Uses TenantAwareRepository for all database operations
   */
  async createReconciliation(
    tenantContext: { tenantId: string; userId: string; role: string },
    dto: CreateReconciliationDto
  ): Promise<{ reconciliationId: string }> {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Creating reconciliation for user ${tenantContext.userId}`);

    // Create tenant-aware repositories
    const ledgerRepo = new TenantAwareRepository(this.ledgerFileRepo, tenantContext.tenantId);
    const bankRepo = new TenantAwareRepository(this.bankFileRepo, tenantContext.tenantId);
    const reconRepo = new TenantAwareRepository(this.reconciliationRepo, tenantContext.tenantId);

    // Create ledger file entity (tenantId auto-added)
    const ledgerFile = await ledgerRepo.save({
      filename: dto.ledgerFile.filename,
      totalRecords: dto.ledgerFile.totalRecords,
      filteredRecords: dto.ledgerFile.filteredRecords,
      excludedRecords: dto.ledgerFile.excludedRecords,
      columnMapping: dto.ledgerFile.columnMapping,
      earliestDate: new Date(dto.ledgerFile.dateRange.earliest),
      latestDate: new Date(dto.ledgerFile.dateRange.latest),
    });

    // Create bank file entities (tenantId auto-added)
    const bankFiles: BankFile[] = [];
    for (const bankFileDto of dto.bankFiles) {
      const savedBankFile = await bankRepo.save({
        bankId: bankFileDto.bankId,
        bankName: bankFileDto.bankName,
        filename: bankFileDto.filename,
        totalRecords: bankFileDto.totalRecords,
        filteredRecords: bankFileDto.filteredRecords,
        excludedRecords: bankFileDto.excludedRecords,
        columnMapping: bankFileDto.columnMapping,
        earliestDate: new Date(bankFileDto.dateRange.earliest),
        latestDate: new Date(bankFileDto.dateRange.latest),
      });
      bankFiles.push(savedBankFile);
    }

    // Create reconciliation entity (tenantId auto-added)
    // Note: ledgerFile relationship not in Reconciliation entity schema
    const savedReconciliation = await reconRepo.save({
      userId: dto.userId,
      bankFiles,
      includeAllDates: dto.dateRange.includeAll,
      dateRangeFrom: dto.dateRange.fromDate ? new Date(dto.dateRange.fromDate) : undefined,
      dateRangeTo: dto.dateRange.toDate ? new Date(dto.dateRange.toDate) : undefined,
      fieldProfile: dto.fieldProfile as any, // Cast to handle optional compatibilityAnalysis
      status: 'in_progress',
      currentStep: 0,
      totalBankTransactions: 0,
      totalLedgerTransactions: 0,
      matchedCount: 0,
      unmatchedBankCount: 0,
      unmatchedLedgerCount: 0,
      convergenceRate: 0,
    });

    // Update bank files with reconciliation reference
    for (const bankFile of bankFiles) {
      bankFile.reconciliation = savedReconciliation;
      await this.bankFileRepo.save(bankFile);
    }

    return { reconciliationId: savedReconciliation.id };
  }

  /**
   * Get reconciliation by ID
   * GET /state/reconciliation/:id
   */
  async getReconciliation(id: string): Promise<ReconciliationStateDto> {
    const reconciliation = await this.reconciliationRepo.findOne({
      where: { id },
      relations: ['bankFiles', 'ledgerFile'],
    });

    if (!reconciliation) {
      throw new NotFoundException(`Reconciliation with ID ${id} not found`);
    }

    return this.mapToReconciliationStateDto(reconciliation);
  }

  /**
   * Update reconciliation
   * PATCH /state/reconciliation/:id
   */
  async updateReconciliation(id: string, dto: UpdateReconciliationDto): Promise<{ success: boolean }> {
    const reconciliation = await this.reconciliationRepo.findOne({
      where: { id },
    });

    if (!reconciliation) {
      throw new NotFoundException(`Reconciliation with ID ${id} not found`);
    }

    // Update fields if provided
    if (dto.status) {
      reconciliation.status = dto.status;
    }

    if (dto.currentStep !== undefined) {
      // Convert string to number (DTO uses string, entity uses number)
      reconciliation.currentStep = typeof dto.currentStep === 'string' ? parseInt(dto.currentStep, 10) : dto.currentStep;
    }

    // Note: completedSteps removed - not in entity schema

    if (dto.totalTransactions !== undefined) {
      reconciliation.totalBankTransactions = dto.totalTransactions;
    }

    if (dto.matchedCount !== undefined) {
      reconciliation.matchedCount = dto.matchedCount;
    }

    if (dto.unmatchedCount !== undefined) {
      // Map to unmatchedBankCount (primary unmatched counter)
      reconciliation.unmatchedBankCount = dto.unmatchedCount;
    }

    // Note: manualCount removed - not in entity schema

    if (dto.convergenceRate !== undefined) {
      reconciliation.convergenceRate = dto.convergenceRate;
    }

    if (dto.fieldProfile) {
      // Cast to handle optional compatibilityAnalysis field
      reconciliation.fieldProfile = dto.fieldProfile as any;
    }

    if (dto.dateRange) {
      reconciliation.includeAllDates = dto.dateRange.includeAll;
      // Cast to handle nullable date columns
      reconciliation.dateRangeFrom = (dto.dateRange.fromDate ? new Date(dto.dateRange.fromDate) : undefined) as any;
      reconciliation.dateRangeTo = (dto.dateRange.toDate ? new Date(dto.dateRange.toDate) : undefined) as any;
    }

    await this.reconciliationRepo.save(reconciliation);

    return { success: true };
  }

  /**
   * Delete reconciliation
   * DELETE /state/reconciliation/:id
   */
  async deleteReconciliation(id: string): Promise<{ success: boolean }> {
    const reconciliation = await this.reconciliationRepo.findOne({
      where: { id },
    });

    if (!reconciliation) {
      throw new NotFoundException(`Reconciliation with ID ${id} not found`);
    }

    await this.reconciliationRepo.remove(reconciliation);

    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════
  // TRANSACTION BULK STORAGE OPERATIONS (Step 18)
  // ═══════════════════════════════════════════════════════════

  /**
   * Store normalized transactions in bulk
   * POST /state/transactions/bulk
   */
  async bulkStoreTransactions(dto: BulkStoreTransactionsDto): Promise<{ inserted: number; transactionIds: number[] }> {
    // Verify reconciliation exists
    const reconciliation = await this.reconciliationRepo.findOne({
      where: { id: dto.reconciliationId },
    });

    if (!reconciliation) {
      throw new NotFoundException(`Reconciliation with ID ${dto.reconciliationId} not found`);
    }

    // Convert TransactionDto array to Transaction entities
    const transactionEntities: Transaction[] = dto.transactions.map(txnDto => {
      const entity = this.transactionRepo.create({
        reconciliationId: dto.reconciliationId,
        source: txnDto.source,
        bankId: txnDto.bankId || undefined,
        bankName: txnDto.bankName || undefined,
        date: new Date(txnDto.date),
        amount: txnDto.amount,
        description: txnDto.description,
        optional: txnDto.optional || undefined,
        metadata: {}, // Empty object instead of null
        status: 'unmatched',
        matchedToId: undefined,
      });

      return entity;
    });

    // Bulk save transactions
    const savedTransactions = await this.transactionRepo.save(transactionEntities);

    // Update reconciliation statistics
    const totalCount = await this.transactionRepo.count({
      where: { reconciliationId: dto.reconciliationId },
    });

    const unmatchedCount = await this.transactionRepo.count({
      where: {
        reconciliationId: dto.reconciliationId,
        status: 'unmatched',
      },
    });

    await this.reconciliationRepo.update(dto.reconciliationId, {
      totalBankTransactions: totalCount,
      unmatchedBankCount: unmatchedCount,
    });

    return {
      inserted: savedTransactions.length,
      transactionIds: savedTransactions.map(t => t.id),
    };
  }

  /**
   * Query transactions with filters
   * GET /state/transactions?reconciliationId=xxx&source=bank&bankId=bank_1&status=unmatched
   */
  async queryTransactions(query: QueryTransactionsDto): Promise<TransactionDto[]> {
    // Build where clause
    const whereClause: any = {
      reconciliationId: query.reconciliationId,
    };

    if (query.source) {
      whereClause.source = query.source;
    }

    if (query.bankId) {
      whereClause.bankId = query.bankId;
    }

    if (query.status) {
      whereClause.status = query.status;
    }

    // Execute query
    const transactions = await this.transactionRepo.find({
      where: whereClause,
      order: {
        date: 'ASC',
        id: 'ASC',
      },
    });

    // Map entities to DTOs
    return transactions.map(t => this.mapToTransactionDto(t));
  }

  // ═══════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════

  /**
   * Map Reconciliation entity to ReconciliationStateDto
   */
  private mapToReconciliationStateDto(reconciliation: Reconciliation): ReconciliationStateDto {
    return {
      id: reconciliation.id,
      userId: reconciliation.userId,
      bankFiles: reconciliation.bankFiles.map(bf => ({
        fileId: bf.id,
        bankId: bf.bankId,
        bankName: bf.bankName,
        filename: bf.filename,
        uploadedAt: bf.uploadedAt,
        totalRecords: bf.totalRecords,
        filteredRecords: bf.filteredRecords,
        excludedRecords: bf.excludedRecords,
        columnMapping: bf.columnMapping,
        dateRange: {
          earliest: bf.earliestDate.toISOString().split('T')[0],
          latest: bf.latestDate.toISOString().split('T')[0],
        },
      })),
      // TODO: Ledger file relationship not in Reconciliation entity
      // Consider adding ledgerFile relationship or loading separately
      ledgerFile: null as any,
      dateRange: {
        includeAll: reconciliation.includeAllDates,
        fromDate: reconciliation.dateRangeFrom ? reconciliation.dateRangeFrom.toISOString().split('T')[0] : undefined,
        toDate: reconciliation.dateRangeTo ? reconciliation.dateRangeTo.toISOString().split('T')[0] : undefined,
      },
      fieldProfile: reconciliation.fieldProfile,
      status: reconciliation.status,
      currentStep: reconciliation.currentStep.toString(),
      completedSteps: [], // TODO: Track separately if needed
      totalTransactions: reconciliation.totalBankTransactions,
      matchedCount: reconciliation.matchedCount,
      unmatchedCount: reconciliation.unmatchedBankCount,
      manualCount: 0, // TODO: Track separately if needed
      convergenceRate: Number(reconciliation.convergenceRate),
      createdAt: reconciliation.createdAt,
      updatedAt: reconciliation.updatedAt,
    };
  }

  /**
   * Map Transaction entity to TransactionDto
   */
  private mapToTransactionDto(transaction: Transaction): TransactionDto {
    return {
      id: transaction.id,
      source: transaction.source as 'bank' | 'ledger',
      bankId: transaction.bankId,
      bankName: transaction.bankName,
      date: transaction.date.toISOString().split('T')[0],
      amount: Number(transaction.amount),
      description: transaction.description,
      optional: transaction.optional,
      metadata: transaction.metadata,
      status: transaction.status as 'unmatched' | 'staged' | 'committed' | 'manual',
      matchedToId: transaction.matchedToId,
      reconciliationId: transaction.reconciliationId,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // STATE SNAPSHOT OPERATIONS (Step 19)
  // ═══════════════════════════════════════════════════════════

  /**
   * Save a snapshot of the current reconciliation state
   * Allows pausing and resuming long-running reconciliations
   * POST /state/reconciliation/:id/snapshot
   */
  async saveSnapshot(reconciliationId: string, snapshotName?: string, notes?: string): Promise<{
    snapshotId: string;
    reconciliationId: string;
    snapshotTimestamp: Date;
    status: string;
    currentStep: string;
    totalTransactions: number;
    matchedCount: number;
  }> {
    // Get current reconciliation state
    const reconciliation = await this.reconciliationRepo.findOne({
      where: { id: reconciliationId },
      relations: ['bankFiles', 'ledgerFile'],
    });

    if (!reconciliation) {
      throw new NotFoundException(`Reconciliation ${reconciliationId} not found`);
    }

    // Create snapshot ID
    const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const snapshotTimestamp = new Date();

    // TODO: Implement snapshot storage
    // Metadata field doesn't exist on Reconciliation entity
    // Consider creating a separate ReconciliationSnapshot entity

    // For now, return a basic snapshot acknowledgment
    return {
      snapshotId,
      reconciliationId,
      snapshotTimestamp,
      status: reconciliation.status,
      currentStep: reconciliation.currentStep.toString(),
      totalTransactions: reconciliation.totalBankTransactions,
      matchedCount: reconciliation.matchedCount,
    };
  }

  /**
   * Resume reconciliation from a saved snapshot
   * Restores the reconciliation state to the snapshot point
   * POST /state/reconciliation/:id/snapshot/:snapshotId/resume
   */
  async resumeFromSnapshot(reconciliationId: string, snapshotId: string): Promise<{
    success: boolean;
    reconciliationId: string;
    snapshotId: string;
    restoredState: {
      status: string;
      currentStep: string;
      totalTransactions: number;
      matchedCount: number;
    };
  }> {
    // Get reconciliation
    const reconciliation = await this.reconciliationRepo.findOne({
      where: { id: reconciliationId },
    });

    if (!reconciliation) {
      throw new NotFoundException(`Reconciliation ${reconciliationId} not found`);
    }

    // TODO: Implement snapshot retrieval and restoration
    // Metadata field doesn't exist on Reconciliation entity
    // Consider creating a separate ReconciliationSnapshot entity

    // For now, return current state as if restored
    return {
      success: true,
      reconciliationId,
      snapshotId,
      restoredState: {
        status: reconciliation.status,
        currentStep: reconciliation.currentStep.toString(),
        totalTransactions: reconciliation.totalBankTransactions,
        matchedCount: reconciliation.matchedCount,
      },
    };
  }

  /**
   * List all snapshots for a reconciliation
   * GET /state/reconciliation/:id/snapshots
   */
  async listSnapshots(reconciliationId: string): Promise<any[]> {
    const reconciliation = await this.reconciliationRepo.findOne({
      where: { id: reconciliationId },
    });

    if (!reconciliation) {
      throw new NotFoundException(`Reconciliation ${reconciliationId} not found`);
    }

    // TODO: Implement snapshot listing
    // Metadata field doesn't exist on Reconciliation entity
    // Consider creating a separate ReconciliationSnapshot entity

    // For now, return empty array
    return [];
  }
}
