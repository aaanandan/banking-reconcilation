/**
 * Authentication Utilities
 *
 * Provides utilities for authentication, including:
 * - User authentication types
 * - Form validation
 * - Token management
 * - SSO provider configuration
 * - Password strength checking
 */

// ==================== TYPES ====================

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  role: UserRole;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  VIEWER = 'viewer',
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export enum SSOProvider {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
}

export interface SSOConfig {
  provider: SSOProvider;
  label: string;
  icon: string;
  color: string;
  backgroundColor: string;
}

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  feedback: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

// ==================== CONSTANTS ====================

export const TOKEN_STORAGE_KEY = 'auth_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';
export const USER_STORAGE_KEY = 'user';
export const REMEMBER_ME_STORAGE_KEY = 'remember_me';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// ==================== SSO CONFIGURATION ====================

export const SSO_CONFIGS: Record<SSOProvider, SSOConfig> = {
  [SSOProvider.GOOGLE]: {
    provider: SSOProvider.GOOGLE,
    label: 'Continue with Google',
    icon: 'GoogleOutlined',
    color: '#4285F4',
    backgroundColor: '#ffffff',
  },
  [SSOProvider.MICROSOFT]: {
    provider: SSOProvider.MICROSOFT,
    label: 'Continue with Microsoft',
    icon: 'WindowsOutlined',
    color: '#00A4EF',
    backgroundColor: '#ffffff',
  },
};

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validate email format
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
};

/**
 * Validate password
 */
export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, error: `Password must not exceed ${PASSWORD_MAX_LENGTH} characters` };
  }

  return { valid: true };
};

/**
 * Validate login credentials
 */
export const validateLoginCredentials = (credentials: LoginCredentials): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validate email
  const emailValidation = validateEmail(credentials.email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error!;
  }

  // Validate password
  const passwordValidation = validatePassword(credentials.password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error!;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Check password strength
 */
export const checkPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  else feedback.push('Use at least 12 characters for better security');

  // Character variety checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (hasLowercase && hasUppercase) score++;
  else feedback.push('Use both uppercase and lowercase letters');

  if (hasNumbers) score++;
  else feedback.push('Include numbers');

  if (hasSpecialChars) score++;
  else feedback.push('Include special characters (!@#$%^&*)');

  // Common patterns check
  const commonPatterns = ['password', '123456', 'qwerty', 'abc123'];
  if (commonPatterns.some((pattern) => password.toLowerCase().includes(pattern))) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common passwords');
  }

  // Determine label and color
  let label: string;
  let color: string;

  if (score === 0) {
    label = 'Very Weak';
    color = '#ff4d4f';
  } else if (score === 1) {
    label = 'Weak';
    color = '#ff7a45';
  } else if (score === 2) {
    label = 'Fair';
    color = '#ffa940';
  } else if (score === 3) {
    label = 'Good';
    color = '#52c41a';
  } else {
    label = 'Strong';
    color = '#389e0d';
  }

  return {
    score,
    label,
    color,
    feedback,
  };
};

// ==================== TOKEN MANAGEMENT ====================

/**
 * Store authentication tokens
 */
export const storeTokens = (tokens: AuthTokens, rememberMe: boolean = false): void => {
  const storage = rememberMe ? localStorage : sessionStorage;

  storage.setItem(TOKEN_STORAGE_KEY, tokens.accessToken);
  storage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
  localStorage.setItem(REMEMBER_ME_STORAGE_KEY, String(rememberMe));
};

/**
 * Get stored access token
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
};

/**
 * Get stored refresh token
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) || sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
};

/**
 * Clear all authentication data
 */
export const clearAuthData = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(REMEMBER_ME_STORAGE_KEY);

  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
};

/**
 * Check if remember me was selected
 */
export const isRememberMeEnabled = (): boolean => {
  return localStorage.getItem(REMEMBER_ME_STORAGE_KEY) === 'true';
};

// ==================== USER MANAGEMENT ====================

/**
 * Store user data
 */
export const storeUser = (user: User): void => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

/**
 * Get stored user data
 */
export const getStoredUser = (): User | null => {
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
};

/**
 * Get user display name
 */
export const getUserDisplayName = (user: User): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  return user.email;
};

/**
 * Get user initials for avatar
 */
export const getUserInitials = (user: User): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) {
    return user.firstName[0].toUpperCase();
  }
  return user.email[0].toUpperCase();
};

// ==================== JWT UTILITIES ====================

/**
 * Decode JWT token (without verification)
 */
export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token: string): Date | null => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;

  return new Date(decoded.exp * 1000);
};

// ==================== SESSION MANAGEMENT ====================

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  if (!token) return false;

  return !isTokenExpired(token);
};

/**
 * Get session info
 */
export const getSessionInfo = (): {
  authenticated: boolean;
  user: User | null;
  expiresAt: Date | null;
} => {
  const token = getAccessToken();
  const user = getStoredUser();

  if (!token || isTokenExpired(token)) {
    return {
      authenticated: false,
      user: null,
      expiresAt: null,
    };
  }

  return {
    authenticated: true,
    user,
    expiresAt: getTokenExpiration(token),
  };
};

