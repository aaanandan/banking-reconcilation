import type { DetectedColumn, ColumnMapping } from '../services/dataPrepService';
import {
  validateAllMappings,
  calculateMappingQuality,
} from './mappingValidation';
import type { ValidationResult } from './mappingValidation';
import {
  runAdvancedValidation,
} from './advancedValidation';
import type { AdvancedValidationSummary } from './advancedValidation';

/**
 * Lazy Validation Utilities
 * Provides on-demand validation to improve performance
 */

// ============================================================================
// VALIDATION CACHE
// ============================================================================

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hash: string;
}

class ValidationCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxAge: number;
  private maxSize: number;

  constructor(maxAge: number = 5000, maxSize: number = 50) {
    this.maxAge = maxAge; // milliseconds
    this.maxSize = maxSize;
  }

  /**
   * Generate hash from input data
   */
  private generateHash(data: any): string {
    return JSON.stringify(data);
  }

  /**
   * Get cached value if valid
   */
  get(key: string, data: any): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Check if data changed
    const currentHash = this.generateHash(data);
    if (currentHash !== entry.hash) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set cached value
   */
  set(key: string, value: T, data: any): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hash: this.generateHash(data),
    });
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear cache entries older than maxAge
   */
  clearExpired(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; maxAge: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      maxAge: this.maxAge,
    };
  }
}

// Global validation caches
const basicValidationCache = new ValidationCache<ReturnType<typeof validateAllMappings>>();
const qualityCache = new ValidationCache<ReturnType<typeof calculateMappingQuality>>();
const advancedValidationCache = new ValidationCache<AdvancedValidationSummary>();

// ============================================================================
// LAZY VALIDATION FUNCTIONS
// ============================================================================

export interface LazyValidationOptions {
  useCache?: boolean;
  cacheMaxAge?: number;
}

/**
 * Lazy validate all mappings with caching
 */
export const lazyValidateAllMappings = (
  mappings: ColumnMapping[],
  detectedColumns: DetectedColumn[],
  options: LazyValidationOptions = {}
): ReturnType<typeof validateAllMappings> => {
  const { useCache = true, cacheMaxAge = 5000 } = options;

  const cacheKey = 'validateAllMappings';
  const cacheData = { mappings, detectedColumns };

  // Try to get from cache
  if (useCache) {
    const cached = basicValidationCache.get(cacheKey, cacheData);
    if (cached) {
      return cached;
    }
  }

  // Compute validation
  const result = validateAllMappings(mappings, detectedColumns);

  // Store in cache
  if (useCache) {
    basicValidationCache.set(cacheKey, result, cacheData);
  }

  return result;
};

/**
 * Lazy calculate mapping quality with caching
 */
export const lazyCalculateMappingQuality = (
  mappings: ColumnMapping[],
  detectedColumns: DetectedColumn[],
  options: LazyValidationOptions = {}
): ReturnType<typeof calculateMappingQuality> => {
  const { useCache = true, cacheMaxAge = 5000 } = options;

  const cacheKey = 'calculateMappingQuality';
  const cacheData = { mappings, detectedColumns };

  // Try to get from cache
  if (useCache) {
    const cached = qualityCache.get(cacheKey, cacheData);
    if (cached) {
      return cached;
    }
  }

  // Compute quality
  const result = calculateMappingQuality(mappings, detectedColumns);

  // Store in cache
  if (useCache) {
    qualityCache.set(cacheKey, result, cacheData);
  }

  return result;
};

/**
 * Lazy run advanced validation with caching
 */
export const lazyRunAdvancedValidation = (
  detectedColumns: DetectedColumn[],
  mappings: ColumnMapping[],
  options: LazyValidationOptions = {}
): AdvancedValidationSummary => {
  const { useCache = true, cacheMaxAge = 5000 } = options;

  const cacheKey = 'runAdvancedValidation';
  const cacheData = { detectedColumns, mappings };

  // Try to get from cache
  if (useCache) {
    const cached = advancedValidationCache.get(cacheKey, cacheData);
    if (cached) {
      return cached;
    }
  }

  // Compute validation
  const result = runAdvancedValidation(detectedColumns, mappings);

  // Store in cache
  if (useCache) {
    advancedValidationCache.set(cacheKey, result, cacheData);
  }

  return result;
};

/**
 * Clear all validation caches
 */
