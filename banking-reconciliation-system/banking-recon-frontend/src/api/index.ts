/**
 * API Module
 *
 * Exports all API-related functionality
 */

// API Client
export { default as apiClient, api, uploadFile, uploadFiles, downloadFile } from './apiClient';

// API Modules
export {
  authApi,
  reconciliationApi,
  transactionApi,
  matchApi,
  learningApi,
  reportsApi,
  settingsApi,
  usersApi,
  helpApi,
  dashboardApi,
  default as apis,
} from './modules';

// Types
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  PaginationParams,
  FilterParams,
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
} from './types';
