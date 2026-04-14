import { DetectedColumn, ColumnMapping } from '../services/dataPrepService';

/**
 * Edge Case Handling Utilities
 * Handles large files, special characters, encoding issues, and data quality
 */

// ============================================================================
// LARGE DATASET HANDLING
// ============================================================================

export interface DatasetLimits {
  maxRows: number;
  maxColumns: number;
  maxSampleSize: number;
  warnThresholdRows: number;
  warnThresholdColumns: number;
}

export const DEFAULT_LIMITS: DatasetLimits = {
  maxRows: 100000,
  maxColumns: 500,
  maxSampleSize: 1000,
  warnThresholdRows: 10000,
  warnThresholdColumns: 50,
};

export interface DatasetSizeAnalysis {
  rowCount: number;
  columnCount: number;
  isLarge: boolean;
  isVeryLarge: boolean;
  exceedsLimits: boolean;
  warnings: string[];
  recommendations: string[];
  estimatedMemoryMB: number;
}

/**
 * Analyze dataset size and detect potential issues
 */
export const analyzeDatasetSize = (
  rowCount: number,
  columnCount: number,
  limits: DatasetLimits = DEFAULT_LIMITS
): DatasetSizeAnalysis => {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Estimate memory usage (rough calculation)
  // Assume average 50 bytes per cell
  const estimatedMemoryMB = (rowCount * columnCount * 50) / (1024 * 1024);

  // Check if large
  const isLarge =
    rowCount >= limits.warnThresholdRows ||
    columnCount >= limits.warnThresholdColumns;

  // Check if very large
  const isVeryLarge =
    rowCount >= limits.warnThresholdRows * 5 ||
    columnCount >= limits.warnThresholdColumns * 2;

  // Check if exceeds limits
  const exceedsLimits =
    rowCount > limits.maxRows || columnCount > limits.maxColumns;

  // Generate warnings
  if (exceedsLimits) {
    warnings.push(
      `File exceeds system limits (${rowCount.toLocaleString()} rows, ${columnCount} columns)`
    );
    recommendations.push(
      'Consider splitting the file into smaller chunks or filtering by date range'
    );
  } else if (isVeryLarge) {
    warnings.push(
      `Very large file detected (${rowCount.toLocaleString()} rows, ${columnCount} columns)`
    );
    recommendations.push('Processing may take longer than usual');
    recommendations.push('Ensure stable internet connection');
  } else if (isLarge) {
    warnings.push(
      `Large file detected (${rowCount.toLocaleString()} rows, ${columnCount} columns)`
    );
    recommendations.push('Processing will use progressive loading for best performance');
  }

  // Memory warnings
  if (estimatedMemoryMB > 100) {
    warnings.push(`Estimated memory usage: ${estimatedMemoryMB.toFixed(0)}MB`);
    recommendations.push('Close other browser tabs to free up memory');
  }

  // Column count warnings
  if (columnCount > 100) {
    warnings.push(`File has many columns (${columnCount})`);
    recommendations.push('Only map the essential columns to improve performance');
  }

  return {
    rowCount,
    columnCount,
    isLarge,
    isVeryLarge,
    exceedsLimits,
    warnings,
    recommendations,
    estimatedMemoryMB,
  };
};

/**
 * Optimize sample size based on dataset size
 */
export const calculateOptimalSampleSize = (
  rowCount: number,
  limits: DatasetLimits = DEFAULT_LIMITS
): number => {
  if (rowCount <= 100) {
    return rowCount; // Use all rows for small datasets
  }

  if (rowCount <= 1000) {
    return Math.min(100, rowCount);
  }

  if (rowCount <= 10000) {
    return Math.min(500, rowCount);
  }

  // For very large datasets, use fixed sample size
  return limits.maxSampleSize;
};

// ============================================================================
// SPECIAL CHARACTER HANDLING
// ============================================================================

export interface CharacterIssue {
  columnName: string;
  originalName: string;
  issue: 'special_chars' | 'whitespace' | 'non_ascii' | 'too_long' | 'empty';
  details: string;
  suggestedFix: string;
}

/**
 * Detect problematic characters in column names
 */
