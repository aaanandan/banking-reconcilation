import { DetectedColumn, ColumnMapping } from '../services/dataPrepService';

/**
 * Advanced validation utilities for column mapping
 * Extends basic validation with duplicate detection, date parsing, currency handling, etc.
 */

// ============================================================================
// DATE FORMAT VALIDATION
// ============================================================================

export interface DateFormatValidationResult {
  isValid: boolean;
  detectedFormat: string | null;
  confidence: number;
  issues: string[];
  suggestions: string[];
}

/**
 * Common date formats to test against
 */
const DATE_FORMATS = [
  { pattern: /^\d{4}-\d{2}-\d{2}$/, format: 'YYYY-MM-DD', example: '2024-01-15' },
  { pattern: /^\d{2}\/\d{2}\/\d{4}$/, format: 'DD/MM/YYYY', example: '15/01/2024' },
  { pattern: /^\d{2}\/\d{2}\/\d{4}$/, format: 'MM/DD/YYYY', example: '01/15/2024' },
  { pattern: /^\d{2}-\d{2}-\d{4}$/, format: 'DD-MM-YYYY', example: '15-01-2024' },
  { pattern: /^\d{2}-[A-Za-z]{3}-\d{4}$/, format: 'DD-Mon-YYYY', example: '15-Jan-2024' },
  { pattern: /^\d{4}\/\d{2}\/\d{2}$/, format: 'YYYY/MM/DD', example: '2024/01/15' },
  { pattern: /^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}$/, format: 'Mon DD, YYYY', example: 'Jan 15, 2024' },
  { pattern: /^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/, format: 'D Month YYYY', example: '15 January 2024' },
];

/**
 * Validates and detects date format from sample values
 */
export const validateDateFormat = (
  sampleValues: string[]
): DateFormatValidationResult => {
  if (!sampleValues || sampleValues.length === 0) {
    return {
      isValid: false,
      detectedFormat: null,
      confidence: 0,
      issues: ['No sample values provided'],
      suggestions: [],
    };
  }

  // Filter out empty values
  const nonEmptyValues = sampleValues.filter((val) => val && val.trim());

  if (nonEmptyValues.length === 0) {
    return {
      isValid: false,
      detectedFormat: null,
      confidence: 0,
      issues: ['All sample values are empty'],
      suggestions: [],
    };
  }

  // Test each format
  const formatMatches: { [key: string]: number } = {};

  nonEmptyValues.forEach((value) => {
    DATE_FORMATS.forEach((dateFormat) => {
      if (dateFormat.pattern.test(value.trim())) {
        formatMatches[dateFormat.format] =
          (formatMatches[dateFormat.format] || 0) + 1;
      }
    });
  });

  // Find the format with most matches
  const formats = Object.keys(formatMatches);

  if (formats.length === 0) {
    return {
      isValid: false,
      detectedFormat: null,
      confidence: 0,
      issues: ['No recognized date format detected'],
      suggestions: [
        'Expected formats: YYYY-MM-DD, DD/MM/YYYY, DD-Mon-YYYY, etc.',
        `Sample values: ${nonEmptyValues.slice(0, 3).join(', ')}`,
      ],
    };
  }

  // Get the best matching format
  const bestFormat = formats.reduce((a, b) =>
    formatMatches[a] > formatMatches[b] ? a : b
  );

  const matchCount = formatMatches[bestFormat];
  const confidence = (matchCount / nonEmptyValues.length) * 100;

  const issues: string[] = [];
  const suggestions: string[] = [];

  if (confidence < 100) {
    const unmatchedCount = nonEmptyValues.length - matchCount;
    issues.push(
      `${unmatchedCount} of ${nonEmptyValues.length} values don't match detected format`
    );
    suggestions.push(
      `Detected format: ${bestFormat}`,
      'Consider cleaning data to use consistent date format'
    );
  }

  return {
    isValid: confidence >= 70,
    detectedFormat: bestFormat,
    confidence: Math.round(confidence),
    issues,
    suggestions:
      suggestions.length > 0
        ? suggestions
        : [`All dates match format: ${bestFormat}`],
  };
};

// ============================================================================
// CURRENCY SYMBOL HANDLING
// ============================================================================

