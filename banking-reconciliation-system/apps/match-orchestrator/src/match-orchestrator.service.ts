import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  BankTransactionDto,
  LedgerTransactionDto,
  FuzzyThresholdsDto,
  ReconciliationRequestDto,
  BankStatisticsDto,
  AlgorithmStatisticsDto,
  ProgressUpdateDto,
  ProgressStatus,
} from './dto/reconciliation.dto';

/**
 * Match Orchestrator Service
 *
 * Coordinates the sequential execution of matching algorithms:
 * 1. MT-01 (Exact Match) - finds exact matches first
 * 2. MT-02 (Fuzzy Match) - processes remaining unmatched transactions
 *
 * Aggregates results and provides unified statistics across all banks.
 */
@Injectable()
export class MatchOrchestratorService {
  private readonly logger = new Logger(MatchOrchestratorService.name);
  private readonly MT01_URL = 'http://localhost:3003/match/exact';
  private readonly MT02_URL = 'http://localhost:3004/match/fuzzy';

  // In-memory progress tracking store (reconciliationId -> ProgressUpdateDto)
  private progressStore: Map<string, ProgressUpdateDto> = new Map();

  constructor(private readonly httpService: HttpService) {}

  /**
   * Call MT-01 Exact Match Service
   * @param bankTransactions - Array of bank transactions
   * @param ledgerTransactions - Array of ledger transactions
   * @param fieldProfile - Optional field quality profile
   * @returns MT-01 response with exact matches
   */
  async callMT01Exact(
    bankTransactions: BankTransactionDto[],
    ledgerTransactions: LedgerTransactionDto[],
    fieldProfile?: any,
  ): Promise<any> {
    this.logger.log(
      `Calling MT-01 Exact Match Service with ${bankTransactions.length} bank txns, ${ledgerTransactions.length} ledger txns`,
    );

    try {
      const payload: any = {
        bankTransactions,
        ledgerTransactions,
      };

      if (fieldProfile) {
        payload.fieldProfile = fieldProfile;
        this.logger.log('Including field profile in MT-01 request');
      }

      const response = await firstValueFrom(
        this.httpService.post(this.MT01_URL, payload),
      );

      this.logger.log(
        `MT-01 returned ${response.data.totalMatches} exact matches`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(`MT-01 call failed: ${error.message}`);
      throw new Error(`Failed to call MT-01 service: ${error.message}`);
    }
  }

  /**
   * Call MT-02 Fuzzy Match Service
   * @param bankTransactions - Array of bank transactions (unmatched)
   * @param ledgerTransactions - Array of ledger transactions (available)
   * @param fuzzyThresholds - Optional fuzzy matching thresholds
   * @param fieldProfile - Optional field quality profile
   * @returns MT-02 response with fuzzy matches
   */
  async callMT02Fuzzy(
    bankTransactions: BankTransactionDto[],
    ledgerTransactions: LedgerTransactionDto[],
    fuzzyThresholds?: FuzzyThresholdsDto,
    fieldProfile?: any,
  ): Promise<any> {
    this.logger.log(
      `Calling MT-02 Fuzzy Match Service with ${bankTransactions.length} bank txns, ${ledgerTransactions.length} ledger txns`,
    );

    try {
      const payload: any = {
        bankTransactions,
        ledgerTransactions,
      };

      if (fuzzyThresholds) {
        payload.thresholds = fuzzyThresholds;
      }

      if (fieldProfile) {
        payload.fieldProfile = fieldProfile;
        this.logger.log('Including field profile in MT-02 request');
      }

      const response = await firstValueFrom(
        this.httpService.post(this.MT02_URL, payload),
      );

      this.logger.log(
        `MT-02 returned ${response.data.totalMatches} fuzzy matches`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(`MT-02 call failed: ${error.message}`);
      throw new Error(`Failed to call MT-02 service: ${error.message}`);
    }
  }

  /**
   * Calculate Statistics by Bank
   *
   * Aggregates match statistics for each bank:
   * - Total transactions per bank
   * - Exact matches per bank
   * - Fuzzy matches per bank
   * - Unmatched transactions per bank
   * - Match rate per bank
   *
   * @param bankTransactions - All bank transactions
   * @param exactMatches - Exact matches from MT-01
   * @param fuzzyMatches - Fuzzy matches from MT-02
   * @returns Array of bank statistics
   */
  private calculateBankStatistics(
    bankTransactions: BankTransactionDto[],
    exactMatches: any[],
    fuzzyMatches: any[],
  ): BankStatisticsDto[] {
    // Group transactions by bank
    const bankGroups = new Map<string, BankTransactionDto[]>();

    for (const txn of bankTransactions) {
      if (!bankGroups.has(txn.bankId)) {
        bankGroups.set(txn.bankId, []);
      }
      bankGroups.get(txn.bankId)!.push(txn);
    }

    // Calculate statistics for each bank
    const statistics: BankStatisticsDto[] = [];

    for (const [bankId, transactions] of bankGroups.entries()) {
      const bankName = transactions[0].bankName;
      const transactionIds = new Set(transactions.map((t) => t.id));

      // Count exact matches for this bank
      const exactCount = exactMatches.filter((m) => transactionIds.has(m.bankTxnId)).length;

      // Count fuzzy matches for this bank
      const fuzzyCount = fuzzyMatches.filter((m) => transactionIds.has(m.bankTxnId)).length;

      const totalMatches = exactCount + fuzzyCount;
      const unmatched = transactions.length - totalMatches;
      const matchRate = transactions.length > 0 ? totalMatches / transactions.length : 0;

      statistics.push({
        bankId,
        bankName,
        totalTransactions: transactions.length,
        exactMatches: exactCount,
        fuzzyMatches: fuzzyCount,
        totalMatches,
        unmatched,
        matchRate: Math.round(matchRate * 1000) / 1000, // Round to 3 decimals
      });
    }

    // Sort by bankId for consistent output
    return statistics.sort((a, b) => a.bankId.localeCompare(b.bankId));
  }

  /**
   * Calculate Statistics by Algorithm
   *
   * Aggregates performance metrics for each matching algorithm:
   * - MT-01 (Exact Match) performance
   * - MT-02 (Fuzzy Match) performance
   *
   * @param totalBankTransactions - Total number of bank transactions
   * @param exactMatches - Exact matches from MT-01
   * @param fuzzyMatches - Fuzzy matches from MT-02
   * @returns Array of algorithm statistics
   */
  private calculateAlgorithmStatistics(
    totalBankTransactions: number,
    exactMatches: any[],
    fuzzyMatches: any[],
  ): AlgorithmStatisticsDto[] {
    const mt01MatchRate =
      totalBankTransactions > 0 ? exactMatches.length / totalBankTransactions : 0;

    const mt02MatchRate =
      totalBankTransactions > 0 ? fuzzyMatches.length / totalBankTransactions : 0;

    return [
      {
        algorithm: 'MT-01',
        matchesFound: exactMatches.length,
        matchRate: Math.round(mt01MatchRate * 1000) / 1000, // Round to 3 decimals
      },
      {
        algorithm: 'MT-02',
        matchesFound: fuzzyMatches.length,
        matchRate: Math.round(mt02MatchRate * 1000) / 1000, // Round to 3 decimals
      },
    ];
  }

  /**
   * Update Progress Status
   * Stores progress update in memory for later retrieval
   *
   * @param reconciliationId - Unique ID for this reconciliation
   * @param status - Current progress status
   * @param currentStep - Current step number (1-based)
   * @param totalSteps - Total number of steps
   * @param message - Human-readable status message
   * @param additionalData - Optional additional data (exactMatchesFound, fuzzyMatchesFound, error)
   */
  private updateProgress(
    reconciliationId: string,
    status: ProgressStatus,
    currentStep: number,
    totalSteps: number,
    message: string,
    additionalData?: {
      exactMatchesFound?: number;
      fuzzyMatchesFound?: number;
      error?: string;
    },
  ): void {
    const progressPercentage = Math.round((currentStep / totalSteps) * 100);

    const progressUpdate: ProgressUpdateDto = {
      reconciliationId,
      status,
      currentStep,
      totalSteps,
      progressPercentage,
      message,
      timestamp: new Date().toISOString(),
      ...additionalData,
    };

    this.progressStore.set(reconciliationId, progressUpdate);
    this.logger.log(`Progress [${reconciliationId}]: ${message} (${progressPercentage}%)`);
  }

  /**
   * Get Progress Status
   * Retrieves current progress for a reconciliation
   *
   * @param reconciliationId - Unique ID for reconciliation
   * @returns Progress update or null if not found
   */
  getProgress(reconciliationId: string): ProgressUpdateDto | null {
    return this.progressStore.get(reconciliationId) || null;
  }

  /**
   * Clear Progress
   * Removes progress data after reconciliation is complete
   *
   * @param reconciliationId - Unique ID for reconciliation
   */
  clearProgress(reconciliationId: string): void {
    this.progressStore.delete(reconciliationId);
  }

  /**
   * Orchestrate Sequential Matching Workflow
   *
   * Workflow:
   * 1. Call MT-01 (Exact Match) with all transactions
   * 2. Extract unmatched bank and ledger transactions
   * 3. Call MT-02 (Fuzzy Match) with remaining unmatched
   * 4. Combine results from both algorithms
   *
   * @param request - Reconciliation request with bank/ledger transactions
   * @param reconciliationId - Optional unique ID for progress tracking
   * @returns Combined matches and metadata
   */
  async orchestrateReconciliation(
    request: ReconciliationRequestDto,
    reconciliationId?: string,
  ): Promise<any> {
    // Generate reconciliation ID if not provided
    const reconId = reconciliationId || `recon_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    this.logger.log(
      `Starting reconciliation workflow [${reconId}] with ${request.bankTransactions.length} bank txns, ${request.ledgerTransactions.length} ledger txns`,
    );

    const totalSteps = 4;

    try {
      // Step 1: Call MT-01 Exact Match
      this.updateProgress(
        reconId,
        ProgressStatus.CALLING_MT01,
        1,
        totalSteps,
        'Calling MT-01 Exact Match service...',
      );

      this.logger.log('Step 1: Calling MT-01 Exact Match...');
      const mt01Response = await this.callMT01Exact(
        request.bankTransactions,
        request.ledgerTransactions,
        request.fieldProfile,
      );

      const exactMatches = mt01Response.matches || [];
      this.logger.log(`MT-01 complete: ${exactMatches.length} exact matches found`);

      this.updateProgress(
        reconId,
        ProgressStatus.MT01_COMPLETE,
        1,
        totalSteps,
        `MT-01 complete: ${exactMatches.length} exact matches found`,
        { exactMatchesFound: exactMatches.length },
      );

      // Step 2: Extract unmatched transactions
      this.updateProgress(
        reconId,
        ProgressStatus.EXTRACTING_UNMATCHED,
        2,
        totalSteps,
        'Extracting unmatched transactions...',
        { exactMatchesFound: exactMatches.length },
      );

      this.logger.log('Step 2: Extracting unmatched transactions...');
      const matchedBankIds = new Set(exactMatches.map((m: any) => m.bankTxnId));
      const matchedLedgerIds = new Set(exactMatches.map((m: any) => m.ledgerTxnId));

      const unmatchedBankTransactions = request.bankTransactions.filter(
        (txn) => !matchedBankIds.has(txn.id),
      );

      const availableLedgerTransactions = request.ledgerTransactions.filter(
        (txn) => !matchedLedgerIds.has(txn.id),
      );

      this.logger.log(
        `Unmatched: ${unmatchedBankTransactions.length} bank txns, ${availableLedgerTransactions.length} ledger txns`,
      );

      // Step 3: Call MT-02 Fuzzy Match (if there are unmatched transactions)
      let fuzzyMatches = [];
      if (unmatchedBankTransactions.length > 0 && availableLedgerTransactions.length > 0) {
        this.updateProgress(
          reconId,
          ProgressStatus.CALLING_MT02,
          3,
          totalSteps,
          `Calling MT-02 Fuzzy Match service with ${unmatchedBankTransactions.length} unmatched transactions...`,
          { exactMatchesFound: exactMatches.length },
        );

        this.logger.log('Step 3: Calling MT-02 Fuzzy Match...');
        const mt02Response = await this.callMT02Fuzzy(
          unmatchedBankTransactions,
          availableLedgerTransactions,
          request.fuzzyThresholds,
          request.fieldProfile,
        );

        fuzzyMatches = mt02Response.matches || [];
        this.logger.log(`MT-02 complete: ${fuzzyMatches.length} fuzzy matches found`);

        this.updateProgress(
          reconId,
          ProgressStatus.MT02_COMPLETE,
          3,
          totalSteps,
          `MT-02 complete: ${fuzzyMatches.length} fuzzy matches found`,
          {
            exactMatchesFound: exactMatches.length,
            fuzzyMatchesFound: fuzzyMatches.length,
          },
        );
      } else {
        this.logger.log('Step 3: Skipped MT-02 (no unmatched transactions remaining)');
        this.updateProgress(
          reconId,
          ProgressStatus.MT02_COMPLETE,
          3,
          totalSteps,
          'MT-02 skipped (no unmatched transactions)',
          {
            exactMatchesFound: exactMatches.length,
            fuzzyMatchesFound: 0,
          },
        );
      }

      // Step 4: Combine results and aggregate statistics
      this.updateProgress(
        reconId,
        ProgressStatus.AGGREGATING_RESULTS,
        4,
        totalSteps,
        'Aggregating results and calculating statistics...',
        {
          exactMatchesFound: exactMatches.length,
          fuzzyMatchesFound: fuzzyMatches.length,
        },
      );

      this.logger.log('Step 4: Combining results and aggregating statistics...');
      const allMatches = [...exactMatches, ...fuzzyMatches];

      // Calculate aggregated statistics
      const bankStatistics = this.calculateBankStatistics(
        request.bankTransactions,
        exactMatches,
        fuzzyMatches,
      );

      const algorithmStatistics = this.calculateAlgorithmStatistics(
        request.bankTransactions.length,
        exactMatches,
        fuzzyMatches,
      );

      const overallMatchRate =
        request.bankTransactions.length > 0
          ? allMatches.length / request.bankTransactions.length
          : 0;

      const result = {
        reconciliationId: reconId,
        matches: allMatches,
        exactMatches,
        fuzzyMatches,
        totalMatches: allMatches.length,
        exactMatchCount: exactMatches.length,
        fuzzyMatchCount: fuzzyMatches.length,
        totalBankTransactions: request.bankTransactions.length,
        totalLedgerTransactions: request.ledgerTransactions.length,
        unmatched: request.bankTransactions.length - allMatches.length,
        overallMatchRate: Math.round(overallMatchRate * 1000) / 1000,
        bankStatistics,
        algorithmStatistics,
        workflow: 'MT-01 → MT-02',
        timestamp: new Date().toISOString(),
      };

      this.logger.log(
        `Reconciliation complete: ${result.totalMatches}/${result.totalBankTransactions} matched (${Math.round(overallMatchRate * 100)}%)`,
      );
      this.logger.log(`Bank statistics calculated for ${bankStatistics.length} banks`);
      this.logger.log(`Algorithm statistics: MT-01=${exactMatches.length}, MT-02=${fuzzyMatches.length}`);

      // Mark as complete
      this.updateProgress(
        reconId,
        ProgressStatus.COMPLETE,
        4,
        totalSteps,
        `Reconciliation complete: ${result.totalMatches}/${result.totalBankTransactions} matched (${Math.round(overallMatchRate * 100)}%)`,
        {
          exactMatchesFound: exactMatches.length,
          fuzzyMatchesFound: fuzzyMatches.length,
        },
      );

      return result;
    } catch (error) {
      this.logger.error(`Reconciliation failed: ${error.message}`, error.stack);

      // Mark as error
      this.updateProgress(
        reconId,
        ProgressStatus.ERROR,
        0,
        totalSteps,
        `Reconciliation failed: ${error.message}`,
        { error: error.message },
      );

      throw error;
    }
  }
}