export const detectColumnNameIssues = (
  columnName: string
): CharacterIssue[] => {
  const issues: CharacterIssue[] = [];

  // Empty or whitespace only
  if (!columnName || columnName.trim().length === 0) {
    issues.push({
      columnName,
      originalName: columnName,
      issue: 'empty',
      details: 'Column name is empty or whitespace only',
      suggestedFix: 'Column_' + Math.random().toString(36).substring(7),
    });
    return issues;
  }

  // Too long (>100 characters)
  if (columnName.length > 100) {
    issues.push({
      columnName,
      originalName: columnName,
      issue: 'too_long',
      details: `Column name is too long (${columnName.length} characters)`,
      suggestedFix: columnName.substring(0, 97) + '...',
    });
  }

  // Leading/trailing whitespace
  if (columnName !== columnName.trim()) {
    issues.push({
      columnName,
      originalName: columnName,
      issue: 'whitespace',
      details: 'Column name has leading or trailing whitespace',
      suggestedFix: columnName.trim(),
    });
  }

  // Special characters that may cause issues
  const specialCharsRegex = /[<>:"/\\|?*\x00-\x1f]/g;
  if (specialCharsRegex.test(columnName)) {
    const cleaned = columnName.replace(specialCharsRegex, '_');
    issues.push({
      columnName,
      originalName: columnName,
      issue: 'special_chars',
      details: 'Column name contains special characters',
      suggestedFix: cleaned,
    });
  }

  // Non-ASCII characters (potential encoding issues)
  const nonAsciiRegex = /[^\x00-\x7F]/g;
  if (nonAsciiRegex.test(columnName)) {
    issues.push({
      columnName,
      originalName: columnName,
      issue: 'non_ascii',
      details: 'Column name contains non-ASCII characters (may cause encoding issues)',
      suggestedFix: columnName.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    });
  }

  return issues;
};

/**
 * Sanitize column name to be safe for processing
 */
export const sanitizeColumnName = (columnName: string): string => {
  if (!columnName || columnName.trim().length === 0) {
    return 'Column_' + Math.random().toString(36).substring(7);
  }

  let sanitized = columnName.trim();

  // Remove or replace special characters
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');

  // Normalize Unicode characters (decompose and remove combining marks)
  sanitized = sanitized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Replace multiple spaces/underscores with single underscore
  sanitized = sanitized.replace(/[\s_]+/g, '_');

  // Remove leading/trailing underscores
  sanitized = sanitized.replace(/^_+|_+$/g, '');

  // Limit length
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }

  // Ensure not empty after sanitization
  if (sanitized.length === 0) {
    sanitized = 'Column_' + Math.random().toString(36).substring(7);
  }

  return sanitized;
};

/**
 * Batch sanitize all column names
 */
export const sanitizeAllColumnNames = (
  columns: DetectedColumn[]
): { sanitized: DetectedColumn[]; issues: CharacterIssue[] } => {
  const sanitized: DetectedColumn[] = [];
  const allIssues: CharacterIssue[] = [];

  columns.forEach((column) => {
    const issues = detectColumnNameIssues(column.columnName);
    allIssues.push(...issues);

    const sanitizedName = sanitizeColumnName(column.columnName);

    sanitized.push({
      ...column,
      columnName: sanitizedName,
    });
  });

  return { sanitized, issues: allIssues };
};

// ============================================================================
// DUPLICATE COLUMN NAME HANDLING
// ============================================================================

export interface DuplicateColumnInfo {
  originalName: string;
  count: number;
  indices: number[];
  resolvedNames: string[];
}

/**
 * Detect and resolve duplicate column names
 */
export const resolveDuplicateColumnNames = (
  columnNames: string[]
): {
  resolvedNames: string[];
  duplicates: DuplicateColumnInfo[];
} => {
  const nameCount: Map<string, number[]> = new Map();
  const resolvedNames: string[] = [];
  const duplicates: DuplicateColumnInfo[] = [];

  // First pass: identify duplicates
  columnNames.forEach((name, index) => {
    if (!nameCount.has(name)) {
      nameCount.set(name, []);
    }
    nameCount.get(name)!.push(index);
  });

  // Second pass: resolve duplicates
  columnNames.forEach((name, index) => {
    const indices = nameCount.get(name)!;

    if (indices.length === 1) {
      // No duplicate
      resolvedNames.push(name);
    } else {
      // Duplicate found
      const occurrenceIndex = indices.indexOf(index);
      const resolvedName = `${name}_${occurrenceIndex + 1}`;
      resolvedNames.push(resolvedName);

      // Track duplicate info (only once per duplicate group)
      if (occurrenceIndex === 0) {
        duplicates.push({
          originalName: name,
          count: indices.length,
          indices,
          resolvedNames: indices.map((_, i) => `${name}_${i + 1}`),
        });
      }
    }
  });

  return { resolvedNames, duplicates };
};

