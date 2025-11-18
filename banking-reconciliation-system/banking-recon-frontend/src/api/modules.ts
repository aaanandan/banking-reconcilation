/**
 * API Modules
 *
 * Feature-specific API endpoints organized by module
 */

import { api, uploadFiles, downloadFile } from './apiClient';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  VerifyEmailRequest,
  ReconciliationListItem,
  ReconciliationDetail,
  CreateReconciliationRequest,
  Transaction,
  Match,
  LearningQuestion,
  AnswerQuestionRequest,
  EntityProfile,
  ReportConfig,
  Report,
  Settings,
  User,
  InviteUserRequest,
  UpdateUserRequest,
  PaginatedResponse,
  PaginationParams,
  FilterParams,
} from './types';

// ==================== AUTH API ====================

export const authApi = {
  /**
   * Login with email and password
   */
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', credentials),

  /**
   * Register new account
   */
  register: (data: RegisterRequest) =>
    api.post('/auth/register', data),

  /**
   * Verify email with code
   */
  verifyEmail: (data: VerifyEmailRequest) =>
    api.post<LoginResponse>('/auth/verify-email', data),

  /**
   * Resend verification code
   */
  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),

  /**
   * Request password reset
   */
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  /**
   * Reset password with token
   */
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  /**
   * Refresh access token
   */
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  /**
   * Logout
   */
  logout: () =>
    api.post('/auth/logout'),
};

// ==================== RECONCILIATION API ====================

export const reconciliationApi = {
  /**
   * Get all reconciliations with pagination
   */
  list: (params?: PaginationParams & FilterParams) =>
    api.get<PaginatedResponse<ReconciliationListItem>>('/reconciliations', { params }),

  /**
   * Get reconciliation by ID
   */
  getById: (id: string) =>
    api.get<ReconciliationDetail>(`/reconciliations/${id}`),

  /**
   * Create new reconciliation
   */
  create: (data: CreateReconciliationRequest) =>
    api.post<ReconciliationDetail>('/reconciliations', data),

  /**
   * Upload files for reconciliation
   */
  uploadFiles: (files: File[], onProgress?: (progress: number) => void) =>
    uploadFiles('/reconciliations/upload', files, onProgress),

  /**
   * Start processing reconciliation
   */
  startProcessing: (id: string) =>
    api.post(`/reconciliations/${id}/process`),

  /**
   * Delete reconciliation
   */
  delete: (id: string) =>
    api.delete(`/reconciliations/${id}`),
};

// ==================== TRANSACTION API ====================

export const transactionApi = {
  /**
   * Get transactions for reconciliation
   */
  list: (reconciliationId: string, params?: PaginationParams & FilterParams) =>
    api.get<PaginatedResponse<Transaction>>(`/reconciliations/${reconciliationId}/transactions`, { params }),

  /**
   * Get transaction by ID
   */
  getById: (reconciliationId: string, transactionId: string) =>
    api.get<Transaction>(`/reconciliations/${reconciliationId}/transactions/${transactionId}`),

  /**
   * Get unmatched transactions
   */
  getUnmatched: (reconciliationId: string, params?: PaginationParams & FilterParams) =>
    api.get<PaginatedResponse<Transaction>>(`/reconciliations/${reconciliationId}/unmatched`, { params }),
};

// ==================== MATCH API ====================

export const matchApi = {
  /**
   * Get matches for reconciliation
   */
  list: (reconciliationId: string, params?: PaginationParams & FilterParams) =>
    api.get<PaginatedResponse<Match>>(`/reconciliations/${reconciliationId}/matches`, { params }),

  /**
   * Get match by ID
   */
  getById: (reconciliationId: string, matchId: string) =>
    api.get<Match>(`/reconciliations/${reconciliationId}/matches/${matchId}`),

  /**
   * Approve match
   */
  approve: (reconciliationId: string, matchId: string) =>
    api.post(`/reconciliations/${reconciliationId}/matches/${matchId}/approve`),

  /**
   * Reject match
   */
  reject: (reconciliationId: string, matchId: string, reason?: string) =>
    api.post(`/reconciliations/${reconciliationId}/matches/${matchId}/reject`, { reason }),

  /**
   * Create manual match
   */
  createManual: (reconciliationId: string, bankTransactionId: string, ledgerTransactionId: string) =>
    api.post<Match>(`/reconciliations/${reconciliationId}/matches/manual`, {
      bankTransactionId,
      ledgerTransactionId,
    }),

  /**
   * Get alternative matches
   */
  getAlternatives: (reconciliationId: string, matchId: string) =>
    api.get<Match[]>(`/reconciliations/${reconciliationId}/matches/${matchId}/alternatives`),
};