// ==================== ERROR HANDLING ====================

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'invalid_credentials',
  EMAIL_NOT_VERIFIED = 'email_not_verified',
  ACCOUNT_LOCKED = 'account_locked',
  TENANT_SUSPENDED = 'tenant_suspended',
  TOKEN_EXPIRED = 'token_expired',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error',
}

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  [AuthErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password. Please try again.',
  [AuthErrorCode.EMAIL_NOT_VERIFIED]: 'Please verify your email address before logging in.',
  [AuthErrorCode.ACCOUNT_LOCKED]: 'Your account has been locked due to multiple failed login attempts.',
  [AuthErrorCode.TENANT_SUSPENDED]: 'Your organization account has been suspended. Please contact support.',
  [AuthErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [AuthErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
  [AuthErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again later.',
};

/**
 * Get user-friendly error message
 */
export const getAuthErrorMessage = (errorCode: string | AuthErrorCode): string => {
  return AUTH_ERROR_MESSAGES[errorCode as AuthErrorCode] || AUTH_ERROR_MESSAGES[AuthErrorCode.UNKNOWN_ERROR];
};

// ==================== SSO UTILITIES ====================

/**
 * Get SSO authorization URL
 */
export const getSSOAuthUrl = (provider: SSOProvider, redirectUri: string): string => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  return `${baseUrl}/auth/sso/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
};

/**
 * Handle SSO callback
 */
export const handleSSOCallback = (searchParams: URLSearchParams): {
  success: boolean;
  error?: string;
} => {
  const error = searchParams.get('error');
  if (error) {
    return { success: false, error };
  }

  return { success: true };
};

// ==================== REGISTRATION ====================

export interface CompanyInfo {
  companyName: string;
  companySize: CompanySize;
  industry?: string;
  country: string;
}

export enum CompanySize {
  SOLO = 'solo',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ENTERPRISE = 'enterprise',
}

export const COMPANY_SIZE_OPTIONS = [
  { value: CompanySize.SOLO, label: '1 person (just me)', description: 'Solo practitioner or freelancer' },
  { value: CompanySize.SMALL, label: '2-10 people', description: 'Small business or startup' },
  { value: CompanySize.MEDIUM, label: '11-50 people', description: 'Growing business' },
  { value: CompanySize.LARGE, label: '51-200 people', description: 'Established company' },
  { value: CompanySize.ENTERPRISE, label: '200+ people', description: 'Enterprise organization' },
];

export const INDUSTRY_OPTIONS = [
  'Accounting & Bookkeeping',
  'Banking & Finance',
  'Construction',
  'Consulting',
  'E-commerce',
  'Education',
  'Healthcare',
  'Hospitality',
  'Manufacturing',
  'Non-Profit',
  'Real Estate',
  'Retail',
  'Technology',
  'Transportation',
  'Other',
];

export interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export interface RegistrationData {
  companyInfo: CompanyInfo;
  userDetails: UserDetails;
}

export interface VerificationCodeData {
  code: string;
  email: string;
}

/**
 * Validate company name
 */
export const validateCompanyName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Company name is required' };
  }

  if (name.trim().length < 2) {
    return { valid: false, error: 'Company name must be at least 2 characters' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Company name must not exceed 100 characters' };
  }

  return { valid: true };
};

/**
 * Validate company info step
 */
export const validateCompanyInfo = (info: CompanyInfo): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validate company name
  const nameValidation = validateCompanyName(info.companyName);
  if (!nameValidation.valid) {
    errors.companyName = nameValidation.error!;
  }

  // Validate company size
  if (!info.companySize) {
    errors.companySize = 'Please select your company size';
  }

  // Validate country
  if (!info.country) {
    errors.country = 'Please select your country';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate first name
 */
export const validateFirstName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'First name is required' };
  }

  if (name.trim().length < 2) {
    return { valid: false, error: 'First name must be at least 2 characters' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'First name must not exceed 50 characters' };
  }

  return { valid: true };
};

/**
 * Validate last name
 */
export const validateLastName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Last name is required' };
  }

  if (name.trim().length < 2) {
    return { valid: false, error: 'Last name must be at least 2 characters' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Last name must not exceed 50 characters' };
  }

  return { valid: true };
};

/**
 * Validate password confirmation
 */
export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): { valid: boolean; error?: string } => {
  if (!confirmPassword) {
    return { valid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }

  return { valid: true };
};

/**
 * Validate user details step
 */
export const validateUserDetails = (details: UserDetails): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validate first name
  const firstNameValidation = validateFirstName(details.firstName);
  if (!firstNameValidation.valid) {
    errors.firstName = firstNameValidation.error!;
  }

  // Validate last name
  const lastNameValidation = validateLastName(details.lastName);
  if (!lastNameValidation.valid) {
    errors.lastName = lastNameValidation.error!;
  }

  // Validate email
  const emailValidation = validateEmail(details.email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error!;
  }

  // Validate password
  const passwordValidation = validatePassword(details.password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error!;
  }

  // Validate password confirmation
  const confirmValidation = validatePasswordConfirmation(details.password, details.confirmPassword);
  if (!confirmValidation.valid) {
    errors.confirmPassword = confirmValidation.error!;
  }

  // Validate terms acceptance
  if (!details.acceptedTerms) {
    errors.acceptedTerms = 'You must accept the Terms of Service to continue';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate verification code
 */
export const validateVerificationCode = (code: string): { valid: boolean; error?: string } => {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'Verification code is required' };
  }

  // Remove spaces and dashes
  const cleanCode = code.replace(/[\s-]/g, '');

  if (cleanCode.length !== 6) {
    return { valid: false, error: 'Verification code must be 6 digits' };
  }

  if (!/^\d+$/.test(cleanCode)) {
    return { valid: false, error: 'Verification code must contain only numbers' };
  }

  return { valid: true };
};

/**
 * Format verification code for display (123456 → 123-456)
 */
export const formatVerificationCode = (code: string): string => {
  const cleanCode = code.replace(/[\s-]/g, '');
  if (cleanCode.length <= 3) return cleanCode;
  return `${cleanCode.slice(0, 3)}-${cleanCode.slice(3, 6)}`;
};
