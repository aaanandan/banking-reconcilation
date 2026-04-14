import { AnalyzeFilesResponse, DetectedColumn, ColumnMapping } from './dataPrepService';

/**
 * Mock data service for development and testing without backend
 */
export const getMockFileAnalysis = (): AnalyzeFilesResponse => {
  return {
    success: true,
    message: 'Mock data loaded successfully',
    bankFileAnalysis: [
      {
        fileName: 'HDFC_Statement.csv',
        bankId: 'bank_1',
        bankName: 'HDFC Bank',
        rowCount: 250,
        dateRange: {
          earliest: '2024-01-01',
          latest: '2024-01-31',
        },
        detectedColumns: [
          {
            columnName: 'Transaction Date',
            sampleValues: ['2024-01-15', '2024-01-16', '2024-01-17'],
            detectedType: 'date',
            confidence: 0.95,
          },
          {
            columnName: 'Amount',
            sampleValues: ['1500.00', '2300.50', '450.75'],
            detectedType: 'amount',
            confidence: 0.98,
          },
          {
            columnName: 'Description',
            sampleValues: ['Payment to vendor', 'Salary credit', 'Utility bill'],
            detectedType: 'text',
            confidence: 0.92,
          },
          {
            columnName: 'Ref No',
            sampleValues: ['REF123456', 'REF789012', 'REF345678'],
            detectedType: 'text',
            confidence: 0.85,
          },
          {
            columnName: 'Balance',
            sampleValues: ['25000.00', '27300.50', '26849.75'],
            detectedType: 'amount',
            confidence: 0.90,
          },
        ],
        suggestedMappings: [
          { sourceColumn: 'Transaction Date', targetField: 'date' },
          { sourceColumn: 'Amount', targetField: 'amount' },
          { sourceColumn: 'Description', targetField: 'description' },
          { sourceColumn: 'Ref No', targetField: 'reference' },
          { sourceColumn: 'Balance', targetField: 'balance' },
        ],
      },
      {
        fileName: 'ICICI_Statement.csv',
        bankId: 'bank_2',
        bankName: 'ICICI Bank',
        rowCount: 180,
        dateRange: {
          earliest: '2024-01-01',
          latest: '2024-01-31',
        },
        detectedColumns: [
          {
            columnName: 'Date',
            sampleValues: ['15-Jan-2024', '16-Jan-2024', '17-Jan-2024'],
            detectedType: 'date',
            confidence: 0.93,
          },
          {
            columnName: 'Debit',
            sampleValues: ['', '2300.50', ''],
            detectedType: 'amount',
            confidence: 0.88,
          },
          {
            columnName: 'Credit',
            sampleValues: ['1500.00', '', '450.75'],
            detectedType: 'amount',
            confidence: 0.88,
          },
          {
            columnName: 'Narration',
            sampleValues: ['Payment received', 'Transfer to savings', 'Bill payment'],
            detectedType: 'text',
            confidence: 0.90,
          },
          {
            columnName: 'Cheque No',
            sampleValues: ['', 'CHQ123', ''],
            detectedType: 'text',
            confidence: 0.75,
          },
        ],
        suggestedMappings: [
          { sourceColumn: 'Date', targetField: 'date' },
          { sourceColumn: 'Debit', targetField: 'debit' },
          { sourceColumn: 'Credit', targetField: 'credit' },
          { sourceColumn: 'Narration', targetField: 'description' },
          { sourceColumn: 'Cheque No', targetField: 'reference' },
        ],
      },
    ],
    ledgerFileAnalysis: {
      fileName: 'General_Ledger.csv',
      bankId: 'ledger',
      bankName: 'General Ledger',
      rowCount: 520,
      dateRange: {
        earliest: '2024-01-01',
        latest: '2024-01-31',
      },
      detectedColumns: [
        {
          columnName: 'Entry Date',
          sampleValues: ['2024-01-15', '2024-01-16', '2024-01-17'],
          detectedType: 'date',
          confidence: 0.97,
        },
        {
          columnName: 'Amount',
          sampleValues: ['1500.00', '2300.50', '450.75'],
          detectedType: 'amount',
          confidence: 0.99,
        },
        {
          columnName: 'Particulars',
          sampleValues: ['Cash received', 'Payment made', 'Bank charges'],
          detectedType: 'text',
          confidence: 0.94,
        },
        {
          columnName: 'Voucher No',
          sampleValues: ['V001', 'V002', 'V003'],
          detectedType: 'text',
          confidence: 0.88,
        },
      ],
      suggestedMappings: [
        { sourceColumn: 'Entry Date', targetField: 'date' },
        { sourceColumn: 'Amount', targetField: 'amount' },
        { sourceColumn: 'Particulars', targetField: 'description' },
        { sourceColumn: 'Voucher No', targetField: 'reference' },
      ],
    },
  };
};

export default {
  getMockFileAnalysis,
};
