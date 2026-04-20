/**
 * User Management Types and Utilities
 * User administration and role management
 */

// ============================================================================
// TYPES
// ============================================================================

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  VIEWER = 'viewer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export enum Permission {
  // Reconciliation
  VIEW_RECONCILIATIONS = 'view_reconciliations',
  CREATE_RECONCILIATIONS = 'create_reconciliations',
  APPROVE_MATCHES = 'approve_matches',
  REJECT_MATCHES = 'reject_matches',

  // Unmatched Pool
  VIEW_UNMATCHED = 'view_unmatched',
  MANAGE_UNMATCHED = 'manage_unmatched',

  // Learning
  VIEW_QUESTIONS = 'view_questions',
  ANSWER_QUESTIONS = 'answer_questions',

  // Entity Profiles
  VIEW_ENTITIES = 'view_entities',
  EDIT_ENTITIES = 'edit_entities',

  // Reports
  VIEW_REPORTS = 'view_reports',
  GENERATE_REPORTS = 'generate_reports',

  // Settings
  VIEW_SETTINGS = 'view_settings',
  EDIT_SETTINGS = 'edit_settings',

  // User Management
  VIEW_USERS = 'view_users',
  MANAGE_USERS = 'manage_users',
  INVITE_USERS = 'invite_users',

  // System
  VIEW_AUDIT_LOG = 'view_audit_log',
  MANAGE_INTEGRATIONS = 'manage_integrations',
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  permissions: Permission[];
  avatar: string | null;
  phoneNumber: string | null;
  department: string | null;
  jobTitle: string | null;
  lastLogin: Date | null;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  invitedAt: Date | null;
  invitedBy: string | null;
}

export interface UserFilter {
  search?: string;
  role?: UserRole[];
  status?: UserStatus[];
  department?: string[];
}

export interface UserInvitation {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  jobTitle?: string;
  message?: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  suspended: number;
  byRole: Record<UserRole, number>;
}

// ============================================================================
// ROLE PERMISSIONS
// ============================================================================

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission), // All permissions

  [UserRole.MANAGER]: [
    Permission.VIEW_RECONCILIATIONS,
    Permission.CREATE_RECONCILIATIONS,
    Permission.APPROVE_MATCHES,
    Permission.REJECT_MATCHES,
    Permission.VIEW_UNMATCHED,
    Permission.MANAGE_UNMATCHED,
    Permission.VIEW_QUESTIONS,
    Permission.ANSWER_QUESTIONS,
    Permission.VIEW_ENTITIES,
    Permission.EDIT_ENTITIES,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_SETTINGS,
    Permission.VIEW_USERS,
    Permission.INVITE_USERS,
    Permission.VIEW_AUDIT_LOG,
  ],

  [UserRole.USER]: [
    Permission.VIEW_RECONCILIATIONS,
    Permission.CREATE_RECONCILIATIONS,
    Permission.APPROVE_MATCHES,
    Permission.REJECT_MATCHES,
    Permission.VIEW_UNMATCHED,
    Permission.VIEW_QUESTIONS,
    Permission.ANSWER_QUESTIONS,
    Permission.VIEW_ENTITIES,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
  ],

  [UserRole.VIEWER]: [
    Permission.VIEW_RECONCILIATIONS,
    Permission.VIEW_UNMATCHED,
    Permission.VIEW_QUESTIONS,
    Permission.VIEW_ENTITIES,
    Permission.VIEW_REPORTS,
  ],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get role label
 */
export const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrator';
    case UserRole.MANAGER:
      return 'Manager';
    case UserRole.USER:
      return 'User';
    case UserRole.VIEWER:
      return 'Viewer';
    default:
      return role;
  }
};

/**
 * Get role color
 */
export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return 'red';
    case UserRole.MANAGER:
      return 'orange';
    case UserRole.USER:
      return 'blue';
    case UserRole.VIEWER:
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Get status label
 */
export const getStatusLabel = (status: UserStatus): string => {
  switch (status) {
    case UserStatus.ACTIVE:
      return 'Active';
    case UserStatus.INACTIVE:
      return 'Inactive';
    case UserStatus.PENDING:
      return 'Pending';
    case UserStatus.SUSPENDED:
      return 'Suspended';
    default:
      return status;
  }
};

/**
 * Get status color
 */
