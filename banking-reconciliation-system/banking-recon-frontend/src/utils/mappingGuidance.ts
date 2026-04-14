import { DetectedColumn, ColumnMapping } from '../services/dataPrepService';

/**
 * Mapping Guidance Utility
 * Provides best practices, tips, and common mistake detection
 */

// ============================================================================
// BEST PRACTICES
// ============================================================================

export interface BestPractice {
  id: string;
  title: string;
  description: string;
  category: 'mapping' | 'data-quality' | 'performance' | 'troubleshooting';
  importance: 'high' | 'medium' | 'low';
  icon: string;
  tips: string[];
  examples?: {
    good: string;
    bad: string;
  };
}

export const BEST_PRACTICES: BestPractice[] = [
  {
    id: 'bp_required_fields',
    title: 'Map All Required Fields',
    description:
      'Ensure date, amount, and description fields are always mapped for successful reconciliation.',
    category: 'mapping',
    importance: 'high',
    icon: 'CheckCircle',
    tips: [
      'Date field is required to match transactions by time',
      'Amount field is required to match transaction values',
      'Description helps identify transaction purpose',
      'Missing required fields will prevent reconciliation',
    ],
    examples: {
      good: 'Date → date, Amount → amount, Description → description',
      bad: 'Only mapping Date and Amount (missing Description)',
    },
  },
  {
    id: 'bp_type_matching',
    title: 'Match Field Types Correctly',
    description:
      'Map columns to fields with compatible types (date to date, amount to amount).',
    category: 'mapping',
    importance: 'high',
    icon: 'Warning',
    tips: [
      'Date columns should map to date fields',
      'Amount/number columns should map to amount fields',
      'Text columns should map to description/reference fields',
      'Type mismatches cause parsing errors',
    ],
    examples: {
      good: 'Transaction Date (date) → date field',
      bad: 'Transaction Date (date) → amount field',
    },
  },
  {
    id: 'bp_debit_credit',
    title: 'Use Debit/Credit When Applicable',
    description:
      'If your file has separate Debit and Credit columns, map both instead of a single Amount column.',
    category: 'mapping',
    importance: 'medium',
    icon: 'Split',
    tips: [
      'Many banks export with Debit and Credit columns',
      'Each transaction should have value in either Debit OR Credit, not both',
      'System will automatically handle negative amounts',
      'Improves reconciliation accuracy',
    ],
    examples: {
      good: 'Debit → debit, Credit → credit',
      bad: 'Combining Debit and Credit into single Amount field',
    },
  },
  {
    id: 'bp_reference_mapping',
    title: 'Map Reference Numbers',
    description:
      'Map reference/cheque numbers when available for better transaction matching.',
    category: 'mapping',
    importance: 'medium',
    icon: 'Key',
    tips: [
      'Reference numbers help match transactions uniquely',
      'Cheque numbers are useful for cheque-based payments',
      'Transaction IDs improve matching accuracy',
      'Optional but highly recommended',
    ],
  },
  {
    id: 'bp_consistent_format',
    title: 'Ensure Consistent Data Format',
    description: 'All dates should use the same format, all amounts should use the same currency.',
    category: 'data-quality',
    importance: 'high',
    icon: 'Format',
    tips: [
      'Mixed date formats (YYYY-MM-DD and DD/MM/YYYY) cause errors',
      'Mixed currencies ($, ₹, €) prevent proper matching',
      'Clean your data before importing if formats are inconsistent',
      'Use the validation panel to detect format issues',
    ],
  },
  {
    id: 'bp_check_duplicates',
    title: 'Review Duplicate Transactions',
    description:
      'Check for and understand duplicate transactions before proceeding.',
    category: 'data-quality',
    importance: 'medium',
    icon: 'Copy',
    tips: [
      'Duplicates may indicate data quality issues',
      'Some duplicates are legitimate (recurring payments on same date)',
      'Review duplicate groups in the validation panel',
      'Consider removing accidental duplicates before import',
    ],
  },
  {
    id: 'bp_date_range',
    title: 'Verify Date Ranges Match',
    description:
      'Ensure bank and ledger files cover the same time period for reconciliation.',
    category: 'data-quality',
    importance: 'high',
    icon: 'Calendar',
    tips: [
      'Bank and ledger should have overlapping date ranges',
      'Mismatched periods result in unmatched transactions',
      'Check the date range displayed in file analysis',
      'Consider splitting files if periods are too different',
    ],
  },
  {
    id: 'bp_save_templates',
    title: 'Save Mappings as Templates',
    description:
      'Save successful mappings as templates for faster processing next time.',
    category: 'performance',
    importance: 'medium',
    icon: 'Save',
    tips: [
      'Templates can be reused for same bank/file format',
      'Saves time on repetitive reconciliations',
      'Share templates with team members',
      'Update templates when bank formats change',
    ],
  },
  {
    id: 'bp_sample_review',
    title: 'Review Sample Data',
    description: 'Always review the mapping preview to verify data looks correct.',
    category: 'mapping',
    importance: 'high',
    icon: 'Eye',
    tips: [
      'Preview shows first few rows with your mappings applied',
      'Verify dates are in correct format',
      'Verify amounts are properly parsed',
      'Check that descriptions are meaningful',
    ],
  },
  {
    id: 'bp_balance_validation',
    title: 'Validate Running Balance',
    description:
      'If your file has a balance column, map it to verify data integrity.',
    category: 'data-quality',
    importance: 'low',
    icon: 'Balance',
    tips: [
      'Balance column helps detect missing transactions',
      'Can verify arithmetic accuracy',
      'Useful for troubleshooting reconciliation issues',
      'Not required but recommended when available',
    ],
  },
];

