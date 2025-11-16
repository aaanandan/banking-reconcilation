import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Reconciliation,
  BankFile,
  LedgerFile,
  Transaction,
  MatchCandidate,
  TransactionDto,
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
 */
@Injectable()
export class StateManagerServiceService {
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
   */
  async createReconciliation(dto: CreateReconciliationDto): Promise<{ reconciliationId: string }> {
    // Create ledger file entity
    const ledgerFile = this.ledgerFileRepo.create({
      filename: dto.ledgerFile.filename,
      totalRecords: dto.ledgerFile.totalRecords,
      filteredRecords: dto.ledgerFile.filteredRecords,
      excludedRecords: dto.ledgerFile.excludedRecords,
      columnMapping: dto.ledgerFile.columnMapping,
      earliestDate: new Date(dto.ledgerFile.dateRange.earliest),
      latestDate: new Date(dto.ledgerFile.dateRange.latest),
    });

    await this.ledgerFileRepo.save(ledgerFile);

    // Create bank file entities
    const bankFiles: BankFile[] = [];
    for (const bankFileDto of dto.bankFiles) {
      const bankFile = this.bankFileRepo.create({
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

      const savedBankFile = await this.bankFileRepo.save(bankFile);
      bankFiles.push(savedBankFile);
    }

    // Create reconciliation entity
    const reconciliation = this.reconciliationRepo.create({
      userId: dto.userId,
      bankFiles,
      ledgerFile,
      includeAllDates: dto.dateRange.includeAll,
      dateRangeFrom: dto.dateRange.fromDate ? new Date(dto.dateRange.fromDate) : null,
      dateRangeTo: dto.dateRange.toDate ? new Date(dto.dateRange.toDate) : null,
      dateRangeAnalysis: dto.dateRangeAnalysis,
      fieldProfile: dto.fieldProfile,
      status: 'in_progress',
      currentStep: 'created',
      completedSteps: [],
      totalTransactions: 0,
      matchedCount: 0,
      unmatchedCount: 0,
      manualCount: 0,
      convergenceRate: 0,
    });

    const savedReconciliation = await this.reconciliationRepo.save(reconciliation);

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

    if (dto.currentStep) {
      reconciliation.currentStep = dto.currentStep;
    }

    if (dto.completedSteps) {
      reconciliation.completedSteps = dto.completedSteps;
    }

    if (dto.totalTransactions !== undefined) {
      reconciliation.totalTransactions = dto.totalTransactions;
    }

    if (dto.matchedCount !== undefined) {
      reconciliation.matchedCount = dto.matchedCount;
    }

    if (dto.unmatchedCount !== undefined) {
      reconciliation.unmatchedCount = dto.unmatchedCount;
    }

    if (dto.manualCount !== undefined) {
      reconciliation.manualCount = dto.manualCount;
    }

    if (dto.convergenceRate !== undefined) {
      reconciliation.convergenceRate = dto.convergenceRate;
    }

    if (dto.fieldProfile) {
      reconciliation.fieldProfile = dto.fieldProfile;
    }

    if (dto.dateRange) {
      reconciliation.includeAllDates = dto.dateRange.includeAll;
      reconciliation.dateRangeFrom = dto.dateRange.fromDate ? new Date(dto.dateRange.fromDate) : null;
      reconciliation.dateRangeTo = dto.dateRange.toDate ? new Date(dto.dateRange.toDate) : null;
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
        bankId: txnDto.bankId || null,
        bankName: txnDto.bankName || null,
        date: new Date(txnDto.date),
        amount: txnDto.amount,
        description: txnDto.description,
        optional: txnDto.optional || null,
        metadata: txnDto.metadata || null,
        status: 'unmatched',
        matchedToId: null,
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
      totalTransactions: totalCount,
      unmatchedCount: unmatchedCount,
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
      ledgerFile: {
        fileId: reconciliation.ledgerFile.id,
        filename: reconciliation.ledgerFile.filename,
        uploadedAt: reconciliation.ledgerFile.uploadedAt,
        totalRecords: reconciliation.ledgerFile.totalRecords,
        filteredRecords: reconciliation.ledgerFile.filteredRecords,
        excludedRecords: reconciliation.ledgerFile.excludedRecords,
        columnMapping: reconciliation.ledgerFile.columnMapping,
        dateRange: {
          earliest: reconciliation.ledgerFile.earliestDate.toISOString().split('T')[0],
          latest: reconciliation.ledgerFile.latestDate.toISOString().split('T')[0],
        },
      },
      dateRange: {
        includeAll: reconciliation.includeAllDates,
        fromDate: reconciliation.dateRangeFrom ? reconciliation.dateRangeFrom.toISOString().split('T')[0] : undefined,
        toDate: reconciliation.dateRangeTo ? reconciliation.dateRangeTo.toISOString().split('T')[0] : undefined,
      },
      fieldProfile: reconciliation.fieldProfile,
      dateRangeAnalysis: reconciliation.dateRangeAnalysis,
      status: reconciliation.status,
      currentStep: reconciliation.currentStep,
      completedSteps: reconciliation.completedSteps,
      totalTransactions: reconciliation.totalTransactions,
      matchedCount: reconciliation.matchedCount,
      unmatchedCount: reconciliation.unmatchedCount,
      manualCount: reconciliation.manualCount,
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

    // Store snapshot in metadata field (in-memory for now, could be separate entity)
    const currentMetadata = reconciliation.metadata || {};
    const snapshots = currentMetadata.snapshots || [];

    const snapshot = {
      snapshotId,
      snapshotName: snapshotName || `Snapshot ${snapshots.length + 1}`,
      notes,
      snapshotTimestamp: snapshotTimestamp.toISOString(),
      state: {
        status: reconciliation.status,
        currentStep: reconciliation.currentStep,
        completedSteps: reconciliation.completedSteps,
        totalTransactions: reconciliation.totalTransactions,
        matchedCount: reconciliation.matchedCount,
        unmatchedCount: reconciliation.unmatchedCount,
        manualCount: reconciliation.manualCount,
        convergenceRate: reconciliation.convergenceRate,
        fieldProfile: reconciliation.fieldProfile,
      },
    };

    snapshots.push(snapshot);

    // Update reconciliation with new snapshot
    reconciliation.metadata = {
      ...currentMetadata,
      snapshots,
      lastSnapshotId: snapshotId,
      lastSnapshotTimestamp: snapshotTimestamp.toISOString(),
    };

    await this.reconciliationRepo.save(reconciliation);

    return {
      snapshotId,
      reconciliationId,
      snapshotTimestamp,
      status: reconciliation.status,
      currentStep: reconciliation.currentStep,
      totalTransactions: reconciliation.totalTransactions,
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

    // Find snapshot in metadata
    const metadata = reconciliation.metadata || {};
    const snapshots = metadata.snapshots || [];

    const snapshot = snapshots.find((s: any) => s.snapshotId === snapshotId);

    if (!snapshot) {
      throw new NotFoundException(`Snapshot ${snapshotId} not found for reconciliation ${reconciliationId}`);
    }

    // Restore state from snapshot
    const restoredState = snapshot.state;

    reconciliation.status = restoredState.status;
    reconciliation.currentStep = restoredState.currentStep;
    reconciliation.completedSteps = restoredState.completedSteps;
    reconciliation.totalTransactions = restoredState.totalTransactions;
    reconciliation.matchedCount = restoredState.matchedCount;
    reconciliation.unmatchedCount = restoredState.unmatchedCount;
    reconciliation.manualCount = restoredState.manualCount;
    reconciliation.convergenceRate = restoredState.convergenceRate;
    reconciliation.fieldProfile = restoredState.fieldProfile;

    // Update metadata to track that this was resumed from snapshot
    reconciliation.metadata = {
      ...metadata,
      resumedFromSnapshotId: snapshotId,
      resumedTimestamp: new Date().toISOString(),
    };

    await this.reconciliationRepo.save(reconciliation);

    return {
      success: true,
      reconciliationId,
      snapshotId,
      restoredState: {
        status: reconciliation.status,
        currentStep: reconciliation.currentStep,
        totalTransactions: reconciliation.totalTransactions,
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

    const metadata = reconciliation.metadata || {};
    const snapshots = metadata.snapshots || [];

    return snapshots.map((snapshot: any) => ({
      snapshotId: snapshot.snapshotId,
      snapshotName: snapshot.snapshotName,
      notes: snapshot.notes,
      snapshotTimestamp: snapshot.snapshotTimestamp,
      state: {
        status: snapshot.state.status,
        currentStep: snapshot.state.currentStep,
        totalTransactions: snapshot.state.totalTransactions,
        matchedCount: snapshot.state.matchedCount,
      },
    }));
  }
}
