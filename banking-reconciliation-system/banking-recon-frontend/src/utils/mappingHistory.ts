import type { ColumnMapping } from '../services/dataPrepService';

/**
 * Mapping History Utility
 * Provides undo/redo functionality for column mappings
 */

// ============================================================================
// HISTORY MANAGER
// ============================================================================

export interface HistoryState {
  mappings: ColumnMapping[];
  timestamp: Date;
  description: string;
}

export class MappingHistoryManager {
  private history: HistoryState[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 50) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Push a new state to history
   */
  push(mappings: ColumnMapping[], description: string = 'Change'): void {
    // Remove any states after current index (for branching history)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new state
    this.history.push({
      mappings: JSON.parse(JSON.stringify(mappings)), // Deep clone
      timestamp: new Date(),
      description,
    });

    // Move index forward
    this.currentIndex++;

    // Enforce max size (remove oldest)
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  /**
   * Undo to previous state
   */
  undo(): ColumnMapping[] | null {
    if (!this.canUndo()) {
      return null;
    }

    this.currentIndex--;
    return JSON.parse(JSON.stringify(this.history[this.currentIndex].mappings));
  }

  /**
   * Redo to next state
   */
  redo(): ColumnMapping[] | null {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    return JSON.parse(JSON.stringify(this.history[this.currentIndex].mappings));
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get current state
   */
  getCurrentState(): HistoryState | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Get undo description (what will be undone)
   */
  getUndoDescription(): string | null {
    if (this.canUndo()) {
      return this.history[this.currentIndex].description;
    }
    return null;
  }

  /**
   * Get redo description (what will be redone)
   */
  getRedoDescription(): string | null {
    if (this.canRedo()) {
      return this.history[this.currentIndex + 1].description;
    }
    return null;
  }

  /**
   * Get history size info
   */
  getHistoryInfo(): {
    totalStates: number;
    currentIndex: number;
    canUndo: boolean;
    canRedo: boolean;
  } {
    return {
      totalStates: this.history.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get full history (for debugging)
   */
  getFullHistory(): HistoryState[] {
    return this.history.map((state) => ({
      ...state,
      mappings: JSON.parse(JSON.stringify(state.mappings)),
    }));
  }
}

// ============================================================================
// HISTORY HOOKS INTEGRATION
// ============================================================================

/**
 * Create a new history manager instance
 */
export const createHistoryManager = (
  maxSize: number = 50
): MappingHistoryManager => {
  return new MappingHistoryManager(maxSize);
};

/**
 * Compare two mapping arrays to check if they're different
 */
export const mappingsChanged = (
  mappings1: ColumnMapping[],
  mappings2: ColumnMapping[]
): boolean => {
  if (mappings1.length !== mappings2.length) {
    return true;
  }

  return !mappings1.every((m1, index) => {
    const m2 = mappings2[index];
    return (
      m1.sourceColumn === m2.sourceColumn &&
      m1.targetField === m2.targetField
    );
  });
};

/**
 * Generate description for mapping change
 */
export const generateChangeDescription = (
  oldMappings: ColumnMapping[],
  newMappings: ColumnMapping[]
): string => {
  // Check if it's a new mapping
  if (oldMappings.length === 0 && newMappings.length > 0) {
    return `Added ${newMappings.length} mapping(s)`;
  }

  // Check if mappings were cleared
  if (oldMappings.length > 0 && newMappings.length === 0) {
    return 'Cleared all mappings';
  }

  // Check if mapping count changed
  if (oldMappings.length !== newMappings.length) {
    const diff = newMappings.length - oldMappings.length;
    return diff > 0
      ? `Added ${diff} mapping(s)`
      : `Removed ${Math.abs(diff)} mapping(s)`;
  }

  // Find what changed
  const changedMappings = newMappings.filter((newMapping, index) => {
    const oldMapping = oldMappings[index];
    return (
      newMapping.sourceColumn !== oldMapping?.sourceColumn ||
      newMapping.targetField !== oldMapping?.targetField
    );
  });

  if (changedMappings.length === 1) {
    const changed = changedMappings[0];
    return `Mapped "${changed.sourceColumn}" to ${changed.targetField}`;
  }

  return `Changed ${changedMappings.length} mapping(s)`;
};
