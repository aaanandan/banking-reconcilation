import { Transaction } from '../types/transaction';

/**
 * Matching Algorithms and Utilities
 * Algorithms for finding and scoring potential transaction matches
 */

// ============================================================================
// TYPES
// ============================================================================

export interface MatchCandidate {
  transaction: Transaction;
  score: number;           // Overall confidence score (0-100)
  matchReasons: MatchReason[];
  fieldScores: FieldScores;
}

export interface MatchReason {
  field: string;
  score: number;
  description: string;
}

export interface FieldScores {
  amount: number;          // 0-100
  date: number;            // 0-100
  description: number;     // 0-100
  reference: number;       // 0-100
}

export interface MatchingRules {
  // Amount matching
  amountTolerance: number;          // Absolute tolerance (e.g., 0.01 for 1 cent)
  amountTolerancePercent: number;   // Percentage tolerance (e.g., 0.1 for 0.1%)

  // Date matching
  maxDateDifferenceDays: number;    // Maximum days apart (e.g., 7)

  // Description matching
  descriptionMinSimilarity: number; // 0-1 (e.g., 0.6 for 60%)
  useDescriptionFuzzy: boolean;     // Use fuzzy matching

  // Reference matching
  requireReferenceMatch: boolean;   // Must reference match if present

  // Scoring weights
  weights: {
    amount: number;        // 0-1 (default 0.4)
    date: number;          // 0-1 (default 0.2)
    description: number;   // 0-1 (default 0.3)
    reference: number;     // 0-1 (default 0.1)
  };

  // Filtering
  minOverallScore: number;          // Minimum score to be considered (0-100)
  maxCandidates: number;            // Maximum number of candidates to return
}

// Default matching rules
export const DEFAULT_MATCHING_RULES: MatchingRules = {
  amountTolerance: 0.01,
  amountTolerancePercent: 0.1,
  maxDateDifferenceDays: 7,
  descriptionMinSimilarity: 0.6,
  useDescriptionFuzzy: true,
  requireReferenceMatch: false,
  weights: {
    amount: 0.4,
    date: 0.2,
    description: 0.3,
    reference: 0.1,
  },
  minOverallScore: 50,
  maxCandidates: 10,
};

// ============================================================================
// AMOUNT MATCHING
// ============================================================================

/**
 * Calculate amount match score
 */
export const calculateAmountScore = (
  amount1: number,
  amount2: number,
  rules: MatchingRules
): number => {
  const abs1 = Math.abs(amount1);
  const abs2 = Math.abs(amount2);
  const difference = Math.abs(abs1 - abs2);

  // Check absolute tolerance
  if (difference <= rules.amountTolerance) {
    return 100;
  }

  // Check percentage tolerance
  const percentDiff = (difference / Math.max(abs1, abs2)) * 100;
  if (percentDiff <= rules.amountTolerancePercent) {
    return 100 - percentDiff * 10; // Proportional score
  }

  // No match
  return 0;
};

// ============================================================================
// DATE MATCHING
// ============================================================================

/**
 * Calculate date match score
 */
export const calculateDateScore = (
  date1: string,
  date2: string,
  rules: MatchingRules
): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays === 0) {
    return 100; // Same day
  }

  if (diffDays <= rules.maxDateDifferenceDays) {
    // Linear decrease: 100 at 0 days, 0 at maxDateDifferenceDays
    return Math.max(0, 100 - (diffDays / rules.maxDateDifferenceDays) * 100);
  }

  return 0; // Too far apart
};

// ============================================================================
// DESCRIPTION MATCHING
// ============================================================================

/**
 * Calculate Levenshtein distance (edit distance)
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }

  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // Deletion
          dp[i][j - 1] + 1,     // Insertion
          dp[i - 1][j - 1] + 1  // Substitution
        );
      }
    }
  }

  return dp[m][n];
};

/**
 * Calculate similarity ratio (0-1)
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);

  return 1 - distance / maxLength;
};

/**
 * Normalize string for comparison
 */
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')        // Normalize whitespace
    .trim();
};

/**
 * Check if strings contain common keywords
 */
const hasCommonKeywords = (str1: string, str2: string): boolean => {
  const keywords1 = normalizeString(str1).split(' ').filter((w) => w.length > 3);
  const keywords2 = normalizeString(str2).split(' ').filter((w) => w.length > 3);

  const commonWords = keywords1.filter((word) => keywords2.includes(word));

  // At least 2 common words of length > 3
  return commonWords.length >= 2;
};

/**
 * Calculate description match score
 */
export const calculateDescriptionScore = (
  desc1: string,
  desc2: string,
  rules: MatchingRules
): number => {
  if (!desc1 || !desc2) return 0;

  // Normalize
  const norm1 = normalizeString(desc1);
  const norm2 = normalizeString(desc2);

  // Exact match
  if (norm1 === norm2) return 100;

  // Fuzzy matching
  if (rules.useDescriptionFuzzy) {
    const similarity = calculateSimilarity(norm1, norm2);

    if (similarity >= rules.descriptionMinSimilarity) {
      return similarity * 100;
    }

    // Check for common keywords
    if (hasCommonKeywords(norm1, norm2)) {
      return Math.max(similarity * 100, 60); // At least 60 if keywords match
    }
  }

  return 0;
};

// ============================================================================
// REFERENCE MATCHING
// ============================================================================

/**
 * Calculate reference match score
 */