/**
 * Get best practices by category
 */
export const getBestPracticesByCategory = (
  category: BestPractice['category']
): BestPractice[] => {
  return BEST_PRACTICES.filter((bp) => bp.category === category);
};

/**
 * Get best practices by importance
 */
export const getBestPracticesByImportance = (
  importance: BestPractice['importance']
): BestPractice[] => {
  return BEST_PRACTICES.filter((bp) => bp.importance === importance);
};

// ============================================================================
// COMMON MISTAKES
// ============================================================================

export interface CommonMistake {
  id: string;
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: 'mapping' | 'data-quality' | 'configuration';
  howToFix: string[];
  relatedBestPractice?: string;
}

export const COMMON_MISTAKES: CommonMistake[] = [
  {
    id: 'mistake_missing_required',
    title: 'Missing Required Field Mapping',
    description:
      'One or more required fields (date, amount, description) are not mapped.',
    severity: 'error',
    category: 'mapping',
    howToFix: [
      'Locate the date column in your file (Transaction Date, Date, etc.)',
      'Locate the amount column (Amount, Debit, Credit, etc.)',
      'Locate the description column (Description, Narration, Particulars, etc.)',
      'Map each to the corresponding target field',
    ],
    relatedBestPractice: 'bp_required_fields',
  },
  {
    id: 'mistake_type_mismatch',
    title: 'Field Type Mismatch',
    description:
      'A column is mapped to a field with incompatible type (e.g., date column to amount field).',
    severity: 'error',
    category: 'mapping',
    howToFix: [
      'Review the detected type for each column',
      'Match date columns to date fields only',
      'Match amount/number columns to amount/debit/credit fields only',
      'Match text columns to description/reference/category fields',
      'Use the type mismatch warnings to identify problems',
    ],
    relatedBestPractice: 'bp_type_matching',
  },
  {
    id: 'mistake_duplicate_mapping',
    title: 'Duplicate Target Field Mapping',
    description: 'The same target field is mapped to multiple source columns.',
    severity: 'error',
    category: 'mapping',
    howToFix: [
      'Review all your mappings',
      'Ensure each target field (date, amount, description, etc.) is mapped only once',
      'If you have multiple similar columns, choose the most appropriate one',
      'Remove duplicate mappings',
    ],
  },
  {
    id: 'mistake_mixed_date_formats',
    title: 'Inconsistent Date Formats',
    description: 'Date column contains values in different formats.',
    severity: 'warning',
    category: 'data-quality',
    howToFix: [
      'Export data from source system with consistent date format',
      'Use Excel/spreadsheet to convert all dates to same format',
      'Preferred format: YYYY-MM-DD (2024-01-15)',
      'Ensure all dates follow the detected format',
    ],
    relatedBestPractice: 'bp_consistent_format',
  },
  {
    id: 'mistake_mixed_currency',
    title: 'Mixed Currency Symbols',
    description: 'Amount column contains different currency symbols ($, ₹, €).',
    severity: 'error',
    category: 'data-quality',
    howToFix: [
      'Ensure all amounts use the same currency',
      'Remove currency symbols if causing issues',
      'Convert all amounts to base currency before import',
      'Use consistent formatting (e.g., all values as $X,XXX.XX)',
    ],
    relatedBestPractice: 'bp_consistent_format',
  },
  {
    id: 'mistake_only_one_debit_credit',
    title: 'Only Debit or Credit Mapped',
    description: 'File has both Debit and Credit columns, but only one is mapped.',
    severity: 'warning',
    category: 'mapping',
    howToFix: [
      'Map both Debit and Credit columns',
      'System needs both to properly calculate transaction amounts',
      'If your file only has one, map it to "amount" instead',
      'Verify data in preview looks correct',
    ],
    relatedBestPractice: 'bp_debit_credit',
  },
  {
    id: 'mistake_debit_credit_overlap',
    title: 'Rows Have Both Debit and Credit Values',
    description:
      'Some rows have values in both Debit and Credit columns (should be mutually exclusive).',
    severity: 'warning',
    category: 'data-quality',
    howToFix: [
      'Review source data - each row should have value in either Debit OR Credit',
      'Check if data export settings are correct',
      'Manually clean data to ensure mutual exclusivity',
      'Contact your bank/accounting software support if this persists',
    ],
    relatedBestPractice: 'bp_debit_credit',
  },
  {
    id: 'mistake_high_duplicates',
    title: 'High Percentage of Duplicates',
    description: 'More than 20% of transactions appear to be duplicates.',
    severity: 'warning',
    category: 'data-quality',
    howToFix: [
      'Review duplicate groups in the validation panel',
      'Check if file was exported multiple times and combined',
      'Verify if duplicates are legitimate (recurring payments on same date/amount)',
      'Remove accidental duplicates before import',
      'Consider using date range filters when exporting from source',
    ],
    relatedBestPractice: 'bp_check_duplicates',
  },
  {
    id: 'mistake_no_reference',
    title: 'Reference Number Not Mapped',
    description: 'File has reference/cheque number column but it\'s not mapped.',
    severity: 'info',
    category: 'mapping',
    howToFix: [
      'Map the reference column to improve matching accuracy',
      'Look for columns named: Ref No, Reference, Cheque No, Transaction ID',
      'This is optional but highly recommended',
      'Reference numbers help uniquely identify transactions',
    ],
    relatedBestPractice: 'bp_reference_mapping',
  },
  {
    id: 'mistake_no_balance',
    title: 'Balance Column Not Mapped',
    description: 'File has running balance column but it\'s not mapped.',
    severity: 'info',
    category: 'mapping',
    howToFix: [
      'Map the balance column to enable balance validation',
      'Look for columns named: Balance, Running Balance, Closing Balance',
      'This is optional but helps verify data integrity',
      'Balance checking can catch missing transactions',
    ],
    relatedBestPractice: 'bp_balance_validation',
  },
];

