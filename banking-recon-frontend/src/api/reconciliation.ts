import { dataPrepClient, apiClient } from './client';
import type { AnalysisResult, BankMapping, ColumnMapping, ReconciliationSummary } from '../types';

export const reconciliationApi = {
  analyzeFiles: (bankFiles: File[], ledgerFile: File, bankNames: string[]) => {
    const formData = new FormData();
    bankFiles.forEach((file, i) => {
      formData.append('bankFiles', file);
      formData.append('bankNames', bankNames[i] || `Bank ${i + 1}`);
    });
    formData.append('ledgerFile', ledgerFile);
    return dataPrepClient.post<AnalysisResult>('/data-prep/analyze-multi-bank', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  validateAndPrepare: (data: {
    bankMappings: BankMapping[];
    ledgerMapping: ColumnMapping;
    dateRange?: { startDate: string; endDate: string };
  }) => dataPrepClient.post('/data-prep/validate-and-prepare', data),

  getAll: () =>
    apiClient.get<ReconciliationSummary[]>('/reconciliations'),

  getOne: (id: string) =>
    apiClient.get<ReconciliationSummary>(`/reconciliations/${id}`),

  startProcessing: (reconciliationId: string) =>
    apiClient.post('/orchestrator/start', { reconciliationId }),

  getProgress: (reconciliationId: string) =>
    apiClient.get(`/orchestrator/status/${reconciliationId}`),
};
