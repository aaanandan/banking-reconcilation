// Reconciliation Types

export interface Reconciliation {
  id: string;
  reconciliationId: string;
  name: string;
  description?: string;
  tenantId: string;
  userId: string;
  status: ReconciliationStatus;
  currentStep: number;
  totalSteps: number;
  dateRangeIncludeAll: boolean;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  totalBankTransactions: number;
  totalLedgerTransactions: number;
  matchedCount: number;
  unmatchedBankCount: number;
  unmatchedLedgerCount: number;
  stagedMatchesCount: number;
  convergenceRate: number;
  currentAlgorithm?: string;
  fieldProfile?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type ReconciliationStatus =
  | 'created'
  | 'uploading'
  | 'analyzing'
  | 'ready_to_match'
  | 'matching'
  | 'review'
  | 'completed'
  | 'paused'
  | 'error';

export interface BankFile {
  id: string;
  reconciliationId: string;
  bankId: string;
  bankName: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  dateRange?: {
    from: string;
    to: string;
  };
  columnMapping: Record<string, string>;
  uploadedAt: string;
}

export interface LedgerFile {
  id: string;
  reconciliationId: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  dateRange?: {
    from: string;
    to: string;
  };
  columnMapping: Record<string, string>;
  uploadedAt: string;
}

export interface Transaction {
  id: string;
  reconciliationId: string;
  source: 'bank' | 'ledger';
  bankId?: string;
  bankName?: string;
  date: string;
  amount: number;
  description: string;
  status: TransactionStatus;
  optionalFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus = 'unmatched' | 'staged' | 'committed' | 'manual';

export interface MatchCandidate {
  id: string;
  reconciliationId: string;
  bankTxnId: string;
  ledgerTxnId: string;
  bankTransaction?: Transaction;
  ledgerTransaction?: Transaction;
  matchType: 'primary' | 'additional';
  algorithm: string;
  confidence: number;
  reasoning: string;
  coreScore?: number;
  additionalScore?: number;
  fieldScoreBreakdown?: Record<string, number>;
  userDecision?: 'accepted' | 'rejected' | 'deferred';
  decidedAt?: string;
  createdAt: string;
}

export interface CreateReconciliationRequest {
  name: string;
  description?: string;
  dateRangeIncludeAll: boolean;
  dateRangeFrom?: string;
  dateRangeTo?: string;
}

export interface CreateReconciliationResponse {
  reconciliation: Reconciliation;
  message: string;
}

export interface UploadFilesRequest {
  reconciliationId: string;
  bankFiles: File[];
  bankNames: string[];
  ledgerFile: File;
}

export interface DataPrepResponse {
  success: boolean;
  bankFilesAnalysis: Array<{
    bankId: string;
    bankName: string;
    fileName: string;
    rowCount: number;
    dateRange: { from: string; to: string };
    columnMapping: Record<string, string>;
  }>;
  ledgerFileAnalysis: {
    fileName: string;
    rowCount: number;
    dateRange: { from: string; to: string };
    columnMapping: Record<string, string>;
  };
  suggestions: {
    dateRange: {
      recommended: { from: string; to: string };
      overlap: { from: string; to: string };
    };
  };
}

export interface StartMatchingRequest {
  reconciliationId: string;
}

export interface MatchingProgressResponse {
  reconciliationId: string;
  currentStep: number;
  totalSteps: number;
  currentAlgorithm: string;
  status: ReconciliationStatus;
  matchedCount: number;
  unmatchedCount: number;
  convergenceRate: number;
  isComplete: boolean;
}
