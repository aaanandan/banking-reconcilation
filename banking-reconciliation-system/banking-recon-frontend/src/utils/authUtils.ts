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
