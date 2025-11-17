import { Injectable, Logger } from '@nestjs/common';
import { TransactionDto } from '@app/shared';
import {
  ClassificationDto,
  ClassificationRequestDto,
  ClassificationResponseDto,
} from './dto/classification.dto';

/**
 * MT-03 Bank Fees & Charges Service
 *
 * STEP 54: Exception Handler - Identifies bank fees with NO ledger entry expected
 *
 * Purpose:
 * - Classify unmatched bank transactions as fees/charges
 * - These transactions WON'T have ledger matches (by design)
 * - Reduces "unknown" pool by identifying expected bank-only transactions
 *
 * Logic:
 * 1. Run AFTER MT-01 & MT-02 on unmatched bank transactions
 * 2. Detect fee keywords: fee, charge, maintenance, service, ATM, wire, etc.
 * 3. Check amount is typical for fees ($5-$100 usually, max $500)
 * 4. Mark as: status: 'classified', type: 'bank_fee'
 * 5. Do NOT try to match to ledger
 *
 * Result:
 * - Transaction removed from "unknown" pool
 * - User sees: "Bank fee - $25 (automatically classified)"
 * - Reduces manual review workload
 */
@Injectable()
export class Mt03BankFeesService {
  private readonly logger = new Logger(Mt03BankFeesService.name);

  // Bank fee keywords (common patterns)
  private readonly FEE_KEYWORDS = [
    'fee',
    'charge',
    'maintenance',
    'service',
    'atm',
    'wire',
    'transfer fee',
    'overdraft',
    'monthly charge',
    'account fee',
    'processing fee',
    'transaction fee',
    'wire transfer',
    'withdrawal fee',
    'minimum balance',
    'service charge',
    'annual fee',
    'penalty',
    'late fee',
    'nsf', // Non-Sufficient Funds
    'returned item',
    'stop payment',
    'cashiers check',
    'money order',
    'foreign transaction',
    'currency conversion',
    'expedited',
    'rush fee',
    'admin fee',
    'administrative',
  ];

  // Typical fee amount range (in dollars)
  private readonly MIN_FEE_AMOUNT = 1; // $1
  private readonly MAX_FEE_AMOUNT = 500; // $500
  private readonly TYPICAL_MAX_FEE = 100; // Most fees under $100

  /**
   * Classify unmatched bank transactions as potential bank fees
   *
   * Algorithm:
   * 1. For each unmatched bank transaction
   * 2. Check description for fee keywords
   * 3. Validate amount is in typical fee range
   * 4. Calculate confidence based on keyword matches and amount
   * 5. Return classification result
   */
  classifyBankFees(
    tenantContext: { tenantId: string; userId: string; role: string },
    request: ClassificationRequestDto,
  ): ClassificationResponseDto {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Running MT-03 matching algorithm`);

    const classifications: ClassificationDto[] = [];
    let totalFeeAmount = 0;

    for (const bankTxn of request.bankTransactions) {
      const classification = this.classifyTransaction(bankTxn);
      classifications.push(classification);

      if (classification.isBankFee) {
        totalFeeAmount += Math.abs(bankTxn.amount);
      }
    }

    const bankFeesFound = classifications.filter((c) => c.isBankFee).length;

    return {
      classifications,
      totalBankFees: bankFeesFound,
      algorithm: 'MT-03-Bank-Fees',
      timestamp: new Date().toISOString(),
      summary: {
        totalProcessed: request.bankTransactions.length,
        bankFeesFound,
        totalFeeAmount: Math.round(totalFeeAmount * 100) / 100,
      },
    };
  }

  /**
   * Classify a single transaction
   */
  private classifyTransaction(txn: TransactionDto): ClassificationDto {
    const description = txn.description.toLowerCase().trim();
    const amount = Math.abs(txn.amount); // Work with absolute value

    // Detect keywords in description
    const detectedKeywords = this.detectKeywords(description);
    const hasKeywords = detectedKeywords.length > 0;

    // Check if amount is in typical fee range
    const isInFeeRange = amount >= this.MIN_FEE_AMOUNT && amount <= this.MAX_FEE_AMOUNT;
    const isTypicalFee = amount <= this.TYPICAL_MAX_FEE;

    // Calculate confidence
    let confidence = 0.0;
    let isBankFee = false;
    let reasoning = '';

    if (hasKeywords && isInFeeRange) {
      // Strong indicator: has keywords AND in fee range
      confidence = isTypicalFee ? 0.95 : 0.85;
      isBankFee = true;
      reasoning = `Bank fee identified: ${detectedKeywords.join(', ')} - Amount $${amount}`;
    } else if (hasKeywords && !isInFeeRange) {
      // Has keywords but amount is unusual
      if (amount > this.MAX_FEE_AMOUNT) {
        confidence = 0.50; // Lower confidence - might be a regular charge
        isBankFee = false; // Don't auto-classify
        reasoning = `Contains fee keywords but amount ($${amount}) exceeds typical fee range`;
      } else {
        confidence = 0.40;
        isBankFee = false;
        reasoning = `Contains fee keywords but amount ($${amount}) below minimum fee threshold`;
      }
    } else if (!hasKeywords && isTypicalFee) {
      // No keywords but small amount - could be a fee
      confidence = 0.30;
      isBankFee = false; // Don't auto-classify without keywords
      reasoning = `Small amount ($${amount}) but no fee keywords detected`;
    } else {
      // No indication of being a fee
      confidence = 0.0;
      isBankFee = false;
      reasoning = 'Not classified as bank fee';
    }

    return {
      bankTxnId: txn.id,
      isBankFee,
      confidence,
      reasoning,
      detectedKeywords,
      algorithm: 'MT-03',
      bankId: txn.bankId,
      bankName: txn.bankName,
    };
  }

  /**
   * Detect fee keywords in transaction description
   */
  private detectKeywords(description: string): string[] {
    const detected: string[] = [];

    for (const keyword of this.FEE_KEYWORDS) {
      if (description.includes(keyword)) {
        detected.push(keyword);
      }
    }

    return detected;
  }

  /**
   * Get statistics about bank fee classifications
   */
  getClassificationStats(
    classifications: ClassificationDto[],
  ): {
    totalFees: number;
    avgFeeAmount: number;
    byBank: Record<string, number>;
    confidenceDistribution: {
      high: number; // >0.8
      medium: number; // 0.5-0.8
      low: number; // <0.5
    };
  } {
    const fees = classifications.filter((c) => c.isBankFee);
    const totalFees = fees.length;

    // Calculate average (would need transaction amounts, placeholder for now)
    const avgFeeAmount = 0; // Would need to track amounts

    // Group by bank
    const byBank: Record<string, number> = {};
    for (const fee of fees) {
      if (fee.bankId) {
        byBank[fee.bankId] = (byBank[fee.bankId] || 0) + 1;
      }
    }

    // Confidence distribution
    const confidenceDistribution = {
      high: fees.filter((f) => f.confidence > 0.8).length,
      medium: fees.filter((f) => f.confidence >= 0.5 && f.confidence <= 0.8).length,
      low: fees.filter((f) => f.confidence < 0.5).length,
    };

    return {
      totalFees,
      avgFeeAmount,
      byBank,
      confidenceDistribution,
    };
  }
}
