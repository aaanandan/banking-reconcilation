import { DetectedColumn, ColumnMapping } from '../services/dataPrepService';

/**
 * Mapping Operations Utility
 * Provides bulk operations and shortcuts for column mappings
 */

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Map all required fields automatically using auto-detection
 */
export const mapAllRequired = (
  detectedColumns: DetectedColumn[]
): ColumnMapping[] => {
  const mappings: ColumnMapping[] = [];
  const requiredFields = ['date', 'amount', 'description'];

  requiredFields.forEach((field) => {
    // Find column with highest confidence for this field type
    let bestColumn: DetectedColumn | null = null;
    let bestScore = 0;

    detectedColumns.forEach((col) => {
      // Check if column type matches required field
      const typeMatches =
        (field === 'date' && col.detectedType === 'date') ||
        (field === 'amount' &&
          (col.detectedType === 'amount' || col.detectedType === 'number')) ||
        (field === 'description' && col.detectedType === 'text');

      if (typeMatches) {
        // Calculate score based on confidence and name matching
        let score = col.confidence;

        // Boost score if column name contains field name
        const columnNameLower = col.columnName.toLowerCase();
        if (columnNameLower.includes(field)) {
          score += 0.3;
        }

        // Boost for common variations
        if (field === 'date' && /date|dt|txn.*date/i.test(col.columnName)) {
          score += 0.2;
        }
        if (
          field === 'amount' &&
          /amount|amt|total|value/i.test(col.columnName)
        ) {
          score += 0.2;
        }
        if (
          field === 'description' &&
          /desc|narration|particulars|details/i.test(col.columnName)
        ) {
          score += 0.2;
        }

        if (score > bestScore) {
          bestScore = score;
          bestColumn = col;
        }
      }
    });

    if (bestColumn && bestScore > 0.5) {
      mappings.push({
        sourceColumn: bestColumn.columnName,
        targetField: field,
      });
    }
  });

  return mappings;
};

/**
 * Map all columns to their best-matching target fields
 */
export const mapAllAuto = (
  detectedColumns: DetectedColumn[]
): ColumnMapping[] => {
  const mappings: ColumnMapping[] = [];
  const fieldTypeMappings: { [key: string]: string[] } = {
    date: ['date'],
    amount: ['amount', 'debit', 'credit', 'balance'],
    number: ['amount', 'debit', 'credit', 'balance'],
    text: ['description', 'reference', 'payee', 'category'],
  };

  const usedTargets = new Set<string>();

  detectedColumns.forEach((col) => {
    const possibleTargets = fieldTypeMappings[col.detectedType] || [];

    // Find best target field
    let bestTarget: string | null = null;
    let bestScore = 0;

    possibleTargets.forEach((target) => {
      if (usedTargets.has(target)) return;

      let score = col.confidence;

      // Boost score for name matching
      const columnNameLower = col.columnName.toLowerCase();
      if (columnNameLower.includes(target)) {
        score += 0.3;
      }

      // Specific boosts
      if (target === 'reference' && /ref|cheque|chq/i.test(col.columnName)) {
        score += 0.3;
      }
      if (target === 'payee' && /payee|party|vendor/i.test(col.columnName)) {
        score += 0.3;
      }
      if (target === 'debit' && /debit|dr|withdrawal/i.test(col.columnName)) {
        score += 0.3;
      }
      if (target === 'credit' && /credit|cr|deposit/i.test(col.columnName)) {
        score += 0.3;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTarget = target;
      }
    });

    if (bestTarget && bestScore > 0.5) {
      mappings.push({
        sourceColumn: col.columnName,
        targetField: bestTarget,
      });
      usedTargets.add(bestTarget);
    }
  });

  return mappings;
};

/**
 * Clear all mappings
 */
export const clearAllMappings = (): ColumnMapping[] => {
  return [];
};

/**
 * Remove mapping for specific source column
 */
export const removeMapping = (
  mappings: ColumnMapping[],
  sourceColumn: string
): ColumnMapping[] => {
  return mappings.filter((m) => m.sourceColumn !== sourceColumn);
};

