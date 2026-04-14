import { useState, useEffect, useMemo } from 'react';
import { DetectedColumn, ColumnMapping } from '../services/dataPrepService';
import {
  useDebouncedValue,
  useDebouncedCallback,
  usePrevious,
  useValueChanged,
} from './usePerformance';
import {
  lazyValidateAllMappings,
  lazyCalculateMappingQuality,
  lazyRunAdvancedValidation,
  validationScheduler,
  ValidationPriority,
} from '../utils/lazyValidation';
import {
  AdvancedValidationSummary,
} from '../utils/advancedValidation';

/**
 * Optimized Validation Hooks
 * Combines performance optimization with lazy validation
 */

// ============================================================================
// USE DEBOUNCED VALIDATION
// ============================================================================

export interface UseOptimizedValidationOptions {
  debounceDelay?: number;
  useCache?: boolean;
  priority?: ValidationPriority;
}

export interface OptimizedValidationResult {
  isComplete: boolean;
  isValid: boolean;
  overallConfidence: number;
  missingRequired: string[];
  duplicateMappings: string[];
  quality: {
    score: number;
    grade: 'excellent' | 'good' | 'fair' | 'poor';
    feedback: string;
  } | null;
  isValidating: boolean;
}

/**
 * Optimized validation hook with debouncing and caching
 */
export const useOptimizedValidation = (
  mappings: ColumnMapping[],
  detectedColumns: DetectedColumn[],
  options: UseOptimizedValidationOptions = {}
): OptimizedValidationResult => {
  const { debounceDelay = 500, useCache = true, priority = 'medium' } = options;

  const [result, setResult] = useState<OptimizedValidationResult>({
    isComplete: false,
    isValid: false,
    overallConfidence: 0,
    missingRequired: [],
    duplicateMappings: [],
    quality: null,
    isValidating: false,
  });

  // Debounce inputs
  const debouncedMappings = useDebouncedValue(mappings, debounceDelay);
  const debouncedColumns = useDebouncedValue(detectedColumns, debounceDelay);

  // Track if inputs changed
  const mappingsChanged = useValueChanged(debouncedMappings);
  const columnsChanged = useValueChanged(debouncedColumns);

  useEffect(() => {
    // Set validating state
    setResult((prev) => ({ ...prev, isValidating: true }));

    // Schedule validation
    validationScheduler.schedule(
      'optimized-validation',
      () => {
        // Run basic validation
        const validation = lazyValidateAllMappings(
          debouncedMappings,
          debouncedColumns,
          { useCache }
        );

        // Run quality calculation
        const quality = lazyCalculateMappingQuality(
          debouncedMappings,
          debouncedColumns,
          { useCache }
        );

        return {
          ...validation,
          quality,
        };
      },
      (validationResult) => {
        if (validationResult) {
          setResult({
            isComplete: validationResult.isComplete,
            isValid: validationResult.isValid,
            overallConfidence: validationResult.overallConfidence,
            missingRequired: validationResult.missingRequired,
            duplicateMappings: validationResult.duplicateMappings,
            quality: validationResult.quality,
            isValidating: false,
          });
        } else {
          setResult((prev) => ({ ...prev, isValidating: false }));
        }
      },
      priority
    );

    return () => {
      validationScheduler.cancel('optimized-validation');
    };
  }, [debouncedMappings, debouncedColumns, useCache, priority]);

  return result;
};

// ============================================================================
// USE ADVANCED VALIDATION (DEBOUNCED)
// ============================================================================

export interface UseAdvancedValidationOptions {
  debounceDelay?: number;
  useCache?: boolean;
  priority?: ValidationPriority;
  enabled?: boolean;
}

/**
 * Optimized advanced validation hook
 */
export const useAdvancedValidation = (
  detectedColumns: DetectedColumn[],
  mappings: ColumnMapping[],
  options: UseAdvancedValidationOptions = {}
): { validation: AdvancedValidationSummary | null; isValidating: boolean } => {
  const {
    debounceDelay = 800,
    useCache = true,
    priority = 'low',
    enabled = true,
  } = options;

  const [validation, setValidation] = useState<AdvancedValidationSummary | null>(
    null
  );
  const [isValidating, setIsValidating] = useState(false);

  // Debounce inputs (longer delay for advanced validation)
  const debouncedColumns = useDebouncedValue(detectedColumns, debounceDelay);
  const debouncedMappings = useDebouncedValue(mappings, debounceDelay);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    setIsValidating(true);

    // Schedule advanced validation with lower priority
    validationScheduler.schedule(
      'advanced-validation',
      () => {
        return lazyRunAdvancedValidation(
          debouncedColumns,
          debouncedMappings,
          { useCache }
        );
      },
      (result) => {
        if (result) {
          setValidation(result);
        }
        setIsValidating(false);
      },
      priority
    );

    return () => {
      validationScheduler.cancel('advanced-validation');
    };
  }, [debouncedColumns, debouncedMappings, useCache, priority, enabled]);

  return { validation, isValidating };
};