export interface CurrencyValidationResult {
  isValid: boolean;
  detectedCurrency: string | null;
  hasSymbols: boolean;
  hasMixedFormats: boolean;
  cleanedValues: number[];
  issues: string[];
  suggestions: string[];
}

/**
 * Common currency symbols and patterns
 */
const CURRENCY_PATTERNS = [
  { symbol: '$', regex: /^\$?\s*-?\d{1,3}(,?\d{3})*(\.\d{2})?$/, currency: 'USD' },
  { symbol: '₹', regex: /^₹?\s*-?\d{1,3}(,?\d{3})*(\.\d{2})?$/, currency: 'INR' },
  { symbol: '€', regex: /^€?\s*-?\d{1,3}(,?\d{3})*(\.\d{2})?$/, currency: 'EUR' },
  { symbol: '£', regex: /^£?\s*-?\d{1,3}(,?\d{3})*(\.\d{2})?$/, currency: 'GBP' },
];

/**
 * Cleans currency value by removing symbols and commas
 */
export const cleanCurrencyValue = (value: string): number | null => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  // Remove currency symbols, spaces, and commas
  const cleaned = value
    .replace(/[$₹€£,\s]/g, '')
    .trim();

  // Handle empty result
  if (!cleaned) {
    return null;
  }

  // Parse as float
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? null : parsed;
};

/**
 * Validates currency format and detects currency type
 */
export const validateCurrencyFormat = (
  sampleValues: string[]
): CurrencyValidationResult => {
  if (!sampleValues || sampleValues.length === 0) {
    return {
      isValid: false,
      detectedCurrency: null,
      hasSymbols: false,
      hasMixedFormats: false,
      cleanedValues: [],
      issues: ['No sample values provided'],
      suggestions: [],
    };
  }

  // Filter out empty values
  const nonEmptyValues = sampleValues.filter((val) => val && val.trim());

  if (nonEmptyValues.length === 0) {
    return {
      isValid: false,
      detectedCurrency: null,
      hasSymbols: false,
      hasMixedFormats: false,
      cleanedValues: [],
      issues: ['All sample values are empty'],
      suggestions: [],
    };
  }

  // Detect currency symbols
  const currencyMatches: { [key: string]: number } = {};
  let symbolCount = 0;

  nonEmptyValues.forEach((value) => {
    CURRENCY_PATTERNS.forEach((pattern) => {
      if (value.includes(pattern.symbol)) {
        symbolCount++;
        currencyMatches[pattern.currency] =
          (currencyMatches[pattern.currency] || 0) + 1;
      }
    });
  });

  const hasSymbols = symbolCount > 0;
  const currencies = Object.keys(currencyMatches);
  const hasMixedFormats = currencies.length > 1;

  // Clean all values
  const cleanedValues = nonEmptyValues
    .map(cleanCurrencyValue)
    .filter((val): val is number => val !== null);

  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for mixed formats
  if (hasMixedFormats) {
    issues.push(
      `Mixed currency symbols detected: ${currencies.join(', ')}`
    );
    suggestions.push('Use consistent currency format across all values');
  }

  // Check for parsing failures
  if (cleanedValues.length < nonEmptyValues.length) {
    const failedCount = nonEmptyValues.length - cleanedValues.length;
    issues.push(
      `${failedCount} values could not be parsed as valid amounts`
    );
    suggestions.push('Ensure all amount values are numeric');
  }

  // Detect most common currency
  let detectedCurrency: string | null = null;
  if (currencies.length > 0) {
    detectedCurrency = currencies.reduce((a, b) =>
      currencyMatches[a] > currencyMatches[b] ? a : b
    );
  }

  return {
    isValid: cleanedValues.length > 0 && !hasMixedFormats,
    detectedCurrency,
    hasSymbols,
    hasMixedFormats,
    cleanedValues,
    issues,
    suggestions:
      suggestions.length > 0
        ? suggestions
        : hasSymbols
        ? [`Currency detected: ${detectedCurrency || 'Unknown'}`]
        : ['No currency symbols detected (numeric values only)'],
  };
};

// ============================================================================
// DUPLICATE TRANSACTION DETECTION
// ============================================================================