/**
 * Remove all unmapped columns (keep only mapped ones)
 */
export const removeUnmapped = (
  mappings: ColumnMapping[],
  detectedColumns: DetectedColumn[]
): ColumnMapping[] => {
  const mappedColumns = new Set(mappings.map((m) => m.sourceColumn));
  return mappings.filter((m) => mappedColumns.has(m.sourceColumn));
};

/**
 * Swap two mappings
 */
export const swapMappings = (
  mappings: ColumnMapping[],
  sourceColumn1: string,
  sourceColumn2: string
): ColumnMapping[] => {
  const mapping1Index = mappings.findIndex((m) => m.sourceColumn === sourceColumn1);
  const mapping2Index = mappings.findIndex((m) => m.sourceColumn === sourceColumn2);

  if (mapping1Index === -1 || mapping2Index === -1) {
    return mappings;
  }

  const newMappings = [...mappings];
  const temp = newMappings[mapping1Index].targetField;
  newMappings[mapping1Index] = {
    ...newMappings[mapping1Index],
    targetField: newMappings[mapping2Index].targetField,
  };
  newMappings[mapping2Index] = {
    ...newMappings[mapping2Index],
    targetField: temp,
  };

  return newMappings;
};

/**
 * Swap debit and credit mappings
 */
export const swapDebitCredit = (mappings: ColumnMapping[]): ColumnMapping[] => {
  const debitIndex = mappings.findIndex((m) => m.targetField === 'debit');
  const creditIndex = mappings.findIndex((m) => m.targetField === 'credit');

  if (debitIndex === -1 || creditIndex === -1) {
    return mappings;
  }

  return swapMappings(
    mappings,
    mappings[debitIndex].sourceColumn,
    mappings[creditIndex].sourceColumn
  );
};

// ============================================================================
// MAPPING STATISTICS
// ============================================================================

export interface MappingStatistics {
  totalColumns: number;
  mappedColumns: number;
  unmappedColumns: number;
  requiredMapped: number;
  requiredTotal: number;
  optionalMapped: number;
  completionPercentage: number;
  mappingsByType: { [key: string]: number };
  missingRequired: string[];
  duplicateTargets: string[];
}

/**
 * Calculate mapping statistics
 */
export const calculateMappingStatistics = (
  detectedColumns: DetectedColumn[],
  mappings: ColumnMapping[]
): MappingStatistics => {
  const requiredFields = ['date', 'amount', 'description'];
  const mappedTargets = mappings.map((m) => m.targetField);
  const mappedColumns = new Set(mappings.map((m) => m.sourceColumn));

  // Count required fields that are mapped
  const requiredMapped = requiredFields.filter((field) =>
    mappedTargets.includes(field)
  ).length;

  // Find missing required fields
  const missingRequired = requiredFields.filter(
    (field) => !mappedTargets.includes(field)
  );

  // Find duplicate targets
  const targetCounts: { [key: string]: number } = {};
  mappedTargets.forEach((target) => {
    targetCounts[target] = (targetCounts[target] || 0) + 1;
  });
  const duplicateTargets = Object.keys(targetCounts).filter(
    (target) => targetCounts[target] > 1
  );

  // Count mappings by type
  const mappingsByType: { [key: string]: number } = {};
  mappings.forEach((mapping) => {
    const column = detectedColumns.find((c) => c.columnName === mapping.sourceColumn);
    if (column) {
      mappingsByType[column.detectedType] =
        (mappingsByType[column.detectedType] || 0) + 1;
    }
  });

  // Calculate completion percentage
  // Weight: required fields 70%, optional fields 30%
  const requiredWeight = 0.7;
  const optionalWeight = 0.3;
  const requiredCompletion = requiredMapped / requiredFields.length;
  const optionalTotal = detectedColumns.length - requiredFields.length;
  const optionalMapped = mappings.length - requiredMapped;
  const optionalCompletion =
    optionalTotal > 0 ? Math.min(optionalMapped / optionalTotal, 1) : 0;
  const completionPercentage =
    (requiredCompletion * requiredWeight + optionalCompletion * optionalWeight) * 100;

  return {
    totalColumns: detectedColumns.length,
    mappedColumns: mappedColumns.size,
    unmappedColumns: detectedColumns.length - mappedColumns.size,
    requiredMapped,
    requiredTotal: requiredFields.length,
    optionalMapped: mappedColumns.size - requiredMapped,
    completionPercentage: Math.round(completionPercentage),
    mappingsByType,
    missingRequired,
    duplicateTargets,
  };
};

