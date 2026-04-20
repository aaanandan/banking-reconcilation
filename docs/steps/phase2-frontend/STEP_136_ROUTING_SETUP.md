# Step 136: Routing Setup

## Overview

Step 136 creates the routing infrastructure for the banking reconciliation SaaS platform. This includes route configuration, protected routes with authentication/authorization, lazy loading for performance, and navigation helpers.

## Files Created

### 1. src/routes/routes.ts (330 lines)

Route configuration with paths, metadata, and helper functions.

**Route Paths (ROUTES constant):**
- Public Routes:
  * LOGIN: `/login`
  * REGISTER: `/register`
  * FORGOT_PASSWORD: `/forgot-password`
  * AUTH_CALLBACK: `/auth/callback`

- Main App:
  * DASHBOARD: `/dashboard`

- Reconciliation Flow:
  * LIST: `/reconciliations`
  * NEW: `/reconciliation/new`
  * MAPPING: `/reconciliation/:id/mapping`
  * DATE_RANGE: `/reconciliation/:id/date-range`
  * REVIEW: `/reconciliation/:id/review`
  * MATCH: `/reconciliation/:id/matches/:matchId`
  * UNMATCHED: `/reconciliation/:id/unmatched`

- Learning & Profiles:
  * QUESTIONS: `/questions`
  * PROFILES: `/profiles`
  * PROFILE_DETAILS: `/profiles/:id`

- Management:
  * REPORTS: `/reports`
  * SETTINGS: `/settings`
  * USERS: `/users`
  * HELP: `/help`

**Route Metadata Interface:**
```typescript
interface RouteMetadata {
  title: string;
  description?: string;
  requiresAuth: boolean;
  requiresEmailVerification?: boolean;
  allowedRoles?: string[];
  icon?: string;
  showInNav?: boolean;
  navGroup?: string;
}
```

**Helper Functions:**
- `buildRoute()` - Build route with parameters (e.g., `/reconciliation/:id` + `{id: '123'}` → `/reconciliation/123`)
- `getRouteMetadata()` - Get metadata for route path
- `requiresAuth()` - Check if route requires authentication
- `hasRouteAccess()` - Check if user role has access to route
- `getNavigationItems()` - Get all navigation items for user role
- `getNavigationGroups()` - Group navigation items by category (main, learning, management, support)
- `generateBreadcrumbs()` - Generate breadcrumb trail for route
- `navigateTo` - Navigation helper object with type-safe route builders

**Navigation Groups:**
- `main` - Dashboard, Reconciliations
- `learning` - Learning Questions, Entity Profiles
- `management` - Reports, Settings, Users
- `support` - Help & Documentation

### 2. src/routes/ProtectedRoute.tsx (90 lines)

Component for protecting routes with authentication and authorization.

**Features:**
- Authentication check: Redirect to login if not authenticated
- Email verification check: Show warning if email not verified
- Role-based access control: Check user role against allowed roles
- Preserves intended destination: Redirects back after login
- 403 Access Denied page for unauthorized access
- Route loading fallback for lazy-loaded components

**Props:**
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  requiresEmailVerification?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
}
```

**Access Flow:**
1. Check authentication → If not authenticated, redirect to login with `state.from`
2. Check email verification → If required but not verified, show warning result
3. Check role-based access → If role not in allowed roles, show 403 result
4. Render children → If all checks pass

**RouteLoadingFallback Component:**
- Full-screen spinner shown while lazy-loading route components
- Ant Design Spin with "Loading..." tip
- Centered layout

### 3. src/routes/AppRouter.tsx (220 lines)

Main router component with all application routes.

**Features:**
- React Router v6 BrowserRouter
- Lazy loading for all route components (code splitting)
- Suspense with loading fallback
- Protected routes with authentication
- Role-based route protection (Settings: admin/manager, Users: admin only)
- Default redirects (/ → /dashboard, * → /dashboard or /login)

**Lazy Loaded Components:**
All major components are lazy-loaded for performance:
- Auth: Login, Register
- Dashboard
- Upload Flow: MultiUpload, ColumnMapping, DateRangeSelector
- Review Flow: TransactionReview, MatchApproval, UnmatchedPool
- Learning: LearningQuestions, EntityProfiles
- Management: ReportsManager, SettingsManager, UsersManager, HelpCenter

**Route Structure:**
```
/
├── /login (public)
├── /register (public)
├── /dashboard (protected)
├── /reconciliation
│   ├── /new (protected)
│   ├── /:id/mapping (protected)
│   ├── /:id/date-range (protected)
│   ├── /:id/review (protected)
│   ├── /:id/matches/:matchId (protected)
│   └── /:id/unmatched (protected)
├── /questions (protected)
├── /profiles (protected)
├── /reports (protected)
├── /settings (protected - admin/manager)
├── /users (protected - admin only)
└── /help (protected)
```

### 4. src/routes/index.ts

Barrel exports for all routing components and utilities.

## Integration Example

```typescript
// src/App.tsx
import React from 'react';
import { AppRouter } from './routes';

