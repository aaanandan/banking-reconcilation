/**
 * API Types and Interfaces
 *
 * Common types and interfaces for API requests and responses
 */

// ==================== COMMON TYPES ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  errors?: Record<string, string[]>;
}

// ==================== REQUEST TYPES ====================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  [key: string]: any;
}

// ==================== AUTH API TYPES ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string;
    role: string;
    emailVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface RegisterRequest {
  companyInfo: {
    companyName: string;
    companySize: string;
    industry?: string;
    country: string;
  };
  userDetails: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

// ==================== RECONCILIATION API TYPES ====================

export interface ReconciliationListItem {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  confidence: number;
}

export interface ReconciliationDetail extends ReconciliationListItem {
  bankFiles: Array<{
    id: string;
    name: string;
    uploadedAt: string;
    transactionCount: number;
  }>;
  ledgerFile: {
    id: string;
    name: string;
    uploadedAt: string;
    transactionCount: number;
  };
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  results?: {
    matches: number;
    unmatched: number;
    accuracy: number;
  };
}

export interface CreateReconciliationRequest {
  name?: string;
  files: File[];
  columnMappings: Record<string, any>;
  dateRange?: {
    startDate: string | null;
    endDate: string | null;
  };
}

// ==================== TRANSACTION API TYPES ====================

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  reference?: string;
  type: 'bank' | 'ledger';
  status: 'matched' | 'unmatched' | 'pending';
  matchId?: string;
  confidence?: number;
}

export interface Match {
  id: string;
  bankTransaction: Transaction;
  ledgerTransaction: Transaction;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'manual';
  status: 'pending' | 'approved' | 'rejected';
  alternatives?: Match[];
}

// ==================== LEARNING API TYPES ====================

export interface LearningQuestion {
  id: string;
  type: 'entity_mapping' | 'pattern_confirmation' | 'rule_suggestion';
  priority: 'high' | 'medium' | 'low';
  question: string;
  context: {
    transaction?: Transaction;
    suggestedEntity?: string;
    confidence?: number;
  };
  options?: string[];
  createdAt: string;
}

export interface AnswerQuestionRequest {
  questionId: string;
  answer: string | boolean;
  notes?: string;
}

export interface EntityProfile {
  id: string;
  name: string;
  type: 'vendor' | 'customer' | 'other';
  patterns: string[];
  transactionCount: number;
  lastSeen: string;
  confidence: number;
}

// ==================== REPORTS API TYPES ====================

export interface ReportConfig {
  type: string;
  format: 'pdf' | 'excel' | 'csv';
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  filters?: Record<string, any>;
}

export interface Report {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
}

// ==================== SETTINGS API TYPES ====================

export interface Settings {
  general: {
    companyName: string;
    timezone: string;
    dateFormat: string;
  };
  reconciliation: {
    autoApproveThreshold: number;
    requireManualReview: boolean;
  };
  learning: {
    enableLearning: boolean;
    confidenceThreshold: number;
  };
  notifications: {
    emailNotifications: boolean;
    reconciliationComplete: boolean;
    learningQuestions: boolean;
  };
}

// ==================== USER MANAGEMENT API TYPES ====================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  lastLoginAt?: string;
  createdAt: string;
}

export interface InviteUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: string;
}
