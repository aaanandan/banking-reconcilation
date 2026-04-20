/**
 * Entity Profile Types and Utilities
 * Helper functions for managing entity profiles and learned patterns
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Seasonality {
  hasPattern: boolean;
  peakMonths: number[];
  lowMonths: number[];
  explanation?: string;
}

export interface BankSpecificBehavior {
  dateOffset: number;
  mostReliableField: string;
  refNumberFormat?: string;
}

export interface EntityProfile {
  id: string;
  tenantId: string;
  entityId: string;

  // Identity
  primaryName: string;
  aliases: string[];
  legalName: string | null;
  relatedEntities: string[];
  parentCompany: string | null;
  subsidiaries: string[];
  industry: string | null;
  location: string | null;
  tags: string[];

  // Business Patterns
  typicalAmountMin: number | null;
  typicalAmountMax: number | null;
  typicalAmountMedian: number | null;
  frequencyPattern: string | null;
  preferredDayOfMonth: number | null;
  seasonality: Seasonality | null;

  // Bank-specific
  bankSpecificBehavior: Record<string, BankSpecificBehavior> | null;

  // Statistics
  totalTransactions: number;
  successfulMatches: number;
  manualInterventions: number;
  userOverrideRate: number;
  mostReliableField: string | null;
  fieldReliabilityScores: Record<string, number> | null;

  // Metadata
  confidence: number;
  createdAt: Date;
  lastUpdated: Date;
}

export interface EntityProfileFilter {
  search?: string;
  industry?: string[];
  location?: string[];
  tags?: string[];
  hasParent?: boolean;
  hasSubsidiaries?: boolean;
  minConfidence?: number;
  maxConfidence?: number;
  minTransactions?: number;
  hasFrequencyPattern?: boolean;
}

export interface EntityProfileStats {
  total: number;
  withParent: number;
  withSubsidiaries: number;
  avgConfidence: number;
  avgMatchRate: number;
  avgTransactions: number;
  byIndustry: Record<string, number>;
  byFrequencyPattern: Record<string, number>;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get confidence level from score
 */
export const getConfidenceLevel = (confidence: number): 'high' | 'medium' | 'low' => {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
};

/**
 * Get confidence color
 */
export const getConfidenceColor = (confidence: number): string => {
  const level = getConfidenceLevel(confidence);
  switch (level) {
    case 'high':
      return '#52c41a';  // Green
    case 'medium':
      return '#faad14';  // Orange
    case 'low':
      return '#ff4d4f';  // Red
    default:
      return '#d9d9d9';  // Gray
  }
};

/**
 * Get confidence label
 */
export const getConfidenceLabel = (confidence: number): string => {
  const level = getConfidenceLevel(confidence);
  const percentage = (confidence * 100).toFixed(0);
  return `${level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Low'} (${percentage}%)`;
};

/**
 * Calculate match rate
 */
export const calculateMatchRate = (profile: EntityProfile): number => {
  if (profile.totalTransactions === 0) return 0;
  return (profile.successfulMatches / profile.totalTransactions) * 100;
};

/**
 * Get frequency pattern label
 */
export const getFrequencyPatternLabel = (pattern: string | null): string => {
  if (!pattern) return 'Unknown';

  const patterns: Record<string, string> = {
    'daily': 'Daily',
    'weekly': 'Weekly',
    'bi-weekly': 'Bi-Weekly',
    'monthly': 'Monthly',
    'quarterly': 'Quarterly',
    'yearly': 'Yearly',
    'irregular': 'Irregular',
    'one-time': 'One-Time',
  };

  return patterns[pattern] || pattern;
};

/**
 * Get frequency pattern color
 */
export const getFrequencyPatternColor = (pattern: string | null): string => {
  if (!pattern) return 'default';

  const colors: Record<string, string> = {
    'daily': 'purple',
    'weekly': 'blue',
    'bi-weekly': 'cyan',
    'monthly': 'green',
    'quarterly': 'orange',
    'yearly': 'red',
    'irregular': 'default',
    'one-time': 'default',
  };

  return colors[pattern] || 'default';
};

/**
 * Format amount range
 */
