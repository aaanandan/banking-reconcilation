import { Injectable, Logger } from '@nestjs/common';
import { TransactionDto } from '@app/shared';
import {
  RoundingClassificationDto,
  RoundingClassificationRequestDto,
  RoundingClassificationResponseDto,
} from './dto/classification.dto';

/**
 * MT-11 Rounding Differences Service
 *
 * STEP 60.4: Exception Handler - Identifies small rounding differences
 *
 * Purpose:
 * - Identify bank transactions with small rounding differences
 * - Detect accounting system rounding discrepancies
 * - Common in systems with different decimal precision
 *
 * Logic:
 * 1. Run AFTER MT-01 & MT-02 on unmatched bank transactions
 * 2. Detect rounding difference indicators:
 *    - Rounding-related keywords (rounding, adjustment, cent, penny)
 *    - Very small amounts (≤ threshold, default $0.01)
 * 3. Classify as rounding difference
 * 4. Mark as: status: 'classified', type: 'rounding_difference'
 *
 * Result:
 * - Transaction removed from "unknown" pool
 * - User sees: "Rounding difference: $0.01 (below threshold)"
 * - Explains why no exact ledger match exists
 */
@Injectable()
export class Mt11RoundingService {
  private readonly logger = new Logger(Mt11RoundingService.name);

  // Rounding-related keywords
  private readonly ROUNDING_KEYWORDS = [
    'rounding',
    'round',
    'adjustment',
    'adjust',
    'cent',
    'penny',
    'pence',
    'difference',
    'discrepancy',
    'variance',
    'decimal',
  ];

  // Default rounding threshold
  private readonly DEFAULT_ROUNDING_THRESHOLD = 0.01;

  /**
   * Classify rounding difference transactions
   *
   * Algorithm:
   * 1. Check for rounding keywords
   * 2. Check if amount is within rounding threshold
   * 3. Classify transactions
   */
  classifyRoundingDifferences(
    tenantContext: { tenantId: string; userId: string; role: string },
    request: RoundingClassificationRequestDto,
  ): RoundingClassificationResponseDto {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Running MT-11 matching algorithm`);

    const threshold =
      request.roundingThreshold ?? this.DEFAULT_ROUNDING_THRESHOLD;
    const classifications: RoundingClassificationDto[] = [];

    let sumRoundingDiff = 0;
    let maxRoundingDiff = 0;

    for (const txn of request.bankTransactions) {
      const classification = this.classifyTransaction(txn, threshold);

      if (classification.isRoundingDifference) {
        classifications.push(classification);
        sumRoundingDiff += classification.roundingDifference;
        maxRoundingDiff = Math.max(
          maxRoundingDiff,
          classification.roundingDifference,
        );
      }
    }

    const avgRoundingDiff =
      classifications.length > 0
        ? sumRoundingDiff / classifications.length
        : 0;

    return {
      classifications,
      totalRoundingDifferences: classifications.length,
      algorithm: 'MT-11-Rounding-Differences',
      timestamp: new Date().toISOString(),
      summary: {
        totalProcessed: request.bankTransactions.length,
        roundingDifferencesFound: classifications.length,
        averageRoundingDifference:
          Math.round(avgRoundingDiff * 100) / 100,
        maxRoundingDifference: Math.round(maxRoundingDiff * 100) / 100,
        roundingThreshold: threshold,
      },
    };
  }

  /**
   * Classify a single transaction
   */
  private classifyTransaction(
    txn: TransactionDto,
    threshold: number,
  ): RoundingClassificationDto {
    const hasRoundingKeywords = this.hasRoundingKeywords(txn.description);
    const amount = Math.abs(txn.amount);
    const isWithinThreshold = amount <= threshold;

    const isRoundingDifference = hasRoundingKeywords || isWithinThreshold;

    // For rounding differences, the expected amount would be 0
    // (assuming the rounding should have been absorbed)
    const expectedAmount = 0;
    const roundingDifference = amount;

    // High confidence if both keywords and small amount
    let confidence = 0.0;
    if (isRoundingDifference) {
      if (hasRoundingKeywords && isWithinThreshold) {
        confidence = 0.95;
      } else if (hasRoundingKeywords) {
        confidence = 0.80;
      } else if (isWithinThreshold) {
        confidence = 0.75;
      }
    }

    let reasoning = '';
    if (isRoundingDifference) {
      if (hasRoundingKeywords && isWithinThreshold) {
        reasoning = `Rounding difference detected: $${amount.toFixed(2)} (below threshold $${threshold.toFixed(2)}). Keywords found in description.`;
      } else if (hasRoundingKeywords) {
        reasoning = `Rounding keywords found in description. Amount: $${amount.toFixed(2)}.`;
      } else {
        reasoning = `Small amount within rounding threshold: $${amount.toFixed(2)} ≤ $${threshold.toFixed(2)}.`;
      }
    } else {
      reasoning = 'No rounding difference indicators found.';
    }

    return {
      bankTxnId: txn.id,
      isRoundingDifference,
      bankAmount: txn.amount,
      expectedAmount,
      roundingDifference,
      confidence,
      reasoning,
      algorithm: 'MT-11',
      bankId: txn.bankId || 'unknown',
    };
  }

  /**
   * Check if description contains rounding keywords
   */
  private hasRoundingKeywords(description: string): boolean {
    const lowerDesc = description.toLowerCase();
    return this.ROUNDING_KEYWORDS.some((keyword) =>
      lowerDesc.includes(keyword),
    );
  }
}
