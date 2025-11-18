/**
 * Report and Analytics Types and Utilities
 * Helper functions for generating and managing reports
 */

// ============================================================================
// TYPES
// ============================================================================

export enum ReportType {
  RECONCILIATION_SUMMARY = 'reconciliation_summary',
  MATCH_ANALYSIS = 'match_analysis',
  ENTITY_INSIGHTS = 'entity_insights',
  TRANSACTION_TRENDS = 'transaction_trends',
  LEARNING_PROGRESS = 'learning_progress',
  AUDIT_TRAIL = 'audit_trail',
  PERFORMANCE_METRICS = 'performance_metrics',
}

export enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ReportFilter {
  dateFrom: string;
  dateTo: string;
  reconciliationIds?: string[];
  entityIds?: string[];
  includeCharts?: boolean;
  includeDetails?: boolean;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  status: ReportStatus;
  format: ExportFormat;
  filter: ReportFilter;
  fileUrl: string | null;
  fileSize: number | null;
  generatedAt: Date | null;
  generatedBy: string;
  createdAt: Date;
}

export interface ReportTemplate {
  type: ReportType;
  title: string;
  description: string;
  icon: string;
  defaultFormat: ExportFormat;
  supportedFormats: ExportFormat[];
  estimatedTime: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    type: ReportType.RECONCILIATION_SUMMARY,
    title: 'Reconciliation Summary',
    description: 'Overview of all reconciliation sessions with statistics and outcomes',
    icon: 'FileTextOutlined',
    defaultFormat: ExportFormat.PDF,
    supportedFormats: [ExportFormat.PDF, ExportFormat.EXCEL, ExportFormat.CSV],
    estimatedTime: '2-3 minutes',
  },
  {
    type: ReportType.MATCH_ANALYSIS,
    title: 'Match Analysis',
    description: 'Detailed analysis of matched transactions with confidence scores and patterns',
    icon: 'BarChartOutlined',
    defaultFormat: ExportFormat.EXCEL,
    supportedFormats: [ExportFormat.PDF, ExportFormat.EXCEL, ExportFormat.CSV],
    estimatedTime: '3-5 minutes',
  },
  {
    type: ReportType.ENTITY_INSIGHTS,
    title: 'Entity Insights',
    description: 'Learned patterns and behaviors for all entities with reliability metrics',
    icon: 'TeamOutlined',
    defaultFormat: ExportFormat.PDF,
    supportedFormats: [ExportFormat.PDF, ExportFormat.EXCEL],
    estimatedTime: '2-4 minutes',
  },
  {
    type: ReportType.TRANSACTION_TRENDS,
    title: 'Transaction Trends',
    description: 'Historical trends and patterns in transaction volumes and amounts',
    icon: 'LineChartOutlined',
    defaultFormat: ExportFormat.PDF,
    supportedFormats: [ExportFormat.PDF, ExportFormat.EXCEL],
    estimatedTime: '2-3 minutes',
  },
  {
    type: ReportType.LEARNING_PROGRESS,
    title: 'Learning Progress',
    description: 'Questions answered and knowledge gained over time',
    icon: 'BulbOutlined',
    defaultFormat: ExportFormat.PDF,
    supportedFormats: [ExportFormat.PDF, ExportFormat.EXCEL],
    estimatedTime: '1-2 minutes',
  },
  {
    type: ReportType.AUDIT_TRAIL,
    title: 'Audit Trail',
    description: 'Complete audit log of all actions, approvals, and rejections',
    icon: 'SafetyOutlined',
    defaultFormat: ExportFormat.CSV,
    supportedFormats: [ExportFormat.PDF, ExportFormat.CSV, ExportFormat.JSON],
    estimatedTime: '3-5 minutes',
  },
  {
    type: ReportType.PERFORMANCE_METRICS,
    title: 'Performance Metrics',
    description: 'System performance metrics including match rates and processing times',
    icon: 'DashboardOutlined',
    defaultFormat: ExportFormat.PDF,
    supportedFormats: [ExportFormat.PDF, ExportFormat.EXCEL],
    estimatedTime: '1-2 minutes',
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get report type label
 */
export const getReportTypeLabel = (type: ReportType): string => {
  const template = REPORT_TEMPLATES.find((t) => t.type === type);
  return template?.title || type;
};

/**
 * Get report type icon
 */
export const getReportTypeIcon = (type: ReportType): string => {
  const template = REPORT_TEMPLATES.find((t) => t.type === type);
  return template?.icon || 'FileOutlined';
};

/**
 * Get export format label
 */
export const getExportFormatLabel = (format: ExportFormat): string => {
  switch (format) {
    case ExportFormat.PDF:
      return 'PDF Document';
    case ExportFormat.EXCEL:
      return 'Excel Spreadsheet';
    case ExportFormat.CSV:
      return 'CSV File';
    case ExportFormat.JSON:
      return 'JSON Data';
    default:
      return format;
  }
};

/**
 * Get export format icon
 */
export const getExportFormatIcon = (format: ExportFormat): string => {
  switch (format) {
    case ExportFormat.PDF:
      return 'FilePdfOutlined';
    case ExportFormat.EXCEL:
      return 'FileExcelOutlined';
    case ExportFormat.CSV:
      return 'FileTextOutlined';
    case ExportFormat.JSON:
      return 'FileOutlined';
    default:
      return 'FileOutlined';
  }
};

/**
 * Get report status label
 */
export const getReportStatusLabel = (status: ReportStatus): string => {
  switch (status) {
    case ReportStatus.PENDING:
      return 'Pending';
    case ReportStatus.GENERATING:
      return 'Generating...';
    case ReportStatus.COMPLETED:
      return 'Completed';
    case ReportStatus.FAILED:
      return 'Failed';
    default:
      return status;
  }
};

/**
 * Get report status color
 */
export const getReportStatusColor = (status: ReportStatus): string => {
  switch (status) {
    case ReportStatus.PENDING:
      return 'default';
    case ReportStatus.GENERATING:
      return 'processing';
    case ReportStatus.COMPLETED:
      return 'success';
    case ReportStatus.FAILED:
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number | null): string => {
  if (bytes === null) return 'N/A';
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate date range
 */
export const validateDateRange = (dateFrom: string, dateTo: string): { valid: boolean; error?: string } => {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);

  if (isNaN(from.getTime())) {
    return { valid: false, error: 'Invalid start date' };
  }

  if (isNaN(to.getTime())) {
    return { valid: false, error: 'Invalid end date' };
  }

  if (from > to) {
    return { valid: false, error: 'Start date must be before end date' };
  }

  // Check if date range is too large (more than 1 year)
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 365) {
    return { valid: false, error: 'Date range cannot exceed 1 year' };
  }

  return { valid: true };
};

/**
 * Get date range presets
 */
export const getDateRangePresets = (): Array<{ label: string; value: [string, string] }> => {
  const today = new Date();
  const getDateString = (date: Date) => date.toISOString().split('T')[0];

  return [
    {
      label: 'Last 7 Days',
      value: [
        getDateString(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
        getDateString(today),
      ],
    },
    {
      label: 'Last 30 Days',
      value: [
        getDateString(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)),
        getDateString(today),
      ],
    },
    {
      label: 'Last 90 Days',
      value: [
        getDateString(new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)),
        getDateString(today),
      ],
    },
    {
      label: 'This Month',
      value: [
        getDateString(new Date(today.getFullYear(), today.getMonth(), 1)),
        getDateString(today),
      ],
    },
    {
      label: 'Last Month',
      value: [
        getDateString(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        getDateString(new Date(today.getFullYear(), today.getMonth(), 0)),
      ],
    },
    {
      label: 'This Year',
      value: [
        getDateString(new Date(today.getFullYear(), 0, 1)),
        getDateString(today),
      ],
    },
  ];
};

/**
 * Filter reports
 */
export const filterReports = (
  reports: Report[],
  filter: {
    type?: ReportType[];
    status?: ReportStatus[];
    format?: ExportFormat[];
    search?: string;
  }
): Report[] => {
  let result = [...reports];

  if (filter.type && filter.type.length > 0) {
    result = result.filter((r) => filter.type!.includes(r.type));
  }

  if (filter.status && filter.status.length > 0) {
    result = result.filter((r) => filter.status!.includes(r.status));
  }

  if (filter.format && filter.format.length > 0) {
    result = result.filter((r) => filter.format!.includes(r.format));
  }

  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.title.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower) ||
        r.generatedBy.toLowerCase().includes(searchLower)
    );
  }

  return result;
};

/**
 * Sort reports
 */
export const sortReports = (
  reports: Report[],
  field: 'title' | 'type' | 'status' | 'createdAt' | 'generatedAt',
  order: 'asc' | 'desc'
): Report[] => {
  const sorted = [...reports];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (field) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'generatedAt':
        aValue = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
        bValue = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
};