const App: React.FC = () => {
  return <AppRouter />;
};

export default App;
```

**Using Navigation Helpers:**
```typescript
import { useNavigate } from 'react-router-dom';
import { navigateTo } from './routes';

const MyComponent: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Type-safe navigation
    navigate(navigateTo.reconciliationReview('123'));
    // Navigates to: /reconciliation/123/review
  };

  return <button onClick={handleClick}>Review</button>;
};
```

**Building Dynamic Routes:**
```typescript
import { buildRoute, ROUTES } from './routes';

const url = buildRoute(ROUTES.RECONCILIATION.MATCH, {
  id: '123',
  matchId: '456',
});
// Result: /reconciliation/123/matches/456
```

**Getting Navigation Items:**
```typescript
import { getNavigationGroups } from './routes';

const navGroups = getNavigationGroups('admin');
// Returns grouped navigation items based on user role
```

## Workflow

### Route Access Flow:

1. **User navigates to URL**
   - Example: `/reconciliation/123/review`

2. **Router matches route**
   - Finds matching Route component
   - Checks if component is lazy-loaded

3. **Lazy loading (if applicable)**
   - Show RouteLoadingFallback (spinner)
   - Load component chunk
   - Render component when loaded

4. **ProtectedRoute checks**
   - Check authentication: `isAuthenticated()`
   - If not authenticated: Redirect to `/login` with `state.from = /reconciliation/123/review`
   - If authenticated: Continue

5. **Email verification check (if required)**
   - Check `user.emailVerified`
   - If not verified: Show warning result with resend button
   - If verified: Continue

6. **Role-based access check (if specified)**
   - Get user role from stored user
   - Check if role in `allowedRoles` array
   - If not allowed: Show 403 Access Denied result
   - If allowed: Continue

7. **Render component**
   - All checks passed
   - Render the requested component

### Login Flow with Redirect:

1. **User tries to access protected route while not logged in**
   - Example: Navigate to `/reconciliation/new`

2. **ProtectedRoute redirects to login**
   - Redirect to `/login`
   - Pass `state.from = /reconciliation/new`

3. **User logs in successfully**
   - Login component checks `location.state.from`
   - Redirects to `/reconciliation/new` instead of `/dashboard`
   - User continues workflow

### Navigation Menu Generation:

1. **Get current user role**
   - Example: `role = 'admin'`

2. **Call getNavigationGroups()**
   ```typescript
   const groups = getNavigationGroups('admin');
   ```

3. **Filter by showInNav and user role**
   - Filters out routes where `showInNav !== true`
   - Filters out routes where user doesn't have access

4. **Group by navGroup**
   ```
   main: [Dashboard, Reconciliations]
   learning: [Questions, Profiles]
   management: [Reports, Settings, Users]
   support: [Help]
   ```

5. **Render navigation menu**
   - Loop through groups
   - Render group header
   - Render links with icons

## Key Features

✅ **Centralized Route Configuration**
   - All routes defined in one place (ROUTES constant)
   - Type-safe route paths
   - Easy to maintain and update

✅ **Route Metadata**
   - Title, description, icons
   - Authentication requirements
   - Role-based access control
   - Navigation visibility

✅ **Protected Routes**
   - Authentication checking
   - Email verification enforcement
   - Role-based authorization
   - Automatic redirects

✅ **Lazy Loading**
   - Code splitting for all major routes
   - Reduces initial bundle size
   - Faster initial page load
   - Loading fallback UI

✅ **Navigation Helpers**
   - `navigateTo` - Type-safe route builders
   - `buildRoute()` - Dynamic route construction
   - `getNavigationItems()` - Menu generation
   - `generateBreadcrumbs()` - Breadcrumb trails

✅ **Role-Based Access**
   - Admin-only routes (User Management)
   - Admin/Manager routes (Settings)
   - User-level routes (most features)
   - Automatic 403 handling

✅ **Redirect Handling**
   - Preserves intended destination
   - Returns after login
   - Default redirects for unknown routes

✅ **Breadcrumb Generation**
   - Automatic breadcrumb trails
   - Context-aware paths
   - Home → Section → Page

## Business Logic

### Authentication Flow:
```
1. Check if user has valid token
2. If no: Redirect to /login with return URL
3. If yes: Continue to step 2
```

### Authorization Flow:
```
1. Get user role from stored user
2. Get allowed roles for route
3. If no restrictions: Allow access
4. If restricted: Check if user role in allowed roles
5. If yes: Allow access
6. If no: Show 403 Access Denied
```

### Email Verification Flow:
```
1. Check if route requires email verification
2. Get user.emailVerified status
3. If not required: Continue
4. If required and verified: Continue
5. If required and not verified: Show warning with resend option
```

### Lazy Loading Flow:
```
1. User navigates to route
2. Router detects lazy component
3. Show RouteLoadingFallback (spinner)
4. Dynamic import component
5. Wait for chunk to load
6. Render component
7. Hide spinner
```

## Route Groups and Access

### Public Routes (no authentication):
- `/login` - Login page
- `/register` - Registration page

### Protected Routes (authentication required):
- `/dashboard` - Dashboard (all authenticated users)
- `/reconciliation/*` - Reconciliation flow (all authenticated users)
- `/questions` - Learning questions (all authenticated users)
- `/profiles` - Entity profiles (all authenticated users)
- `/reports` - Reports & analytics (all authenticated users)
- `/help` - Help & documentation (all authenticated users)

### Admin/Manager Routes:
- `/settings` - Settings (admin, manager)

### Admin-Only Routes:
- `/users` - User management (admin only)

## Navigation Structure

```
Main
├── Dashboard (/dashboard)
└── Reconciliations (/reconciliations)

Learning
├── Learning Questions (/questions)
└── Entity Profiles (/profiles)

Management
├── Reports & Analytics (/reports)
├── Settings (/settings) [admin, manager]
└── User Management (/users) [admin]

Support
└── Help & Documentation (/help)
```

## Performance Optimizations

1. **Code Splitting**: All major components lazy-loaded
2. **Lazy Loading**: Components loaded only when route accessed
3. **Suspense Boundaries**: Loading states during chunk loading
4. **Route-Level Splitting**: Each route is a separate chunk
5. **Tree Shaking**: Unused routes not included in bundle

## Implementation Notes

1. **React Router v6**: Uses latest routing patterns
2. **TypeScript**: Full type safety for routes and helpers
3. **Ant Design**: Uses Result components for error states
4. **Modular**: Routes easily added/removed
5. **Testable**: Route logic separated from components
6. **Extensible**: Easy to add new features (analytics, transitions)

## Next Steps

After Step 136, the application has:
- Complete routing infrastructure
- Authentication/authorization
- Lazy loading for performance
- Navigation helpers

Next steps could include:
- Layout components (header, sidebar, footer)
- API integration
- State management
- Testing

---

Step 136 implements complete routing setup with authentication, authorization, lazy loading, and navigation helpers.

**Files:** 4 files, ~640 lines
**Progress:** Step 136/280 (48.6%)
**Next:** Step 137+ - Layout, Integration, Testing