/**
 * Get common mistakes by severity
 */
export const getCommonMistakesBySeverity = (
  severity: CommonMistake['severity']
): CommonMistake[] => {
  return COMMON_MISTAKES.filter((m) => m.severity === severity);
};

/**
 * Get common mistake by ID
 */
export const getCommonMistakeById = (id: string): CommonMistake | null => {
  return COMMON_MISTAKES.find((m) => m.id === id) || null;
};

// ============================================================================
// MISTAKE DETECTION
// ============================================================================

export interface DetectedMistake {
  mistake: CommonMistake;
  context: string;
  affectedFields?: string[];
}

/**
 * Detect common mistakes in current mapping configuration
 */
export const detectMistakes = (
  detectedColumns: DetectedColumn[],
  mappings: ColumnMapping[]
): DetectedMistake[] => {
  const detected: DetectedMistake[] = [];

  // Check for missing required fields
  const requiredFields = ['date', 'amount', 'description'];
  const mappedFields = mappings.map((m) => m.targetField);

  requiredFields.forEach((field) => {
    if (!mappedFields.includes(field)) {
      const mistake = COMMON_MISTAKES.find(
        (m) => m.id === 'mistake_missing_required'
      );
      if (mistake) {
        detected.push({
          mistake,
          context: `Required field '${field}' is not mapped`,
          affectedFields: [field],
        });
      }
    }
  });

  // Check for duplicate target fields
  const duplicateFields = mappedFields.filter(
    (field, index) => mappedFields.indexOf(field) !== index
  );

  if (duplicateFields.length > 0) {
    const mistake = COMMON_MISTAKES.find(
      (m) => m.id === 'mistake_duplicate_mapping'
    );
    if (mistake) {
      detected.push({
        mistake,
        context: `Target fields mapped multiple times: ${[...new Set(duplicateFields)].join(', ')}`,
        affectedFields: [...new Set(duplicateFields)],
      });
    }
  }

  // Check for debit/credit mapping issues
  const hasDebit = mappedFields.includes('debit');
  const hasCredit = mappedFields.includes('credit');

  if ((hasDebit && !hasCredit) || (!hasDebit && hasCredit)) {
    const mistake = COMMON_MISTAKES.find(
      (m) => m.id === 'mistake_only_one_debit_credit'
    );
    if (mistake) {
      detected.push({
        mistake,
        context: `Only ${hasDebit ? 'debit' : 'credit'} column is mapped`,
        affectedFields: [hasDebit ? 'debit' : 'credit'],
      });
    }
  }

  // Check for unmapped reference column
  const hasReferenceColumn = detectedColumns.some((col) =>
    /ref|reference|cheque|chq|transaction.*id|txn.*id/i.test(col.columnName)
  );
  const hasReferenceMapping = mappedFields.includes('reference');

  if (hasReferenceColumn && !hasReferenceMapping) {
    const mistake = COMMON_MISTAKES.find(
      (m) => m.id === 'mistake_no_reference'
    );
    if (mistake) {
      detected.push({
        mistake,
        context: 'Reference/Cheque number column detected but not mapped',
      });
    }
  }

  // Check for unmapped balance column
  const hasBalanceColumn = detectedColumns.some((col) =>
    /balance|closing.*balance|running.*balance/i.test(col.columnName)
  );
  const hasBalanceMapping = mappedFields.includes('balance');

  if (hasBalanceColumn && !hasBalanceMapping) {
    const mistake = COMMON_MISTAKES.find((m) => m.id === 'mistake_no_balance');
    if (mistake) {
      detected.push({
        mistake,
        context: 'Balance column detected but not mapped',
      });
    }
  }

  return detected;
};

