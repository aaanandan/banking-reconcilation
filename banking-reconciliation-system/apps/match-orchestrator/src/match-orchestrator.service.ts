import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  BankTransactionDto,
  LedgerTransactionDto,
  FuzzyThresholdsDto,
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
}
