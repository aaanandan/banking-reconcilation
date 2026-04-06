export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'viewer';
  tenantId: string;
}

export interface Tenant {
  id: string;
  tenantId: string;
  companyName: string;
  email: string;
  plan: 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface ColumnSuggestion {
  field: 'date' | 'amount' | 'description' | 'reference' | 'balance';
  column: string;
  confidence: number;
}

export interface BankFileAnalysis {
  bankId: string;
  bankName: string;
  columns: string[];
  suggestions: ColumnSuggestion[];
  dateRange: { earliest: string; latest: string };
  totalRecords: number;
}

export interface LedgerFileAnalysis {
  columns: string[];
  suggestions: ColumnSuggestion[];
  dateRange: { earliest: string; latest: string };
  totalRecords: number;
}

export interface AnalysisResult {
  banks: BankFileAnalysis[];
  ledger: LedgerFileAnalysis;
  dateRangeAnalysis: {
    recommended: { startDate: string; endDate: string };
    overlap: { startDate: string; endDate: string } | null;
  };
}

export interface ColumnMapping {
  date: string;
  amount: string;
  description: string;
  reference?: string;
  balance?: string;
}

export interface BankMapping {
  bankId: string;
  bankName: string;
  columnMapping: ColumnMapping;
}

export interface ReconciliationState {
  step: 'upload' | 'mapping' | 'daterange' | 'processing' | 'review' | 'complete';
  bankFiles: File[];
  ledgerFile: File | null;
  analysisResult: AnalysisResult | null;
  bankMappings: BankMapping[];
  ledgerMapping: ColumnMapping | null;
  dateRange: { startDate: string; endDate: string } | null;
  reconciliationId: string | null;
}

export interface ReconciliationSummary {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bankFileCount: number;
  totalBankTransactions: number;
  totalLedgerTransactions: number;
  matchedCount: number;
  unmatchedCount: number;
  convergenceRate: number;
  createdAt: string;
  completedAt?: string;
}
