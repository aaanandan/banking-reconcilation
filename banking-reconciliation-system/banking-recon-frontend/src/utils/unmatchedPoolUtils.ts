import { Transaction } from '../types/transaction';

/**
 * Unmatched Pool Types and Utilities
 * Helper functions for managing unmatched transactions
 */

// ============================================================================
// TYPES
// ============================================================================

export type UnmatchedSource = 'bank' | 'ledger' | 'both';

export interface UnmatchedFilter {
  search?: string;
  source?: UnmatchedSource[];
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  hasAlternatives?: boolean;
}

export interface UnmatchedStats {
  total: number;
  bankUnmatched: number;
  ledgerUnmatched: number;
  withAlternatives: number;
  withoutAlternatives: number;
  totalUnmatchedAmount: number;
  oldestUnmatched: string | null;
  averageDaysUnmatched: number;
}

export interface AlternativeMatch {
  transaction: Transaction;
  confidence: number;
  reasons: string[];
  scores: {
    amount: number;
    date: number;
    description: number;
    reference: number;
  };
}

export interface UnmatchedTransaction {
  transaction: Transaction;
  daysUnmatched: number;
  alternativeMatches: AlternativeMatch[];
  hasHighConfidenceAlternative: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate days since transaction date
 */
export const calculateDaysUnmatched = (transactionDate: string): number => {
  const txDate = new Date(transactionDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - txDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get urgency level based on days unmatched
 */
export const getUrgencyLevel = (daysUnmatched: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (daysUnmatched >= 90) return 'critical';
  if (daysUnmatched >= 60) return 'high';
  if (daysUnmatched >= 30) return 'medium';
  return 'low';
};

/**
 * Get urgency color
 */
export const getUrgencyColor = (urgency: 'low' | 'medium' | 'high' | 'critical'): string => {
  switch (urgency) {
    case 'critical':
      return '#cf1322';  // Dark Red
    case 'high':
      return '#ff4d4f';  // Red
    case 'medium':
      return '#faad14';  // Orange
    case 'low':
      return '#52c41a';  // Green
    default:
      return '#d9d9d9';  // Gray
  }
};

/**
 * Get urgency label
 */
export const getUrgencyLabel = (urgency: 'low' | 'medium' | 'high' | 'critical'): string => {
  switch (urgency) {
    case 'critical':
      return 'Critical (90+ days)';
    case 'high':
      return 'High (60-89 days)';
    case 'medium':
      return 'Medium (30-59 days)';
    case 'low':
      return 'Low (<30 days)';
    default:
      return urgency;
  }
};

/**
 * Calculate unmatched statistics
 */
export const calculateUnmatchedStats = (
  unmatchedTransactions: UnmatchedTransaction[]
): UnmatchedStats => {
  const total = unmatchedTransactions.length;

  const bankUnmatched = unmatchedTransactions.filter(
    (ut) => ut.transaction.source === 'bank_statement'
  ).length;

  const ledgerUnmatched = unmatchedTransactions.filter(
    (ut) => ut.transaction.source === 'ledger'
  ).length;

  const withAlternatives = unmatchedTransactions.filter(
    (ut) => ut.alternativeMatches.length > 0
  ).length;

  const withoutAlternatives = total - withAlternatives;

  const totalUnmatchedAmount = unmatchedTransactions.reduce(
    (sum, ut) => sum + Math.abs(ut.transaction.amount),
    0
  );

  // Find oldest unmatched
  let oldestUnmatched: string | null = null;
  let maxDays = 0;
  unmatchedTransactions.forEach((ut) => {
    if (ut.daysUnmatched > maxDays) {
      maxDays = ut.daysUnmatched;
      oldestUnmatched = ut.transaction.date;
    }
  });

  // Calculate average days unmatched
  const averageDaysUnmatched = total > 0
    ? unmatchedTransactions.reduce((sum, ut) => sum + ut.daysUnmatched, 0) / total
    : 0;

  return {
    total,
    bankUnmatched,
    ledgerUnmatched,
    withAlternatives,
    withoutAlternatives,
    totalUnmatchedAmount,
    oldestUnmatched,
    averageDaysUnmatched,
  };
};

/**
 * Filter unmatched transactions
 */
export const filterUnmatchedTransactions = (
  transactions: UnmatchedTransaction[],
  filter: UnmatchedFilter
): UnmatchedTransaction[] => {
  let result = [...transactions];

  // Search
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    result = result.filter(
      (ut) =>
        ut.transaction.description.toLowerCase().includes(searchLower) ||
        ut.transaction.reference?.toLowerCase().includes(searchLower) ||
        ut.transaction.payee?.toLowerCase().includes(searchLower)
    );
  }

  // Source
  if (filter.source && filter.source.length > 0) {
    result = result.filter((ut) => {
      const isBankSource = ut.transaction.source === 'bank_statement';
      const isLedgerSource = ut.transaction.source === 'ledger';

      if (filter.source!.includes('bank') && isBankSource) return true;
      if (filter.source!.includes('ledger') && isLedgerSource) return true;
      if (filter.source!.includes('both')) return true;

      return false;
    });
  }

  // Date range
  if (filter.dateFrom) {
    result = result.filter(
      (ut) => new Date(ut.transaction.date) >= new Date(filter.dateFrom!)
    );
  }
  if (filter.dateTo) {
    result = result.filter(
      (ut) => new Date(ut.transaction.date) <= new Date(filter.dateTo!)
    );
  }

  // Amount range
  if (filter.amountMin !== undefined) {
    result = result.filter((ut) => Math.abs(ut.transaction.amount) >= filter.amountMin!);
  }
  if (filter.amountMax !== undefined) {
    result = result.filter((ut) => Math.abs(ut.transaction.amount) <= filter.amountMax!);
  }

  // Has alternatives
  if (filter.hasAlternatives !== undefined) {
    result = result.filter((ut) => {
      const hasAlts = ut.alternativeMatches.length > 0;
      return filter.hasAlternatives ? hasAlts : !hasAlts;
    });
  }

  return result;
};

/**
 * Sort unmatched transactions
 */
export const sortUnmatchedTransactions = (
  transactions: UnmatchedTransaction[],
  field: 'date' | 'amount' | 'daysUnmatched' | 'alternatives',
  order: 'asc' | 'desc'
): UnmatchedTransaction[] => {
  const sorted = [...transactions];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (field) {
      case 'date':
        aValue = new Date(a.transaction.date).getTime();
        bValue = new Date(b.transaction.date).getTime();
        break;
      case 'amount':
        aValue = Math.abs(a.transaction.amount);
        bValue = Math.abs(b.transaction.amount);
        break;
      case 'daysUnmatched':
        aValue = a.daysUnmatched;
        bValue = b.daysUnmatched;
        break;
      case 'alternatives':
        aValue = a.alternativeMatches.length;
        bValue = b.alternativeMatches.length;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
};

/**
 * Group unmatched transactions by urgency
 */
export const groupByUrgency = (
  transactions: UnmatchedTransaction[]
): Map<'low' | 'medium' | 'high' | 'critical', UnmatchedTransaction[]> => {
  const groups = new Map<'low' | 'medium' | 'high' | 'critical', UnmatchedTransaction[]>();

  groups.set('critical', []);
  groups.set('high', []);
  groups.set('medium', []);
  groups.set('low', []);

  transactions.forEach((ut) => {
    const urgency = getUrgencyLevel(ut.daysUnmatched);
    groups.get(urgency)!.push(ut);
  });

  return groups;
};

/**
 * Group by source
 */
export const groupBySource = (
  transactions: UnmatchedTransaction[]
): Map<'bank' | 'ledger', UnmatchedTransaction[]> => {
  const groups = new Map<'bank' | 'ledger', UnmatchedTransaction[]>();

  groups.set('bank', []);
  groups.set('ledger', []);

  transactions.forEach((ut) => {
    const sourceKey = ut.transaction.source === 'bank_statement' ? 'bank' : 'ledger';
    groups.get(sourceKey)!.push(ut);
  });

  return groups;
};

/**
 * Get recommended action for unmatched transaction
 */
export const getRecommendedAction = (
  unmatched: UnmatchedTransaction
): 'auto_match' | 'review' | 'manual_match' | 'investigate' => {
  // Has high confidence alternative (>=90%)
  if (unmatched.hasHighConfidenceAlternative) {
    return 'auto_match';
  }

  // Has some alternatives (>=60%)
  const hasGoodAlternative = unmatched.alternativeMatches.some((alt) => alt.confidence >= 60);
  if (hasGoodAlternative) {
    return 'review';
  }

  // Recent transaction (<30 days) with no alternatives
  if (unmatched.daysUnmatched < 30 && unmatched.alternativeMatches.length === 0) {
    return 'manual_match';
  }

  // Old transaction (>=60 days) with no good alternatives
  if (unmatched.daysUnmatched >= 60) {
    return 'investigate';
  }

  return 'manual_match';
};

/**
 * Get action label
 */
export const getActionLabel = (action: 'auto_match' | 'review' | 'manual_match' | 'investigate'): string => {
  switch (action) {
    case 'auto_match':
      return 'Auto-Match Available';
    case 'review':
      return 'Review Alternatives';
    case 'manual_match':
      return 'Manual Match Needed';
    case 'investigate':
      return 'Requires Investigation';
    default:
      return action;
  }
};

/**
 * Get action color
 */
export const getActionColor = (action: 'auto_match' | 'review' | 'manual_match' | 'investigate'): string => {
  switch (action) {
    case 'auto_match':
      return 'success';
    case 'review':
      return 'processing';
    case 'manual_match':
      return 'warning';
    case 'investigate':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Format alternative match summary
 */
export const formatAlternativeMatchSummary = (alternative: AlternativeMatch): string => {
  const topReasons = alternative.reasons.slice(0, 2);
  return `${alternative.confidence}% - ${topReasons.join(', ')}`;
};