// ============================================================================
// ENCODING DETECTION
// ============================================================================

export interface EncodingIssue {
  type: 'mojibake' | 'null_bytes' | 'bom' | 'mixed_encoding';
  details: string;
  affectedColumns: string[];
  suggestion: string;
}

/**
 * Detect common encoding issues
 */
export const detectEncodingIssues = (
  columns: DetectedColumn[]
): EncodingIssue[] => {
  const issues: EncodingIssue[] = [];

  // Check for Mojibake (garbled text from encoding issues)
  const mojibakePattern = /�|[\u0080-\u009F]/;
  const affectedByMojibake: string[] = [];

  columns.forEach((col) => {
    if (mojibakePattern.test(col.columnName)) {
      affectedByMojibake.push(col.columnName);
    }

    col.sampleValues.forEach((val) => {
      if (mojibakePattern.test(val)) {
        if (!affectedByMojibake.includes(col.columnName)) {
          affectedByMojibake.push(col.columnName);
        }
      }
    });
  });

  if (affectedByMojibake.length > 0) {
    issues.push({
      type: 'mojibake',
      details: 'Detected garbled text (Mojibake) indicating encoding issues',
      affectedColumns: affectedByMojibake,
      suggestion:
        'Ensure file is saved with UTF-8 encoding. Try re-exporting from source system.',
    });
  }

  // Check for null bytes
  const nullBytePattern = /\x00/;
  const affectedByNullBytes: string[] = [];

  columns.forEach((col) => {
    col.sampleValues.forEach((val) => {
      if (nullBytePattern.test(val)) {
        if (!affectedByNullBytes.includes(col.columnName)) {
          affectedByNullBytes.push(col.columnName);
        }
      }
    });
  });

  if (affectedByNullBytes.length > 0) {
    issues.push({
      type: 'null_bytes',
      details: 'Detected null bytes in data',
      affectedColumns: affectedByNullBytes,
      suggestion: 'Clean the file to remove null bytes before import.',
    });
  }

  // Check for BOM (Byte Order Mark)
  const firstColumn = columns[0];
  if (firstColumn && firstColumn.columnName.charCodeAt(0) === 0xfeff) {
    issues.push({
      type: 'bom',
      details: 'File contains BOM (Byte Order Mark)',
      affectedColumns: [firstColumn.columnName],
      suggestion: 'BOM detected. File should be cleaned or saved without BOM.',
    });
  }

  return issues;
};

// ============================================================================
// DATA TYPE CONFUSION
// ============================================================================

export interface TypeConfusion {
  columnName: string;
  detectedType: string;
  conflictingTypes: string[];
  sampleValues: string[];
  confidence: number;
  suggestion: string;
}

/**
 * Detect columns with mixed or ambiguous data types
 */
export const detectTypeConfusion = (
  column: DetectedColumn
): TypeConfusion | null => {
  const { columnName, sampleValues, detectedType, confidence } = column;

  // Low confidence indicates type confusion
  if (confidence < 0.7) {
    // Analyze sample values to find conflicting types
    const types = new Set<string>();

    sampleValues.forEach((val) => {
      if (!val || val.trim() === '') {
        types.add('empty');
      } else if (/^\d+$/.test(val)) {
        types.add('integer');
      } else if (/^\d+\.\d+$/.test(val)) {
        types.add('decimal');
      } else if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
        types.add('date');
      } else if (/^[$₹€£]\s*\d/.test(val)) {
        types.add('currency');
      } else {
        types.add('text');
      }
    });

    if (types.size > 2) {
      return {
        columnName,
        detectedType,
        conflictingTypes: Array.from(types),
        sampleValues: sampleValues.slice(0, 5),
        confidence,
        suggestion:
          'Column contains mixed data types. Consider cleaning the data or mapping to text field.',
      };
    }
  }

  return null;
};

// ============================================================================
// MEMORY OPTIMIZATION
// ============================================================================

