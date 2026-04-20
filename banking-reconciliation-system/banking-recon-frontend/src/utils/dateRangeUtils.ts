/**
 * Date Range Selection Utilities
 *
 * Provides utilities for date range selection, including:
 * - Date range presets (This Month, Last Month, etc.)
 * - Transaction filtering by date range
 * - Summary statistics calculation
 * - Date validation and formatting
 */

import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(isBetween);
dayjs.extend(quarterOfYear);

// ==================== TYPES ====================

export interface DateRange {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
}

export enum DateRangePreset {
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_QUARTER = 'this_quarter',
  LAST_QUARTER = 'last_quarter',
  THIS_YEAR = 'this_year',
  LAST_YEAR = 'last_year',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  CUSTOM = 'custom',
  ALL = 'all',
}

export interface DateRangePresetOption {
  key: DateRangePreset;
  label: string;
  description: string;
  getRange: () => DateRange;
}

export interface TransactionData {
  id: string;
  date: string; // ISO date string
  amount: number;
  description: string;
  [key: string]: any;
}

export interface DateRangeSummary {
  totalTransactions: number;
  bankTransactions: number;
  ledgerTransactions: number;
  dateRange: {
    earliest: string | null;
    latest: string | null;
  };
  amountSummary: {
    total: number;
    bank: number;
    ledger: number;
  };
  coverage: {
    percentage: number;
    included: number;
    excluded: number;
  };
}

export interface FileTransactions {
  fileId: string;
  fileName: string;
  fileType: 'bank' | 'ledger';
  transactions: TransactionData[];
}

// ==================== CONSTANTS ====================

export const DATE_FORMAT = 'YYYY-MM-DD';
export const DISPLAY_DATE_FORMAT = 'MMM DD, YYYY';
export const MONTH_FORMAT = 'MMMM YYYY';

// ==================== PRESET OPTIONS ====================

export const DATE_RANGE_PRESETS: DateRangePresetOption[] = [
  {
    key: DateRangePreset.ALL,
    label: 'All Transactions',
    description: 'Process all transactions without date filtering',
    getRange: () => ({
      startDate: null,
      endDate: null,
    }),
  },
  {
    key: DateRangePreset.THIS_MONTH,
    label: 'This Month',
    description: `${dayjs().format(MONTH_FORMAT)}`,
    getRange: () => ({
      startDate: dayjs().startOf('month'),
      endDate: dayjs().endOf('month'),
    }),
  },
  {
    key: DateRangePreset.LAST_MONTH,
    label: 'Last Month',
    description: `${dayjs().subtract(1, 'month').format(MONTH_FORMAT)}`,
    getRange: () => ({
      startDate: dayjs().subtract(1, 'month').startOf('month'),
      endDate: dayjs().subtract(1, 'month').endOf('month'),
    }),
  },
  {
    key: DateRangePreset.THIS_QUARTER,
    label: 'This Quarter',
    description: `Q${dayjs().quarter()} ${dayjs().year()}`,
    getRange: () => ({
      startDate: dayjs().startOf('quarter'),
      endDate: dayjs().endOf('quarter'),
    }),
  },
  {
    key: DateRangePreset.LAST_QUARTER,
    label: 'Last Quarter',
    description: `Q${dayjs().subtract(1, 'quarter').quarter()} ${dayjs().subtract(1, 'quarter').year()}`,
    getRange: () => ({
      startDate: dayjs().subtract(1, 'quarter').startOf('quarter'),
      endDate: dayjs().subtract(1, 'quarter').endOf('quarter'),
    }),
  },
  {
    key: DateRangePreset.THIS_YEAR,
    label: 'This Year',
    description: `${dayjs().year()}`,
    getRange: () => ({
      startDate: dayjs().startOf('year'),
      endDate: dayjs().endOf('year'),
    }),
  },
  {
    key: DateRangePreset.LAST_YEAR,
    label: 'Last Year',
    description: `${dayjs().subtract(1, 'year').year()}`,
    getRange: () => ({
      startDate: dayjs().subtract(1, 'year').startOf('year'),
      endDate: dayjs().subtract(1, 'year').endOf('year'),
    }),
  },
  {
    key: DateRangePreset.LAST_30_DAYS,
    label: 'Last 30 Days',
    description: `${dayjs().subtract(30, 'days').format(DISPLAY_DATE_FORMAT)} - ${dayjs().format(DISPLAY_DATE_FORMAT)}`,
    getRange: () => ({
      startDate: dayjs().subtract(30, 'days').startOf('day'),
      endDate: dayjs().endOf('day'),
    }),
  },
  {
    key: DateRangePreset.LAST_90_DAYS,
    label: 'Last 90 Days',
    description: `${dayjs().subtract(90, 'days').format(DISPLAY_DATE_FORMAT)} - ${dayjs().format(DISPLAY_DATE_FORMAT)}`,
    getRange: () => ({
      startDate: dayjs().subtract(90, 'days').startOf('day'),
      endDate: dayjs().endOf('day'),
    }),
  },
  {
    key: DateRangePreset.CUSTOM,
    label: 'Custom Range',
    description: 'Select custom start and end dates',
    getRange: () => ({
      startDate: null,
      endDate: null,
    }),
  },
];

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get preset option by key
 */
