/**
 * File Upload Types and Utilities
 * Multi-bank and ledger file upload management
 */

// ============================================================================
// TYPES
// ============================================================================

export enum FileType {
  BANK_STATEMENT = 'bank_statement',
  LEDGER = 'ledger',
}

export enum FileFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
}

export enum UploadStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error',
}

export enum ValidationStatus {
  PENDING = 'pending',
  VALID = 'valid',
  WARNING = 'warning',
  INVALID = 'invalid',
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface UploadedFile {
  id: string;
  file: File;
  type: FileType;
  format: FileFormat;
  status: UploadStatus;
  progress: number;
  size: number;
  uploadedAt: Date;
  validationStatus: ValidationStatus;
  validationMessages: string[];
  rowCount?: number;
  columnCount?: number;
  preview?: string[][];
}

export interface UploadValidation {
  status: ValidationStatus;
  messages: string[];
  warnings: string[];
  errors: string[];
}

export interface UploadSummary {
  totalFiles: number;
  bankFiles: number;
  ledgerFiles: number;
  totalSize: number;
  allValid: boolean;
  readyToProcess: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const MAX_BANK_FILES = 3;
export const MAX_LEDGER_FILES = 1;
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.pdf'];
export const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/pdf',
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get file format from filename
 */
export const getFileFormat = (filename: string): FileFormat | null => {
  const ext = filename.toLowerCase().split('.').pop();

  switch (ext) {
    case 'csv':
      return FileFormat.CSV;
    case 'xlsx':
    case 'xls':
      return FileFormat.EXCEL;
    case 'pdf':
      return FileFormat.PDF;
    default:
      return null;
  }
};

/**
 * Get format label
 */
export const getFormatLabel = (format: FileFormat): string => {
  switch (format) {
    case FileFormat.CSV:
      return 'CSV';
    case FileFormat.EXCEL:
      return 'Excel';
    case FileFormat.PDF:
      return 'PDF';
    default:
      return format;
  }
};

/**
 * Get format icon
 */
export const getFormatIcon = (format: FileFormat): string => {
  switch (format) {
    case FileFormat.CSV:
      return 'FileTextOutlined';
    case FileFormat.EXCEL:
      return 'FileExcelOutlined';
    case FileFormat.PDF:
      return 'FilePdfOutlined';
    default:
      return 'FileOutlined';
  }
};

/**
 * Get status color
 */
export const getStatusColor = (status: UploadStatus): string => {
  switch (status) {
    case UploadStatus.IDLE:
      return 'default';
    case UploadStatus.UPLOADING:
      return 'processing';
    case UploadStatus.PROCESSING:
      return 'processing';
    case UploadStatus.SUCCESS:
      return 'success';
    case UploadStatus.ERROR:
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Get validation status color
 */
export const getValidationStatusColor = (status: ValidationStatus): string => {
  switch (status) {
    case ValidationStatus.PENDING:
      return 'default';
    case ValidationStatus.VALID:
      return 'success';
    case ValidationStatus.WARNING:
      return 'warning';
    case ValidationStatus.INVALID:
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate file
 */
export const validateFile = (file: File, type: FileType, existingFiles: UploadedFile[]): UploadValidation => {
  const messages: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check file extension
  const format = getFileFormat(file.name);
  if (!format) {
    errors.push(`Invalid file format. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum (${formatFileSize(MAX_FILE_SIZE)})`);
  }

  if (file.size === 0) {
    errors.push('File is empty');
  }

  // Check file count limits
  if (type === FileType.BANK_STATEMENT) {
    const bankFileCount = existingFiles.filter((f) => f.type === FileType.BANK_STATEMENT).length;
    if (bankFileCount >= MAX_BANK_FILES) {
      errors.push(`Maximum ${MAX_BANK_FILES} bank files allowed`);
    }
  } else if (type === FileType.LEDGER) {
    const ledgerFileCount = existingFiles.filter((f) => f.type === FileType.LEDGER).length;
    if (ledgerFileCount >= MAX_LEDGER_FILES) {
      errors.push(`Only ${MAX_LEDGER_FILES} ledger file allowed`);
    }
  }

  // Check for duplicate filename
  const duplicate = existingFiles.find((f) => f.file.name === file.name);
  if (duplicate) {
    warnings.push('File with same name already uploaded');
  }

  // Check file size warnings
  if (file.size > 10 * 1024 * 1024) {
    warnings.push('Large file may take longer to process');
  }

  let status: ValidationStatus;
  if (errors.length > 0) {
    status = ValidationStatus.INVALID;
  } else if (warnings.length > 0) {
    status = ValidationStatus.WARNING;
  } else {
    status = ValidationStatus.VALID;
  }

  messages.push(...errors, ...warnings);

  return { status, messages, warnings, errors };
};

/**
 * Calculate upload summary
 */
export const calculateUploadSummary = (files: UploadedFile[]): UploadSummary => {
  const bankFiles = files.filter((f) => f.type === FileType.BANK_STATEMENT);
  const ledgerFiles = files.filter((f) => f.type === FileType.LEDGER);
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const allValid = files.every(
    (f) => f.validationStatus === ValidationStatus.VALID || f.validationStatus === ValidationStatus.WARNING
  );

  const allUploaded = files.every((f) => f.status === UploadStatus.SUCCESS);

  const hasRequiredFiles = bankFiles.length > 0 && ledgerFiles.length > 0;

  const readyToProcess = allValid && allUploaded && hasRequiredFiles;

  return {
    totalFiles: files.length,
    bankFiles: bankFiles.length,
    ledgerFiles: ledgerFiles.length,
    totalSize,
    allValid,
    readyToProcess,
  };
};

/**
 * Check if can add bank file
 */
export const canAddBankFile = (files: UploadedFile[]): boolean => {
  const bankFileCount = files.filter((f) => f.type === FileType.BANK_STATEMENT).length;
  return bankFileCount < MAX_BANK_FILES;
};

/**
 * Check if can add ledger file
 */
export const canAddLedgerFile = (files: UploadedFile[]): boolean => {
  const ledgerFileCount = files.filter((f) => f.type === FileType.LEDGER).length;
  return ledgerFileCount < MAX_LEDGER_FILES;
};

/**
 * Generate unique file ID
 */
export const generateFileId = (): string => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create uploaded file object
 */
export const createUploadedFile = (file: File, type: FileType): UploadedFile => {
  const format = getFileFormat(file.name) || FileFormat.CSV;

  return {
    id: generateFileId(),
    file,
    type,
    format,
    status: UploadStatus.IDLE,
    progress: 0,
    size: file.size,
    uploadedAt: new Date(),
    validationStatus: ValidationStatus.PENDING,
    validationMessages: [],
  };
};

/**
 * Get file type label
 */
export const getFileTypeLabel = (type: FileType): string => {
  switch (type) {
    case FileType.BANK_STATEMENT:
      return 'Bank Statement';
    case FileType.LEDGER:
      return 'Ledger';
    default:
      return type;
  }
};

/**
 * Get file type color
 */
export const getFileTypeColor = (type: FileType): string => {
  switch (type) {
    case FileType.BANK_STATEMENT:
      return '#1890ff';
    case FileType.LEDGER:
      return '#52c41a';
    default:
      return '#8c8c8c';
  }
};

/**
 * Sort files by type and upload time
 */
export const sortFiles = (files: UploadedFile[]): UploadedFile[] => {
  return [...files].sort((a, b) => {
    // Ledger files first
    if (a.type === FileType.LEDGER && b.type !== FileType.LEDGER) return -1;
    if (a.type !== FileType.LEDGER && b.type === FileType.LEDGER) return 1;

    // Then by upload time
    return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
  });
};

/**
 * Check if files are ready for next step
 */
export const isReadyForNextStep = (files: UploadedFile[]): { ready: boolean; message?: string } => {
  const summary = calculateUploadSummary(files);

  if (summary.bankFiles === 0) {
    return { ready: false, message: 'At least one bank statement file is required' };
  }

  if (summary.ledgerFiles === 0) {
    return { ready: false, message: 'Ledger file is required' };
  }

  if (!summary.allValid) {
    return { ready: false, message: 'Please fix validation errors before proceeding' };
  }

  if (!summary.readyToProcess) {
    return { ready: false, message: 'Files are still uploading or processing' };
  }

  return { ready: true };
};
