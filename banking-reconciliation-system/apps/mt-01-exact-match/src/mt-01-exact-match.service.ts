import { Injectable } from '@nestjs/common';
import { TransactionDto } from '@app/shared';
import { MatchCandidateDto, MatchRequestDto, MatchResponseDto } from './dto/match.dto';

/**
 * MT-01 Exact Match Service
 * Implements exact matching algorithm for transaction reconciliation
 * Matches on: date, amount, description (all must be identical)
 */
@Injectable()
export class Mt01ExactMatchService {
  /**
   * Find exact matches between bank and ledger transactions
   * Step 23-24: Exact match algorithm with multi-bank support
   *
   * Algorithm:
   * 1. For each bank transaction (from any bank)
   * 2. Search through all ledger transactions
   * 3. Match if ALL fields are identical:
   *    - Date (exact)
   *    - Amount (exact)
   *    - Description (case-insensitive, trimmed)
   * 4. Return match with 100% confidence
   *
   * Multi-bank support (Step 24):
   * - Bank transactions include bankId/bankName metadata
   * - Ledger transactions have no bankId (consolidated ledger)
   * - Matches preserve bankId/bankName for traceability
   * - Each bank transaction matched independently
   */
  findExactMatches(request: MatchRequestDto): MatchResponseDto {
    const matches: MatchCandidateDto[] = [];
    const { bankTransactions, ledgerTransactions } = request;

    // Track which ledger transactions have been matched to avoid duplicates
    const matchedLedgerIds = new Set<number>();

    for (const bankTxn of bankTransactions) {
      for (const ledgerTxn of ledgerTransactions) {
        // Skip if ledger transaction already matched
        if (matchedLedgerIds.has(ledgerTxn.id)) {
          continue;
        }

        if (this.isExactMatch(bankTxn, ledgerTxn)) {
          matches.push({
            bankTxnId: bankTxn.id,
            ledgerTxnId: ledgerTxn.id,
            confidence: 1.0,
            reasoning: 'Exact match on date, amount, and description',
            algorithm: 'MT-01',
            // Multi-bank support (Step 24): Include bank metadata
            bankId: bankTxn.bankId,
            bankName: bankTxn.bankName,
          });

          // Mark this ledger transaction as matched (1:1 matching)
          matchedLedgerIds.add(ledgerTxn.id);

          // Break inner loop - move to next bank transaction
          break;
        }
      }
    }

    return {
      matches,
      totalMatches: matches.length,
      algorithm: 'MT-01-Exact',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if two transactions are an exact match
   * Private helper method
   */
  private isExactMatch(bank: TransactionDto, ledger: TransactionDto): boolean {
    // Date must match exactly
    if (bank.date !== ledger.date) {
      return false;
    }

    // Amount must match exactly
    if (bank.amount !== ledger.amount) {
      return false;
    }

    // Description must match (case-insensitive, trimmed)
    const bankDesc = bank.description.toLowerCase().trim();
    const ledgerDesc = ledger.description.toLowerCase().trim();

    if (bankDesc !== ledgerDesc) {
      return false;
    }

    // All criteria met - exact match!
    return true;
  }
}