export const getPresetOption = (key: DateRangePreset): DateRangePresetOption | undefined => {
  return DATE_RANGE_PRESETS.find((preset) => preset.key === key);
};

/**
 * Get date range for a preset
 */
export const getPresetDateRange = (preset: DateRangePreset): DateRange => {
  const option = getPresetOption(preset);
  return option ? option.getRange() : { startDate: null, endDate: null };
};

/**
 * Format date range for display
 */
export const formatDateRange = (range: DateRange): string => {
  if (!range.startDate && !range.endDate) {
    return 'All Transactions';
  }
  if (!range.startDate) {
    return `Up to ${range.endDate!.format(DISPLAY_DATE_FORMAT)}`;
  }
  if (!range.endDate) {
    return `From ${range.startDate.format(DISPLAY_DATE_FORMAT)}`;
  }
  return `${range.startDate.format(DISPLAY_DATE_FORMAT)} - ${range.endDate.format(DISPLAY_DATE_FORMAT)}`;
};

/**
 * Check if a date is within a range
 */
export const isDateInRange = (date: string | Dayjs, range: DateRange): boolean => {
  const dateDayjs = typeof date === 'string' ? dayjs(date) : date;

  // If no range specified, all dates are included
  if (!range.startDate && !range.endDate) {
    return true;
  }

  // If only start date, check if date is after
  if (range.startDate && !range.endDate) {
    return dateDayjs.isSameOrAfter(range.startDate, 'day');
  }

  // If only end date, check if date is before
  if (!range.startDate && range.endDate) {
    return dateDayjs.isSameOrBefore(range.endDate, 'day');
  }

  // Both start and end dates specified
  return dateDayjs.isBetween(range.startDate, range.endDate, 'day', '[]');
};

/**
 * Filter transactions by date range
 */
export const filterTransactionsByDateRange = (
  transactions: TransactionData[],
  range: DateRange
): TransactionData[] => {
  if (!range.startDate && !range.endDate) {
    return transactions;
  }

  return transactions.filter((transaction) => isDateInRange(transaction.date, range));
};

/**
 * Calculate summary statistics for transactions within date range
 */
export const calculateDateRangeSummary = (
  files: FileTransactions[],
  range: DateRange
): DateRangeSummary => {
  // Get all transactions
  const allTransactions = files.flatMap((file) =>
    file.transactions.map((t) => ({ ...t, fileType: file.fileType }))
  );

  // Filter by date range
  const filteredTransactions = filterTransactionsByDateRange(allTransactions, range);

  // Calculate statistics
  const bankTransactions = filteredTransactions.filter((t) => t.fileType === 'bank');
  const ledgerTransactions = filteredTransactions.filter((t) => t.fileType === 'ledger');

  // Find date range
  const dates = allTransactions.map((t) => dayjs(t.date)).sort((a, b) => a.diff(b));
  const earliest = dates.length > 0 ? dates[0].format(DATE_FORMAT) : null;
  const latest = dates.length > 0 ? dates[dates.length - 1].format(DATE_FORMAT) : null;

  // Calculate amounts
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const bankAmount = bankTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const ledgerAmount = ledgerTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Calculate coverage
  const included = filteredTransactions.length;
  const excluded = allTransactions.length - included;
  const percentage = allTransactions.length > 0
    ? Math.round((included / allTransactions.length) * 100)
    : 0;

  return {
    totalTransactions: filteredTransactions.length,
    bankTransactions: bankTransactions.length,
    ledgerTransactions: ledgerTransactions.length,
    dateRange: {
      earliest,
      latest,
    },
    amountSummary: {
      total: totalAmount,
      bank: bankAmount,
      ledger: ledgerAmount,
    },
    coverage: {
      percentage,
      included,
      excluded,
    },
  };
};