export const getStatusColor = (status: UserStatus): string => {
  switch (status) {
    case UserStatus.ACTIVE:
      return 'success';
    case UserStatus.INACTIVE:
      return 'default';
    case UserStatus.PENDING:
      return 'warning';
    case UserStatus.SUSPENDED:
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Get user full name
 */
export const getUserFullName = (user: User): string => {
  return `${user.firstName} ${user.lastName}`.trim();
};

/**
 * Get user initials
 */
export const getUserInitials = (user: User): string => {
  const firstInitial = user.firstName.charAt(0).toUpperCase();
  const lastInitial = user.lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
};

/**
 * Check if user has permission
 */
export const hasPermission = (user: User, permission: Permission): boolean => {
  return user.permissions.includes(permission);
};

/**
 * Check if user has any of the permissions
 */
export const hasAnyPermission = (user: User, permissions: Permission[]): boolean => {
  return permissions.some((permission) => user.permissions.includes(permission));
};

/**
 * Check if user has all of the permissions
 */
export const hasAllPermissions = (user: User, permissions: Permission[]): boolean => {
  return permissions.every((permission) => user.permissions.includes(permission));
};

/**
 * Get permissions for role
 */
export const getPermissionsForRole = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Calculate user stats
 */
export const calculateUserStats = (users: User[]): UserStats => {
  const stats: UserStats = {
    total: users.length,
    active: 0,
    inactive: 0,
    pending: 0,
    suspended: 0,
    byRole: {
      [UserRole.ADMIN]: 0,
      [UserRole.MANAGER]: 0,
      [UserRole.USER]: 0,
      [UserRole.VIEWER]: 0,
    },
  };

  users.forEach((user) => {
    // Count by status
    switch (user.status) {
      case UserStatus.ACTIVE:
        stats.active++;
        break;
      case UserStatus.INACTIVE:
        stats.inactive++;
        break;
      case UserStatus.PENDING:
        stats.pending++;
        break;
      case UserStatus.SUSPENDED:
        stats.suspended++;
        break;
    }

    // Count by role
    stats.byRole[user.role]++;
  });

  return stats;
};

/**
 * Filter users
 */
export const filterUsers = (users: User[], filter: UserFilter): User[] => {
  let result = [...users];

  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    result = result.filter(
      (user) =>
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.department && user.department.toLowerCase().includes(searchLower)) ||
        (user.jobTitle && user.jobTitle.toLowerCase().includes(searchLower))
    );
  }

  if (filter.role && filter.role.length > 0) {
    result = result.filter((user) => filter.role!.includes(user.role));
  }

  if (filter.status && filter.status.length > 0) {
    result = result.filter((user) => filter.status!.includes(user.status));
  }

  if (filter.department && filter.department.length > 0) {
    result = result.filter((user) => user.department && filter.department!.includes(user.department));
  }

  return result;
};

/**
 * Sort users
 */
export const sortUsers = (
  users: User[],
  field: 'name' | 'email' | 'role' | 'status' | 'lastLogin' | 'createdAt',
  order: 'asc' | 'desc'
): User[] => {
  const sorted = [...users];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (field) {
      case 'name':
        aValue = getUserFullName(a).toLowerCase();
        bValue = getUserFullName(b).toLowerCase();
        break;
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'role':
        aValue = a.role;
        bValue = b.role;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'lastLogin':
        aValue = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
        bValue = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
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
 * Format last login
 */
export const formatLastLogin = (lastLogin: Date | null): string => {
  if (!lastLogin) return 'Never';

  const now = new Date();
  const loginDate = new Date(lastLogin);
  const diffMs = now.getTime() - loginDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return loginDate.toLocaleDateString();
};

/**
 * Validate email
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
};

/**
 * Validate user invitation
 */
export const validateInvitation = (invitation: UserInvitation): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate email
  const emailValidation = validateEmail(invitation.email);
  if (!emailValidation.valid) {
    errors.push(emailValidation.error!);
  }

  // Validate first name
  if (!invitation.firstName || invitation.firstName.trim().length === 0) {
    errors.push('First name is required');
  }

  if (invitation.firstName && invitation.firstName.length > 50) {
    errors.push('First name must be less than 50 characters');
  }

  // Validate last name
  if (!invitation.lastName || invitation.lastName.trim().length === 0) {
    errors.push('Last name is required');
  }

  if (invitation.lastName && invitation.lastName.length > 50) {
    errors.push('Last name must be less than 50 characters');
  }

  // Validate message length
  if (invitation.message && invitation.message.length > 500) {
    errors.push('Message must be less than 500 characters');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Get permission label
 */
export const getPermissionLabel = (permission: Permission): string => {
  return permission
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Get permission category
 */
export const getPermissionCategory = (permission: Permission): string => {
  if (permission.startsWith('VIEW_') || permission.startsWith('CREATE_') ||
      permission.startsWith('APPROVE_') || permission.startsWith('REJECT_')) {
    if (permission.includes('RECONCILIATION')) return 'Reconciliation';
  }

  if (permission.includes('UNMATCHED')) return 'Unmatched Pool';
  if (permission.includes('QUESTION')) return 'Learning';
  if (permission.includes('ENTIT')) return 'Entity Profiles';
  if (permission.includes('REPORT')) return 'Reports';
  if (permission.includes('SETTING')) return 'Settings';
  if (permission.includes('USER')) return 'User Management';
  if (permission.includes('AUDIT') || permission.includes('INTEGRATION')) return 'System';

  return 'Other';
};

/**
 * Group permissions by category
 */
export const groupPermissionsByCategory = (permissions: Permission[]): Record<string, Permission[]> => {
  const grouped: Record<string, Permission[]> = {};

  permissions.forEach((permission) => {
    const category = getPermissionCategory(permission);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(permission);
  });

  return grouped;
};
