import { Transaction, TransactionMatch } from '../types/transaction';

/**
 * Match Approval Types and Utilities
 * Types and helper functions for the match approval workflow
 */

// ============================================================================
// TYPES
// ============================================================================

export type MatchApprovalStatus = 'pending' | 'approved' | 'rejected';

export type MatchConfidenceLevel = 'high' | 'medium' | 'low';

export interface MatchedPair {
  match: TransactionMatch;
  bankTransaction: Transaction;
  ledgerTransaction: Transaction;
}

export interface MatchApprovalFilter {
  search?: string;
  confidenceLevel?: MatchConfidenceLevel[];
  status?: MatchApprovalStatus[];
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  matchType?: ('automatic' | 'manual' | 'suggested')[];
  matchedBy?: string[];
}

export interface MatchApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  automatic: number;
  manual: number;
  totalAmount: number;
  approvalRate: number;  // Percentage
}

export interface BulkApprovalRequest {
  matchIds: string[];
  approvedBy: string;
  notes?: string;
}

export interface BulkRejectionRequest {
  matchIds: string[];
  rejectedBy: string;
  reason: string;
  notes?: string;
}

export interface MatchAuditEntry {
  timestamp: string;
  action: 'created' | 'approved' | 'rejected' | 'modified';
  user: string;
  details?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get confidence level from score
 */
export const getConfidenceLevel = (score: number): MatchConfidenceLevel => {
  if (score >= 85) return 'high';
  if (score >= 65) return 'medium';
  return 'low';
};

/**
 * Get confidence level color
 */
export const getConfidenceLevelColor = (level: MatchConfidenceLevel): string => {
  switch (level) {
    case 'high':
      return '#52c41a';  // Green
    case 'medium':
      return '#faad14';  // Orange
    case 'low':
      return '#ff4d4f';  // Red
    default:
      return '#d9d9d9';  // Gray
  }
};

/**
 * Get confidence level label
 */
export const getConfidenceLevelLabel = (level: MatchConfidenceLevel): string => {
  switch (level) {
    case 'high':
      return 'High Confidence';
    case 'medium':
      return 'Medium Confidence';
    case 'low':
      return 'Low Confidence';
    default:
      return level;
  }
};

/**
 * Get match type label
 */
export const getMatchTypeLabel = (type: 'automatic' | 'manual' | 'suggested'): string => {
  switch (type) {
    case 'automatic':
      return 'Auto-Matched';
    case 'manual':
      return 'Manual Match';
    case 'suggested':
      return 'Suggested';
    default:
      return type;
  }
};

/**
 * Get match type color
 */
export const getMatchTypeColor = (type: 'automatic' | 'manual' | 'suggested'): string => {
  switch (type) {
    case 'automatic':
      return 'success';
    case 'manual':
      return 'processing';
    case 'suggested':
      return 'warning';
    default:
      return 'default';
  }
};

/**
 * Get approval status color
 */
export const getApprovalStatusColor = (status: MatchApprovalStatus): string => {
  switch (status) {
    case 'pending':
      return 'processing';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Get approval status label
 */
export const getApprovalStatusLabel = (status: MatchApprovalStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pending Approval';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
};

/**
 * Calculate match approval statistics
 */
export const calculateMatchApprovalStats = (
  matches: TransactionMatch[]
): MatchApprovalStats => {
  const total = matches.length;
  const pending = matches.filter((m) => m.status === 'pending').length;
  const approved = matches.filter((m) => m.status === 'approved').length;
  const rejected = matches.filter((m) => m.status === 'rejected').length;

  const highConfidence = matches.filter((m) => m.matchConfidence >= 85).length;
  const mediumConfidence = matches.filter(
    (m) => m.matchConfidence >= 65 && m.matchConfidence < 85
  ).length;
  const lowConfidence = matches.filter((m) => m.matchConfidence < 65).length;

  const automatic = matches.filter((m) => m.matchType === 'automatic').length;
  const manual = matches.filter((m) => m.matchType === 'manual').length;

  // Note: Would need to join with transactions to get actual amounts
  const totalAmount = 0; // Placeholder

  const approvalRate = total > 0 ? (approved / total) * 100 : 0;

  return {
    total,
    pending,
    approved,
    rejected,
    highConfidence,
    mediumConfidence,
    lowConfidence,
    automatic,
    manual,
    totalAmount,
    approvalRate,
  };
};

/**
 * Filter matched pairs
 */
export const filterMatchedPairs = (
  pairs: MatchedPair[],
  filter: MatchApprovalFilter
): MatchedPair[] => {
  let result = [...pairs];

  // Search
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.bankTransaction.description.toLowerCase().includes(searchLower) ||
        p.ledgerTransaction.description.toLowerCase().includes(searchLower) ||
        p.bankTransaction.reference?.toLowerCase().includes(searchLower) ||
        p.ledgerTransaction.reference?.toLowerCase().includes(searchLower)
    );
  }

  // Confidence level
  if (filter.confidenceLevel && filter.confidenceLevel.length > 0) {
    result = result.filter((p) =>
      filter.confidenceLevel!.includes(getConfidenceLevel(p.match.matchConfidence))
    );
  }

  // Status
  if (filter.status && filter.status.length > 0) {
    result = result.filter((p) => filter.status!.includes(p.match.status as MatchApprovalStatus));
  }

  // Date range
  if (filter.dateFrom) {
    result = result.filter(
      (p) => new Date(p.bankTransaction.date) >= new Date(filter.dateFrom!)
    );
  }
  if (filter.dateTo) {
    result = result.filter(
      (p) => new Date(p.bankTransaction.date) <= new Date(filter.dateTo!)
    );
  }

  // Amount range
  if (filter.amountMin !== undefined) {
    result = result.filter((p) => Math.abs(p.bankTransaction.amount) >= filter.amountMin!);
  }
  if (filter.amountMax !== undefined) {
    result = result.filter((p) => Math.abs(p.bankTransaction.amount) <= filter.amountMax!);
  }

  // Match type
  if (filter.matchType && filter.matchType.length > 0) {
    result = result.filter((p) => filter.matchType!.includes(p.match.matchType));
  }

  // Matched by
  if (filter.matchedBy && filter.matchedBy.length > 0) {
    result = result.filter((p) => filter.matchedBy!.includes(p.match.matchedBy));
  }

  return result;
};

/**
 * Sort matched pairs
 */
export const sortMatchedPairs = (
  pairs: MatchedPair[],
  field: 'confidence' | 'date' | 'amount' | 'status',
  order: 'asc' | 'desc'
): MatchedPair[] => {
  const sorted = [...pairs];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (field) {
      case 'confidence':
        aValue = a.match.matchConfidence;
        bValue = b.match.matchConfidence;
        break;
      case 'date':
        aValue = new Date(a.bankTransaction.date).getTime();
        bValue = new Date(b.bankTransaction.date).getTime();
        break;
      case 'amount':
        aValue = Math.abs(a.bankTransaction.amount);
        bValue = Math.abs(b.bankTransaction.amount);
        break;
      case 'status':
        aValue = a.match.status;
        bValue = b.match.status;
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
 * Group matches by date
 */
export const groupMatchesByDate = (pairs: MatchedPair[]): Map<string, MatchedPair[]> => {
  const groups = new Map<string, MatchedPair[]>();

  pairs.forEach((pair) => {
    const date = pair.bankTransaction.date.split('T')[0]; // YYYY-MM-DD
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(pair);
  });

  return groups;
};

/**
 * Validate bulk approval
 */
export const validateBulkApproval = (
  matchIds: string[],
  matches: TransactionMatch[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (matchIds.length === 0) {
    errors.push('No matches selected');
  }

  matchIds.forEach((id) => {
    const match = matches.find((m) => m.id === id);
    if (!match) {
      errors.push(`Match ${id} not found`);
    } else if (match.status !== 'pending') {
      errors.push(`Match ${id} is already ${match.status}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Create audit entry
 */
export const createAuditEntry = (
  action: 'created' | 'approved' | 'rejected' | 'modified',
  user: string,
  details?: string
): MatchAuditEntry => {
  return {
    timestamp: new Date().toISOString(),
    action,
    user,
    details,
  };
};

/**
 * Format audit trail
 */
export const formatAuditTrail = (match: TransactionMatch): MatchAuditEntry[] => {
  const entries: MatchAuditEntry[] = [];

  // Created
  entries.push({
    timestamp: match.matchedAt,
    action: 'created',
    user: match.matchedBy,
    details: `Match created with ${match.matchConfidence}% confidence`,
  });

  // Approved
  if (match.status === 'approved' && match.approvedAt && match.approvedBy) {
    entries.push({
      timestamp: match.approvedAt,
      action: 'approved',
      user: match.approvedBy,
      details: match.notes,
    });
  }

  // Rejected
  if (match.status === 'rejected' && match.rejectedAt && match.rejectedBy) {
    entries.push({
      timestamp: match.rejectedAt,
      action: 'rejected',
      user: match.rejectedBy,
      details: match.rejectionReason || match.notes,
    });
  }

  return entries;
};

/**
 * Get recommended action based on confidence
 */
export const getRecommendedAction = (confidence: number): 'approve' | 'review' | 'reject' => {
  if (confidence >= 90) return 'approve';
  if (confidence >= 60) return 'review';
  return 'reject';
};

/**
 * Calculate difference summary between matched transactions
 */
export const calculateMatchDifferences = (
  bankTxn: Transaction,
  ledgerTxn: Transaction
): {
  amountDiff: number;
  dateDiff: number; // days
  descriptionSimilar: boolean;
  referenceSimilar: boolean;
} => {
  const amountDiff = Math.abs(Math.abs(bankTxn.amount) - Math.abs(ledgerTxn.amount));

  const date1 = new Date(bankTxn.date);
  const date2 = new Date(ledgerTxn.date);
  const dateDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);

  const desc1 = bankTxn.description.toLowerCase();
  const desc2 = ledgerTxn.description.toLowerCase();
  const descriptionSimilar = desc1.includes(desc2) || desc2.includes(desc1);

  const ref1 = bankTxn.reference?.toLowerCase() || '';
  const ref2 = ledgerTxn.reference?.toLowerCase() || '';
  const referenceSimilar = ref1.length > 0 && ref2.length > 0 && (ref1.includes(ref2) || ref2.includes(ref1));

  return {
    amountDiff,
    dateDiff,
    descriptionSimilar,
    referenceSimilar,
  };
};
