/**
 * Routing Configuration
 *
 * Defines all application routes, route types, and navigation helpers
 */

// ==================== ROUTE PATHS ====================

export const ROUTES = {
  // Public Routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Auth Callback
  AUTH_CALLBACK: '/auth/callback',

  // Main App Routes
  DASHBOARD: '/dashboard',

  // Reconciliation Flow
  RECONCILIATION: {
    LIST: '/reconciliations',
    NEW: '/reconciliation/new',
    UPLOAD: '/reconciliation/new', // Alias
    MAPPING: '/reconciliation/:id/mapping',
    DATE_RANGE: '/reconciliation/:id/date-range',
    REVIEW: '/reconciliation/:id/review',
    DETAILS: '/reconciliation/:id',
    MATCH: '/reconciliation/:id/matches/:matchId',
    UNMATCHED: '/reconciliation/:id/unmatched',
  },

  // Learning & Profiles
  LEARNING: {
    QUESTIONS: '/questions',
    PROFILES: '/profiles',
    PROFILE_DETAILS: '/profiles/:id',
  },

  // Management
  REPORTS: '/reports',
  SETTINGS: '/settings',
  USERS: '/users',
  HELP: '/help',

  // Legal & Info
  TERMS: '/terms',
  PRIVACY: '/privacy',
  SUPPORT: '/support',

  // Error Pages
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401',
  SERVER_ERROR: '/500',
} as const;

// ==================== ROUTE METADATA ====================

export interface RouteMetadata {
  title: string;
  description?: string;
  requiresAuth: boolean;
  requiresEmailVerification?: boolean;
  allowedRoles?: string[];
  icon?: string;
  showInNav?: boolean;
  navGroup?: string;
}

export const ROUTE_METADATA: Record<string, RouteMetadata> = {
  // Public Routes
  [ROUTES.LOGIN]: {
    title: 'Sign In',
    requiresAuth: false,
  },
  [ROUTES.REGISTER]: {
    title: 'Create Account',
    requiresAuth: false,
  },

  // Dashboard
  [ROUTES.DASHBOARD]: {
    title: 'Dashboard',
    description: 'Overview and statistics',
    requiresAuth: true,
    icon: 'DashboardOutlined',
    showInNav: true,
    navGroup: 'main',
  },

  // Reconciliations
  [ROUTES.RECONCILIATION.LIST]: {
    title: 'Reconciliations',
    description: 'View all reconciliations',
    requiresAuth: true,
    icon: 'ReconciliationOutlined',
    showInNav: true,
    navGroup: 'main',
  },
  [ROUTES.RECONCILIATION.NEW]: {
    title: 'New Reconciliation',
    description: 'Upload files for reconciliation',
    requiresAuth: true,
  },
  [ROUTES.RECONCILIATION.REVIEW]: {
    title: 'Review Transactions',
    description: 'Review and approve matches',
    requiresAuth: true,
  },
  [ROUTES.RECONCILIATION.UNMATCHED]: {
    title: 'Unmatched Pool',
    description: 'Manage unmatched transactions',
    requiresAuth: true,
  },

  // Learning
  [ROUTES.LEARNING.QUESTIONS]: {
    title: 'Learning Questions',
    description: 'Answer system learning questions',
    requiresAuth: true,
    icon: 'QuestionCircleOutlined',
    showInNav: true,
    navGroup: 'learning',
  },
  [ROUTES.LEARNING.PROFILES]: {
    title: 'Entity Profiles',
    description: 'View learned entity patterns',
    requiresAuth: true,
    icon: 'TeamOutlined',
    showInNav: true,
    navGroup: 'learning',
  },

  // Management
  [ROUTES.REPORTS]: {
    title: 'Reports & Analytics',
    description: 'Generate and view reports',
    requiresAuth: true,
    icon: 'BarChartOutlined',
    showInNav: true,
    navGroup: 'management',
  },
  [ROUTES.SETTINGS]: {
    title: 'Settings',
    description: 'Configure system settings',
    requiresAuth: true,
    allowedRoles: ['admin', 'manager'],
    icon: 'SettingOutlined',
    showInNav: true,
    navGroup: 'management',
  },
  [ROUTES.USERS]: {
    title: 'User Management',
    description: 'Manage users and permissions',
    requiresAuth: true,
    allowedRoles: ['admin'],
    icon: 'UserOutlined',
    showInNav: true,
    navGroup: 'management',
  },
  [ROUTES.HELP]: {
    title: 'Help & Documentation',
    description: 'Get help and learn',
    requiresAuth: true,
    icon: 'BookOutlined',
    showInNav: true,
    navGroup: 'support',
  },
};

// ==================== ROUTE HELPERS ====================

/**
 * Build route path with parameters
 */
export const buildRoute = (path: string, params: Record<string, string | number>): string => {
  let builtPath = path;
  Object.entries(params).forEach(([key, value]) => {
    builtPath = builtPath.replace(`:${key}`, String(value));
  });
  return builtPath;
};

/**
 * Get route metadata
 */
export const getRouteMetadata = (path: string): RouteMetadata | undefined => {
  return ROUTE_METADATA[path];
};