export interface DuplicateDetectionResult {
  hasDuplicates: boolean;
  duplicateCount: number;
  duplicateGroups: DuplicateGroup[];
  uniqueTransactionCount: number;
  duplicatePercentage: number;
  warnings: string[];
  suggestions: string[];
}

export interface DuplicateGroup {
  key: string;
  count: number;
  indices: number[];
  sampleValues: {
    date?: string;
    amount?: string;
    description?: string;
  };
}

/**
 * Detects duplicate transactions based on date, amount, and description
 */
export const detectDuplicateTransactions = (
  detectedColumns: DetectedColumn[],
  mappings: ColumnMapping[]
): DuplicateDetectionResult => {
  // Find mapped columns for key fields
  const dateColumn = detectedColumns.find((col) =>
    mappings.some(
      (m) => m.sourceColumn === col.columnName && m.targetField === 'date'
    )
  );

  const amountColumn = detectedColumns.find((col) =>
    mappings.some(
      (m) => m.sourceColumn === col.columnName && m.targetField === 'amount'
    )
  );

  const descriptionColumn = detectedColumns.find((col) =>
    mappings.some(
      (m) =>
        m.sourceColumn === col.columnName && m.targetField === 'description'
    )
  );

  // Need at least date and amount to detect duplicates
  if (!dateColumn || !amountColumn) {
    return {
      hasDuplicates: false,
      duplicateCount: 0,
      duplicateGroups: [],
      uniqueTransactionCount: 0,
      duplicatePercentage: 0,
      warnings: ['Cannot detect duplicates: date or amount column not mapped'],
      suggestions: ['Map both date and amount columns to enable duplicate detection'],
    };
  }

  // Build transaction keys
  const transactionMap: Map<string, number[]> = new Map();
  const maxSamples = Math.max(
    dateColumn.sampleValues.length,
    amountColumn.sampleValues.length
  );

  for (let i = 0; i < maxSamples; i++) {
    const date = dateColumn.sampleValues[i] || '';
    const amount = amountColumn.sampleValues[i] || '';
    const description = descriptionColumn?.sampleValues[i] || '';

    // Create composite key
    const key = `${date}|${amount}|${description}`;

    if (!transactionMap.has(key)) {
      transactionMap.set(key, []);
    }
    transactionMap.get(key)!.push(i);
  }

  // Find duplicate groups
  const duplicateGroups: DuplicateGroup[] = [];
  transactionMap.forEach((indices, key) => {
    if (indices.length > 1) {
      const [date, amount, description] = key.split('|');
      duplicateGroups.push({
        key,
        count: indices.length,
        indices,
        sampleValues: {
          date: date || undefined,
          amount: amount || undefined,
          description: description || undefined,
        },
      });
    }
  });

  const duplicateCount = duplicateGroups.reduce(
    (sum, group) => sum + (group.count - 1),
    0
  );
  const uniqueTransactionCount = maxSamples - duplicateCount;
  const duplicatePercentage =
    maxSamples > 0 ? (duplicateCount / maxSamples) * 100 : 0;

  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (duplicateGroups.length > 0) {
    warnings.push(
      `Found ${duplicateGroups.length} groups of duplicate transactions`
    );
    warnings.push(
      `${duplicateCount} duplicate transactions (${duplicatePercentage.toFixed(1)}% of data)`
    );

    suggestions.push('Review duplicate transactions before importing');
    suggestions.push('Duplicates may indicate:');
    suggestions.push('  - Same transaction recorded multiple times');
    suggestions.push('  - Legitimate recurring payments on same date');
    suggestions.push('  - Data quality issues in source file');
  }

  return {
    hasDuplicates: duplicateGroups.length > 0,
    duplicateCount,
    duplicateGroups,
    uniqueTransactionCount,
    duplicatePercentage: Math.round(duplicatePercentage * 10) / 10,
    warnings,
    suggestions,
  };
};

// ============================================================================
// MULTI-COLUMN VALIDATION (DEBIT + CREDIT)
// ============================================================================

export interface MultiColumnValidationResult {
  isValid: boolean;
  hasDebitCredit: boolean;
  debitCreditBalance: 'valid' | 'imbalanced' | 'not_applicable';
  balanceIssues: string[];
  totalDebit: number;
  totalCredit: number;
  netDifference: number;
  suggestions: string[];
}

