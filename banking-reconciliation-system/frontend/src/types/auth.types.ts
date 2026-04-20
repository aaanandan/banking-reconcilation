// Authentication & Authorization Types

export interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: 'tenant_admin' | 'tenant_user';
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  message: string;
}

export interface RegisterRequest {
  // Tenant information
  companyName: string;
  // Admin user information
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  user: User;
  tenant: Tenant;
  token: string;
  message: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'tenant_admin' | 'tenant_user';
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  tenantId: string;
  companyName: string;
  contactEmail: string;
  billingEmail?: string;
  subscriptionTier: 'free' | 'basic' | 'professional' | 'enterprise';
  subscriptionStatus: 'active' | 'trial' | 'suspended' | 'cancelled';
  trialEndsAt?: string;
  maxUsers: number;
  maxReconciliationsPerMonth: number;
  maxStorageGB: number;
  settings: Record<string, any>; // JSONB field for tenant-specific settings
  brandingLogo?: string;
  brandingPrimaryColor?: string;
  brandingSecondaryColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: 'tenant_admin' | 'tenant_user';
}