/**
 * Check if route requires authentication
 */
export const requiresAuth = (path: string): boolean => {
  const metadata = getRouteMetadata(path);
  return metadata?.requiresAuth ?? false;
};

/**
 * Check if user has access to route
 */
export const hasRouteAccess = (path: string, userRole?: string): boolean => {
  const metadata = getRouteMetadata(path);

  // If no metadata, allow access
  if (!metadata) return true;

  // If no role restrictions, allow access
  if (!metadata.allowedRoles || metadata.allowedRoles.length === 0) {
    return true;
  }

  // Check if user role is in allowed roles
  if (!userRole) return false;
  return metadata.allowedRoles.includes(userRole);
};

/**
 * Get navigation items
 */
export const getNavigationItems = (userRole?: string): Array<{
  path: string;
  metadata: RouteMetadata;
}> => {
  return Object.entries(ROUTE_METADATA)
    .filter(([_, metadata]) => metadata.showInNav)
    .filter(([path, _]) => hasRouteAccess(path, userRole))
    .map(([path, metadata]) => ({ path, metadata }));
};

/**
 * Get navigation groups
 */
export const getNavigationGroups = (userRole?: string): Record<string, Array<{
  path: string;
  metadata: RouteMetadata;
}>> => {
  const items = getNavigationItems(userRole);
  const groups: Record<string, Array<{ path: string; metadata: RouteMetadata }>> = {};

  items.forEach(item => {
    const group = item.metadata.navGroup || 'other';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
  });

  return groups;
};

// ==================== BREADCRUMB HELPERS ====================

export interface Breadcrumb {
  title: string;
  path?: string;
}

/**
 * Generate breadcrumbs from route path
 */
export const generateBreadcrumbs = (path: string, params?: Record<string, string>): Breadcrumb[] => {
  const breadcrumbs: Breadcrumb[] = [
    { title: 'Home', path: ROUTES.DASHBOARD },
  ];

  // Map common patterns to breadcrumbs
  if (path.startsWith('/reconciliation/')) {
    breadcrumbs.push({ title: 'Reconciliations', path: ROUTES.RECONCILIATION.LIST });

    if (path.includes('/review')) {
      breadcrumbs.push({ title: 'Review', path });
    } else if (path.includes('/unmatched')) {
      breadcrumbs.push({ title: 'Unmatched Pool', path });
    } else if (path.includes('/mapping')) {
      breadcrumbs.push({ title: 'Column Mapping', path });
    } else if (path.includes('/date-range')) {
      breadcrumbs.push({ title: 'Date Range', path });
    } else if (path.includes('/matches/')) {
      breadcrumbs.push({ title: 'Match Details', path });
    } else if (path === ROUTES.RECONCILIATION.NEW) {
      breadcrumbs.push({ title: 'New Reconciliation' });
    } else if (params?.id) {
      breadcrumbs.push({ title: `Reconciliation #${params.id}` });
    }
  } else if (path.startsWith('/profiles')) {
    breadcrumbs.push({ title: 'Entity Profiles', path: ROUTES.LEARNING.PROFILES });
    if (params?.id) {
      breadcrumbs.push({ title: `Profile #${params.id}` });
    }
  } else {
    // Use metadata title if available
    const metadata = getRouteMetadata(path);
    if (metadata && path !== ROUTES.DASHBOARD) {
      breadcrumbs.push({ title: metadata.title });
    }
  }

  return breadcrumbs;
};

// ==================== NAVIGATION HELPERS ====================

/**
 * Navigate to route (for use with useNavigate hook)
 */
export const navigateTo = {
  dashboard: () => ROUTES.DASHBOARD,
  login: () => ROUTES.LOGIN,
  register: () => ROUTES.REGISTER,

  // Reconciliations
  reconciliations: () => ROUTES.RECONCILIATION.LIST,
  newReconciliation: () => ROUTES.RECONCILIATION.NEW,
  reconciliationMapping: (id: string) => buildRoute(ROUTES.RECONCILIATION.MAPPING, { id }),
  reconciliationDateRange: (id: string) => buildRoute(ROUTES.RECONCILIATION.DATE_RANGE, { id }),
  reconciliationReview: (id: string) => buildRoute(ROUTES.RECONCILIATION.REVIEW, { id }),
  reconciliationDetails: (id: string) => buildRoute(ROUTES.RECONCILIATION.DETAILS, { id }),
  matchDetails: (id: string, matchId: string) => buildRoute(ROUTES.RECONCILIATION.MATCH, { id, matchId }),
  unmatchedPool: (id: string) => buildRoute(ROUTES.RECONCILIATION.UNMATCHED, { id }),

  // Learning
  questions: () => ROUTES.LEARNING.QUESTIONS,
  profiles: () => ROUTES.LEARNING.PROFILES,
  profileDetails: (id: string) => buildRoute(ROUTES.LEARNING.PROFILE_DETAILS, { id }),

  // Management
  reports: () => ROUTES.REPORTS,
  settings: () => ROUTES.SETTINGS,
  users: () => ROUTES.USERS,
  help: () => ROUTES.HELP,
};
