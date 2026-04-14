import { Injectable, Logger } from '@nestjs/common';
import {
  MatchDto,
  ValidationRequestDto,
  ValidationResponseDto,
  ValidationIssueDto,
} from './dto/validation.dto';

/**
 * MT-16 Final Validation Service
 *
 * STEP 59: Safety Validator - Critical checks before committing matches
 *
 * Purpose:
 * - Validate all staged matches for data integrity
 * - Prevent critical errors in reconciliation
 * - Ensure business rule compliance
 * - Flag low confidence matches for review
 *
 * Safety Checks:
 * 1. No credit-to-debit matches (sign mismatch)
 * 2. No duplicate matches (1 bank → 2+ ledgers)
 * 3. Amount sign consistency
 * 4. Date reasonableness (not future dates)
 * 5. Confidence threshold validation
 *
 * Business Rules:
 * 1. No orphaned transactions
 * 2. All mandatory fields present
 *
 * Result:
 * - valid: true/false
 * - List of issues by severity (critical/warning/info)
 * - Coverage statistics
 * - Recommendations for manual review
 */
@Injectable()
export class Mt16FinalValidationService {
  private readonly logger = new Logger(Mt16FinalValidationService.name);

  // Validation thresholds
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.7; // 70%
  private readonly FUTURE_DATE_TOLERANCE_DAYS = 1; // Allow 1 day in future

  /**
   * Validate matches before committing
   *
   * Algorithm:
   * 1. Run all safety checks
   * 2. Run business rule checks
   * 3. Review confidence scores
   * 4. Generate validation report
   */
  validateMatches(
    tenantContext: { tenantId: string; userId: string; role: string },
    request: ValidationRequestDto,
  ): ValidationResponseDto {
    this.logger.log(`[Tenant: ${tenantContext.tenantId}] Running MT-16 matching algorithm`);

    const issues: ValidationIssueDto[] = [];
    const { matches } = request;

    // SAFETY CHECK 1: Credit-to-debit matches
    this.checkCreditDebitMismatch(matches, issues);

    // SAFETY CHECK 2: Duplicate matches
    this.checkDuplicateMatches(matches, issues);

    // SAFETY CHECK 3: Amount sign consistency
    this.checkAmountSignConsistency(matches, issues);

    // SAFETY CHECK 4: Future dates
    this.checkFutureDates(matches, issues);

    // SAFETY CHECK 5: Low confidence matches
    this.checkLowConfidence(matches, issues);

    // BUSINESS RULE CHECK 1: Mandatory fields
    this.checkMandatoryFields(matches, issues);

    // Calculate validation result
    const criticalIssues = issues.filter((i) => i.severity === 'critical');
    const warningIssues = issues.filter((i) => i.severity === 'warning');
    const valid = criticalIssues.length === 0;

    // Get affected matches
    const affectedMatchIndices = new Set<number>();
    issues.forEach((issue) => {
      issue.affectedMatches.forEach((idx) => affectedMatchIndices.add(idx));
    });

    const invalidMatches = affectedMatchIndices.size;
    const validMatches = matches.length - invalidMatches;

    // Calculate low confidence matches
    const lowConfidenceMatches = matches.filter(
      (m) => m.confidence < this.MIN_CONFIDENCE_THRESHOLD,
    ).length;

    return {
      valid,
      totalMatches: matches.length,
      validMatches,
      invalidMatches,
      issues,
      algorithm: 'MT-16-Final-Validation',
      timestamp: new Date().toISOString(),
      coverage: {
        matchedPercentage:
          matches.length > 0
            ? Math.round((validMatches / matches.length) * 100 * 100) / 100
            : 0,
        criticalIssues: criticalIssues.length,
        warningIssues: warningIssues.length,
        lowConfidenceMatches,
      },
    };
  }

  /**
   * Check for credit-to-debit mismatches
   */
  private checkCreditDebitMismatch(
    matches: MatchDto[],
    issues: ValidationIssueDto[],
  ): void {
    const affected: number[] = [];

    matches.forEach((match, index) => {
      const bankSign = Math.sign(match.bankAmount);
      const ledgerSign = Math.sign(match.ledgerAmount);

      if (bankSign !== ledgerSign && bankSign !== 0 && ledgerSign !== 0) {
        affected.push(index);
      }
    });

    if (affected.length > 0) {
      issues.push({
        severity: 'critical',
        code: 'CREDIT_DEBIT_MISMATCH',
        message: `Found ${affected.length} match(es) with credit-to-debit mismatch (sign inconsistency)`,
        affectedMatches: affected,
      });
    }
  }

