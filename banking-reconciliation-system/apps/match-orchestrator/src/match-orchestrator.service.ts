import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  BankTransactionDto,
  LedgerTransactionDto,
  FuzzyThresholdsDto,
  ReconciliationRequestDto,
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

    // Step 4: Combine results
    this.logger.log('Step 4: Combining results...');
    const allMatches = [...exactMatches, ...fuzzyMatches];

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
      workflow: 'MT-01 → MT-02',
      timestamp: new Date().toISOString(),
    };

    this.logger.log(
      `Reconciliation complete: ${result.totalMatches}/${result.totalBankTransactions} matched (${Math.round((result.totalMatches / result.totalBankTransactions) * 100)}%)`,
    );

    return result;
  }
}
