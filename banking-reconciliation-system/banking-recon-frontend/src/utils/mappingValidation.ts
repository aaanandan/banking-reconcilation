/**
 * Mapping Validation Utilities
 * Provides validation and quality checking for column mappings
 */

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

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
  confidence: number;
}

export interface FieldTypeRule {
  field: string;
  compatibleTypes: ('date' | 'amount' | 'text' | 'number')[];
  required: boolean;
}

/**
 * Field type compatibility rules
 */
const FIELD_TYPE_RULES: FieldTypeRule[] = [
  {
    field: 'date',
    compatibleTypes: ['date', 'text'],
    required: true,
  },
  {
    field: 'amount',
    compatibleTypes: ['amount', 'number'],
    required: true,
  },
  {
    field: 'description',
    compatibleTypes: ['text'],
    required: true,
  },
  {
    field: 'reference',
    compatibleTypes: ['text', 'number'],
    required: false,
  },
  {
    field: 'payee',
    compatibleTypes: ['text'],
    required: false,
  },
  {
    field: 'category',
    compatibleTypes: ['text'],
    required: false,
  },
  {
    field: 'balance',
    compatibleTypes: ['amount', 'number'],
    required: false,
  },
  {
    field: 'debit',
    compatibleTypes: ['amount', 'number'],
    required: false,
  },
  {
    field: 'credit',
    compatibleTypes: ['amount', 'number'],
    required: false,
  },
];

/**
 * Validate a single column mapping
 */
export const validateMapping = (
  mapping: ColumnMapping,
  detectedColumn: DetectedColumn
): ValidationResult => {
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];
  let confidence = 100;

  // Find field type rule
  const rule = FIELD_TYPE_RULES.find(r => r.field === mapping.targetField);

  if (!rule) {
    warnings.push(`Unknown target field: ${mapping.targetField}`);
    confidence -= 20;
  } else {
    // Check type compatibility
    if (!rule.compatibleTypes.includes(detectedColumn.detectedType)) {
      const compatibleTypesStr = rule.compatibleTypes.join(' or ');
      errors.push(
        `Type mismatch: ${mapping.targetField} expects ${compatibleTypesStr}, but column is detected as ${detectedColumn.detectedType}`
      );
      suggestions.push(
        `Consider mapping a ${compatibleTypesStr} column to ${mapping.targetField} instead`
      );
      confidence -= 40;
    }

    // Check detection confidence
    if (detectedColumn.confidence < 0.7) {
      warnings.push(
        `Low detection confidence (${(detectedColumn.confidence * 100).toFixed(0)}%) for ${detectedColumn.columnName}`
      );
      suggestions.push('Verify sample values to ensure correct mapping');
      confidence -= 15;
    } else if (detectedColumn.confidence < 0.85) {
      warnings.push(
        `Moderate detection confidence (${(detectedColumn.confidence * 100).toFixed(0)}%) for ${detectedColumn.columnName}`
      );
      confidence -= 5;
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    suggestions,
    confidence: Math.max(0, confidence),
  };
};

/**
 * Validate all mappings for a file
 */
export const validateAllMappings = (
  mappings: ColumnMapping[],
  detectedColumns: DetectedColumn[]
): {
  isComplete: boolean;
  isValid: boolean;
  overallConfidence: number;
  missingRequired: string[];
  duplicateMappings: string[];
  validationResults: Map<string, ValidationResult>;
} => {
  const validationResults = new Map<string, ValidationResult>();
  const mappedFields = new Set<string>();
  const duplicateMappings: string[] = [];
  let totalConfidence = 0;
  let validMappingsCount = 0;

  // Check for duplicate target fields
  mappings.forEach(mapping => {
    if (mappedFields.has(mapping.targetField)) {
      duplicateMappings.push(mapping.targetField);
    }
    mappedFields.add(mapping.targetField);
  });

  // Validate each mapping
  mappings.forEach(mapping => {
    const detectedColumn = detectedColumns.find(
      col => col.columnName === mapping.sourceColumn
    );

    if (detectedColumn) {
      const result = validateMapping(mapping, detectedColumn);
      validationResults.set(mapping.sourceColumn, result);

      if (result.isValid) {
        totalConfidence += result.confidence;
        validMappingsCount++;
      }
    }
  });

  // Check for missing required fields
  const requiredFields = FIELD_TYPE_RULES.filter(r => r.required).map(r => r.field);
  const missingRequired = requiredFields.filter(field => !mappedFields.has(field));

  const overallConfidence =
    validMappingsCount > 0 ? totalConfidence / validMappingsCount : 0;

  return {
    isComplete: missingRequired.length === 0,
    isValid: duplicateMappings.length === 0 && validationResults.size === mappings.length,
    overallConfidence,
    missingRequired,
    duplicateMappings,
    validationResults,
  };
};

