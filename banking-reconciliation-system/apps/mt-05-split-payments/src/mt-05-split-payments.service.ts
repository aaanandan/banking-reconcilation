import { Injectable, Logger } from '@nestjs/common';
import { TransactionDto } from '@app/shared';
import {
  SplitPaymentMatchDto,
  SplitPaymentMatchRequestDto,
  SplitPaymentMatchResponseDto,
} from './dto/match.dto';

/**
 * MT-05 Split Payments Service
 *
 * STEP 56: Complex Matcher - Multiple bank transactions → single ledger entry
 *
 * Purpose:
 * - Match multiple bank transactions to a single ledger entry
 * - Common scenario: One invoice paid in multiple installments
 * - Example: Bank $500 + $500 → Ledger $1,000
 *
 * Logic:
 * 1. Group bank transactions by:
 *    - Same or similar description
 *    - Same date ±1 day (configurable)
 *    - Optionally same payer/entity
 * 2. For each group (2 to maxSplitSize transactions):
 *    - Calculate sum of bank amounts
 *    - Check if sum matches any ledger amount (±1% tolerance)
 * 3. Return consolidated matches
 * 4. Limit to max 5 transactions per group (configurable)
 *
 * Result:
 * - User sees: "3 bank payments ($500 + $500 + $500) → Ledger $1,500"
 * - Reduces unmatched transactions
 * - Handles partial payment scenarios
 */
@Injectable()
export class Mt05SplitPaymentsService {
  private readonly logger = new Logger(Mt05SplitPaymentsService.name);

  // Default configuration
  private readonly DEFAULT_MAX_SPLIT_SIZE = 5;
  private readonly DEFAULT_AMOUNT_TOLERANCE = 0.01; // 1%
  private readonly DEFAULT_DATE_TOLERANCE = 1; // 1 day
  private readonly MIN_DESCRIPTION_SIMILARITY = 0.6; // 60% similarity

