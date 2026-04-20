/**
 * Settings Types and Utilities
 * Configuration management for system settings
 */

// ============================================================================
// TYPES
// ============================================================================

export enum SettingsCategory {
  GENERAL = 'general',
  RECONCILIATION = 'reconciliation',
  LEARNING = 'learning',
  NOTIFICATIONS = 'notifications',
  INTEGRATIONS = 'integrations',
  SECURITY = 'security',
  DATA = 'data',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SYSTEM = 'system',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
}

export enum NotificationEvent {
  RECONCILIATION_COMPLETE = 'reconciliation_complete',
  MATCH_APPROVAL_REQUIRED = 'match_approval_required',
  CRITICAL_UNMATCHED = 'critical_unmatched',
  LEARNING_QUESTION = 'learning_question',
  REPORT_READY = 'report_ready',
  SYSTEM_ERROR = 'system_error',
}

export enum DataRetentionPeriod {
  DAYS_30 = '30_days',
  DAYS_90 = '90_days',
  DAYS_180 = '180_days',
  YEAR_1 = '1_year',
  YEARS_3 = '3_years',
  YEARS_7 = '7_years',
  FOREVER = 'forever',
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface GeneralSettings {
  companyName: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  language: string;
  fiscalYearStart: string; // MM-DD format
}

export interface ReconciliationSettings {
  defaultMatchThreshold: number; // 0-1
  autoMatchThreshold: number; // 0-1
  requireApprovalAboveAmount: number;
  allowManualOverrides: boolean;
  enableAlternativeMatches: boolean;
  maxAlternativeMatches: number;
  urgencyCriticalDays: number;
  urgencyHighDays: number;
  urgencyMediumDays: number;
}

export interface LearningSettings {
  enableLearning: boolean;
  questionTimingPreference: 'immediate' | 'step_end' | 'session_end' | 'deferred';
  minConfidenceForAutoAccept: number; // 0-1
  maxQuestionsPerSession: number;
  enableSmartSuggestions: boolean;
  learningAggressiveness: 'conservative' | 'moderate' | 'aggressive';
}

export interface NotificationPreference {
  channel: NotificationChannel;
  enabled: boolean;
  events: NotificationEvent[];
}

export interface NotificationSettings {
  preferences: NotificationPreference[];
  emailAddress: string | null;
  slackWebhook: string | null;
  customWebhook: string | null;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string; // HH:MM format
}

export interface IntegrationSettings {
  apiKeysEnabled: boolean;
  apiKeys: ApiKey[];
  webhooksEnabled: boolean;
  webhooks: Webhook[];
  externalSystemsConnected: ExternalSystem[];
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsed: Date | null;
  expiresAt: Date | null;
  enabled: boolean;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  secret: string;
}

export interface ExternalSystem {
  id: string;
  name: string;
  type: 'erp' | 'accounting' | 'bank' | 'custom';
  connected: boolean;
  lastSync: Date | null;
}

export interface SecuritySettings {
  sessionTimeout: number; // minutes
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  passwordExpiryDays: number | null;
  mfaEnabled: boolean;
  mfaRequired: boolean;
  ipWhitelistEnabled: boolean;
  ipWhitelist: string[];
}

export interface DataSettings {
  transactionRetention: DataRetentionPeriod;
  reconciliationRetention: DataRetentionPeriod;
  auditLogRetention: DataRetentionPeriod;
  autoBackupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  exportFormat: 'excel' | 'csv' | 'json';
  anonymizeExports: boolean;
}

export interface Settings {
  id: string;
  tenantId: string;
  general: GeneralSettings;
  reconciliation: ReconciliationSettings;
  learning: LearningSettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
  security: SecuritySettings;
  data: DataSettings;
  updatedAt: Date;
  updatedBy: string;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  companyName: '',
  timezone: 'America/New_York',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  currency: 'USD',
  language: 'en',
  fiscalYearStart: '01-01',
};

export const DEFAULT_RECONCILIATION_SETTINGS: ReconciliationSettings = {
  defaultMatchThreshold: 0.85,
  autoMatchThreshold: 0.95,
  requireApprovalAboveAmount: 10000,
  allowManualOverrides: true,
  enableAlternativeMatches: true,
  maxAlternativeMatches: 5,
  urgencyCriticalDays: 90,
  urgencyHighDays: 60,
  urgencyMediumDays: 30,
};

export const DEFAULT_LEARNING_SETTINGS: LearningSettings = {
  enableLearning: true,
  questionTimingPreference: 'step_end',
  minConfidenceForAutoAccept: 0.9,
  maxQuestionsPerSession: 10,
  enableSmartSuggestions: true,
  learningAggressiveness: 'moderate',
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  preferences: [
    {
      channel: NotificationChannel.EMAIL,
      enabled: true,
      events: [
        NotificationEvent.RECONCILIATION_COMPLETE,
        NotificationEvent.CRITICAL_UNMATCHED,
        NotificationEvent.REPORT_READY,
        NotificationEvent.SYSTEM_ERROR,
      ],
    },
    {
      channel: NotificationChannel.SYSTEM,
      enabled: true,
      events: Object.values(NotificationEvent),
    },
  ],
  emailAddress: null,
  slackWebhook: null,
  customWebhook: null,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

export const DEFAULT_INTEGRATION_SETTINGS: IntegrationSettings = {
  apiKeysEnabled: false,
  apiKeys: [],
  webhooksEnabled: false,
  webhooks: [],
  externalSystemsConnected: [],
};

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  sessionTimeout: 30,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
  passwordExpiryDays: 90,
  mfaEnabled: false,
  mfaRequired: false,
  ipWhitelistEnabled: false,
  ipWhitelist: [],
};

export const DEFAULT_DATA_SETTINGS: DataSettings = {
  transactionRetention: DataRetentionPeriod.YEARS_7,
  reconciliationRetention: DataRetentionPeriod.YEARS_7,
  auditLogRetention: DataRetentionPeriod.YEARS_7,
  autoBackupEnabled: true,
  backupFrequency: 'daily',
  exportFormat: 'excel',
  anonymizeExports: false,
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const TIMEZONES = [
  { label: 'Eastern Time (ET)', value: 'America/New_York' },
  { label: 'Central Time (CT)', value: 'America/Chicago' },
  { label: 'Mountain Time (MT)', value: 'America/Denver' },
  { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
  { label: 'UTC', value: 'UTC' },
  { label: 'London (GMT)', value: 'Europe/London' },
  { label: 'Paris (CET)', value: 'Europe/Paris' },
  { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Sydney (AEST)', value: 'Australia/Sydney' },
];

export const DATE_FORMATS = [
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  { label: 'DD.MM.YYYY', value: 'DD.MM.YYYY' },
];

export const CURRENCIES = [
  { label: 'US Dollar (USD)', value: 'USD' },
  { label: 'Euro (EUR)', value: 'EUR' },
  { label: 'British Pound (GBP)', value: 'GBP' },
  { label: 'Japanese Yen (JPY)', value: 'JPY' },
  { label: 'Canadian Dollar (CAD)', value: 'CAD' },
  { label: 'Australian Dollar (AUD)', value: 'AUD' },
];

export const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Japanese', value: 'ja' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get category label
 */
export const getCategoryLabel = (category: SettingsCategory): string => {
  switch (category) {
    case SettingsCategory.GENERAL:
      return 'General';
    case SettingsCategory.RECONCILIATION:
      return 'Reconciliation';
    case SettingsCategory.LEARNING:
      return 'Learning';
    case SettingsCategory.NOTIFICATIONS:
      return 'Notifications';
    case SettingsCategory.INTEGRATIONS:
      return 'Integrations';
    case SettingsCategory.SECURITY:
      return 'Security';
    case SettingsCategory.DATA:
      return 'Data & Privacy';
    default:
      return category;
  }
};

/**
 * Get category icon
 */
export const getCategoryIcon = (category: SettingsCategory): string => {
  switch (category) {
    case SettingsCategory.GENERAL:
      return 'SettingOutlined';
    case SettingsCategory.RECONCILIATION:
      return 'ReconciliationOutlined';
    case SettingsCategory.LEARNING:
      return 'BulbOutlined';
    case SettingsCategory.NOTIFICATIONS:
      return 'BellOutlined';
    case SettingsCategory.INTEGRATIONS:
      return 'ApiOutlined';
    case SettingsCategory.SECURITY:
      return 'SafetyOutlined';
    case SettingsCategory.DATA:
      return 'DatabaseOutlined';
    default:
      return 'SettingOutlined';
  }
};

/**
 * Get retention period label
 */
export const getRetentionPeriodLabel = (period: DataRetentionPeriod): string => {
  switch (period) {
    case DataRetentionPeriod.DAYS_30:
      return '30 Days';
    case DataRetentionPeriod.DAYS_90:
      return '90 Days';
    case DataRetentionPeriod.DAYS_180:
      return '6 Months';
    case DataRetentionPeriod.YEAR_1:
      return '1 Year';
    case DataRetentionPeriod.YEARS_3:
      return '3 Years';
    case DataRetentionPeriod.YEARS_7:
      return '7 Years';
    case DataRetentionPeriod.FOREVER:
      return 'Forever';
    default:
      return period;
  }
};

/**
 * Validate general settings
 */
export const validateGeneralSettings = (settings: GeneralSettings): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!settings.companyName || settings.companyName.trim().length === 0) {
    errors.push('Company name is required');
  }

  if (settings.companyName.length > 100) {
    errors.push('Company name must be less than 100 characters');
  }

  // Validate fiscal year start format (MM-DD)
  const fiscalYearRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
  if (!fiscalYearRegex.test(settings.fiscalYearStart)) {
    errors.push('Fiscal year start must be in MM-DD format');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate reconciliation settings
 */
export const validateReconciliationSettings = (
  settings: ReconciliationSettings
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (settings.defaultMatchThreshold < 0 || settings.defaultMatchThreshold > 1) {
    errors.push('Default match threshold must be between 0 and 1');
  }

  if (settings.autoMatchThreshold < 0 || settings.autoMatchThreshold > 1) {
    errors.push('Auto match threshold must be between 0 and 1');
  }

  if (settings.autoMatchThreshold < settings.defaultMatchThreshold) {
    errors.push('Auto match threshold must be >= default match threshold');
  }

  if (settings.requireApprovalAboveAmount < 0) {
    errors.push('Approval amount must be positive');
  }

  if (settings.maxAlternativeMatches < 1 || settings.maxAlternativeMatches > 20) {
    errors.push('Max alternative matches must be between 1 and 20');
  }

  if (settings.urgencyCriticalDays <= settings.urgencyHighDays) {
    errors.push('Critical urgency days must be > high urgency days');
  }

  if (settings.urgencyHighDays <= settings.urgencyMediumDays) {
    errors.push('High urgency days must be > medium urgency days');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate learning settings
 */
export const validateLearningSettings = (settings: LearningSettings): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (settings.minConfidenceForAutoAccept < 0 || settings.minConfidenceForAutoAccept > 1) {
    errors.push('Min confidence must be between 0 and 1');
  }

  if (settings.maxQuestionsPerSession < 1 || settings.maxQuestionsPerSession > 100) {
    errors.push('Max questions per session must be between 1 and 100');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate notification settings
 */
export const validateNotificationSettings = (settings: NotificationSettings): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate email if email notifications enabled
  const emailPref = settings.preferences.find((p) => p.channel === NotificationChannel.EMAIL);
  if (emailPref?.enabled && !settings.emailAddress) {
    errors.push('Email address required when email notifications enabled');
  }

  if (settings.emailAddress) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settings.emailAddress)) {
      errors.push('Invalid email address format');
    }
  }

  // Validate Slack webhook if Slack notifications enabled
  const slackPref = settings.preferences.find((p) => p.channel === NotificationChannel.SLACK);
  if (slackPref?.enabled && !settings.slackWebhook) {
    errors.push('Slack webhook required when Slack notifications enabled');
  }

  // Validate quiet hours format (HH:MM)
  if (settings.quietHoursEnabled) {
    const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(settings.quietHoursStart)) {
      errors.push('Quiet hours start must be in HH:MM format');
    }
    if (!timeRegex.test(settings.quietHoursEnd)) {
      errors.push('Quiet hours end must be in HH:MM format');
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate security settings
 */
export const validateSecuritySettings = (settings: SecuritySettings): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (settings.sessionTimeout < 5 || settings.sessionTimeout > 480) {
    errors.push('Session timeout must be between 5 and 480 minutes');
  }

  if (settings.passwordMinLength < 6 || settings.passwordMinLength > 32) {
    errors.push('Password min length must be between 6 and 32');
  }

  if (settings.passwordExpiryDays !== null && (settings.passwordExpiryDays < 30 || settings.passwordExpiryDays > 365)) {
    errors.push('Password expiry must be between 30 and 365 days');
  }

  // Validate IP addresses
  if (settings.ipWhitelistEnabled && settings.ipWhitelist.length === 0) {
    errors.push('At least one IP address required when IP whitelist enabled');
  }

  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  for (const ip of settings.ipWhitelist) {
    if (!ipRegex.test(ip)) {
      errors.push(`Invalid IP address format: ${ip}`);
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate all settings
 */
export const validateSettings = (settings: Settings): { valid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {};

  const generalValidation = validateGeneralSettings(settings.general);
  if (!generalValidation.valid) {
    errors.general = generalValidation.errors;
  }

  const reconciliationValidation = validateReconciliationSettings(settings.reconciliation);
  if (!reconciliationValidation.valid) {
    errors.reconciliation = reconciliationValidation.errors;
  }

  const learningValidation = validateLearningSettings(settings.learning);
  if (!learningValidation.valid) {
    errors.learning = learningValidation.errors;
  }

  const notificationValidation = validateNotificationSettings(settings.notifications);
  if (!notificationValidation.valid) {
    errors.notifications = notificationValidation.errors;
  }

  const securityValidation = validateSecuritySettings(settings.security);
  if (!securityValidation.valid) {
    errors.security = securityValidation.errors;
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

/**
 * Get password strength
 */
export const getPasswordStrength = (password: string, settings: SecuritySettings): {
  strength: 'weak' | 'medium' | 'strong';
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= settings.passwordMinLength) {
    score += 20;
  } else {
    feedback.push(`Password must be at least ${settings.passwordMinLength} characters`);
  }

  if (settings.passwordRequireUppercase && /[A-Z]/.test(password)) {
    score += 20;
  } else if (settings.passwordRequireUppercase) {
    feedback.push('Password must contain uppercase letters');
  }

  if (settings.passwordRequireLowercase && /[a-z]/.test(password)) {
    score += 20;
  } else if (settings.passwordRequireLowercase) {
    feedback.push('Password must contain lowercase letters');
  }

  if (settings.passwordRequireNumbers && /[0-9]/.test(password)) {
    score += 20;
  } else if (settings.passwordRequireNumbers) {
    feedback.push('Password must contain numbers');
  }

  if (settings.passwordRequireSpecialChars && /[^A-Za-z0-9]/.test(password)) {
    score += 20;
  } else if (settings.passwordRequireSpecialChars) {
    feedback.push('Password must contain special characters');
  }

  let strength: 'weak' | 'medium' | 'strong';
  if (score >= 80) {
    strength = 'strong';
  } else if (score >= 50) {
    strength = 'medium';
  } else {
    strength = 'weak';
  }

  return { strength, score, feedback };
};
