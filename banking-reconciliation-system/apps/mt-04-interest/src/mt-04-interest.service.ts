import { Injectable } from '@nestjs/common';
import { TransactionDto } from '@app/shared';
import {
  InterestClassificationDto,
  InterestClassificationRequestDto,
  InterestClassificationResponseDto,
} from './dto/classification.dto';

/**
 * MT-04 Interest Credits Service
 *
 * STEP 55: Exception Handler - Identifies interest with NO ledger entry expected
 *
 * Purpose:
 * - Classify unmatched bank transactions as interest income
 * - These transactions WON'T have immediate ledger matches (by design)
 * - Interest may be recorded quarterly in ledger, not immediately
 * - Reduces "unknown" pool by identifying expected bank-only transactions
 *
 * Logic:
 * 1. Run AFTER MT-01 & MT-02 on unmatched bank transactions
 * 2. Detect interest keywords: interest, earnings, accrual, yield, etc.
 * 3. Check it's a CREDIT transaction (positive amount)
 * 4. Validate amount is typical for interest (usually < $1000)
 * 5. Mark as: status: 'classified', type: 'interest_income'
 *
 * Result:
 * - Transaction removed from "unknown" pool
 * - User sees: "Interest income - $12.50 (automatically classified)"
 * - Can be aggregated for monthly/quarterly reporting
 */
@Injectable()
export class Mt04InterestService {
  // Interest keywords (common patterns)
  private readonly INTEREST_KEYWORDS = [
    'interest',
    'interest earned',
    'interest income',
    'interest credit',
    'int earned',
    'int cr',
    'accrued interest',
    'accrual',
    'yield',
    'interest payment',
    'interest paid',
    'savings interest',
    'deposit interest',
    'monthly interest',
    'quarterly interest',
    'annual interest',
    'interest accrued',
    'earned interest',
    'credit interest',
    'int pmt',
    'int payment',
    'intrest', // Common misspelling
  ];

  // Typical interest amount range (in dollars)
  private readonly MIN_INTEREST_AMOUNT = 0.01; // $0.01
  private readonly MAX_TYPICAL_INTEREST = 1000; // $1,000 (most interest)
  private readonly MAX_INTEREST_AMOUNT = 10000; // $10,000 (absolute max)

  /**
   * Classify unmatched bank transactions as potential interest income
   *
   * Algorithm:
   * 1. For each unmatched bank transaction
   * 2. Check if it's a CREDIT (positive amount)
   * 3. Check description for interest keywords
   * 4. Validate amount is in typical interest range
   * 5. Calculate confidence based on keyword matches and amount
   * 6. Return classification result
   */
  classifyInterest(
    request: InterestClassificationRequestDto,
  ): InterestClassificationResponseDto {
    const classifications: InterestClassificationDto[] = [];
    let totalInterestAmount = 0;

    for (const bankTxn of request.bankTransactions) {
      const classification = this.classifyTransaction(bankTxn);
      classifications.push(classification);

      if (classification.isInterest) {
        totalInterestAmount += bankTxn.amount; // Interest is always positive
      }
    }

    const interestFound = classifications.filter((c) => c.isInterest).length;

    return {
      classifications,
      totalInterest: interestFound,
      algorithm: 'MT-04-Interest',
      timestamp: new Date().toISOString(),
      summary: {
        totalProcessed: request.bankTransactions.length,
        interestFound,
        totalInterestAmount: Math.round(totalInterestAmount * 100) / 100,
      },
    };
  }

