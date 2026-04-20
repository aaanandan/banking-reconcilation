/**
 * Routes Module
 *
 * Exports all routing-related components and utilities
 */

// Router Component
export { AppRouter, default } from './AppRouter';

// Protected Route
export { ProtectedRoute, RouteLoadingFallback } from './ProtectedRoute';
export type { ProtectedRouteProps } from './ProtectedRoute';

// Route Configuration
export {
  ROUTES,
  ROUTE_METADATA,
  buildRoute,
  getRouteMetadata,
  requiresAuth,
  hasRouteAccess,
  getNavigationItems,
  getNavigationGroups,
  generateBreadcrumbs,
  navigateTo,
} from './routes';

export type { RouteMetadata, Breadcrumb } from './routes';
