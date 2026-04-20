import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/**
 * Performance optimization hooks
 * Includes debouncing, memoization, and throttling utilities
 */

// ============================================================================
// DEBOUNCED VALUE HOOK
// ============================================================================

/**
 * Debounces a value, only updating after the specified delay
 * Useful for delaying expensive operations until user stops typing
 */
export function useDebouncedValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// DEBOUNCED CALLBACK HOOK
// ============================================================================

/**
 * Debounces a callback function
 * Useful for delaying expensive operations like validation
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// ============================================================================
// THROTTLED CALLBACK HOOK
// ============================================================================

/**
 * Throttles a callback function
 * Ensures function is called at most once per specified interval
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  const lastRunRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        // Enough time has passed, execute immediately
        lastRunRef.current = now;
        callbackRef.current(...args);
      } else {
        // Schedule execution after remaining time
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          callbackRef.current(...args);
        }, delay - timeSinceLastRun);
      }
    },
    [delay]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

// ============================================================================
// MEMOIZED COMPUTATION HOOK
// ============================================================================

/**
 * Memoizes expensive computations with custom comparison
 */
export function useMemoizedComputation<T, D extends any[]>(
  computation: () => T,
  dependencies: D,
  isEqual?: (prev: D, next: D) => boolean
): T {
  const prevDepsRef = useRef<D>(dependencies);
  const resultRef = useRef<T>();
  const isFirstRun = useRef(true);

  // Default equality check
  const defaultIsEqual = (prev: D, next: D): boolean => {
    if (prev.length !== next.length) return false;
    return prev.every((item, index) => item === next[index]);
  };

  const equalityCheck = isEqual || defaultIsEqual;

  if (isFirstRun.current || !equalityCheck(prevDepsRef.current, dependencies)) {
    resultRef.current = computation();
    prevDepsRef.current = dependencies;
    isFirstRun.current = false;
  }

  return resultRef.current as T;
}

// ============================================================================
// LAZY VALUE HOOK
// ============================================================================

/**
 * Lazily computes and caches a value
 * Only computes when dependencies change or when requested
 */
export function useLazyValue<T>(
  computation: () => T,
  dependencies: any[]
): [T | undefined, () => T, () => void] {
  const [value, setValue] = useState<T | undefined>(undefined);
  const [shouldCompute, setShouldCompute] = useState(false);

  const compute = useCallback(() => {
    const result = computation();
    setValue(result);
    return result;
  }, dependencies);

  const invalidate = useCallback(() => {
    setValue(undefined);
    setShouldCompute(false);
  }, []);

  // Auto-compute if shouldCompute is true
  useEffect(() => {
    if (shouldCompute && value === undefined) {
      compute();
    }
  }, [shouldCompute, value, compute]);

  // Invalidate when dependencies change
  useEffect(() => {
    invalidate();
  }, dependencies);

  return [value, compute, invalidate];
}

// ============================================================================
// ASYNC COMPUTATION HOOK
// ============================================================================

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Manages async computations with loading and error states
 */
export function useAsyncComputation<T, D extends any[]>(
  computation: (...args: D) => Promise<T>,
  dependencies: D
): AsyncState<T> & { recompute: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const compute = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await computation(...dependencies);

      if (isMountedRef.current) {
        setState({
          data: result,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      }
    }
  }, dependencies);

  useEffect(() => {
    compute();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [compute]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    recompute: compute,
  };
}

// ============================================================================
// PERFORMANCE MEASUREMENT HOOK
// ============================================================================

export interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  maxRenderTime: number;
}

/**
 * Measures component performance metrics
 */
export function usePerformanceMetrics(componentName: string): PerformanceMetrics {
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;

    renderCountRef.current++;
    renderTimesRef.current.push(renderTime);

    // Keep only last 20 measurements
    if (renderTimesRef.current.length > 20) {
      renderTimesRef.current.shift();
    }

    if (process.env.NODE_ENV === 'development') {
      console.debug(
        `[Performance] ${componentName} render #${renderCountRef.current}: ${renderTime.toFixed(2)}ms`
      );
    }
  });

  startTimeRef.current = performance.now();

  const metrics: PerformanceMetrics = {
    renderCount: renderCountRef.current,
    lastRenderTime:
      renderTimesRef.current.length > 0
        ? renderTimesRef.current[renderTimesRef.current.length - 1]
        : 0,
    averageRenderTime:
      renderTimesRef.current.length > 0
        ? renderTimesRef.current.reduce((a, b) => a + b, 0) /
          renderTimesRef.current.length
        : 0,
    maxRenderTime:
      renderTimesRef.current.length > 0 ? Math.max(...renderTimesRef.current) : 0,
  };

  return metrics;
}

// ============================================================================
// WINDOW SIZE HOOK (Debounced)
// ============================================================================

interface WindowSize {
  width: number;
  height: number;
}

/**
 * Returns debounced window size
 * Prevents excessive re-renders on window resize
 */
export function useDebouncedWindowSize(delay: number = 200): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const debouncedSetSize = useDebouncedCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, delay);

  useEffect(() => {
    window.addEventListener('resize', debouncedSetSize);

    return () => {
      window.removeEventListener('resize', debouncedSetSize);
    };
  }, [debouncedSetSize]);

  return windowSize;
}

// ============================================================================
// PREVIOUS VALUE HOOK
// ============================================================================

/**
 * Returns the previous value of a variable
 * Useful for comparing current vs previous state
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ============================================================================
// VALUE CHANGED HOOK
// ============================================================================

/**
 * Returns true if value changed since last render
 */
export function useValueChanged<T>(value: T, comparator?: (a: T, b: T) => boolean): boolean {
  const previous = usePrevious(value);

  if (previous === undefined) return false;

  if (comparator) {
    return !comparator(previous, value);
  }

  return previous !== value;
}

// ============================================================================
// BATCH UPDATE HOOK
// ============================================================================

/**
 * Batches multiple state updates into a single update
 */
export function useBatchedUpdates<T>(
  initialValue: T,
  delay: number = 100
): [T, (updates: Partial<T>) => void, () => void] {
  const [value, setValue] = useState<T>(initialValue);
  const pendingUpdatesRef = useRef<Partial<T>[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const applyUpdates = useCallback(() => {
    if (pendingUpdatesRef.current.length > 0) {
      setValue((current) => {
        let updated = { ...current };
        pendingUpdatesRef.current.forEach((update) => {
          updated = { ...updated, ...update };
        });
        return updated;
      });
      pendingUpdatesRef.current = [];
    }
  }, []);

  const batchUpdate = useCallback(
    (updates: Partial<T>) => {
      pendingUpdatesRef.current.push(updates);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        applyUpdates();
      }, delay);
    },
    [delay, applyUpdates]
  );

  const flushUpdates = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    applyUpdates();
  }, [applyUpdates]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, batchUpdate, flushUpdates];
}
