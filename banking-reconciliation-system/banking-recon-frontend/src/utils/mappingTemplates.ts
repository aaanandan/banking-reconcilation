import { ColumnMapping } from '../services/dataPrepService';

/**
 * Mapping Templates Utility
 * Save, load, and manage column mapping templates for reuse
 */

export interface MappingTemplate {
  id: string;
  name: string;
  description: string;
  bankName?: string;
  fileType: 'bank' | 'ledger';
  mappings: ColumnMapping[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  tags: string[];
}

export interface TemplateCategory {
  name: string;
  description: string;
  templates: MappingTemplate[];
}

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

const TEMPLATES_STORAGE_KEY = 'banking_recon_mapping_templates';
const RECENT_TEMPLATES_KEY = 'banking_recon_recent_templates';

// ============================================================================
// PREDEFINED TEMPLATES (Common Bank Formats)
// ============================================================================

export const PREDEFINED_TEMPLATES: MappingTemplate[] = [
  {
    id: 'template_hdfc_bank',
    name: 'HDFC Bank Statement',
    description: 'Standard HDFC Bank CSV format with Transaction Date, Amount, Description columns',
    bankName: 'HDFC Bank',
    fileType: 'bank',
    mappings: [
      { sourceColumn: 'Transaction Date', targetField: 'date' },
      { sourceColumn: 'Amount', targetField: 'amount' },
      { sourceColumn: 'Description', targetField: 'description' },
      { sourceColumn: 'Ref No', targetField: 'reference' },
      { sourceColumn: 'Balance', targetField: 'balance' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    usageCount: 0,
    tags: ['HDFC', 'Bank', 'India', 'Standard'],
  },
  {
    id: 'template_icici_bank',
    name: 'ICICI Bank Statement',
    description: 'ICICI Bank CSV format with Date, Debit, Credit, Narration columns',
    bankName: 'ICICI Bank',
    fileType: 'bank',
    mappings: [
      { sourceColumn: 'Date', targetField: 'date' },
      { sourceColumn: 'Debit', targetField: 'debit' },
      { sourceColumn: 'Credit', targetField: 'credit' },
      { sourceColumn: 'Narration', targetField: 'description' },
      { sourceColumn: 'Cheque No', targetField: 'reference' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    usageCount: 0,
    tags: ['ICICI', 'Bank', 'India', 'Debit-Credit'],
  },
  {
    id: 'template_sbi_bank',
    name: 'State Bank of India',
    description: 'SBI CSV format with Txn Date, Debit, Credit, Description columns',
    bankName: 'State Bank of India',
    fileType: 'bank',
    mappings: [
      { sourceColumn: 'Txn Date', targetField: 'date' },
      { sourceColumn: 'Value Date', targetField: 'date' },
      { sourceColumn: 'Debit', targetField: 'debit' },
      { sourceColumn: 'Credit', targetField: 'credit' },
      { sourceColumn: 'Description', targetField: 'description' },
      { sourceColumn: 'Ref No./Cheque No.', targetField: 'reference' },
      { sourceColumn: 'Balance', targetField: 'balance' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    usageCount: 0,
    tags: ['SBI', 'Bank', 'India', 'Debit-Credit'],
  },
  {
    id: 'template_axis_bank',
    name: 'Axis Bank Statement',
    description: 'Axis Bank CSV format',
    bankName: 'Axis Bank',
    fileType: 'bank',
    mappings: [
      { sourceColumn: 'Transaction Date', targetField: 'date' },
      { sourceColumn: 'Debit', targetField: 'debit' },
      { sourceColumn: 'Credit', targetField: 'credit' },
      { sourceColumn: 'Particulars', targetField: 'description' },
      { sourceColumn: 'Chq/Ref Number', targetField: 'reference' },
      { sourceColumn: 'Balance', targetField: 'balance' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    usageCount: 0,
    tags: ['Axis', 'Bank', 'India', 'Debit-Credit'],
  },
  {
    id: 'template_general_ledger',
    name: 'General Ledger (Standard)',
    description: 'Standard general ledger format with Entry Date, Amount, Particulars',
    fileType: 'ledger',
    mappings: [
      { sourceColumn: 'Entry Date', targetField: 'date' },
      { sourceColumn: 'Date', targetField: 'date' },
      { sourceColumn: 'Amount', targetField: 'amount' },
      { sourceColumn: 'Particulars', targetField: 'description' },
      { sourceColumn: 'Description', targetField: 'description' },
      { sourceColumn: 'Voucher No', targetField: 'reference' },
      { sourceColumn: 'Reference', targetField: 'reference' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    usageCount: 0,
    tags: ['Ledger', 'Accounting', 'Standard'],
  },
  {
    id: 'template_tally_export',
    name: 'Tally Export Format',
    description: 'Tally accounting software export format',
    fileType: 'ledger',
    mappings: [
      { sourceColumn: 'Date', targetField: 'date' },
      { sourceColumn: 'Debit', targetField: 'debit' },
      { sourceColumn: 'Credit', targetField: 'credit' },
      { sourceColumn: 'Particulars', targetField: 'description' },
      { sourceColumn: 'Vch No.', targetField: 'reference' },
      { sourceColumn: 'Voucher Type', targetField: 'category' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    usageCount: 0,
    tags: ['Tally', 'Ledger', 'India', 'Accounting'],
  },
];

// ============================================================================
// STORAGE OPERATIONS
// ============================================================================

/**
 * Get all templates from local storage
 */
export const getAllTemplates = (): MappingTemplate[] => {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!stored) {
      return [...PREDEFINED_TEMPLATES];
    }

    const userTemplates: MappingTemplate[] = JSON.parse(stored);
    return [...PREDEFINED_TEMPLATES, ...userTemplates];
  } catch (error) {
    console.error('Error loading templates:', error);
    return [...PREDEFINED_TEMPLATES];
  }
};

/**
 * Get templates by file type
 */
export const getTemplatesByType = (
  fileType: 'bank' | 'ledger'
): MappingTemplate[] => {
  return getAllTemplates().filter((t) => t.fileType === fileType);
};

/**
 * Get templates by bank name
 */
export const getTemplatesByBank = (bankName: string): MappingTemplate[] => {
  return getAllTemplates().filter(
    (t) => t.bankName?.toLowerCase().includes(bankName.toLowerCase())
  );
};

/**
 * Search templates by name, description, or tags
 */
export const searchTemplates = (query: string): MappingTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return getAllTemplates().filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      t.bankName?.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Get a specific template by ID
 */
export const getTemplateById = (id: string): MappingTemplate | null => {
  const templates = getAllTemplates();
  return templates.find((t) => t.id === id) || null;
};

/**
 * Save a new template
 */
export const saveTemplate = (
  template: Omit<MappingTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
): MappingTemplate => {
  try {
    const userTemplates = getUserTemplates();

    const newTemplate: MappingTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };

    userTemplates.push(newTemplate);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(userTemplates));

    return newTemplate;
  } catch (error) {
    console.error('Error saving template:', error);
    throw new Error('Failed to save template');
  }
};

/**
 * Update an existing template
 */
export const updateTemplate = (
  id: string,
  updates: Partial<Omit<MappingTemplate, 'id' | 'createdAt'>>
): MappingTemplate | null => {
  try {
    const userTemplates = getUserTemplates();
    const index = userTemplates.findIndex((t) => t.id === id);

    if (index === -1) {
      throw new Error('Template not found or is a predefined template');
    }

    userTemplates[index] = {
      ...userTemplates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(userTemplates));
    return userTemplates[index];
  } catch (error) {
    console.error('Error updating template:', error);
    return null;
  }
};

/**
 * Delete a template
 */
export const deleteTemplate = (id: string): boolean => {
  try {
    // Don't allow deleting predefined templates
    if (PREDEFINED_TEMPLATES.some((t) => t.id === id)) {
      throw new Error('Cannot delete predefined templates');
    }

    const userTemplates = getUserTemplates();
    const filtered = userTemplates.filter((t) => t.id !== id);

    if (filtered.length === userTemplates.length) {
      return false; // Template not found
    }

    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting template:', error);
    return false;
  }
};

/**
 * Increment usage count for a template
 */
export const incrementTemplateUsage = (id: string): void => {
  try {
    // Don't track usage for predefined templates in localStorage
    if (PREDEFINED_TEMPLATES.some((t) => t.id === id)) {
      trackRecentTemplate(id);
      return;
    }

    const userTemplates = getUserTemplates();
    const index = userTemplates.findIndex((t) => t.id === id);

    if (index !== -1) {
      userTemplates[index].usageCount++;
      userTemplates[index].updatedAt = new Date().toISOString();
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(userTemplates));
    }

    trackRecentTemplate(id);
  } catch (error) {
    console.error('Error incrementing usage count:', error);
  }
};

/**
 * Get user-created templates only
 */
const getUserTemplates = (): MappingTemplate[] => {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting user templates:', error);
    return [];
  }
};

// ============================================================================
// RECENT TEMPLATES
// ============================================================================

/**
 * Track recently used template
 */
const trackRecentTemplate = (templateId: string): void => {
  try {
    const stored = localStorage.getItem(RECENT_TEMPLATES_KEY);
    let recent: string[] = stored ? JSON.parse(stored) : [];

    // Remove if already exists
    recent = recent.filter((id) => id !== templateId);

    // Add to front
    recent.unshift(templateId);

    // Keep only last 5
    recent = recent.slice(0, 5);

    localStorage.setItem(RECENT_TEMPLATES_KEY, JSON.stringify(recent));
  } catch (error) {
    console.error('Error tracking recent template:', error);
  }
};

/**
 * Get recently used templates
 */
export const getRecentTemplates = (): MappingTemplate[] => {
  try {
    const stored = localStorage.getItem(RECENT_TEMPLATES_KEY);
    if (!stored) {
      return [];
    }

    const recentIds: string[] = JSON.parse(stored);
    const allTemplates = getAllTemplates();

    return recentIds
      .map((id) => allTemplates.find((t) => t.id === id))
      .filter((t): t is MappingTemplate => t !== undefined);
  } catch (error) {
    console.error('Error getting recent templates:', error);
    return [];
  }
};

// ============================================================================
// TEMPLATE MATCHING
// ============================================================================

export interface TemplateMatchScore {
  template: MappingTemplate;
  score: number;
  matchedColumns: number;
  totalColumns: number;
  confidence: number;
}

/**
 * Find templates that match the detected columns
 * Returns templates sorted by match score
 */
export const findMatchingTemplates = (
  detectedColumnNames: string[],
  fileType: 'bank' | 'ledger',
  limit: number = 5
): TemplateMatchScore[] => {
  const templates = getTemplatesByType(fileType);
  const scores: TemplateMatchScore[] = [];

  templates.forEach((template) => {
    let matchedColumns = 0;
    const templateColumns = template.mappings.map((m) =>
      m.sourceColumn.toLowerCase()
    );

    detectedColumnNames.forEach((detected) => {
      const detectedLower = detected.toLowerCase();
      if (templateColumns.includes(detectedLower)) {
        matchedColumns++;
      }
    });

    if (matchedColumns > 0) {
      const totalColumns = template.mappings.length;
      const score = (matchedColumns / totalColumns) * 100;
      const confidence = Math.min(
        (matchedColumns / detectedColumnNames.length) * 100,
        100
      );

      scores.push({
        template,
        score: Math.round(score),
        matchedColumns,
        totalColumns,
        confidence: Math.round(confidence),
      });
    }
  });

  // Sort by score (descending)
  scores.sort((a, b) => b.score - a.score);

  return scores.slice(0, limit);
};

/**
 * Apply template to detected columns
 * Returns suggested mappings based on template
 */
export const applyTemplate = (
  template: MappingTemplate,
  detectedColumnNames: string[]
): ColumnMapping[] => {
  const mappings: ColumnMapping[] = [];

  template.mappings.forEach((templateMapping) => {
    // Case-insensitive column name matching
    const matchedColumn = detectedColumnNames.find(
      (detected) =>
        detected.toLowerCase() === templateMapping.sourceColumn.toLowerCase()
    );

    if (matchedColumn) {
      mappings.push({
        sourceColumn: matchedColumn,
        targetField: templateMapping.targetField,
      });
    }
  });

  incrementTemplateUsage(template.id);
  return mappings;
};

// ============================================================================
// TEMPLATE VALIDATION
// ============================================================================

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate template structure
 */
export const validateTemplate = (
  template: Partial<MappingTemplate>
): TemplateValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!template.name || template.name.trim().length === 0) {
    errors.push('Template name is required');
  }

  if (!template.fileType) {
    errors.push('File type (bank/ledger) is required');
  }

  if (!template.mappings || template.mappings.length === 0) {
    errors.push('At least one mapping is required');
  }

  // Validate mappings
  if (template.mappings && template.mappings.length > 0) {
    const requiredFields = ['date', 'amount', 'description'];
    const mappedFields = template.mappings.map((m) => m.targetField);

    requiredFields.forEach((field) => {
      if (!mappedFields.includes(field)) {
        warnings.push(`Required field '${field}' is not mapped`);
      }
    });

    // Check for duplicate target fields
    const duplicates = mappedFields.filter(
      (field, index) => mappedFields.indexOf(field) !== index
    );
    if (duplicates.length > 0) {
      errors.push(
        `Duplicate target fields: ${[...new Set(duplicates)].join(', ')}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// ============================================================================
// EXPORT/IMPORT TEMPLATES
// ============================================================================

/**
 * Export templates as JSON string
 */
export const exportTemplates = (templateIds?: string[]): string => {
  const allTemplates = getUserTemplates();
  const toExport = templateIds
    ? allTemplates.filter((t) => templateIds.includes(t.id))
    : allTemplates;

  return JSON.stringify(toExport, null, 2);
};

/**
 * Import templates from JSON string
 */
export const importTemplates = (
  jsonString: string
): { success: number; failed: number; errors: string[] } => {
  try {
    const imported: MappingTemplate[] = JSON.parse(jsonString);
    const userTemplates = getUserTemplates();
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    imported.forEach((template, index) => {
      const validation = validateTemplate(template);

      if (!validation.isValid) {
        failed++;
        errors.push(
          `Template ${index + 1} (${template.name || 'unnamed'}): ${validation.errors.join(', ')}`
        );
        return;
      }

      // Generate new ID to avoid conflicts
      const newTemplate: MappingTemplate = {
        ...template,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      userTemplates.push(newTemplate);
      success++;
    });

    if (success > 0) {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(userTemplates));
    }

    return { success, failed, errors };
  } catch (error) {
    return {
      success: 0,
      failed: 1,
      errors: ['Invalid JSON format'],
    };
  }
};