export const formatAmountRange = (profile: EntityProfile): string => {
  const min = profile.typicalAmountMin;
  const max = profile.typicalAmountMax;
  const median = profile.typicalAmountMedian;

  if (min === null && max === null && median === null) {
    return 'No data';
  }

  if (median !== null) {
    return `Median: $${median.toFixed(2)}`;
  }

  if (min !== null && max !== null) {
    return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
  }

  if (min !== null) {
    return `Min: $${min.toFixed(2)}`;
  }

  if (max !== null) {
    return `Max: $${max.toFixed(2)}`;
  }

  return 'No data';
};

/**
 * Get month names for seasonality
 */
export const getMonthNames = (months: number[]): string[] => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return months.map((m) => monthNames[m - 1] || '');
};

/**
 * Format seasonality
 */
export const formatSeasonality = (seasonality: Seasonality | null): string => {
  if (!seasonality || !seasonality.hasPattern) {
    return 'No seasonal pattern';
  }

  const peak = seasonality.peakMonths.length > 0
    ? `Peak: ${getMonthNames(seasonality.peakMonths).join(', ')}`
    : '';

  const low = seasonality.lowMonths.length > 0
    ? `Low: ${getMonthNames(seasonality.lowMonths).join(', ')}`
    : '';

  const parts = [peak, low].filter(Boolean);

  return parts.length > 0 ? parts.join(' | ') : 'Seasonal pattern detected';
};

/**
 * Calculate profile statistics
 */
export const calculateProfileStats = (profiles: EntityProfile[]): EntityProfileStats => {
  const total = profiles.length;
  const withParent = profiles.filter((p) => p.parentCompany !== null).length;
  const withSubsidiaries = profiles.filter((p) => p.subsidiaries.length > 0).length;

  const avgConfidence = total > 0
    ? profiles.reduce((sum, p) => sum + p.confidence, 0) / total
    : 0;

  const avgMatchRate = total > 0
    ? profiles.reduce((sum, p) => sum + calculateMatchRate(p), 0) / total
    : 0;

  const avgTransactions = total > 0
    ? profiles.reduce((sum, p) => sum + p.totalTransactions, 0) / total
    : 0;

  const byIndustry: Record<string, number> = {};
  profiles.forEach((p) => {
    const industry = p.industry || 'Unknown';
    byIndustry[industry] = (byIndustry[industry] || 0) + 1;
  });

  const byFrequencyPattern: Record<string, number> = {};
  profiles.forEach((p) => {
    const pattern = p.frequencyPattern || 'Unknown';
    byFrequencyPattern[pattern] = (byFrequencyPattern[pattern] || 0) + 1;
  });

  return {
    total,
    withParent,
    withSubsidiaries,
    avgConfidence,
    avgMatchRate,
    avgTransactions,
    byIndustry,
    byFrequencyPattern,
  };
};

/**
 * Filter entity profiles
 */
export const filterEntityProfiles = (
  profiles: EntityProfile[],
  filter: EntityProfileFilter
): EntityProfile[] => {
  let result = [...profiles];

  // Search
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.primaryName.toLowerCase().includes(searchLower) ||
        p.aliases.some((a) => a.toLowerCase().includes(searchLower)) ||
        p.legalName?.toLowerCase().includes(searchLower) ||
        p.entityId.toLowerCase().includes(searchLower)
    );
  }

  // Industry
  if (filter.industry && filter.industry.length > 0) {
    result = result.filter((p) => {
      const industry = p.industry || 'Unknown';
      return filter.industry!.includes(industry);
    });
  }

  // Location
  if (filter.location && filter.location.length > 0) {
    result = result.filter((p) => {
      const location = p.location || 'Unknown';
      return filter.location!.includes(location);
    });
  }

  // Tags
  if (filter.tags && filter.tags.length > 0) {
    result = result.filter((p) =>
      filter.tags!.some((tag) => p.tags.includes(tag))
    );
  }

  // Has parent
  if (filter.hasParent !== undefined) {
    result = result.filter((p) =>
      filter.hasParent ? p.parentCompany !== null : p.parentCompany === null
    );
  }

  // Has subsidiaries
  if (filter.hasSubsidiaries !== undefined) {
    result = result.filter((p) =>
      filter.hasSubsidiaries ? p.subsidiaries.length > 0 : p.subsidiaries.length === 0
    );
  }

  // Confidence range
  if (filter.minConfidence !== undefined) {
    result = result.filter((p) => p.confidence >= filter.minConfidence!);
  }
  if (filter.maxConfidence !== undefined) {
    result = result.filter((p) => p.confidence <= filter.maxConfidence!);
  }

  // Minimum transactions
  if (filter.minTransactions !== undefined) {
    result = result.filter((p) => p.totalTransactions >= filter.minTransactions!);
  }

  // Has frequency pattern
  if (filter.hasFrequencyPattern !== undefined) {
    result = result.filter((p) =>
      filter.hasFrequencyPattern ? p.frequencyPattern !== null : p.frequencyPattern === null
    );
  }

  return result;
};

