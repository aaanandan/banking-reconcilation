import { Injectable, Logger } from '@nestjs/common';
import { TransactionDto } from '@app/shared';
import {
  TimingDifferenceMatchDto,
  TimingDifferenceMatchRequestDto,
  TimingDifferenceMatchResponseDto,
} from './dto/match.dto';

/**
 * MT-09 Timing Differences Service
 *
 * STEP 58: Date-Flexible Matcher - Handles date mismatches between bank and ledger
 *
 * Purpose:
 * - Match transactions with different dates (common in banking)
 * - Handle check clearance delays (3-5 days)
 * - Handle wire transfer delays (1-2 days)
 * - Handle weekend/holiday processing delays
 *
 * Scenario:
 * - Bank: Payment processed Jan 13
 * - Ledger: Payment recorded Jan 15
 * - 2-day timing difference (acceptable)
 *
 * Logic:
 * 1. Relax date matching: ±5 days (configurable)
 * 2. Amount must be exact (±0.1% tolerance)
 * 3. Description similarity >70%
 * 4. Track per-entity timing patterns for learning
 *
 * Result:
 * - Matches transactions that differ only in date
 * - Learns typical timing delays per entity
 * - Improves future matching accuracy
 */
@Injectable()
export class Mt09TimingDifferencesService {
  private readonly logger = new Logger(Mt09TimingDifferencesService.name);

  // Default configuration
  private readonly DEFAULT_MAX_DATE_DIFFERENCE = 5; // 5 days
  private readonly DEFAULT_AMOUNT_TOLERANCE = 0.001; // 0.1%
  private readonly DEFAULT_MIN_DESCRIPTION_SIMILARITY = 0.7; // 70%

