// Reconciliation Service
import apiClient from './api';
import type {
  Reconciliation,
  CreateReconciliationRequest,
  CreateReconciliationResponse,
  DataPrepResponse,
  Transaction,
  MatchCandidate,
  QueryParams,
  PaginatedResponse,
} from '../types';

const STATE_MANAGER_PORT = import.meta.env.VITE_STATE_MANAGER_PORT || '3002';
const STATE_BASE_URL = `http://localhost:${STATE_MANAGER_PORT}/state`;

const DATA_PREP_PORT = import.meta.env.VITE_DATA_PREP_PORT || '3001';
const DATA_PREP_BASE_URL = `http://localhost:${DATA_PREP_PORT}/data-prep`;

export const reconciliationService = {
  /**
   * Create a new reconciliation
   */
  async createReconciliation(data: CreateReconciliationRequest): Promise<CreateReconciliationResponse> {
    const response = await apiClient.post<CreateReconciliationResponse>(
      `${STATE_BASE_URL}/reconciliation`,
      data
    );
    return response.data;
  },

  /**
   * Get reconciliation by ID
   */
  async getReconciliation(reconciliationId: string): Promise<Reconciliation> {
    const response = await apiClient.get<Reconciliation>(
      `${STATE_BASE_URL}/reconciliation/${reconciliationId}`
    );
    return response.data;
  },

  /**
   * Get all reconciliations (paginated)
   */
  async getReconciliations(params?: QueryParams): Promise<PaginatedResponse<Reconciliation>> {
    const response = await apiClient.get<PaginatedResponse<Reconciliation>>(
      `${STATE_BASE_URL}/reconciliations`,
      { params }
    );
    return response.data;
  },

  /**
   * Upload and analyze files with data-prep service
   */
  async uploadAndAnalyzeFiles(
    reconciliationId: string,
    bankFiles: File[],
    bankNames: string[],
    ledgerFile: File
  ): Promise<DataPrepResponse> {
    const formData = new FormData();

    // Add bank files
    bankFiles.forEach((file, index) => {
      formData.append('bankFiles', file);
      formData.append('bankNames', bankNames[index]);
    });

    // Add ledger file
    formData.append('ledgerFile', ledgerFile);

    // Add reconciliation ID
    formData.append('reconciliationId', reconciliationId);

    const response = await apiClient.post<DataPrepResponse>(
      `${DATA_PREP_BASE_URL}/analyze-multi-bank-files`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  /**
   * Store transactions in bulk (after data prep)
   */
  async storeBulkTransactions(
    reconciliationId: string,
    transactions: Transaction[]
  ): Promise<{ success: boolean; count: number }> {
    const response = await apiClient.post(
      `${STATE_BASE_URL}/transactions/bulk`,
      {
        reconciliationId,
        transactions,
      }
    );
    return response.data;
  },

  /**
   * Get transactions for a reconciliation
   */
  async getTransactions(
    reconciliationId: string,
    params?: {
      source?: 'bank' | 'ledger';
      status?: string;
      bankId?: string;
    } & QueryParams
  ): Promise<PaginatedResponse<Transaction>> {
    const response = await apiClient.get<PaginatedResponse<Transaction>>(
      `${STATE_BASE_URL}/transactions`,
      {
        params: {
          reconciliationId,
          ...params,
        },
      }
    );
    return response.data;
  },

  /**
   * Get match candidates for a reconciliation
   */
  async getMatchCandidates(
    reconciliationId: string,
    params?: QueryParams
  ): Promise<PaginatedResponse<MatchCandidate>> {
    const response = await apiClient.get<PaginatedResponse<MatchCandidate>>(
      `${STATE_BASE_URL}/matches`,
      {
        params: {
          reconciliationId,
          ...params,
        },
      }
    );
    return response.data;
  },

  /**
   * Accept a match (commit it)
   */
  async acceptMatch(matchId: string): Promise<{ success: boolean }> {
    const response = await apiClient.patch(
      `${STATE_BASE_URL}/matches/${matchId}/accept`
    );
    return response.data;
  },

  /**
   * Reject a match
   */
  async rejectMatch(matchId: string): Promise<{ success: boolean }> {
    const response = await apiClient.patch(
      `${STATE_BASE_URL}/matches/${matchId}/reject`
    );
    return response.data;
  },

  /**
   * Update reconciliation status
   */
  async updateReconciliationStatus(
    reconciliationId: string,
    status: string
  ): Promise<Reconciliation> {
    const response = await apiClient.patch<Reconciliation>(
      `${STATE_BASE_URL}/reconciliation/${reconciliationId}/status`,
      { status }
    );
    return response.data;
  },

  /**
   * Delete reconciliation
   */
  async deleteReconciliation(reconciliationId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(
      `${STATE_BASE_URL}/reconciliation/${reconciliationId}`
    );
    return response.data;
  },
};

export default reconciliationService;