/**
 * Sort entity profiles
 */
export const sortEntityProfiles = (
  profiles: EntityProfile[],
  field: 'name' | 'confidence' | 'transactions' | 'matchRate' | 'lastUpdated',
  order: 'asc' | 'desc'
): EntityProfile[] => {
  const sorted = [...profiles];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (field) {
      case 'name':
        aValue = a.primaryName.toLowerCase();
        bValue = b.primaryName.toLowerCase();
        break;
      case 'confidence':
        aValue = a.confidence;
        bValue = b.confidence;
        break;
      case 'transactions':
        aValue = a.totalTransactions;
        bValue = b.totalTransactions;
        break;
      case 'matchRate':
        aValue = calculateMatchRate(a);
        bValue = calculateMatchRate(b);
        break;
      case 'lastUpdated':
        aValue = new Date(a.lastUpdated).getTime();
        bValue = new Date(b.lastUpdated).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
};

/**
 * Get field reliability label
 */
export const getFieldReliabilityLabel = (score: number): string => {
  if (score >= 0.9) return 'Excellent';
  if (score >= 0.75) return 'Good';
  if (score >= 0.5) return 'Fair';
  return 'Poor';
};

/**
 * Get field reliability color
 */
export const getFieldReliabilityColor = (score: number): string => {
  if (score >= 0.9) return '#52c41a';   // Green
  if (score >= 0.75) return '#1890ff';  // Blue
  if (score >= 0.5) return '#faad14';   // Orange
  return '#ff4d4f';                     // Red
};

/**
 * Get top reliable fields
 */
export const getTopReliableFields = (
  fieldReliabilityScores: Record<string, number> | null,
  topN: number = 3
): Array<{ field: string; score: number }> => {
  if (!fieldReliabilityScores) return [];

  const entries = Object.entries(fieldReliabilityScores);
  entries.sort((a, b) => b[1] - a[1]);

  return entries.slice(0, topN).map(([field, score]) => ({ field, score }));
};

/**
 * Format bank count
 */
export const getBankCount = (profile: EntityProfile): number => {
  if (!profile.bankSpecificBehavior) return 0;
  return Object.keys(profile.bankSpecificBehavior).length;
};

/**
 * Check if profile is complete
 */
export const isProfileComplete = (profile: EntityProfile): boolean => {
  // Basic identity
  const hasIdentity = profile.primaryName && profile.primaryName.length > 0;

  // Has some business patterns
  const hasPatterns =
    profile.typicalAmountMedian !== null ||
    profile.frequencyPattern !== null;

  // Has statistics
  const hasStats = profile.totalTransactions > 0;

  // Has good confidence
  const hasConfidence = profile.confidence >= 0.5;

  return hasIdentity && hasPatterns && hasStats && hasConfidence;
};

/**
 * Get completeness percentage
 */
export const getCompletenessPercentage = (profile: EntityProfile): number => {
  let score = 0;
  let total = 10;

  if (profile.primaryName) score += 1;
  if (profile.aliases.length > 0) score += 1;
  if (profile.legalName) score += 1;
  if (profile.industry) score += 1;
  if (profile.typicalAmountMedian !== null) score += 1;
  if (profile.frequencyPattern !== null) score += 1;
  if (profile.totalTransactions > 0) score += 1;
  if (profile.confidence >= 0.5) score += 1;
  if (profile.fieldReliabilityScores && Object.keys(profile.fieldReliabilityScores).length > 0) score += 1;
  if (profile.bankSpecificBehavior && Object.keys(profile.bankSpecificBehavior).length > 0) score += 1;

  return (score / total) * 100;
};