export const clearValidationCaches = (): void => {
  basicValidationCache.clear();
  qualityCache.clear();
  advancedValidationCache.clear();
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCaches = (): void => {
  basicValidationCache.clearExpired();
  qualityCache.clearExpired();
  advancedValidationCache.clearExpired();
};

/**
 * Get cache statistics
 */
export const getValidationCacheStats = () => {
  return {
    basicValidation: basicValidationCache.getStats(),
    quality: qualityCache.getStats(),
    advancedValidation: advancedValidationCache.getStats(),
  };
};

// ============================================================================
// PROGRESSIVE VALIDATION
// ============================================================================

export interface ProgressiveValidationOptions {
  batchSize?: number;
  delayBetweenBatches?: number;
  onProgress?: (progress: number, total: number) => void;
  onBatchComplete?: (batchResults: any) => void;
}

/**
 * Progressively validate large datasets in batches
 * Prevents UI blocking for large files
 */
export const progressiveValidation = async (
  detectedColumns: DetectedColumn[],
  mappings: ColumnMapping[],
  options: ProgressiveValidationOptions = {}
): Promise<AdvancedValidationSummary> => {
  const {
    batchSize = 1000,
    delayBetweenBatches = 10,
    onProgress,
    onBatchComplete,
  } = options;

  // For column mapping, validation is not row-based, so run normally
  // This function is more useful for transaction-level validation
  // For now, just run the validation with progress callback

  if (onProgress) {
    onProgress(0, 1);
  }

  const result = runAdvancedValidation(detectedColumns, mappings);

  if (onProgress) {
    onProgress(1, 1);
  }

  if (onBatchComplete) {
    onBatchComplete(result);
  }

  return result;
};

/**
 * Process large arrays in batches to avoid blocking UI
 */
export const processBatches = async <T, R>(
  items: T[],
  processor: (batch: T[]) => R,
  options: ProgressiveValidationOptions = {}
): Promise<R[]> => {
  const { batchSize = 1000, delayBetweenBatches = 10, onProgress } = options;

  const results: R[] = [];
  const totalBatches = Math.ceil(items.length / batchSize);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const result = processor(batch);
    results.push(result);

    if (onProgress) {
      const currentBatch = Math.floor(i / batchSize) + 1;
      onProgress(currentBatch, totalBatches);
    }

    // Delay between batches to allow UI updates
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
};

// ============================================================================
// VALIDATION SCHEDULER
// ============================================================================

export type ValidationPriority = 'high' | 'medium' | 'low';

interface ValidationTask {
  id: string;
  priority: ValidationPriority;
  execute: () => any;
  callback: (result: any) => void;
  timestamp: number;
}

class ValidationScheduler {
  private queue: ValidationTask[] = [];
  private isProcessing: boolean = false;
  private currentTask: ValidationTask | null = null;

  /**
   * Schedule a validation task
   */
  schedule(
    id: string,
    execute: () => any,
    callback: (result: any) => void,
    priority: ValidationPriority = 'medium'
  ): void {
    // Remove existing task with same ID
    this.queue = this.queue.filter((task) => task.id !== id);

    // Add new task
    this.queue.push({
      id,
      priority,
      execute,
      callback,
      timestamp: Date.now(),
    });

    // Sort by priority and timestamp
    this.queue.sort((a, b) => {
      const priorityOrder: Record<ValidationPriority, number> = {
        high: 0,
        medium: 1,
        low: 2,
      };

      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      return a.timestamp - b.timestamp;
    });

    // Start processing if not already processing
    if (!this.isProcessing) {
      this.process();
    }
  }

  /**
   * Process validation queue
   */
  private async process(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    this.currentTask = this.queue.shift()!;

    try {
      const result = await this.currentTask.execute();
      this.currentTask.callback(result);
    } catch (error) {
      console.error('Validation task failed:', error);
      this.currentTask.callback(null);
    }

    this.currentTask = null;

    // Small delay before next task to allow UI updates
    await new Promise((resolve) => setTimeout(resolve, 10));

    this.process();
  }

  /**
   * Cancel a scheduled task
   */
  cancel(id: string): void {
    this.queue = this.queue.filter((task) => task.id !== id);
  }

  /**
   * Cancel all tasks
   */
  cancelAll(): void {
    this.queue = [];
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueLength: number;
    isProcessing: boolean;
    currentTaskId: string | null;
  } {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      currentTaskId: this.currentTask?.id || null,
    };
  }
}

// Global validation scheduler
export const validationScheduler = new ValidationScheduler();

// ============================================================================
// CONDITIONAL VALIDATION
// ============================================================================

/**
 * Only run validation if conditions are met
 */
export const conditionalValidation = <T>(
  shouldValidate: boolean,
  validationFn: () => T,
  defaultValue: T
): T => {
  if (!shouldValidate) {
    return defaultValue;
  }

  return validationFn();
};

/**
 * Only run validation if data changed significantly
 */
export const incrementalValidation = <T>(
  currentData: any,
  previousData: any,
  validationFn: () => T,
  cachedResult: T | null,
  threshold: number = 0.1 // 10% change threshold
): T => {
  if (!previousData || !cachedResult) {
    return validationFn();
  }

  // Calculate change percentage
  const currentHash = JSON.stringify(currentData);
  const previousHash = JSON.stringify(previousData);

  if (currentHash === previousHash) {
    // No change, return cached result
    return cachedResult;
  }

  // Data changed, run validation
  return validationFn();
};