/**
 * Validates multi-column amount fields (debit + credit columns)
 */
export const validateDebitCreditColumns = (
  detectedColumns: DetectedColumn[],
  mappings: ColumnMapping[]
): MultiColumnValidationResult => {
  // Find debit and credit columns
  const debitColumn = detectedColumns.find((col) =>
    mappings.some(
      (m) => m.sourceColumn === col.columnName && m.targetField === 'debit'
    )
  );

  const creditColumn = detectedColumns.find((col) =>
    mappings.some(
      (m) => m.sourceColumn === col.columnName && m.targetField === 'credit'
    )
  );

  const balanceColumn = detectedColumns.find((col) =>
    mappings.some(
      (m) => m.sourceColumn === col.columnName && m.targetField === 'balance'
    )
  );

  // If no debit/credit columns, this validation doesn't apply
  if (!debitColumn && !creditColumn) {
    return {
      isValid: true,
      hasDebitCredit: false,
      debitCreditBalance: 'not_applicable',
      balanceIssues: [],
      totalDebit: 0,
      totalCredit: 0,
      netDifference: 0,
      suggestions: ['Using single amount column (not debit/credit split)'],
    };
  }

  const hasDebitCredit = !!(debitColumn && creditColumn);
  const balanceIssues: string[] = [];
  const suggestions: string[] = [];

  // If only one of debit/credit is mapped
  if (!hasDebitCredit) {
    balanceIssues.push(
      `Only ${debitColumn ? 'debit' : 'credit'} column is mapped`
    );
    suggestions.push('Map both debit and credit columns for proper reconciliation');

    return {
      isValid: false,
      hasDebitCredit: false,
      debitCreditBalance: 'imbalanced',
      balanceIssues,
      totalDebit: 0,
      totalCredit: 0,
      netDifference: 0,
      suggestions,
    };
  }

  // Calculate totals
  const debitValues = debitColumn!.sampleValues
    .map(cleanCurrencyValue)
    .filter((val): val is number => val !== null);

  const creditValues = creditColumn!.sampleValues
    .map(cleanCurrencyValue)
    .filter((val): val is number => val !== null);

  const totalDebit = debitValues.reduce((sum, val) => sum + val, 0);
  const totalCredit = creditValues.reduce((sum, val) => sum + val, 0);
  const netDifference = Math.abs(totalDebit - totalCredit);

  // Check for mutual exclusivity (each row should have either debit OR credit, not both)
  const maxLength = Math.max(
    debitColumn!.sampleValues.length,
    creditColumn!.sampleValues.length
  );

  let bothNonEmpty = 0;
  let bothEmpty = 0;

  for (let i = 0; i < maxLength; i++) {
    const debit = debitColumn!.sampleValues[i];
    const credit = creditColumn!.sampleValues[i];

    const debitHasValue = debit && debit.trim() && cleanCurrencyValue(debit) !== 0;
    const creditHasValue =
      credit && credit.trim() && cleanCurrencyValue(credit) !== 0;

    if (debitHasValue && creditHasValue) {
      bothNonEmpty++;
    } else if (!debitHasValue && !creditHasValue) {
      bothEmpty++;
    }
  }

  if (bothNonEmpty > 0) {
    balanceIssues.push(
      `${bothNonEmpty} rows have both debit and credit values (should be mutually exclusive)`
    );
  }

  if (bothEmpty > 0) {
    balanceIssues.push(`${bothEmpty} rows have neither debit nor credit values`);
  }

  // Validate balance column if present
  if (balanceColumn) {
    suggestions.push('Balance column detected - can verify running balance');
  }

  // Determine if balance is valid
  let debitCreditBalance: 'valid' | 'imbalanced' | 'not_applicable' = 'valid';

  if (balanceIssues.length > 0) {
    debitCreditBalance = 'imbalanced';
    suggestions.push(
      'Debit and credit columns should be mutually exclusive (only one per row)'
    );
  } else {
    suggestions.push(
      `Total debit: ${totalDebit.toFixed(2)}, Total credit: ${totalCredit.toFixed(2)}`
    );

    if (netDifference < 0.01) {
      suggestions.push('Debit and credit totals are balanced ✓');
    } else {
      suggestions.push(
        `Net difference: ${netDifference.toFixed(2)} (may be expected depending on date range)`
      );
    }
  }

  return {
    isValid: balanceIssues.length === 0,
    hasDebitCredit: true,
    debitCreditBalance,
    balanceIssues,
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    netDifference: Math.round(netDifference * 100) / 100,
    suggestions,
  };
};

