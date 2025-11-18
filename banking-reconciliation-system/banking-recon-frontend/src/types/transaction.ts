/**
 * Transaction Types and Interfaces
 * Core types for banking transactions
 */

export type TransactionStatus =
  | 'pending'       // Uploaded, not yet reviewed
  | 'reviewed'      // Reviewed but not matched
  | 'matched'       // Matched with another transaction
  | 'unmatched'     // Marked as unmatched
  | 'approved'      // Match approved
  | 'rejected';     // Match rejected

export type TransactionType =
  | 'debit'
  | 'credit'
  | 'both';         // For transactions with both debit and credit

export type TransactionSource =
  | 'bank_statement'
  | 'internal_ledger'
  | 'manual_entry';

export interface Transaction {
  id: string;
  tenantId: string;

  // Core fields
  date: string;              // ISO date string
  amount: number;            // Positive number
  description: string;

  // Optional fields
  reference?: string;
  payee?: string;
  category?: string;
  balance?: number;

  // Debit/Credit (if using split columns)
  debit?: number;
  credit?: number;

  // Metadata
  transactionType: TransactionType;
  source: TransactionSource;
  status: TransactionStatus;
  uploadId: string;          // Reference to file upload

  // Matching
  matchId?: string;          // Reference to matched transaction
  matchConfidence?: number;  // 0-100

  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  reviewedBy?: string;
  reviewedAt?: string;

  // Raw data
  rawData?: Record<string, any>;  // Original CSV row data
}

export interface TransactionFilter {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  status?: TransactionStatus[];
  type?: TransactionType[];
  source?: TransactionSource[];
  category?: string[];
  payee?: string[];
  matched?: boolean;      // Filter by matched/unmatched
  uploadId?: string;      // Filter by specific upload
}

export interface TransactionSortConfig {
  field: keyof Transaction;
  order: 'asc' | 'desc';
}

export interface TransactionListState {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  selectedTransactions: string[];  // IDs
  filter: TransactionFilter;
  sort: TransactionSortConfig;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  loading: boolean;
  error?: string;
}

export interface TransactionMatch {
  id: string;
  tenantId: string;
  bankTransactionId: string;
  ledgerTransactionId: string;
  matchConfidence: number;
  matchType: 'automatic' | 'manual' | 'suggested';
  matchedFields: string[];  // Which fields matched
  status: 'pending' | 'approved' | 'rejected';
  matchedBy: string;
  matchedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface TransactionStats {
  total: number;
  pending: number;
  reviewed: number;
  matched: number;
  unmatched: number;
  approved: number;
  rejected: number;
  totalAmount: number;
  matchRate: number;      // Percentage
}

export interface TransactionGroup {
  date: string;
  transactions: Transaction[];
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

// Utility type guards
export const isPending = (transaction: Transaction): boolean =>
  transaction.status === 'pending';

export const isMatched = (transaction: Transaction): boolean =>
  transaction.status === 'matched' || transaction.status === 'approved';

export const isUnmatched = (transaction: Transaction): boolean =>
  transaction.status === 'unmatched' || transaction.status === 'rejected';

export const isDebit = (transaction: Transaction): boolean =>
  transaction.transactionType === 'debit' ||
  (transaction.debit !== undefined && transaction.debit > 0);

export const isCredit = (transaction: Transaction): boolean =>
  transaction.transactionType === 'credit' ||
  (transaction.credit !== undefined && transaction.credit > 0);

// Utility functions
export const getTransactionAmount = (transaction: Transaction): number => {
  if (transaction.amount !== undefined) {
    return Math.abs(transaction.amount);
  }
  if (transaction.debit !== undefined && transaction.debit > 0) {
    return transaction.debit;
  }
  if (transaction.credit !== undefined && transaction.credit > 0) {
    return transaction.credit;
  }
  return 0;
};

export const getTransactionDisplayAmount = (transaction: Transaction): string => {
  const amount = getTransactionAmount(transaction);
  const sign = isDebit(transaction) ? '-' : '+';
  return `${sign}$${amount.toFixed(2)}`;
};

export const formatTransactionDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getStatusColor = (status: TransactionStatus): string => {
  switch (status) {
    case 'pending':
      return 'default';
    case 'reviewed':
      return 'processing';
    case 'matched':
      return 'success';
    case 'unmatched':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
};

export const getStatusLabel = (status: TransactionStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'reviewed':
      return 'Reviewed';
    case 'matched':
      return 'Matched';
    case 'unmatched':
      return 'Unmatched';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
};

export const getSourceLabel = (source: TransactionSource): string => {
  switch (source) {
    case 'bank_statement':
      return 'Bank Statement';
    case 'internal_ledger':
      return 'Internal Ledger';
    case 'manual_entry':
      return 'Manual Entry';
    default:
      return source;
  }
};

export const getTypeLabel = (type: TransactionType): string => {
  switch (type) {
    case 'debit':
      return 'Debit';
    case 'credit':
      return 'Credit';
    case 'both':
      return 'Both';
    default:
      return type;
  }
};

// Mock data generator for development
export const generateMockTransaction = (overrides?: Partial<Transaction>): Transaction => {
  const id = Math.random().toString(36).substring(7);
  const isDebitTxn = Math.random() > 0.5;
  const amount = Math.random() * 1000 + 10;

  return {
    id,
    tenantId: 'tenant-1',
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    amount: isDebitTxn ? -amount : amount,
    description: `Transaction ${id}`,
    transactionType: isDebitTxn ? 'debit' : 'credit',
    source: 'bank_statement',
    status: 'pending',
    uploadId: 'upload-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'user-1',
    ...overrides,
  };
};

export const generateMockTransactions = (count: number): Transaction[] => {
  return Array.from({ length: count }, (_, i) =>
    generateMockTransaction({
      id: `txn-${i + 1}`,
      description: `Sample Transaction ${i + 1}`,
    })
  );
};
