import { Injectable } from '@nestjs/common';
import { TransactionDto } from '@app/shared';
import {
  FuzzyMatchRequestDto,
  FuzzyMatchResponseDto,
  FuzzyMatchCandidateDto,
  FuzzyThresholdsDto,
} from './dto/fuzzy-match.dto';

/**
 * MT-02 Near-Exact Match Service
 * Implements fuzzy matching algorithms for transactions with minor variations
 *
 * Algorithm:
 * - Date tolerance: ±N days (configurable)
 * - Amount tolerance: ±X% (configurable)
 * - Description similarity: Levenshtein distance (configurable threshold)
 * - Weighted confidence: date 30% + amount 40% + description 30%
 */
@Injectable()
export class Mt02NearExactService {
  /**
   * Default thresholds for fuzzy matching
   */
  private readonly DEFAULT_THRESHOLDS: FuzzyThresholdsDto = {
    dateTolerance: 2, // ±2 days
    amountTolerance: 0.05, // ±5%
    descriptionSimilarity: 0.7, // 70% similarity minimum
    minConfidence: 0.7, // 70% overall confidence minimum
  };

  /**
   * Weights for confidence calculation
   */
  private readonly WEIGHTS = {
    date: 0.3,
    amount: 0.4,
    description: 0.3,
  };

