import { Injectable, Logger } from '@nestjs/common';
import { TransactionDto } from '@app/shared';
import {
  ConsolidatedDepositMatchDto,
  ConsolidatedDepositRequestDto,
  ConsolidatedDepositResponseDto,
} from './dto/match.dto';

/**
 * MT-06 Consolidated Deposits Service
 *
 * STEP 57: Multi-Bank Matcher - Multiple bank deposits → single ledger entry
 *
 * Purpose:
 * - Match deposits from multiple banks to a single ledger total
 * - Common scenario: Company deposits cash at 3 different banks on same day
 * - Example: HDFC $2K + ICICI $3K + SBI $5K → Ledger $10K
 *
 * Logic:
 * 1. Filter for deposit transactions (credit + deposit keywords)
 * 2. Group deposits by date (same day by default)
 * 3. Calculate sum across all banks in group
 * 4. Match sum to ledger amount (±1% tolerance)
 * 5. Track which bank contributed what amount
 * 6. Essential for multi-bank scenarios
 *
 * Result:
 * - User sees: "3 deposits from 3 banks → 1 ledger ($10,000)"
 * - Shows breakdown: HDFC $2K, ICICI $3K, SBI $5K
 * - Reduces unmatched transactions in multi-bank reconciliations
 */
@Injectable()
export class Mt06ConsolidatedDepositsService {
  private readonly logger = new Logger(Mt06ConsolidatedDepositsService.name);

  // Deposit keywords
  private readonly DEPOSIT_KEYWORDS = [
    'deposit',
    'cash deposit',
    'transfer in',
    'incoming',
    'credit transfer',
    'deposit cash',
    'cash in',
    'received',
    'collection',
    'receipt',
  ];

  // Default configuration
  private readonly DEFAULT_AMOUNT_TOLERANCE = 0.01; // 1%
  private readonly DEFAULT_DATE_TOLERANCE = 0; // Same day