/**
 * Validate date range
 */
export const validateDateRange = (range: DateRange): { valid: boolean; error?: string } => {
  // Allow null/undefined for "all transactions"
  if (!range.startDate && !range.endDate) {
    return { valid: true };
  }

  // If both dates are specified, ensure start is before end
  if (range.startDate && range.endDate) {
    if (range.startDate.isAfter(range.endDate)) {
      return { valid: false, error: 'Start date must be before end date' };
    }
  }

  // Check if dates are in the future
  const now = dayjs();
  if (range.startDate && range.startDate.isAfter(now, 'day')) {
    return { valid: false, error: 'Start date cannot be in the future' };
  }
  if (range.endDate && range.endDate.isAfter(now, 'day')) {
    return { valid: false, error: 'End date cannot be in the future' };
  }

  return { valid: true };
};

/**
 * Get suggested presets based on transaction data
 */
export const getSuggestedPresets = (files: FileTransactions[]): DateRangePreset[] => {
  const allTransactions = files.flatMap((file) => file.transactions);

  if (allTransactions.length === 0) {
    return [DateRangePreset.ALL];
  }

  // Find date range of transactions
  const dates = allTransactions.map((t) => dayjs(t.date));
  const earliest = dates.reduce((min, date) => (date.isBefore(min) ? date : min));
  const latest = dates.reduce((max, date) => (date.isAfter(max) ? date : max));

  const suggestions: DateRangePreset[] = [];

  // Always suggest "All"
  suggestions.push(DateRangePreset.ALL);

  // Suggest based on data span
  const daySpan = latest.diff(earliest, 'days');

  if (daySpan <= 31) {
    suggestions.push(DateRangePreset.THIS_MONTH);
  }

  if (daySpan <= 90) {
    suggestions.push(DateRangePreset.LAST_30_DAYS);
  }

  if (daySpan <= 180) {
    suggestions.push(DateRangePreset.THIS_QUARTER, DateRangePreset.LAST_90_DAYS);
  }

  if (daySpan > 180) {
    suggestions.push(DateRangePreset.THIS_YEAR, DateRangePreset.LAST_YEAR);
  }

  // Always offer custom
  suggestions.push(DateRangePreset.CUSTOM);

  return suggestions;
};

/**
 * Format amount with currency
 */
export const formatAmount = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Get color for coverage percentage
 */
export const getCoverageColor = (percentage: number): string => {
  if (percentage >= 80) return 'success';
  if (percentage >= 50) return 'warning';
  return 'error';
};

/**
 * Check if date range is ready for processing
 */
export const isDateRangeReady = (
  range: DateRange,
  summary: DateRangeSummary
): { ready: boolean; message?: string } => {
  // Validate date range
  const validation = validateDateRange(range);
  if (!validation.valid) {
    return { ready: false, message: validation.error };
  }

  // Check if there are transactions in the selected range
  if (summary.totalTransactions === 0) {
    return { ready: false, message: 'No transactions found in selected date range' };
  }

  // Check if both bank and ledger have transactions
  if (summary.bankTransactions === 0) {
    return { ready: false, message: 'No bank transactions in selected date range' };
  }

  if (summary.ledgerTransactions === 0) {
    return { ready: false, message: 'No ledger transactions in selected date range' };
  }

  return { ready: true };
};

/**
 * Export date range configuration for API
 */
export const exportDateRangeConfig = (range: DateRange): {
  startDate: string | null;
  endDate: string | null;
} => {
  return {
    startDate: range.startDate ? range.startDate.format(DATE_FORMAT) : null,
    endDate: range.endDate ? range.endDate.format(DATE_FORMAT) : null,
  };
};