  /**
   * Classify a single transaction
   */
  private classifyTransaction(txn: TransactionDto): InterestClassificationDto {
    const description = txn.description.toLowerCase().trim();
    const amount = txn.amount; // Don't use absolute value - need to check sign

    // Detect keywords in description
    const detectedKeywords = this.detectKeywords(description);
    const hasKeywords = detectedKeywords.length > 0;

    // Interest must be CREDIT (positive amount)
    const isCredit = amount > 0;

    // Check if amount is in typical interest range
    const absoluteAmount = Math.abs(amount);
    const isInInterestRange =
      absoluteAmount >= this.MIN_INTEREST_AMOUNT &&
      absoluteAmount <= this.MAX_INTEREST_AMOUNT;
    const isTypicalInterest = absoluteAmount <= this.MAX_TYPICAL_INTEREST;

    // Calculate confidence
    let confidence = 0.0;
    let isInterest = false;
    let reasoning = '';

    if (hasKeywords && isCredit && isInInterestRange) {
      // Strong indicator: has keywords, is credit, and in range
      confidence = isTypicalInterest ? 0.95 : 0.85;
      isInterest = true;
      reasoning = `Interest income identified: ${detectedKeywords.join(', ')} - Amount $${absoluteAmount}`;
    } else if (hasKeywords && !isCredit) {
      // Has interest keywords but is a DEBIT (not interest income)
      confidence = 0.0;
      isInterest = false;
      reasoning = `Contains interest keywords but is a debit transaction (interest charged, not earned)`;
    } else if (hasKeywords && isCredit && !isInInterestRange) {
      // Has keywords and is credit but amount is unusual
      if (absoluteAmount > this.MAX_INTEREST_AMOUNT) {
        confidence = 0.40; // Lower confidence - might not be interest
        isInterest = false; // Don't auto-classify
        reasoning = `Contains interest keywords but amount ($${absoluteAmount}) exceeds typical interest range`;
      } else {
        confidence = 0.30;
        isInterest = false;
        reasoning = `Contains interest keywords but amount ($${absoluteAmount}) below minimum threshold`;
      }
    } else if (!hasKeywords && isCredit && isTypicalInterest) {
      // No keywords but small credit - could be interest
      confidence = 0.20;
      isInterest = false; // Don't auto-classify without keywords
      reasoning = `Small credit amount ($${absoluteAmount}) but no interest keywords detected`;
    } else {
      // No indication of being interest
      confidence = 0.0;
      isInterest = false;
      reasoning = 'Not classified as interest income';
    }

    return {
      bankTxnId: txn.id,
      isInterest,
      confidence,
      reasoning,
      detectedKeywords,
      algorithm: 'MT-04',
      bankId: txn.bankId,
      bankName: txn.bankName,
    };
  }

  /**
   * Detect interest keywords in transaction description
   */
  private detectKeywords(description: string): string[] {
    const detected: string[] = [];

    for (const keyword of this.INTEREST_KEYWORDS) {
      if (description.includes(keyword)) {
        detected.push(keyword);
      }
    }

    return detected;
  }

  /**
   * Get statistics about interest classifications
   */
  getClassificationStats(
    classifications: InterestClassificationDto[],
  ): {
    totalInterest: number;
    avgInterestAmount: number;
    byBank: Record<string, number>;
    confidenceDistribution: {
      high: number; // >0.8
      medium: number; // 0.5-0.8
      low: number; // <0.5
    };
  } {
    const interest = classifications.filter((c) => c.isInterest);
    const totalInterest = interest.length;

    // Calculate average (would need transaction amounts)
    const avgInterestAmount = 0; // Placeholder

    // Group by bank
    const byBank: Record<string, number> = {};
    for (const item of interest) {
      if (item.bankId) {
        byBank[item.bankId] = (byBank[item.bankId] || 0) + 1;
      }
    }

    // Confidence distribution
    const confidenceDistribution = {
      high: interest.filter((i) => i.confidence > 0.8).length,
      medium: interest.filter((i) => i.confidence >= 0.5 && i.confidence <= 0.8)
        .length,
      low: interest.filter((i) => i.confidence < 0.5).length,
    };

    return {
      totalInterest,
      avgInterestAmount,
      byBank,
      confidenceDistribution,
    };
  }
}