  /**
   * Find fuzzy matches between bank and ledger transactions
   * Step 28: Fuzzy matching with configurable tolerances
   *
   * @param request - Bank transactions, ledger transactions, and optional thresholds
   * @returns Match candidates with confidence scores and detailed breakdowns
   */
  findFuzzyMatches(request: FuzzyMatchRequestDto): FuzzyMatchResponseDto {
    const thresholds = request.thresholds || this.DEFAULT_THRESHOLDS;
    const matches: FuzzyMatchCandidateDto[] = [];
    const { bankTransactions, ledgerTransactions } = request;

    // Track matched ledger IDs to prevent duplicates (1:1 matching)
    const matchedLedgerIds = new Set<number>();

    for (const bankTxn of bankTransactions) {
      let bestMatch: FuzzyMatchCandidateDto | null = null;
      let bestConfidence = 0;

      for (const ledgerTxn of ledgerTransactions) {
        // Skip if ledger transaction already matched
        if (matchedLedgerIds.has(ledgerTxn.id)) {
          continue;
        }

        // Calculate individual scores
        const dateScore = this.fuzzyDateMatch(
          bankTxn.date,
          ledgerTxn.date,
          thresholds.dateTolerance,
        );

        const amountScore = this.fuzzyAmountMatch(
          bankTxn.amount,
          ledgerTxn.amount,
          thresholds.amountTolerance,
        );

        const descScore = this.fuzzyDescriptionMatch(
          bankTxn.description,
          ledgerTxn.description,
          thresholds.descriptionSimilarity,
        );

        // Calculate weighted confidence
        const confidence =
          dateScore * this.WEIGHTS.date +
          amountScore * this.WEIGHTS.amount +
          descScore * this.WEIGHTS.description;

        // Check if this match meets minimum confidence threshold
        if (confidence >= thresholds.minConfidence && confidence > bestConfidence) {
          bestConfidence = confidence;
          bestMatch = {
            bankTxnId: bankTxn.id,
            ledgerTxnId: ledgerTxn.id,
            confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
            scores: {
              date: Math.round(dateScore * 100) / 100,
              amount: Math.round(amountScore * 100) / 100,
              description: Math.round(descScore * 100) / 100,
            },
            reasoning: this.generateReasoning(confidence, dateScore, amountScore, descScore),
            algorithm: 'MT-02',
            bankId: bankTxn.bankId,
            bankName: bankTxn.bankName,
          };
        }
      }

      // Add best match for this bank transaction (if found)
      if (bestMatch) {
        matches.push(bestMatch);
        matchedLedgerIds.add(bestMatch.ledgerTxnId);
      }
    }

    return {
      matches,
      totalMatches: matches.length,
      algorithm: 'MT-02-Fuzzy',
      thresholds,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Fuzzy date matching with tolerance
   * Score: 1.0 if exact, decreases linearly within tolerance, 0.0 if beyond tolerance
   *
   * @param date1 - First date (YYYY-MM-DD)
   * @param date2 - Second date (YYYY-MM-DD)
   * @param tolerance - Tolerance in days (±)
   * @returns Score from 0.0 to 1.0
   */
  private fuzzyDateMatch(date1: string, date2: string, tolerance: number): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffMs = Math.abs(d1.getTime() - d2.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays === 0) return 1.0; // Exact match
    if (diffDays <= tolerance) {
      // Linear decrease: 1.0 at 0 days, 0.5 at tolerance
      return 1.0 - (diffDays / tolerance) * 0.5;
    }
    return 0.0; // Beyond tolerance
  }

  /**
   * Fuzzy amount matching with percentage tolerance
   * Score: 1.0 if exact, decreases linearly within tolerance, 0.0 if beyond tolerance
   *
   * @param amt1 - First amount
   * @param amt2 - Second amount
   * @param tolerance - Tolerance as percentage (0.01 = 1%)
   * @returns Score from 0.0 to 1.0
   */
  private fuzzyAmountMatch(amt1: number, amt2: number, tolerance: number): number {
    const diff = Math.abs(amt1 - amt2);
    if (diff === 0) return 1.0; // Exact match

    const threshold = amt1 * tolerance;
    if (diff <= threshold) {
      // Linear decrease: 1.0 at 0 diff, 0.5 at threshold
      return 1.0 - (diff / threshold) * 0.5;
    }
    return 0.0; // Beyond tolerance
  }

  /**
   * Fuzzy description matching using Levenshtein distance
   * Score: 1.0 if exact, similarity based on Levenshtein, 0.0 if below threshold
   *
   * @param desc1 - First description
   * @param desc2 - Second description
   * @param minSimilarity - Minimum similarity threshold (0.0 to 1.0)
   * @returns Score from 0.0 to 1.0
   */
  private fuzzyDescriptionMatch(
    desc1: string,
    desc2: string,
    minSimilarity: number,
  ): number {
    const s1 = desc1.toLowerCase().trim();
    const s2 = desc2.toLowerCase().trim();

    if (s1 === s2) return 1.0; // Exact match

    const similarity = this.levenshteinSimilarity(s1, s2);
    return similarity >= minSimilarity ? similarity : 0.0;
  }

  /**
   * Calculate Levenshtein similarity between two strings
   * Returns similarity score from 0.0 (completely different) to 1.0 (identical)
   *
   * @param s1 - First string
   * @param s2 - Second string
   * @returns Similarity score (0.0 to 1.0)
   */
  private levenshteinSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Uses dynamic programming approach
   *
   * @param s1 - First string
   * @param s2 - Second string
   * @returns Edit distance (number of edits needed)
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const matrix: number[][] = [];

    // Initialize first column
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    // Initialize first row
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]; // No change needed
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // Substitution
            matrix[i][j - 1] + 1, // Insertion
            matrix[i - 1][j] + 1, // Deletion
          );
        }
      }
    }

    return matrix[s2.length][s1.length];
  }

  /**
   * Generate human-readable reasoning for a match
   *
   * @param confidence - Overall confidence score
   * @param dateScore - Date match score
   * @param amountScore - Amount match score
   * @param descScore - Description match score
   * @returns Reasoning string
   */
  private generateReasoning(
    confidence: number,
    dateScore: number,
    amountScore: number,
    descScore: number,
  ): string {
    const confidencePercent = (confidence * 100).toFixed(0);
    const parts: string[] = [];

    if (dateScore >= 0.9) parts.push('date match');
    else if (dateScore >= 0.7) parts.push('date near-match');

    if (amountScore >= 0.9) parts.push('amount match');
    else if (amountScore >= 0.7) parts.push('amount near-match');

    if (descScore >= 0.9) parts.push('description match');
    else if (descScore >= 0.7) parts.push('description similar');

    return `Fuzzy match (${confidencePercent}% confidence): ${parts.join(', ')}`;
  }
}