// ==================== LEARNING API ====================

export const learningApi = {
  /**
   * Get learning questions
   */
  getQuestions: (params?: PaginationParams & FilterParams) =>
    api.get<PaginatedResponse<LearningQuestion>>('/learning/questions', { params }),

  /**
   * Get question by ID
   */
  getQuestionById: (id: string) =>
    api.get<LearningQuestion>(`/learning/questions/${id}`),

  /**
   * Answer learning question
   */
  answerQuestion: (data: AnswerQuestionRequest) =>
    api.post(`/learning/questions/${data.questionId}/answer`, data),

  /**
   * Skip learning question
   */
  skipQuestion: (id: string) =>
    api.post(`/learning/questions/${id}/skip`),

  /**
   * Get entity profiles
   */
  getProfiles: (params?: PaginationParams & FilterParams) =>
    api.get<PaginatedResponse<EntityProfile>>('/learning/profiles', { params }),

  /**
   * Get entity profile by ID
   */
  getProfileById: (id: string) =>
    api.get<EntityProfile>(`/learning/profiles/${id}`),

  /**
   * Update entity profile
   */
  updateProfile: (id: string, data: Partial<EntityProfile>) =>
    api.put<EntityProfile>(`/learning/profiles/${id}`, data),

  /**
   * Delete entity profile
   */
  deleteProfile: (id: string) =>
    api.delete(`/learning/profiles/${id}`),
};

// ==================== REPORTS API ====================

export const reportsApi = {
  /**
   * Generate report
   */
  generate: (config: ReportConfig) =>
    api.post<Report>('/reports/generate', config),

  /**
   * Get all reports
   */
  list: (params?: PaginationParams & FilterParams) =>
    api.get<PaginatedResponse<Report>>('/reports', { params }),

  /**
   * Get report by ID
   */
  getById: (id: string) =>
    api.get<Report>(`/reports/${id}`),

  /**
   * Download report
   */
  download: (id: string, filename: string) =>
    downloadFile(`/reports/${id}/download`, filename),

  /**
   * Delete report
   */
  delete: (id: string) =>
    api.delete(`/reports/${id}`),
};

// ==================== SETTINGS API ====================

export const settingsApi = {
  /**
   * Get current settings
   */
  get: () =>
    api.get<Settings>('/settings'),

  /**
   * Update settings
   */
  update: (settings: Partial<Settings>) =>
    api.put<Settings>('/settings', settings),

  /**
   * Reset settings to defaults
   */
  reset: () =>
    api.post<Settings>('/settings/reset'),
};

// ==================== USER MANAGEMENT API ====================

export const usersApi = {
  /**
   * Get all users
   */
  list: (params?: PaginationParams & FilterParams) =>
    api.get<PaginatedResponse<User>>('/users', { params }),

  /**
   * Get user by ID
   */
  getById: (id: string) =>
    api.get<User>(`/users/${id}`),

  /**
   * Get current user
   */
  me: () =>
    api.get<User>('/users/me'),

  /**
   * Invite new user
   */
  invite: (data: InviteUserRequest) =>
    api.post<User>('/users/invite', data),

  /**
   * Update user
   */
  update: (id: string, data: UpdateUserRequest) =>
    api.put<User>(`/users/${id}`, data),

  /**
   * Delete user
   */
  delete: (id: string) =>
    api.delete(`/users/${id}`),

  /**
   * Resend invitation
   */
  resendInvitation: (id: string) =>
    api.post(`/users/${id}/resend-invitation`),
};

// ==================== HELP & DOCUMENTATION API ====================

export const helpApi = {
  /**
   * Get help articles
   */
  getArticles: (params?: PaginationParams & FilterParams) =>
    api.get('/help/articles', { params }),

  /**
   * Get article by ID
   */
  getArticleById: (id: string) =>
    api.get(`/help/articles/${id}`),

  /**
   * Search help articles
   */
  search: (query: string) =>
    api.get('/help/search', { params: { q: query } }),
};

// ==================== DASHBOARD API ====================

export const dashboardApi = {
  /**
   * Get dashboard statistics
   */
  getStats: () =>
    api.get('/dashboard/stats'),

  /**
   * Get recent activity
   */
  getActivity: (limit?: number) =>
    api.get('/dashboard/activity', { params: { limit } }),
};

// ==================== EXPORT ALL APIS ====================

export default {
  auth: authApi,
  reconciliations: reconciliationApi,
  transactions: transactionApi,
  matches: matchApi,
  learning: learningApi,
  reports: reportsApi,
  settings: settingsApi,
  users: usersApi,
  help: helpApi,
  dashboard: dashboardApi,
};
