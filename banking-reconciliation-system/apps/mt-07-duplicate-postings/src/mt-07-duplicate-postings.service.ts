import { Injectable, Logger } from '@nestjs/common';
import { TransactionDto } from '@app/shared';
import {
  DuplicateClassificationDto,
  DuplicateClassificationRequestDto,
  DuplicateClassificationResponseDto,
} from './dto/classification.dto';

/**
 * MT-07 Duplicate Postings Service
 *
 * STEP 60.1: Exception Handler - Identifies duplicate bank transactions
 *
 * Purpose:
 * - Identify duplicate bank transactions that should be ignored
 * - Banking systems sometimes post same transaction twice
 * - These duplicates WON'T have ledger matches (only one ledger entry)
 *
 * Logic:
 * 1. Run AFTER MT-01 & MT-02 on unmatched bank transactions
 * 2. Find exact duplicates within same bank:
 *    - Same date
 *    - Same amount
 *    - Same/similar description
 *    - Within 24 hours
 * 3. Mark as: status: 'classified', type: 'duplicate'
 * 4. Flag for user review (may be legitimate repeat transaction)
 *
 * Result:
 * - Duplicate removed from "unknown" pool
 * - User sees: "Possible duplicate transaction (review if needed)"
 * - Reduces confusion about "missing" ledger entries
 */
@Injectable()
export class Mt07DuplicatePostingsService {
  private readonly logger = new Logger(Mt07DuplicatePostingsService.name);

  // Duplicate detection thresholds
  private readonly MAX_TIME_DIFFERENCE_HOURS = 24; // Within 24 hours
  private readonly MIN_DESCRIPTION_SIMILARITY = 0.8; // 80% similarity

  /**
   * Classify duplicate bank transactions
   *
   * Algorithm:
   * 1. Group transactions by bank
   * 2. For each bank, find exact duplicates
   * 3. Check date, amount, description similarity
   * 4. Return classification results
   */
  classifyDuplicates(
    tenantContext: { tenantId: string; userId: string; role: string },
    request: DuplicateClassificationRequestDto,
  ): DuplicateClassificationResponseDto {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Running MT-07 matching algorithm`);

    const classifications: DuplicateClassificationDto[] = [];
    const duplicateGroups: Map<string, number[]> = new Map();

    // Group by bank first
    const byBank = this.groupByBank(request.bankTransactions);

    // Check for duplicates within each bank
    for (const [bankId, transactions] of byBank.entries()) {
      this.findDuplicatesInBank(
        transactions,
        classifications,
        duplicateGroups,
      );
    }

    const duplicatesFound = classifications.filter((c) => c.isDuplicate).length;
    const uniqueGroups = duplicateGroups.size;

    return {
      classifications,
      totalDuplicates: duplicatesFound,
      algorithm: 'MT-07-Duplicate-Postings',
      timestamp: new Date().toISOString(),
      summary: {
        totalProcessed: request.bankTransactions.length,
        duplicatesFound,
        uniqueGroups,
      },
    };
  }

  /**
   * Group transactions by bank
   */
  private groupByBank(
    transactions: TransactionDto[],
  ): Map<string, TransactionDto[]> {
    const byBank = new Map<string, TransactionDto[]>();

    for (const txn of transactions) {
      const bankId = txn.bankId || 'unknown';
      if (!byBank.has(bankId)) {
        byBank.set(bankId, []);
      }
      byBank.get(bankId)!.push(txn);
    }

    return byBank;
  }

  /**
   * Find duplicates within a single bank
   */
  private findDuplicatesInBank(
    transactions: TransactionDto[],
    classifications: DuplicateClassificationDto[],
    duplicateGroups: Map<string, number[]>,
  ): void {
    const processed = new Set<number>();

    for (let i = 0; i < transactions.length; i++) {
      const txn1 = transactions[i];

      // Skip if already processed
      if (processed.has(txn1.id)) continue;

      const duplicates: number[] = [];

      // Compare with all other transactions
      for (let j = i + 1; j < transactions.length; j++) {
        const txn2 = transactions[j];

        // Skip if already processed
        if (processed.has(txn2.id)) continue;

        // Check if they are duplicates
        if (this.areDuplicates(txn1, txn2)) {
          duplicates.push(txn2.id);
          processed.add(txn2.id);
        }
      }

      // Create classification for this transaction
      const classification = this.createClassification(
        txn1,
        duplicates,
        duplicates.length > 0,
      );

      classifications.push(classification);

      // If duplicates found, track the group
      if (duplicates.length > 0) {
        const groupKey = `${txn1.date}-${txn1.amount}`;
        duplicateGroups.set(groupKey, [txn1.id, ...duplicates]);
      }
    }
  }

  /**
   * Check if two transactions are duplicates
   */
  private areDuplicates(txn1: TransactionDto, txn2: TransactionDto): boolean {
    // 1. Check amount match (exact)
    if (txn1.amount !== txn2.amount) {
      return false;
    }

    // 2. Check date proximity (within 24 hours)
    const date1 = new Date(txn1.date);
    const date2 = new Date(txn2.date);
    const hoursDiff =
      Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > this.MAX_TIME_DIFFERENCE_HOURS) {
      return false;
    }

    // 3. Check description similarity
    const similarity = this.calculateDescriptionSimilarity(
      txn1.description,
      txn2.description,
    );

    return similarity >= this.MIN_DESCRIPTION_SIMILARITY;
  }

  /**
   * Calculate description similarity (Jaccard)
   */
  private calculateDescriptionSimilarity(desc1: string, desc2: string): number {
    const words1 = new Set(desc1.toLowerCase().split(/\s+/));
    const words2 = new Set(desc2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Create a classification result
   */
  private createClassification(
    txn: TransactionDto,
    duplicateIds: number[],
    isDuplicate: boolean,
  ): DuplicateClassificationDto {
    let confidence = 0.0;
    let reasoning = '';

    if (isDuplicate) {
      confidence = 0.90; // High confidence for exact duplicates
      reasoning = `Duplicate detected: ${duplicateIds.length} identical transaction(s) found with same amount ($${txn.amount}), date (${txn.date}), and similar description`;
    } else {
      confidence = 0.0;
      reasoning = 'Not classified as duplicate';
    }

    return {
      bankTxnId: txn.id,
      isDuplicate,
      duplicateOfIds: duplicateIds,
      confidence,
      reasoning,
      algorithm: 'MT-07',
      bankId: txn.bankId,
      bankName: txn.bankName,
      duplicateCount: duplicateIds.length,
    };
  }
}
