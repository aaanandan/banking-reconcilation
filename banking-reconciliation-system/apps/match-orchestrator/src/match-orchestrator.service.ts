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

  constructor(private readonly httpService: HttpService) {}

  /**
   * Call MT-01 Exact Match Service
   * @param bankTransactions - Array of bank transactions
   * @param ledgerTransactions - Array of ledger transactions
   * @returns MT-01 response with exact matches
   */
  async callMT01Exact(
    bankTransactions: BankTransactionDto[],
    ledgerTransactions: LedgerTransactionDto[],
  ): Promise<any> {
    this.logger.log(
      `Calling MT-01 Exact Match Service with ${bankTransactions.length} bank txns, ${ledgerTransactions.length} ledger txns`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.MT01_URL, {
          bankTransactions,
          ledgerTransactions,
        }),
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
   * @returns MT-02 response with fuzzy matches
   */
  async callMT02Fuzzy(
    bankTransactions: BankTransactionDto[],
    ledgerTransactions: LedgerTransactionDto[],
    fuzzyThresholds?: FuzzyThresholdsDto,
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
   * Orchestrate Sequential Matching Workflow
   *
   * Workflow:
   * 1. Call MT-01 (Exact Match) with all transactions
   * 2. Extract unmatched bank and ledger transactions
   * 3. Call MT-02 (Fuzzy Match) with remaining unmatched
   * 4. Combine results from both algorithms
   *
   * @param request - Reconciliation request with bank/ledger transactions
   * @returns Combined matches and metadata
   */
  async orchestrateReconciliation(request: ReconciliationRequestDto): Promise<any> {
    this.logger.log(
      `Starting reconciliation workflow with ${request.bankTransactions.length} bank txns, ${request.ledgerTransactions.length} ledger txns`,
    );

    // Step 1: Call MT-01 Exact Match
    this.logger.log('Step 1: Calling MT-01 Exact Match...');
    const mt01Response = await this.callMT01Exact(
      request.bankTransactions,
      request.ledgerTransactions,
    );

    const exactMatches = mt01Response.matches || [];
    this.logger.log(`MT-01 complete: ${exactMatches.length} exact matches found`);

    // Step 2: Extract unmatched transactions
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
      this.logger.log('Step 3: Calling MT-02 Fuzzy Match...');
      const mt02Response = await this.callMT02Fuzzy(
        unmatchedBankTransactions,
        availableLedgerTransactions,
        request.fuzzyThresholds,
      );

      fuzzyMatches = mt02Response.matches || [];
      this.logger.log(`MT-02 complete: ${fuzzyMatches.length} fuzzy matches found`);
    } else {
      this.logger.log('Step 3: Skipped MT-02 (no unmatched transactions remaining)');
    }

    // Step 4: Combine results and aggregate statistics
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

    return result;
  }
}