// ============================================================================
// USE CONDITIONAL VALIDATION
// ============================================================================

export interface UseConditionalValidationOptions {
  enabled: boolean;
  debounceDelay?: number;
}

/**
 * Only runs validation when enabled
 * Useful for validation panels that can be hidden
 */
export const useConditionalValidation = (
  mappings: ColumnMapping[],
  detectedColumns: DetectedColumn[],
  options: UseConditionalValidationOptions
): OptimizedValidationResult | null => {
  const { enabled, debounceDelay = 500 } = options;

  const validation = useOptimizedValidation(mappings, detectedColumns, {
    debounceDelay,
    priority: enabled ? 'medium' : 'low',
  });

  if (!enabled) {
    return null;
  }

  return validation;
};

// ============================================================================
// USE INCREMENTAL VALIDATION
// ============================================================================

export interface IncrementalValidationState {
  lastValidated: Date | null;
  validationCount: number;
  shouldRevalidate: boolean;
}

/**
 * Tracks validation state and determines when to revalidate
 */
export const useIncrementalValidation = (
  mappings: ColumnMapping[],
  revalidateThreshold: number = 3 // revalidate after N mapping changes
): IncrementalValidationState => {
  const [state, setState] = useState<IncrementalValidationState>({
    lastValidated: null,
    validationCount: 0,
    shouldRevalidate: false,
  });

  const previousMappings = usePrevious(mappings);
  const mappingsChanged = useValueChanged(mappings);

  useEffect(() => {
    if (mappingsChanged) {
      const newCount = state.validationCount + 1;
      const shouldRevalidate = newCount >= revalidateThreshold;

      setState({
        lastValidated: shouldRevalidate ? new Date() : state.lastValidated,
        validationCount: shouldRevalidate ? 0 : newCount,
        shouldRevalidate,
      });
    }
  }, [mappings, mappingsChanged, state.validationCount, revalidateThreshold]);

  return state;
};

// ============================================================================
// USE SMART VALIDATION
// ============================================================================

export interface SmartValidationOptions {
  basicDelay?: number;
  advancedDelay?: number;
  enableAdvanced?: boolean;
  revalidateThreshold?: number;
}

export interface SmartValidationResult {
  basic: OptimizedValidationResult;
  advanced: AdvancedValidationSummary | null;
  isValidating: boolean;
  stats: {
    lastBasicValidation: Date | null;
    lastAdvancedValidation: Date | null;
    validationCount: number;
  };
}

/**
 * Smart validation that combines basic and advanced validation
 * with intelligent scheduling and caching
 */
export const useSmartValidation = (
  mappings: ColumnMapping[],
  detectedColumns: DetectedColumn[],
  options: SmartValidationOptions = {}
): SmartValidationResult => {
  const {
    basicDelay = 300,
    advancedDelay = 1000,
    enableAdvanced = true,
    revalidateThreshold = 3,
  } = options;

  const [stats, setStats] = useState({
    lastBasicValidation: null as Date | null,
    lastAdvancedValidation: null as Date | null,
    validationCount: 0,
  });

  // Basic validation (fast, high priority)
  const basic = useOptimizedValidation(mappings, detectedColumns, {
    debounceDelay: basicDelay,
    useCache: true,
    priority: 'high',
  });

  // Advanced validation (slower, low priority, only if enabled)
  const { validation: advanced, isValidating: advancedValidating } =
    useAdvancedValidation(detectedColumns, mappings, {
      debounceDelay: advancedDelay,
      useCache: true,
      priority: 'low',
      enabled: enableAdvanced && basic.isComplete,
    });

  // Track validation stats
  useEffect(() => {
    if (!basic.isValidating && basic.quality !== null) {
      setStats((prev) => ({
        ...prev,
        lastBasicValidation: new Date(),
        validationCount: prev.validationCount + 1,
      }));
    }
  }, [basic.isValidating, basic.quality]);

  useEffect(() => {
    if (!advancedValidating && advanced !== null) {
      setStats((prev) => ({
        ...prev,
        lastAdvancedValidation: new Date(),
      }));
    }
  }, [advancedValidating, advanced]);

  return {
    basic,
    advanced,
    isValidating: basic.isValidating || advancedValidating,
    stats,
  };
};
