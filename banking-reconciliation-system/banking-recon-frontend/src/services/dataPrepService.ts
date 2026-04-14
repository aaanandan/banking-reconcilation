import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface DetectedColumn {
  columnName: string;
  sampleValues: string[];
  detectedType: 'date' | 'amount' | 'text' | 'number';
  confidence: number;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
}

export interface FileAnalysisResult {
  fileName: string;
  bankId: string;
  bankName: string;
  detectedColumns: DetectedColumn[];
  suggestedMappings: ColumnMapping[];
  rowCount: number;
  dateRange?: {
    earliest: string;
    latest: string;
  };
}

export interface AnalyzeFilesRequest {
  bankFiles: File[];
  ledgerFile: File;
}

export interface AnalyzeFilesResponse {
  bankFileAnalysis: FileAnalysisResult[];
  ledgerFileAnalysis: FileAnalysisResult;
  success: boolean;
  message?: string;
}

export interface UploadWithMappingsRequest {
  bankFiles: Array<{
    file: File;
    bankId: string;
    bankName: string;
    mappings: ColumnMapping[];
  }>;
  ledgerFile: {
    file: File;
    mappings: ColumnMapping[];
  };
  reconciliationName?: string;
  description?: string;
}

export interface UploadWithMappingsResponse {
  reconciliationId: string;
  success: boolean;
  message: string;
}

/**
 * Analyze uploaded files and detect columns
 */
export const analyzeFiles = async (
  bankFiles: File[],
  ledgerFile: File
): Promise<AnalyzeFilesResponse> => {
  try {
    const formData = new FormData();

    // Add bank files
    bankFiles.forEach((file, index) => {
      formData.append('bankFiles', file);
      formData.append(`bankFile_${index}_name`, file.name);
    });

    // Add ledger file
    formData.append('ledgerFile', ledgerFile);

    const response = await axios.post<AnalyzeFilesResponse>(
      `${API_BASE_URL}/data-prep/analyze-files`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || 'Failed to analyze files. Please try again.'
      );
    }
    throw new Error('An unexpected error occurred while analyzing files.');
  }
};

/**
 * Upload files with column mappings and start reconciliation
 */
export const uploadFilesWithMappings = async (
  request: UploadWithMappingsRequest
): Promise<UploadWithMappingsResponse> => {
  try {
    const formData = new FormData();

    // Add bank files with mappings
    request.bankFiles.forEach((bankFile, index) => {
      formData.append('bankFiles', bankFile.file);
      formData.append(`bankFile_${index}_id`, bankFile.bankId);
      formData.append(`bankFile_${index}_name`, bankFile.bankName);
      formData.append(`bankFile_${index}_mappings`, JSON.stringify(bankFile.mappings));
    });

    // Add ledger file with mappings
    formData.append('ledgerFile', request.ledgerFile.file);
    formData.append('ledgerMappings', JSON.stringify(request.ledgerFile.mappings));

    // Add optional metadata
    if (request.reconciliationName) {
      formData.append('reconciliationName', request.reconciliationName);
    }
    if (request.description) {
      formData.append('description', request.description);
    }

    const response = await axios.post<UploadWithMappingsResponse>(
      `${API_BASE_URL}/data-prep/upload-with-mappings`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || 'Failed to upload files. Please try again.'
      );
    }
    throw new Error('An unexpected error occurred during file upload.');
  }
};

/**
 * Get suggested column mappings based on column names
 */
export const getSuggestedMappings = (detectedColumns: DetectedColumn[]): ColumnMapping[] => {
  const suggestions: ColumnMapping[] = [];
  const usedFields = new Set<string>();

  // Common column name patterns
  const patterns: Record<string, RegExp[]> = {
    date: [
      /^(date|transaction.*date|entry.*date|posting.*date)$/i,
      /^(txn.*date|dt)$/i,
    ],
    amount: [
      /^(amount|amt|value|transaction.*amount)$/i,
      /^(debit|credit|dr|cr)$/i,
    ],
    description: [
      /^(description|desc|narration|particulars|details)$/i,
      /^(txn.*description|remarks)$/i,
    ],
    reference: [
      /^(reference|ref.*no|ref.*number|txn.*id|transaction.*id)$/i,
      /^(voucher.*no|cheque.*no|check.*no)$/i,
    ],
    payee: [
      /^(payee|payer|beneficiary|party|name)$/i,
      /^(customer|vendor|supplier)$/i,
    ],
    category: [
      /^(category|type|class|ledger|account)$/i,
    ],
    balance: [
      /^(balance|closing.*balance|running.*balance)$/i,
    ],
  };

  detectedColumns.forEach(column => {
    // Try to match column name to a field
    for (const [field, regexPatterns] of Object.entries(patterns)) {
      if (usedFields.has(field)) continue;

      for (const pattern of regexPatterns) {
        if (pattern.test(column.columnName)) {
          suggestions.push({
            sourceColumn: column.columnName,
            targetField: field,
          });
          usedFields.add(field);
          break;
        }
      }
    }
  });

  return suggestions;
};

export default {
  analyzeFiles,
  uploadFilesWithMappings,
  getSuggestedMappings,
};