  /**
   * Find consolidated deposit matches across multiple banks
   *
   * Algorithm:
   * 1. Filter for deposit transactions
   * 2. Group by date
   * 3. Calculate sum per date
   * 4. Match to ledger amounts
   * 5. Return matches with bank breakdown
   */
  findConsolidatedDeposits(
    tenantContext: { tenantId: string; userId: string; role: string },
    request: ConsolidatedDepositRequestDto,
  ): ConsolidatedDepositResponseDto {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Running MT-06 matching algorithm`);

    const amountTolerance =
      request.amountTolerance ?? this.DEFAULT_AMOUNT_TOLERANCE;
    const dateTolerance = request.dateTolerance ?? this.DEFAULT_DATE_TOLERANCE;

    const matches: ConsolidatedDepositMatchDto[] = [];
    const matchedBankIds = new Set<number>();
    const matchedLedgerIds = new Set<number>();
    const uniqueBanksSet = new Set<string>();

    // Filter for deposit transactions only
    const deposits = this.filterDeposits(request.bankTransactions);

    // Group deposits by date
    const dateGroups = this.groupByDate(deposits, dateTolerance);

    // For each date group, try to match to ledger
    for (const [dateKey, group] of dateGroups.entries()) {
      // Skip if any transaction already matched
      if (group.some((txn) => matchedBankIds.has(txn.id))) {
        continue;
      }

      // Calculate total deposit amount
      const totalAmount = group.reduce((sum, txn) => sum + txn.amount, 0);

      // Count unique banks in this group
      const banksInGroup = new Set(
        group.map((txn) => txn.bankId).filter(Boolean),
      );

      // Only consider if deposits from multiple banks (or unspecified)
      // This is the key differentiator for MT-06
      if (banksInGroup.size < 2 && banksInGroup.size !== 0) {
        continue; // Skip single-bank groups (those would be handled by MT-05)
      }

      // Try to match to ledger transactions
      for (const ledgerTxn of request.ledgerTransactions) {
        // Skip if already matched
        if (matchedLedgerIds.has(ledgerTxn.id)) {
          continue;
        }

        // Check if sum matches ledger amount
        const difference = Math.abs(totalAmount - ledgerTxn.amount);
        const tolerance = Math.abs(ledgerTxn.amount) * amountTolerance;

        if (difference <= tolerance) {
          // Found a match!
          const match = this.createMatch(
            group,
            ledgerTxn,
            totalAmount,
            difference,
          );

          matches.push(match);

          // Mark as matched
          group.forEach((txn) => matchedBankIds.add(txn.id));
          matchedLedgerIds.add(ledgerTxn.id);

          // Track unique banks
          group.forEach((txn) => {
            if (txn.bankId) uniqueBanksSet.add(txn.bankId);
          });

          break; // Move to next date group
        }
      }
    }

    return {
      matches,
      totalMatches: matches.length,
      totalBankTransactions: matchedBankIds.size,
      totalLedgerTransactions: matchedLedgerIds.size,
      uniqueBanks: uniqueBanksSet.size,
      algorithm: 'MT-06-Consolidated-Deposits',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Filter transactions to keep only deposits
   */
  private filterDeposits(transactions: TransactionDto[]): TransactionDto[] {
    return transactions.filter((txn) => {
      // Must be a credit (positive amount)
      if (txn.amount <= 0) return false;

      // Check for deposit keywords
      const description = txn.description.toLowerCase();
      return this.DEPOSIT_KEYWORDS.some((keyword) =>
        description.includes(keyword),
      );
    });
  }

  /**
   * Group transactions by date
   */
  private groupByDate(
    transactions: TransactionDto[],
    dateTolerance: number,
  ): Map<string, TransactionDto[]> {
    const groups = new Map<string, TransactionDto[]>();

    for (const txn of transactions) {
      const date = new Date(txn.date);
      const dateKey = this.getDateKey(date, dateTolerance);

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }

      groups.get(dateKey)!.push(txn);
    }

    return groups;
  }

  /**
   * Generate date key for grouping (accounts for tolerance)
   */
  private getDateKey(date: Date, tolerance: number): string {
    if (tolerance === 0) {
      // Exact date
      return date.toISOString().split('T')[0];
    } else {
      // Use a date range key
      const adjusted = new Date(date);
      adjusted.setDate(adjusted.getDate() - tolerance);
      return adjusted.toISOString().split('T')[0];
    }
  }

  /**
   * Create a consolidated deposit match
   */
  private createMatch(
    deposits: TransactionDto[],
    ledgerTxn: TransactionDto,
    totalAmount: number,
    difference: number,
  ): ConsolidatedDepositMatchDto {
    const bankTxnIds = deposits.map((txn) => txn.id);

    // Create bank breakdown
    const bankMap = new Map<
      string,
      { bankName?: string; amount: number; transactionIds: number[] }
    >();

    for (const txn of deposits) {
      const bankId = txn.bankId || 'unknown';

      if (!bankMap.has(bankId)) {
        bankMap.set(bankId, {
          bankName: txn.bankName,
          amount: 0,
          transactionIds: [],
        });
      }

      const entry = bankMap.get(bankId)!;
      entry.amount += txn.amount;
      entry.transactionIds.push(txn.id);
    }

    const bankBreakdown = Array.from(bankMap.entries()).map(
      ([bankId, data]) => ({
        bankId,
        bankName: data.bankName,
        amount: Math.round(data.amount * 100) / 100,
        transactionIds: data.transactionIds,
      }),
    );

    // Calculate confidence
    const amountMatchScore = 1 - difference / Math.abs(ledgerTxn.amount);
    const multiBankBonus = bankBreakdown.length > 1 ? 0.05 : 0;
    const confidence = Math.min(0.95, amountMatchScore + multiBankBonus);

    const reasoning =
      `Consolidated deposits from ${bankBreakdown.length} bank(s): ` +
      `${bankBreakdown.map((b) => `${b.bankId} $${b.amount}`).join(' + ')} ` +
      `= $${totalAmount.toFixed(2)}, ` +
      `matching ledger $${ledgerTxn.amount.toFixed(2)} ` +
      `(difference: $${difference.toFixed(2)})`;

    return {
      bankTxnIds,
      ledgerTxnId: ledgerTxn.id,
      totalDepositAmount: Math.round(totalAmount * 100) / 100,
      ledgerAmount: ledgerTxn.amount,
      amountDifference: Math.round(difference * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      reasoning,
      bankCount: bankBreakdown.length,
      depositCount: deposits.length,
      algorithm: 'MT-06',
      bankBreakdown,
    };
  }

  /**
   * Get statistics about consolidated deposits
   */
  getDepositStats(
    matches: ConsolidatedDepositMatchDto[],
  ): {
    totalConsolidations: number;
    avgBanksPerConsolidation: number;
    avgDepositsPerConsolidation: number;
    totalAmount: number;
    byBankCount: Record<number, number>; // How many consolidations involved N banks
  } {
    const totalConsolidations = matches.length;

    const avgBanksPerConsolidation =
      totalConsolidations > 0
        ? matches.reduce((sum, m) => sum + m.bankCount, 0) /
          totalConsolidations
        : 0;

    const avgDepositsPerConsolidation =
      totalConsolidations > 0
        ? matches.reduce((sum, m) => sum + m.depositCount, 0) /
          totalConsolidations
        : 0;

    const totalAmount = matches.reduce(
      (sum, m) => sum + m.totalDepositAmount,
      0,
    );

    // Group by number of banks involved
    const byBankCount: Record<number, number> = {};
    for (const match of matches) {
      const count = match.bankCount;
      byBankCount[count] = (byBankCount[count] || 0) + 1;
    }

    return {
      totalConsolidations,
      avgBanksPerConsolidation: Math.round(avgBanksPerConsolidation * 100) / 100,
      avgDepositsPerConsolidation:
        Math.round(avgDepositsPerConsolidation * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      byBankCount,
    };
  }
}