export interface MemoryOptimizationResult {
  originalSampleSize: number;
  optimizedSampleSize: number;
  reduction: number;
  estimatedSavingsMB: number;
}

/**
 * Optimize sample values for memory efficiency
 */
export const optimizeSampleValues = (
  columns: DetectedColumn[],
  maxSamplesPerColumn: number = 10
): {
  optimized: DetectedColumn[];
  result: MemoryOptimizationResult;
} => {
  let originalSize = 0;
  let optimizedSize = 0;

  const optimized = columns.map((col) => {
    originalSize += col.sampleValues.length;
    const optimizedSamples = col.sampleValues.slice(0, maxSamplesPerColumn);
    optimizedSize += optimizedSamples.length;

    return {
      ...col,
      sampleValues: optimizedSamples,
    };
  });

  const reduction = ((originalSize - optimizedSize) / originalSize) * 100;
  const estimatedSavingsMB =
    ((originalSize - optimizedSize) * 50) / (1024 * 1024); // Rough estimate

  return {
    optimized,
    result: {
      originalSampleSize: originalSize,
      optimizedSampleSize: optimizedSize,
      reduction: Math.round(reduction),
      estimatedSavingsMB: Math.round(estimatedSavingsMB * 10) / 10,
    },
  };
};

// ============================================================================
// COMPREHENSIVE EDGE CASE ANALYSIS
// ============================================================================

export interface EdgeCaseAnalysis {
  datasetSize: DatasetSizeAnalysis;
  columnNameIssues: CharacterIssue[];
  duplicateColumns: DuplicateColumnInfo[];
  encodingIssues: EncodingIssue[];
  typeConfusions: TypeConfusion[];
  memoryOptimization: MemoryOptimizationResult | null;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Run comprehensive edge case analysis
 */
export const analyzeEdgeCases = (
  columns: DetectedColumn[],
  rowCount: number,
  autoOptimize: boolean = true
): EdgeCaseAnalysis => {
  // Analyze dataset size
  const datasetSize = analyzeDatasetSize(rowCount, columns.length);

  // Detect column name issues
  const { issues: columnNameIssues } = sanitizeAllColumnNames(columns);

  // Detect duplicate column names
  const { duplicates } = resolveDuplicateColumnNames(
    columns.map((c) => c.columnName)
  );

  // Detect encoding issues
  const encodingIssues = detectEncodingIssues(columns);

  // Detect type confusion
  const typeConfusions = columns
    .map(detectTypeConfusion)
    .filter((tc): tc is TypeConfusion => tc !== null);

  // Memory optimization (if requested)
  let memoryOptimization: MemoryOptimizationResult | null = null;
  if (autoOptimize && datasetSize.isLarge) {
    const { result } = optimizeSampleValues(columns);
    memoryOptimization = result;
  }

  // Collect critical issues
  const criticalIssues: string[] = [];
  if (datasetSize.exceedsLimits) {
    criticalIssues.push('File exceeds system limits');
  }
  if (encodingIssues.some((e) => e.type === 'mojibake')) {
    criticalIssues.push('Encoding issues detected (garbled text)');
  }
  if (duplicates.length > 0) {
    criticalIssues.push(`${duplicates.length} duplicate column name(s) found`);
  }

  // Collect warnings
  const warnings: string[] = [
    ...datasetSize.warnings,
    ...columnNameIssues.map((i) => `${i.columnName}: ${i.details}`),
    ...encodingIssues.map((e) => e.details),
    ...typeConfusions.map((tc) => `${tc.columnName}: ${tc.suggestion}`),
  ];

  // Collect recommendations
  const recommendations: string[] = [
    ...datasetSize.recommendations,
    ...encodingIssues.map((e) => e.suggestion),
  ];

  if (columnNameIssues.length > 0) {
    recommendations.push('Column names will be automatically sanitized');
  }

  if (duplicates.length > 0) {
    recommendations.push(
      'Duplicate column names will be numbered (e.g., Column_1, Column_2)'
    );
  }

  if (memoryOptimization && memoryOptimization.reduction > 0) {
    recommendations.push(
      `Sample data optimized: ${memoryOptimization.reduction}% reduction`
    );
  }

  return {
    datasetSize,
    columnNameIssues,
    duplicateColumns: duplicates,
    encodingIssues,
    typeConfusions,
    memoryOptimization,
    criticalIssues,
    warnings,
    recommendations,
  };
};