  /**
   * Find split payment matches
   *
   * Algorithm:
   * 1. Group bank transactions by similarity
   * 2. For each group, calculate sum
   * 3. Match sum to ledger amounts
   * 4. Return matches with confidence scores
   */
  findSplitPayments(
    tenantContext: { tenantId: string; userId: string; role: string },
    request: SplitPaymentMatchRequestDto,
  ): SplitPaymentMatchResponseDto {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Running MT-05 matching algorithm`);

    const maxSplitSize = request.maxSplitSize ?? this.DEFAULT_MAX_SPLIT_SIZE;
    const amountTolerance =
      request.amountTolerance ?? this.DEFAULT_AMOUNT_TOLERANCE;
    const dateTolerance = request.dateTolerance ?? this.DEFAULT_DATE_TOLERANCE;

    const matches: SplitPaymentMatchDto[] = [];
    const matchedBankIds = new Set<number>();
    const matchedLedgerIds = new Set<number>();

    // Group bank transactions by potential splits
    const groups = this.groupBankTransactions(
      request.bankTransactions,
      dateTolerance,
      maxSplitSize,
    );

    // For each group, try to match to ledger
    for (const group of groups) {
      // Skip if any transaction already matched
      if (group.some((txn) => matchedBankIds.has(txn.id))) {
        continue;
      }

      // Calculate group sum
      const groupSum = group.reduce((sum, txn) => sum + txn.amount, 0);

      // Try to match to ledger transactions
      for (const ledgerTxn of request.ledgerTransactions) {
        // Skip if already matched
        if (matchedLedgerIds.has(ledgerTxn.id)) {
          continue;
        }

        // Check if sum matches ledger amount
        const difference = Math.abs(groupSum - ledgerTxn.amount);
        const tolerance = Math.abs(ledgerTxn.amount) * amountTolerance;

        if (difference <= tolerance) {
          // Found a match!
          const match = this.createMatch(
            group,
            ledgerTxn,
            groupSum,
            difference,
            amountTolerance,
          );

          matches.push(match);

          // Mark as matched
          group.forEach((txn) => matchedBankIds.add(txn.id));
          matchedLedgerIds.add(ledgerTxn.id);

          break; // Move to next group
        }
      }
    }

    return {
      matches,
      totalMatches: matches.length,
      totalBankTransactions: matchedBankIds.size,
      totalLedgerTransactions: matchedLedgerIds.size,
      algorithm: 'MT-05-Split-Payments',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Group bank transactions by potential split criteria
   */
  private groupBankTransactions(
    transactions: TransactionDto[],
    dateTolerance: number,
    maxSplitSize: number,
  ): TransactionDto[][] {
    const groups: TransactionDto[][] = [];

    // Sort by date first
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Try to find groups of 2 to maxSplitSize transactions
    for (let size = 2; size <= maxSplitSize && size <= sorted.length; size++) {
      // Use sliding window to find potential groups
      for (let i = 0; i <= sorted.length - size; i++) {
        const potentialGroup = sorted.slice(i, i + size);

        // Check if this is a valid group
        if (this.isValidGroup(potentialGroup, dateTolerance)) {
          groups.push(potentialGroup);
        }
      }
    }

    return groups;
  }

  /**
   * Check if a group of transactions is valid for split matching
   */
  private isValidGroup(
    group: TransactionDto[],
    dateTolerance: number,
  ): boolean {
    if (group.length < 2) return false;

    const firstDate = new Date(group[0].date);
    const firstDesc = group[0].description.toLowerCase().trim();

    // All transactions must be within date tolerance
    for (const txn of group) {
      const txnDate = new Date(txn.date);
      const daysDiff =
        Math.abs(txnDate.getTime() - firstDate.getTime()) /
        (1000 * 60 * 60 * 24);

      if (daysDiff > dateTolerance) {
        return false;
      }

      // Check description similarity
      const similarity = this.calculateSimilarity(
        firstDesc,
        txn.description.toLowerCase().trim(),
      );

      if (similarity < this.MIN_DESCRIPTION_SIMILARITY) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate string similarity (simple Jaccard similarity)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Create a match result
   */
  private createMatch(
    bankGroup: TransactionDto[],
    ledgerTxn: TransactionDto,
    totalBankAmount: number,
    difference: number,
    tolerance: number,
  ): SplitPaymentMatchDto {
    const bankTxnIds = bankGroup.map((txn) => txn.id);
    const bankIds = [
      ...new Set(bankGroup.map((txn) => txn.bankId).filter(Boolean)),
    ] as string[];

    // Calculate confidence based on amount match and group cohesion
    const amountMatchScore = 1 - difference / Math.abs(ledgerTxn.amount);
    const groupCohesionScore = this.calculateGroupCohesion(bankGroup);
    const confidence = Math.min(
      0.95,
      (amountMatchScore * 0.7 + groupCohesionScore * 0.3),
    );

    // Extract entity name from description
    const entityName = this.extractEntityName(bankGroup[0].description);

    const reasoning =
      `Split payment match: ${bankGroup.length} bank transactions ` +
      `(${bankGroup.map((t) => `$${t.amount}`).join(' + ')}) ` +
      `sum to $${totalBankAmount.toFixed(2)}, ` +
      `matching ledger $${ledgerTxn.amount.toFixed(2)} ` +
      `(difference: $${difference.toFixed(2)})`;

    return {
      bankTxnIds,
      ledgerTxnId: ledgerTxn.id,
      totalBankAmount: Math.round(totalBankAmount * 100) / 100,
      ledgerAmount: ledgerTxn.amount,
      amountDifference: Math.round(difference * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      reasoning,
      splitCount: bankGroup.length,
      algorithm: 'MT-05',
      bankIds: bankIds.length > 0 ? bankIds : undefined,
      entityName: entityName || undefined,
    };
  }

  /**
   * Calculate group cohesion (how similar are the transactions)
   */
  private calculateGroupCohesion(group: TransactionDto[]): number {
    if (group.length <= 1) return 1.0;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const similarity = this.calculateSimilarity(
          group[i].description.toLowerCase(),
          group[j].description.toLowerCase(),
        );
        totalSimilarity += similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  /**
   * Extract entity name from description (simple heuristic)
   */
  private extractEntityName(description: string): string | null {
    // Remove common payment words
    const cleaned = description
      .replace(/payment|invoice|bill|to|from/gi, '')
      .trim();

    // Return first meaningful word sequence
    const words = cleaned.split(/\s+/).filter((w) => w.length > 2);
    return words.length > 0 ? words.slice(0, 2).join(' ') : null;
  }
}