export const calculateReferenceScore = (
  ref1: string | undefined,
  ref2: string | undefined,
  rules: MatchingRules
): number => {
  // If neither has reference, neutral score
  if (!ref1 && !ref2) return rules.requireReferenceMatch ? 0 : 50;

  // If only one has reference, low score
  if (!ref1 || !ref2) return rules.requireReferenceMatch ? 0 : 25;

  // Normalize
  const norm1 = normalizeString(ref1);
  const norm2 = normalizeString(ref2);

  // Exact match
  if (norm1 === norm2) return 100;

  // Partial match (one contains the other)
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 80;

  // Fuzzy match
  const similarity = calculateSimilarity(norm1, norm2);
  if (similarity >= 0.8) return similarity * 100;

  return rules.requireReferenceMatch ? 0 : 25;
};

// ============================================================================
// OVERALL MATCHING
// ============================================================================

/**
 * Calculate overall match score
 */
export const calculateOverallScore = (
  fieldScores: FieldScores,
  rules: MatchingRules
): number => {
  const { weights } = rules;

  const weightedScore =
    fieldScores.amount * weights.amount +
    fieldScores.date * weights.date +
    fieldScores.description * weights.description +
    fieldScores.reference * weights.reference;

  // Normalize to 0-100 (weights should sum to 1.0)
  const totalWeight = weights.amount + weights.date + weights.description + weights.reference;

  return (weightedScore / totalWeight) * 100;
};

/**
 * Generate match reasons
 */
export const generateMatchReasons = (
  fieldScores: FieldScores
): MatchReason[] => {
  const reasons: MatchReason[] = [];

  if (fieldScores.amount === 100) {
    reasons.push({
      field: 'amount',
      score: 100,
      description: 'Exact amount match',
    });
  } else if (fieldScores.amount > 90) {
    reasons.push({
      field: 'amount',
      score: fieldScores.amount,
      description: 'Very close amount match',
    });
  } else if (fieldScores.amount > 0) {
    reasons.push({
      field: 'amount',
      score: fieldScores.amount,
      description: 'Amount within tolerance',
    });
  }

  if (fieldScores.date === 100) {
    reasons.push({
      field: 'date',
      score: 100,
      description: 'Same date',
    });
  } else if (fieldScores.date > 80) {
    reasons.push({
      field: 'date',
      score: fieldScores.date,
      description: 'Dates very close',
    });
  } else if (fieldScores.date > 0) {
    reasons.push({
      field: 'date',
      score: fieldScores.date,
      description: 'Dates within acceptable range',
    });
  }

  if (fieldScores.description === 100) {
    reasons.push({
      field: 'description',
      score: 100,
      description: 'Exact description match',
    });
  } else if (fieldScores.description > 80) {
    reasons.push({
      field: 'description',
      score: fieldScores.description,
      description: 'Very similar descriptions',
    });
  } else if (fieldScores.description > 60) {
    reasons.push({
      field: 'description',
      score: fieldScores.description,
      description: 'Similar descriptions',
    });
  }

  if (fieldScores.reference === 100) {
    reasons.push({
      field: 'reference',
      score: 100,
      description: 'Exact reference match',
    });
  } else if (fieldScores.reference > 80) {
    reasons.push({
      field: 'reference',
      score: fieldScores.reference,
      description: 'Similar references',
    });
  }

  return reasons;
};

/**
 * Find matching candidates for a transaction
 */
export const findMatchingCandidates = (
  sourceTransaction: Transaction,
  potentialMatches: Transaction[],
  rules: MatchingRules = DEFAULT_MATCHING_RULES
): MatchCandidate[] => {
  const candidates: MatchCandidate[] = [];

  for (const target of potentialMatches) {
    // Skip if same transaction
    if (sourceTransaction.id === target.id) continue;

    // Skip if same source (can't match bank to bank or ledger to ledger)
    if (sourceTransaction.source === target.source) continue;

    // Calculate field scores
    const fieldScores: FieldScores = {
      amount: calculateAmountScore(
        sourceTransaction.amount,
        target.amount,
        rules
      ),
      date: calculateDateScore(
        sourceTransaction.date,
        target.date,
        rules
      ),
      description: calculateDescriptionScore(
        sourceTransaction.description,
        target.description,
        rules
      ),
      reference: calculateReferenceScore(
        sourceTransaction.reference,
        target.reference,
        rules
      ),
    };

    // Calculate overall score
    const score = calculateOverallScore(fieldScores, rules);

    // Filter by minimum score
    if (score < rules.minOverallScore) continue;

    // Generate match reasons
    const matchReasons = generateMatchReasons(fieldScores);

    candidates.push({
      transaction: target,
      score,
      matchReasons,
      fieldScores,
    });
  }

  // Sort by score (descending)
  candidates.sort((a, b) => b.score - a.score);

  // Limit number of candidates
  return candidates.slice(0, rules.maxCandidates);
};

/**
 * Auto-match transactions with high confidence
 */
export const autoMatchTransactions = (
  bankTransactions: Transaction[],
  ledgerTransactions: Transaction[],
  minConfidence: number = 95,
  rules: MatchingRules = DEFAULT_MATCHING_RULES
): Array<{ bank: Transaction; ledger: Transaction; score: number }> => {
  const matches: Array<{ bank: Transaction; ledger: Transaction; score: number }> = [];
  const usedLedger = new Set<string>();

  for (const bankTxn of bankTransactions) {
    // Skip if already matched
    if (bankTxn.matchId) continue;

    // Find candidates
    const candidates = findMatchingCandidates(bankTxn, ledgerTransactions, rules);

    // Get best match if above threshold
    if (candidates.length > 0 && candidates[0].score >= minConfidence) {
      const best = candidates[0];

      // Skip if already used
      if (usedLedger.has(best.transaction.id)) continue;

      matches.push({
        bank: bankTxn,
        ledger: best.transaction,
        score: best.score,
      });

      usedLedger.add(best.transaction.id);
    }
  }

  return matches;
};
