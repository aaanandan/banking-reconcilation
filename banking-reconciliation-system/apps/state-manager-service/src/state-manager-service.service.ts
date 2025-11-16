import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Reconciliation,
  BankFile,
  LedgerFile,
  Transaction,
  MatchCandidate,
} from '@app/shared';
import {
  CreateReconciliationDto,
  ReconciliationStateDto,
  UpdateReconciliationDto,
} from './dto/reconciliation.dto';

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
}