// ============================================================================
// COPY MAPPINGS
// ============================================================================

/**
 * Copy mappings from one file to another by matching column names
 */
export const copyMappings = (
  sourceMappings: ColumnMapping[],
  targetColumns: DetectedColumn[]
): ColumnMapping[] => {
  const copiedMappings: ColumnMapping[] = [];
  const targetColumnNames = new Set(targetColumns.map((c) => c.columnName));

  sourceMappings.forEach((sourceMapping) => {
    // Exact match
    if (targetColumnNames.has(sourceMapping.sourceColumn)) {
      copiedMappings.push({
        sourceColumn: sourceMapping.sourceColumn,
        targetField: sourceMapping.targetField,
      });
      return;
    }

    // Fuzzy match (case-insensitive)
    const sourceColumnLower = sourceMapping.sourceColumn.toLowerCase();
    const matchingColumn = targetColumns.find(
      (tc) => tc.columnName.toLowerCase() === sourceColumnLower
    );

    if (matchingColumn) {
      copiedMappings.push({
        sourceColumn: matchingColumn.columnName,
        targetField: sourceMapping.targetField,
      });
    }
  });

  return copiedMappings;
};

/**
 * Merge mappings (combine two mapping sets, preferring newer)
 */
export const mergeMappings = (
  existingMappings: ColumnMapping[],
  newMappings: ColumnMapping[]
): ColumnMapping[] => {
  const merged = [...existingMappings];
  const existingTargets = new Set(existingMappings.map((m) => m.targetField));

  newMappings.forEach((newMapping) => {
    // If target field is already mapped, replace it
    const existingIndex = merged.findIndex(
      (m) => m.targetField === newMapping.targetField
    );

    if (existingIndex !== -1) {
      merged[existingIndex] = newMapping;
    } else {
      merged.push(newMapping);
    }
  });

  return merged;
};

// ============================================================================
// QUICK ACTIONS
// ============================================================================

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: (
    mappings: ColumnMapping[],
    detectedColumns: DetectedColumn[]
  ) => ColumnMapping[];
  requiresConfirmation?: boolean;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'map_required',
    label: 'Map Required Fields',
    description: 'Automatically map date, amount, and description fields',
    icon: 'ThunderboltOutlined',
    action: (mappings, columns) => {
      const requiredMappings = mapAllRequired(columns);
      return mergeMappings(mappings, requiredMappings);
    },
  },
  {
    id: 'map_all_auto',
    label: 'Auto-Map All',
    description: 'Automatically map all columns to best-matching fields',
    icon: 'RocketOutlined',
    action: (mappings, columns) => mapAllAuto(columns),
  },
  {
    id: 'clear_all',
    label: 'Clear All',
    description: 'Remove all column mappings',
    icon: 'ClearOutlined',
    action: () => clearAllMappings(),
    requiresConfirmation: true,
  },
  {
    id: 'swap_debit_credit',
    label: 'Swap Debit/Credit',
    description: 'Swap debit and credit column mappings',
    icon: 'SwapOutlined',
    action: (mappings) => swapDebitCredit(mappings),
  },
];

/**
 * Execute a quick action by ID
 */
export const executeQuickAction = (
  actionId: string,
  mappings: ColumnMapping[],
  detectedColumns: DetectedColumn[]
): ColumnMapping[] | null => {
  const action = QUICK_ACTIONS.find((a) => a.id === actionId);

  if (!action) {
    return null;
  }

  return action.action(mappings, detectedColumns);
};