// ============================================================================
// CONTEXTUAL TIPS
// ============================================================================

export interface ContextualTip {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  action?: {
    label: string;
    handler: string; // Function name to call
  };
}

/**
 * Get contextual tips based on current mapping state
 */
export const getContextualTips = (
  detectedColumns: DetectedColumn[],
  mappings: ColumnMapping[],
  validationScore?: number
): ContextualTip[] => {
  const tips: ContextualTip[] = [];

  // All required fields mapped
  const requiredFields = ['date', 'amount', 'description'];
  const mappedFields = mappings.map((m) => m.targetField);
  const allRequiredMapped = requiredFields.every((field) =>
    mappedFields.includes(field)
  );

  if (allRequiredMapped && mappings.length === 3) {
    tips.push({
      id: 'tip_consider_optional',
      message:
        'All required fields are mapped! Consider mapping optional fields like reference or balance for better matching.',
      type: 'info',
    });
  }

  // High validation score
  if (validationScore && validationScore >= 90) {
    tips.push({
      id: 'tip_save_template',
      message:
        'Your mapping looks great! Consider saving it as a template for future use.',
      type: 'success',
      action: {
        label: 'Save Template',
        handler: 'openSaveTemplateDialog',
      },
    });
  }

  // Detected columns not yet mapped
  const unmappedColumns = detectedColumns.filter(
    (col) => !mappings.some((m) => m.sourceColumn === col.columnName)
  );

  if (unmappedColumns.length > 0 && allRequiredMapped) {
    tips.push({
      id: 'tip_unmapped_columns',
      message: `${unmappedColumns.length} columns are not yet mapped. Review if any should be included.`,
      type: 'info',
    });
  }

  // Debit/credit suggestion
  const hasDebitColumn = detectedColumns.some((col) =>
    /debit/i.test(col.columnName)
  );
  const hasCreditColumn = detectedColumns.some((col) =>
    /credit/i.test(col.columnName)
  );
  const hasAmountMapping = mappedFields.includes('amount');

  if (hasDebitColumn && hasCreditColumn && hasAmountMapping) {
    tips.push({
      id: 'tip_use_debit_credit',
      message:
        'Your file has Debit and Credit columns. Consider using them instead of Amount for better accuracy.',
      type: 'info',
    });
  }

  return tips;
};

// ============================================================================
// QUICK START TIPS
// ============================================================================

export const QUICK_START_TIPS = [
  '💡 Start by mapping the three required fields: Date, Amount, and Description',
  '🔍 Use the search box to quickly find column names',
  '✨ Auto-mapping has already suggested some mappings based on column names',
  '📋 Save your mapping as a template to reuse it for similar files',
  '⚠️ Pay attention to type mismatch warnings to avoid import errors',
  '👁️ Review the mapping preview to ensure data looks correct',
  '🎯 Optional fields like Reference and Balance improve matching accuracy',
  '📊 Check the validation panel for data quality insights',
];

/**
 * Get a random quick start tip
 */
export const getRandomQuickStartTip = (): string => {
  const randomIndex = Math.floor(Math.random() * QUICK_START_TIPS.length);
  return QUICK_START_TIPS[randomIndex];
};