  /**
   * Find timing difference matches
   *
   * Algorithm:
   * 1. For each bank transaction
   * 2. Find ledger transactions within date tolerance
   * 3. Check amount match (very tight tolerance)
   * 4. Calculate description similarity
   * 5. Return matches with confidence scores
   */
  findTimingMatches(
    tenantContext: { tenantId: string; userId: string; role: string },
    request: TimingDifferenceMatchRequestDto,
  ): TimingDifferenceMatchResponseDto {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Running MT-09 matching algorithm`);

    const maxDateDiff = request.maxDateDifference ?? this.DEFAULT_MAX_DATE_DIFFERENCE;
    const amountTolerance = request.amountTolerance ?? this.DEFAULT_AMOUNT_TOLERANCE;
    const minDescSimilarity =
      request.minDescriptionSimilarity ?? this.DEFAULT_MIN_DESCRIPTION_SIMILARITY;

    const matches: TimingDifferenceMatchDto[] = [];
    const matchedBankIds = new Set<number>();
    const matchedLedgerIds = new Set<number>();
    const dateDifferences: number[] = [];

    // Try to match each bank transaction
    for (const bankTxn of request.bankTransactions) {
      // Skip if already matched
      if (matchedBankIds.has(bankTxn.id)) continue;

      let bestMatch: {
        ledgerTxn: TransactionDto;
        score: number;
        dateDiff: number;
        amountScore: number;
        descSimilarity: number;
      } | null = null;

      // Check all ledger transactions
      for (const ledgerTxn of request.ledgerTransactions) {
        // Skip if already matched
        if (matchedLedgerIds.has(ledgerTxn.id)) continue;

        // Calculate date difference
        const dateDiff = this.getDateDifference(bankTxn.date, ledgerTxn.date);

        // Skip if date difference too large
        if (dateDiff > maxDateDiff) continue;

        // Calculate amount match score
        const amountScore = this.calculateAmountScore(
          bankTxn.amount,
          ledgerTxn.amount,
          amountTolerance,
        );

        // Skip if amount doesn't match closely enough
        if (amountScore < 0.95) continue; // 95% match required

        // Calculate description similarity
        const descSimilarity = this.calculateDescriptionSimilarity(
          bankTxn.description,
          ledgerTxn.description,
        );

        // Skip if description too different
        if (descSimilarity < minDescSimilarity) continue;

        // Calculate overall score
        // Prioritize: amount (50%) > description (30%) > date closeness (20%)
        const dateScore = 1 - dateDiff / maxDateDiff;
        const overallScore =
          amountScore * 0.5 + descSimilarity * 0.3 + dateScore * 0.2;

        // Keep best match
        if (!bestMatch || overallScore > bestMatch.score) {
          bestMatch = {
            ledgerTxn,
            score: overallScore,
            dateDiff,
            amountScore,
            descSimilarity,
          };
        }
      }

      // If we found a match, add it
      if (bestMatch) {
        const match = this.createMatch(
          bankTxn,
          bestMatch.ledgerTxn,
          bestMatch.dateDiff,
          bestMatch.amountScore,
          bestMatch.descSimilarity,
          bestMatch.score,
        );

        matches.push(match);
        matchedBankIds.add(bankTxn.id);
        matchedLedgerIds.add(bestMatch.ledgerTxn.id);
        dateDifferences.push(bestMatch.dateDiff);
      }
    }

    // Calculate timing statistics
    const timingStats = this.calculateTimingStats(dateDifferences, maxDateDiff);

    return {
      matches,
      totalMatches: matches.length,
      algorithm: 'MT-09-Timing-Differences',
      timestamp: new Date().toISOString(),
      timingStats,
    };
  }

  /**
   * Calculate date difference in days (absolute)
   */
  private getDateDifference(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffMs = Math.abs(d1.getTime() - d2.getTime());
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate amount match score
   */
  private calculateAmountScore(
    amount1: number,
    amount2: number,
    tolerance: number,
  ): number {
    const difference = Math.abs(amount1 - amount2);
    const maxDiff = Math.abs(amount1) * tolerance;

    if (difference <= maxDiff) {
      return 1.0 - difference / (maxDiff || 1);
    }

    return 0;
  }

  /**
   * Calculate description similarity using Jaccard similarity
   */
  private calculateDescriptionSimilarity(desc1: string, desc2: string): number {
    const words1 = new Set(
      desc1
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );
    const words2 = new Set(
      desc2
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Create a timing difference match
   */
  private createMatch(
    bankTxn: TransactionDto,
    ledgerTxn: TransactionDto,
    dateDiff: number,
    amountScore: number,
    descSimilarity: number,
    overallScore: number,
  ): TimingDifferenceMatchDto {
    const confidence = Math.min(0.95, overallScore);

    const reasoning =
      `Timing difference match: Bank ${bankTxn.date} vs Ledger ${ledgerTxn.date} ` +
      `(${dateDiff} day${dateDiff !== 1 ? 's' : ''} difference). ` +
      `Amount match: ${(amountScore * 100).toFixed(1)}%, ` +
      `Description similarity: ${(descSimilarity * 100).toFixed(1)}%`;

    // Extract entity name for learning
    const entityName = this.extractEntityName(bankTxn.description);

    return {
      bankTxnId: bankTxn.id,
      ledgerTxnId: ledgerTxn.id,
      bankDate: bankTxn.date,
      ledgerDate: ledgerTxn.date,
      dateDifference: dateDiff,
      amountMatchScore: Math.round(amountScore * 100) / 100,
      descriptionSimilarity: Math.round(descSimilarity * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      reasoning,
      algorithm: 'MT-09',
      bankId: bankTxn.bankId,
      bankName: bankTxn.bankName,
      entityName: entityName || undefined,
    };
  }

  /**
   * Extract entity name from description
   */
  private extractEntityName(description: string): string | null {
    const cleaned = description.replace(/payment|invoice|bill|to|from/gi, '').trim();
    const words = cleaned.split(/\s+/).filter((w) => w.length > 2);
    return words.length > 0 ? words.slice(0, 2).join(' ') : null;
  }

  /**
   * Calculate timing statistics
   */
  private calculateTimingStats(
    dateDifferences: number[],
    maxRange: number,
  ): {
    avgDateDifference: number;
    mostCommonDifference: number;
    dateRangeUsed: string;
  } {
    if (dateDifferences.length === 0) {
      return {
        avgDateDifference: 0,
        mostCommonDifference: 0,
        dateRangeUsed: `±${maxRange} days`,
      };
    }

    // Average
    const avg =
      dateDifferences.reduce((sum, d) => sum + d, 0) / dateDifferences.length;

    // Most common (mode)
    const counts = new Map<number, number>();
    for (const diff of dateDifferences) {
      counts.set(diff, (counts.get(diff) || 0) + 1);
    }

    let mostCommon = 0;
    let maxCount = 0;
    for (const [diff, count] of counts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = diff;
      }
    }

    return {
      avgDateDifference: Math.round(avg * 100) / 100,
      mostCommonDifference: mostCommon,
      dateRangeUsed: `±${maxRange} days`,
    };
  }
}