// ============================================================================
// COMBINED ADVANCED VALIDATION
// ============================================================================

export interface AdvancedValidationSummary {
  dateFormatValidation: DateFormatValidationResult;
  currencyValidation: CurrencyValidationResult;
  duplicateDetection: DuplicateDetectionResult;
  debitCreditValidation: MultiColumnValidationResult;
  overallScore: number;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Runs all advanced validations and returns comprehensive summary
 */
export const runAdvancedValidation = (
  detectedColumns: DetectedColumn[],
  mappings: ColumnMapping[]
): AdvancedValidationSummary => {
  // Find key columns
  const dateColumn = detectedColumns.find((col) =>
    mappings.some(
      (m) => m.sourceColumn === col.columnName && m.targetField === 'date'
    )
  );

  const amountColumn = detectedColumns.find((col) =>
    mappings.some(
      (m) => m.sourceColumn === col.columnName && m.targetField === 'amount'
    )
  );

  // Run individual validations
  const dateFormatValidation = dateColumn
    ? validateDateFormat(dateColumn.sampleValues)
    : {
        isValid: false,
        detectedFormat: null,
        confidence: 0,
        issues: ['Date column not mapped'],
        suggestions: [],
      };

  const currencyValidation = amountColumn
    ? validateCurrencyFormat(amountColumn.sampleValues)
    : {
        isValid: false,
        detectedCurrency: null,
        hasSymbols: false,
        hasMixedFormats: false,
        cleanedValues: [],
        issues: ['Amount column not mapped'],
        suggestions: [],
      };

  const duplicateDetection = detectDuplicateTransactions(
    detectedColumns,
    mappings
  );

  const debitCreditValidation = validateDebitCreditColumns(
    detectedColumns,
    mappings
  );

  // Calculate overall score
  let score = 100;

  // Date format issues
  if (!dateFormatValidation.isValid) {
    score -= 20;
  } else if (dateFormatValidation.confidence < 100) {
    score -= (100 - dateFormatValidation.confidence) / 10;
  }

  // Currency issues
  if (!currencyValidation.isValid) {
    score -= 15;
  }
  if (currencyValidation.hasMixedFormats) {
    score -= 10;
  }

  // Duplicate issues (warnings only, not critical)
  if (duplicateDetection.duplicatePercentage > 20) {
    score -= 10;
  }

  // Debit/credit issues
  if (debitCreditValidation.hasDebitCredit && !debitCreditValidation.isValid) {
    score -= 15;
  }

  // Collect critical issues, warnings, and recommendations
  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Date format
  if (!dateFormatValidation.isValid) {
    criticalIssues.push(
      `Date format validation failed: ${dateFormatValidation.issues.join(', ')}`
    );
  }

  // Currency
  if (currencyValidation.hasMixedFormats) {
    criticalIssues.push('Mixed currency formats detected');
  }

  // Duplicates
  if (duplicateDetection.hasDuplicates) {
    warnings.push(
      `${duplicateDetection.duplicatePercentage}% duplicate transactions detected`
    );
    recommendations.push(...duplicateDetection.suggestions);
  }

  // Debit/credit
  if (debitCreditValidation.balanceIssues.length > 0) {
    warnings.push(...debitCreditValidation.balanceIssues);
  }

  // Add general recommendations
  recommendations.push(...dateFormatValidation.suggestions);
  recommendations.push(...currencyValidation.suggestions);
  recommendations.push(...debitCreditValidation.suggestions);

  return {
    dateFormatValidation,
    currencyValidation,
    duplicateDetection,
    debitCreditValidation,
    overallScore: Math.max(0, Math.round(score)),
    criticalIssues,
    warnings,
    recommendations: [...new Set(recommendations)], // Remove duplicates
  };
};
