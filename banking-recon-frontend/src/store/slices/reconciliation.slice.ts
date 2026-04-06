import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ReconciliationState, AnalysisResult, ColumnMapping } from '../../types';

const initialState: ReconciliationState = {
  step: 'upload',
  bankFiles: [],
  ledgerFile: null,
  analysisResult: null,
  bankMappings: [],
  ledgerMapping: null,
  dateRange: null,
  reconciliationId: null,
};

const reconciliationSlice = createSlice({
  name: 'reconciliation',
  initialState,
  reducers: {
    setFiles: (state, action: PayloadAction<{ bankFiles: File[]; ledgerFile: File }>) => {
      state.bankFiles = action.payload.bankFiles;
      state.ledgerFile = action.payload.ledgerFile;
    },
    setAnalysisResult: (state, action: PayloadAction<AnalysisResult>) => {
      state.analysisResult = action.payload;
      state.step = 'mapping';
      // Initialize empty mappings for each bank
      state.bankMappings = action.payload.banks.map((bank) => ({
        bankId: bank.bankId,
        bankName: bank.bankName,
        columnMapping: {
          date: bank.suggestions.find((s) => s.field === 'date')?.column || '',
          amount: bank.suggestions.find((s) => s.field === 'amount')?.column || '',
          description: bank.suggestions.find((s) => s.field === 'description')?.column || '',
          reference: bank.suggestions.find((s) => s.field === 'reference')?.column || '',
        },
      }));
      state.ledgerMapping = {
        date: action.payload.ledger.suggestions.find((s) => s.field === 'date')?.column || '',
        amount: action.payload.ledger.suggestions.find((s) => s.field === 'amount')?.column || '',
        description:
          action.payload.ledger.suggestions.find((s) => s.field === 'description')?.column || '',
        reference:
          action.payload.ledger.suggestions.find((s) => s.field === 'reference')?.column || '',
      };
    },
    updateBankMapping: (
      state,
      action: PayloadAction<{ bankId: string; mapping: Partial<ColumnMapping> }>
    ) => {
      const bank = state.bankMappings.find((b) => b.bankId === action.payload.bankId);
      if (bank) {
        bank.columnMapping = { ...bank.columnMapping, ...action.payload.mapping };
      }
    },
    updateLedgerMapping: (state, action: PayloadAction<Partial<ColumnMapping>>) => {
      if (state.ledgerMapping) {
        state.ledgerMapping = { ...state.ledgerMapping, ...action.payload };
      }
    },
    setDateRange: (state, action: PayloadAction<{ startDate: string; endDate: string } | null>) => {
      state.dateRange = action.payload;
      state.step = 'processing';
    },
    setReconciliationId: (state, action: PayloadAction<string>) => {
      state.reconciliationId = action.payload;
    },
    goToStep: (state, action: PayloadAction<ReconciliationState['step']>) => {
      state.step = action.payload;
    },
    reset: () => initialState,
  },
});

export const {
  setFiles,
  setAnalysisResult,
  updateBankMapping,
  updateLedgerMapping,
  setDateRange,
  setReconciliationId,
  goToStep,
  reset,
} = reconciliationSlice.actions;
export default reconciliationSlice.reducer;