/**
 * Calculate mapping quality score (0-100)
 */
export const calculateMappingQuality = (
  mappings: ColumnMapping[],
  detectedColumns: DetectedColumn[]
): {
  score: number;
  grade: 'excellent' | 'good' | 'fair' | 'poor';
  feedback: string;
} => {
  const validation = validateAllMappings(mappings, detectedColumns);

  let score = validation.overallConfidence;

  // Penalties
  if (!validation.isComplete) {
    score -= validation.missingRequired.length * 20;
  }

  if (validation.duplicateMappings.length > 0) {
    score -= validation.duplicateMappings.length * 15;
  }

  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine grade
  let grade: 'excellent' | 'good' | 'fair' | 'poor';
  let feedback: string;

  if (score >= 90) {
    grade = 'excellent';
    feedback = 'All mappings are validated and ready to proceed';
  } else if (score >= 75) {
    grade = 'good';
    feedback = 'Mappings look good with minor warnings';
  } else if (score >= 60) {
    grade = 'fair';
    feedback = 'Some mappings need attention';
  } else {
    grade = 'poor';
    feedback = 'Please review and fix mapping issues';
  }

  return { score, grade, feedback };
};

/**
 * Get suggested target field for a detected column
 */
export const suggestTargetField = (
  detectedColumn: DetectedColumn,
  usedFields: Set<string>
): string | null => {
  // Find compatible fields based on detected type
  const compatibleRules = FIELD_TYPE_RULES.filter(rule =>
    rule.compatibleTypes.includes(detectedColumn.detectedType)
  );

  // Prioritize required fields that haven't been used
  const requiredUnused = compatibleRules.filter(
    rule => rule.required && !usedFields.has(rule.field)
  );

  if (requiredUnused.length > 0) {
    return requiredUnused[0].field;
  }

  // Then optional fields
  const optionalUnused = compatibleRules.filter(
    rule => !rule.required && !usedFields.has(rule.field)
  );

  if (optionalUnused.length > 0) {
    return optionalUnused[0].field;
  }

  return null;
};

/**
 * Check if a mapping would create a type mismatch
 */
export const hasTypeMismatch = (
  targetField: string,
  detectedType: 'date' | 'amount' | 'text' | 'number'
): boolean => {
  const rule = FIELD_TYPE_RULES.find(r => r.field === targetField);
  if (!rule) return false;

  return !rule.compatibleTypes.includes(detectedType);
};

/**
 * Get type mismatch warning message
 */
export const getTypeMismatchWarning = (
  targetField: string,
  detectedType: 'date' | 'amount' | 'text' | 'number'
): string | null => {
  const rule = FIELD_TYPE_RULES.find(r => r.field === targetField);
  if (!rule) return null;

  if (!rule.compatibleTypes.includes(detectedType)) {
    const expected = rule.compatibleTypes.join(' or ');
    return `Warning: ${targetField} expects ${expected} type, but column is ${detectedType}`;
  }

  return null;
};

/**
 * Validate sample values for a target field type
 */
export const validateSampleValues = (
  targetField: string,
  sampleValues: string[]
): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];

  switch (targetField) {
    case 'date':
      // Check if values look like dates
      const datePatterns = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY or MM/DD/YYYY
        /^\d{2}-\w{3}-\d{4}$/, // DD-Mon-YYYY
      ];

      const validDates = sampleValues.filter(val =>
        datePatterns.some(pattern => pattern.test(val.trim()))
      );

      if (validDates.length === 0 && sampleValues.length > 0) {
        issues.push('Sample values do not appear to be valid dates');
      }
      break;

    case 'amount':
    case 'balance':
    case 'debit':
    case 'credit':
      // Check if values look like numbers
      const validNumbers = sampleValues.filter(val => {
        const cleaned = val.replace(/[,$]/g, '').trim();
        return cleaned === '' || !isNaN(parseFloat(cleaned));
      });

      if (validNumbers.length < sampleValues.length * 0.5) {
        issues.push('Many sample values do not appear to be valid numbers');
      }
      break;

    case 'description':
    case 'reference':
    case 'payee':
    case 'category':
      // Text fields - check if not all empty
      const nonEmpty = sampleValues.filter(val => val.trim().length > 0);

      if (nonEmpty.length === 0) {
        issues.push('All sample values are empty');
      }
      break;
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};

export default {
  validateMapping,
  validateAllMappings,
  calculateMappingQuality,
  suggestTargetField,
  hasTypeMismatch,
  getTypeMismatchWarning,
  validateSampleValues,
};