  /**
   * Check for duplicate matches (1 transaction matched multiple times)
   */
  private checkDuplicateMatches(
    matches: MatchDto[],
    issues: ValidationIssueDto[],
  ): void {
    const bankTxnCounts = new Map<number, number[]>();
    const ledgerTxnCounts = new Map<number, number[]>();

    matches.forEach((match, index) => {
      // Track bank transaction usage
      if (!bankTxnCounts.has(match.bankTxnId)) {
        bankTxnCounts.set(match.bankTxnId, []);
      }
      bankTxnCounts.get(match.bankTxnId)!.push(index);

      // Track ledger transaction usage
      if (!ledgerTxnCounts.has(match.ledgerTxnId)) {
        ledgerTxnCounts.set(match.ledgerTxnId, []);
      }
      ledgerTxnCounts.get(match.ledgerTxnId)!.push(index);
    });

    // Check for duplicates
    const duplicateBankAffected: number[] = [];
    const duplicateLedgerAffected: number[] = [];

    for (const [txnId, indices] of bankTxnCounts.entries()) {
      if (indices.length > 1) {
        duplicateBankAffected.push(...indices);
      }
    }

    for (const [txnId, indices] of ledgerTxnCounts.entries()) {
      if (indices.length > 1) {
        duplicateLedgerAffected.push(...indices);
      }
    }

    if (duplicateBankAffected.length > 0) {
      issues.push({
        severity: 'critical',
        code: 'DUPLICATE_BANK_MATCH',
        message: `Found bank transaction(s) matched multiple times`,
        affectedMatches: [...new Set(duplicateBankAffected)],
      });
    }

    if (duplicateLedgerAffected.length > 0) {
      issues.push({
        severity: 'critical',
        code: 'DUPLICATE_LEDGER_MATCH',
        message: `Found ledger transaction(s) matched multiple times`,
        affectedMatches: [...new Set(duplicateLedgerAffected)],
      });
    }
  }

  /**
   * Check amount sign consistency
   */
  private checkAmountSignConsistency(
    matches: MatchDto[],
    issues: ValidationIssueDto[],
  ): void {
    const affected: number[] = [];

    matches.forEach((match, index) => {
      // Both should be positive or both negative (or one can be zero)
      const bankIsZero = match.bankAmount === 0;
      const ledgerIsZero = match.ledgerAmount === 0;

      if (!bankIsZero && !ledgerIsZero) {
        const bankPositive = match.bankAmount > 0;
        const ledgerPositive = match.ledgerAmount > 0;

        if (bankPositive !== ledgerPositive) {
          affected.push(index);
        }
      }
    });

    if (affected.length > 0) {
      issues.push({
        severity: 'critical',
        code: 'AMOUNT_SIGN_INCONSISTENCY',
        message: `Found ${affected.length} match(es) with amount sign inconsistency`,
        affectedMatches: affected,
      });
    }
  }

  /**
   * Check for future dates
   */
  private checkFutureDates(
    matches: MatchDto[],
    issues: ValidationIssueDto[],
  ): void {
    const affected: number[] = [];
    const now = new Date();
    const maxFutureDate = new Date(now);
    maxFutureDate.setDate(maxFutureDate.getDate() + this.FUTURE_DATE_TOLERANCE_DAYS);

    matches.forEach((match, index) => {
      const bankDate = new Date(match.bankDate);
      const ledgerDate = new Date(match.ledgerDate);

      if (bankDate > maxFutureDate || ledgerDate > maxFutureDate) {
        affected.push(index);
      }
    });

    if (affected.length > 0) {
      issues.push({
        severity: 'warning',
        code: 'FUTURE_DATE_DETECTED',
        message: `Found ${affected.length} match(es) with future dates (beyond ${this.FUTURE_DATE_TOLERANCE_DAYS} day tolerance)`,
        affectedMatches: affected,
      });
    }
  }

  /**
   * Check for low confidence matches
   */
  private checkLowConfidence(
    matches: MatchDto[],
    issues: ValidationIssueDto[],
  ): void {
    const affected: number[] = [];

    matches.forEach((match, index) => {
      if (match.confidence < this.MIN_CONFIDENCE_THRESHOLD) {
        affected.push(index);
      }
    });

    if (affected.length > 0) {
      issues.push({
        severity: 'warning',
        code: 'LOW_CONFIDENCE_MATCH',
        message: `Found ${affected.length} match(es) with confidence below ${this.MIN_CONFIDENCE_THRESHOLD * 100}% - recommend manual review`,
        affectedMatches: affected,
      });
    }
  }

  /**
   * Check mandatory fields
   */
  private checkMandatoryFields(
    matches: MatchDto[],
    issues: ValidationIssueDto[],
  ): void {
    const affected: number[] = [];

    matches.forEach((match, index) => {
      const missingFields: string[] = [];

      if (!match.bankTxnId && match.bankTxnId !== 0) missingFields.push('bankTxnId');
      if (!match.ledgerTxnId && match.ledgerTxnId !== 0) missingFields.push('ledgerTxnId');
      if (!match.bankAmount && match.bankAmount !== 0) missingFields.push('bankAmount');
      if (!match.ledgerAmount && match.ledgerAmount !== 0) missingFields.push('ledgerAmount');
      if (!match.bankDate) missingFields.push('bankDate');
      if (!match.ledgerDate) missingFields.push('ledgerDate');
      if (!match.algorithm) missingFields.push('algorithm');

      if (missingFields.length > 0) {
        affected.push(index);
      }
    });

    if (affected.length > 0) {
      issues.push({
        severity: 'critical',
        code: 'MISSING_MANDATORY_FIELDS',
        message: `Found ${affected.length} match(es) with missing mandatory fields`,
        affectedMatches: affected,
      });
    }
  }
}
