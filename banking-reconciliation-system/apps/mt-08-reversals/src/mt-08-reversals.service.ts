import { Injectable } from '@nestjs/common';
import { TransactionDto } from '@app/shared';
import {
  ReversalPairDto,
  ReversalPairingRequestDto,
  ReversalPairingResponseDto,
} from './dto/pairing.dto';

/**
 * MT-08 Reversals & Corrections Service
 *
 * STEP 60.2: Exception Handler - Identifies reversals that cancel each other
 *
 * Purpose:
 * - Identify bank reversals/corrections that cancel each other out
 * - These pairs net to zero and don't need ledger matches
 * - Common in error corrections and banking adjustments
 *
 * Logic:
 * 1. Run AFTER MT-01 & MT-02 on unmatched bank transactions
 * 2. Find pairs:
 *    - Opposite amounts (+/- same value)
 *    - Within ±3 days
 *    - Related descriptions (reversal, correction, cancel, void keywords)
 * 3. Mark both as: status: 'classified', type: 'self_cancelling'
 * 4. Link the pair together
 *
 * Result:
 * - Both transactions removed from "unknown" pool
 * - User sees: "Reversal pair: $1,000 payment + $1,000 reversal = $0 (no ledger entry needed)"
 * - Explains why no ledger match exists
 */
@Injectable()
export class Mt08ReversalsService {
  // Reversal detection keywords
  private readonly REVERSAL_KEYWORDS = [
    'reversal',
    'reverse',
    'correction',
    'corrected',
    'cancel',
    'cancelled',
    'canceled',
    'void',
    'voided',
    'refund',
    'return',
    'chargeback',
    'error',
    'mistake',
    'undo',
  ];

  // Timing threshold
  private readonly MAX_DAYS_BETWEEN = 3; // Within 3 days

  /**
   * Find reversal pairs
   *
   * Algorithm:
   * 1. For each transaction, look for opposite amount
   * 2. Check date proximity (within 3 days)
   * 3. Check for reversal keywords
   * 4. Return pairs
   */
  findReversalPairs(
    request: ReversalPairingRequestDto,
  ): ReversalPairingResponseDto {
    const pairs: ReversalPairDto[] = [];
    const matched = new Set<number>();

    const transactions = request.bankTransactions;

    for (let i = 0; i < transactions.length; i++) {
      const txn1 = transactions[i];

      // Skip if already matched
      if (matched.has(txn1.id)) continue;

      // Look for opposite amount
      for (let j = i + 1; j < transactions.length; j++) {
        const txn2 = transactions[j];

        // Skip if already matched
        if (matched.has(txn2.id)) continue;

        // Check if they form a reversal pair
        if (this.isReversalPair(txn1, txn2)) {
          const pair = this.createPair(txn1, txn2);
          pairs.push(pair);

          // Mark both as matched
          matched.add(txn1.id);
          matched.add(txn2.id);

          break; // Move to next transaction
        }
      }
    }

    return {
      pairs,
      totalPairs: pairs.length,
      totalTransactions: matched.size,
      algorithm: 'MT-08-Reversals',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if two transactions form a reversal pair
   */
  private isReversalPair(
    txn1: TransactionDto,
    txn2: TransactionDto,
  ): boolean {
    // 0. Check if from same bank (reversals must be within same bank)
    if (txn1.bankId && txn2.bankId && txn1.bankId !== txn2.bankId) {
      return false;
    }

    // 1. Check if amounts are opposite
    if (Math.abs(txn1.amount + txn2.amount) > 0.01) {
      // Not exact opposites
      return false;
    }

    // 2. Check date proximity (within 3 days)
    const date1 = new Date(txn1.date);
    const date2 = new Date(txn2.date);
    const daysDiff =
      Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > this.MAX_DAYS_BETWEEN) {
      return false;
    }

    // 3. Check for reversal keywords in either description
    const hasReversalKeywords =
      this.hasReversalKeywords(txn1.description) ||
      this.hasReversalKeywords(txn2.description);

    return hasReversalKeywords;
  }

  /**
   * Check if description contains reversal keywords
   */
  private hasReversalKeywords(description: string): boolean {
    const lowerDesc = description.toLowerCase();
    return this.REVERSAL_KEYWORDS.some((keyword) =>
      lowerDesc.includes(keyword),
    );
  }

  /**
   * Create a reversal pair result
   */
  private createPair(
    txn1: TransactionDto,
    txn2: TransactionDto,
  ): ReversalPairDto {
    // Determine which is original and which is reversal
    let original: TransactionDto;
    let reversal: TransactionDto;

    const date1 = new Date(txn1.date);
    const date2 = new Date(txn2.date);

    // Original is usually earlier
    if (date1 <= date2) {
      original = txn1;
      reversal = txn2;
    } else {
      original = txn2;
      reversal = txn1;
    }

    const daysBetween =
      Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);

    const netAmount = Math.abs(original.amount + reversal.amount);

    const confidence = netAmount < 0.01 ? 0.95 : 0.85; // High confidence if perfect match

    const reasoning =
      `Reversal pair detected: Original $${original.amount} (${original.date}) ` +
      `reversed by $${reversal.amount} (${reversal.date}). ` +
      `Net: $${netAmount.toFixed(2)}. ${daysBetween.toFixed(0)} day(s) apart.`;

    return {
      originalTxnId: original.id,
      reversalTxnId: reversal.id,
      originalAmount: original.amount,
      reversalAmount: reversal.amount,
      netAmount: Math.round(netAmount * 100) / 100,
      confidence,
      reasoning,
      daysBetween: Math.round(daysBetween),
      algorithm: 'MT-08',
      bankId: original.bankId,
    };
  }
}
