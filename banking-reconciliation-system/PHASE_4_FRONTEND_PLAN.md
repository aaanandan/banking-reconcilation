# Phase 4: Frontend Implementation Plan (Steps 51-140)

**Status:** Starting Implementation
**Branch:** `claude/banking-reconciliation-system-01CG4GnbP57XppTYHuupsXQr`
**Total Steps:** 90 steps

---

## Overview

Phase 4 involves creating a production-ready React frontend with multi-tenancy built-in from the start. The frontend will integrate with all 23 tenant-aware backend microservices.

---

## Phase 4 Breakdown: Frontend with Multi-Tenancy (Steps 51-140)

### **Sub-Phase 4A: Frontend Foundation (Steps 51-60)**

**Step 51:** Create React application with TypeScript
- Initialize React app with Vite + TypeScript
- Configure path mappings
- Set up project structure

**Step 52:** Install core dependencies
- React Router v6
- Axios for API calls
- Ant Design component library
- JWT decode library
- State management (Zustand/Redux)

**Step 53:** Create folder structure
- /src/components
- /src/pages
- /src/services (API clients)
- /src/store (state management)
- /src/hooks
- /src/types
- /src/utils

**Step 54:** Set up TypeScript types
- API response types
- Entity types matching backend
- DTO types for requests
- Auth types (JWT payload structure)

**Step 55:** Create API client foundation
- Axios instance with interceptors
- Base URL configuration
- Request/response interceptors
- Error handling

**Step 56:** Test basic frontend setup
- Verify build
- Verify dev server
- Test API client foundation

---

### **Sub-Phase 4B: Authentication & JWT Management (Steps 57-70)**

**Step 57:** Create AuthContext
- JWT token storage (localStorage)
- Token decoding
- Tenant context extraction
- User context extraction

**Step 58:** Create AuthService
- Register endpoint integration
- Login endpoint integration
- Logout functionality
- Token refresh (if implemented)

**Step 59:** Create Login page
- Email/password form
- Form validation
- Error handling
- Remember me functionality

**Step 60:** Create Registration page
- Company name (tenant name)
- Admin user details
- Email validation
- Password strength validation
- Terms & conditions

**Step 61:** Create Protected Route component
- Check JWT token validity
- Redirect to login if not authenticated
- Extract tenant context from JWT
- Pass tenant context to child components

**Step 62:** Create AuthGuard HOC
- Role-based access control
- Tenant admin vs regular user
- Conditional rendering based on role

**Step 63:** Add JWT token interceptor
- Attach token to all API requests
- Handle 401 responses (token expired)
- Auto-logout on authentication failure

**Step 64:** Create user profile page
- Display current user info
- Show tenant information
- Edit profile functionality

**Step 65:** Test authentication flow
- Register new tenant
- Login with credentials
- Verify JWT includes tenantId
- Test protected routes
- Test logout

---

### **Sub-Phase 4C: Tenant Management UI (Steps 66-80)**

**Step 66:** Create TenantContext
- Current tenant state
- Tenant switching functionality (future multi-tenant users)
- Tenant branding settings

**Step 67:** Create TenantService
- Get tenant details endpoint
- Update tenant settings endpoint
- Get tenant usage statistics

**Step 68:** Create tenant dashboard layout
- Top navigation bar with tenant name
- Sidebar navigation
- Main content area
- Footer

**Step 69:** Create tenant settings page
- Company name
- Billing information display
- Contact information
- Timezone settings

**Step 70:** Create usage statistics component
- Reconciliations count
- Transactions processed
- Storage used
- API calls made

**Step 71:** Create billing information page (read-only for now)
- Subscription plan display
- Usage quotas
- Billing history placeholder

**Step 72:** Add tenant branding: Logo upload
- Upload logo image
- Preview functionality
- Save to tenant settings (JSONB)

**Step 73:** Add tenant branding: Color scheme
- Primary color picker
- Secondary color picker
- Apply colors to UI components
- Preview functionality

**Step 74:** Create tenant switcher component (for future multi-tenant users)
- Dropdown in header
- List user's accessible tenants
- Switch tenant context
- Reload data for new tenant

**Step 75:** Test tenant management
- View tenant details
- Update tenant settings
- Verify tenant isolation
- Test branding changes

---

### **Sub-Phase 4D: Core Application Layout (Steps 76-85)**

**Step 76:** Create main application shell
- Header with tenant logo
- Navigation sidebar
- Content area with routing
- Footer

**Step 77:** Create navigation menu
- Dashboard
- New Reconciliation
- Reconciliation History
- Settings
- Help/Documentation

**Step 78:** Create dashboard home page
- Statistics cards (total reconciliations, match rate, etc.)
- Recent reconciliations list
- Quick actions
- System status

**Step 79:** Create loading & error states
- Global loading indicator
- Error boundary component
- Toast notifications
- Empty state components

**Step 80:** Create breadcrumb navigation
- Dynamic breadcrumbs based on route
- Click to navigate
- Integration with React Router

**Step 81:** Test core layout
- Navigation between pages
- Responsive design basics
- Loading states
- Error handling

---

### **Sub-Phase 4E: Reconciliation Workflows - Part 1 (Steps 82-100)**

**Step 82:** Create ReconciliationService
- Create reconciliation endpoint
- Upload files endpoint
- Get reconciliation by ID endpoint
- List reconciliations endpoint
- Get reconciliation progress endpoint

**Step 83:** Create "New Reconciliation" page - Step 1: Basic Info
- Reconciliation name input
- Description textarea
- Date range selection (optional)
- Form validation

**Step 84:** Create "New Reconciliation" page - Step 2: Upload Bank Files
- Multi-file upload component
- Bank file selection (support 1-N banks)
- Bank name input for each file
- File validation (CSV only)

**Step 85:** Create "New Reconciliation" page - Step 3: Upload Ledger File
- Single file upload
- File preview
- Validation

**Step 86:** Create "New Reconciliation" page - Step 4: Data Prep Integration
- Call data-prep-service with files
- Show column mapping results
- Display file analysis (date ranges, row counts)
- Optional: Allow user to adjust column mappings

**Step 87:** Create "New Reconciliation" page - Step 5: Review & Create
- Summary of reconciliation
- File details
- Transaction counts per bank
- Create button

**Step 88:** Implement file upload with progress
- Progress bar for each file
- Cancel upload functionality
- Error handling for upload failures

**Step 89:** Create reconciliation wizard component
- Multi-step form (Steps 1-5)
- Progress indicator
- Back/Next navigation
- Form state management

**Step 90:** Test new reconciliation flow
- Create reconciliation with 1 bank
- Create reconciliation with 3 banks
- Test date range filtering
- Verify data-prep integration
- Verify tenant isolation (tenantId in requests)

---

### **Sub-Phase 4F: Reconciliation Workflows - Part 2 (Steps 91-110)**

**Step 91:** Create "Reconciliation Detail" page layout
- Reconciliation header (name, status, dates)
- Statistics panel (total txns, matched, unmatched)
- Tabs: Overview, Matches, Transactions, Questions

**Step 92:** Create reconciliation overview tab
- Status timeline
- Current matching step
- Progress percentage
- Match rate by bank
- Convergence graph (placeholder)

**Step 93:** Create "Start Matching" button & integration
- Call match-orchestrator service
- Show matching progress
- Poll for updates
- Display results when complete

**Step 94:** Create matches list component
- Table with columns: Bank Txn, Ledger Txn, Confidence, Algorithm
- Filter by confidence threshold
- Filter by bank
- Pagination

**Step 95:** Create match detail modal
- Bank transaction details
- Ledger transaction details
- Match reasoning
- Confidence breakdown
- Accept/Reject buttons

**Step 96:** Implement match actions
- Accept match (commit)
- Reject match (returns to unmatched pool)
- Bulk actions (accept all high-confidence)
- Call state-manager-service to update status

**Step 97:** Create transactions tab
- Two sub-tabs: Bank Transactions, Ledger Transactions
- Table with columns: Date, Amount, Description, Status, BankName
- Filter by status (matched, unmatched, staged)
- Filter by bank
- Search functionality
- Pagination

**Step 98:** Create transaction detail modal
- All transaction fields (core + optional)
- Match history (if matched previously)
- Manual match suggestion (search opposite pool)
- Manual classification option

**Step 99:** Create manual matching interface
- Select bank transaction
- Search/filter ledger transactions
- Create manual match with confidence 1.0
- Save to state-manager

**Step 100:** Create "Questions" tab
- List deferred questions from question-manager-service
- Group by category (identity, business rule, etc.)
- Answer question interface
- Submit answers to learning-service

---

### **Sub-Phase 4G: Reconciliation Workflows - Part 3 (Steps 101-115)**

**Step 101:** Create reconciliation history page
- Table: Name, Date, Status, Match Rate, Actions
- Filter by status
- Filter by date range
- Search by name
- Pagination

**Step 102:** Implement reconciliation actions
- View (navigate to detail page)
- Resume (for paused reconciliations)
- Delete (with confirmation)
- Export results (CSV/Excel)

**Step 103:** Create export functionality
- Generate report with match results
- Include statistics
- Download as CSV/Excel
- Call backend export endpoint (to be created)

**Step 104:** Create learning feedback interface
- Show entity profiles learned
- Display pattern insights
- User can validate/correct profiles
- Integration with learning-service

**Step 105:** Create convergence metrics display
- Graph showing match rate over iterations
- Statistics per matching technique (MT-01, MT-02, etc.)
- Field effectiveness breakdown
- Historical comparison

**Step 106:** Implement real-time progress updates
- WebSocket connection (or polling)
- Live updates during matching process
- Notifications when matching complete
- Progress bar with current MT step

**Step 107:** Create error handling for workflows
- Display errors from backend services
- Retry mechanism for failed API calls
- User-friendly error messages
- Error logging

**Step 108:** Test reconciliation workflows
- End-to-end: Upload → Match → Review → Accept
- Test multi-bank scenarios
- Test date range filtering
- Verify tenant isolation
- Test manual matching

---

### **Sub-Phase 4H: Advanced Features (Steps 109-125)**

**Step 109:** Create admin panel (tenant admin only)
- User management page
- View all tenant users
- Add/remove users
- Change user roles

**Step 110:** Create user invitation system
- Send invite emails (backend integration)
- Invite link with token
- New user registration via invite
- Role assignment

**Step 111:** Create user management UI
- Table: Email, Name, Role, Status, Actions
- Edit user role
- Deactivate/activate user
- Resend invitation

**Step 112:** Implement role-based UI rendering
- Hide admin features from regular users
- Show/hide based on JWT role
- Permission checks on actions

**Step 113:** Create help/documentation page
- Getting started guide
- FAQ section
- Video tutorials (placeholders)
- Contact support

**Step 114:** Create notification system
- Toast notifications for actions
- In-app notification center (icon in header)
- Mark as read functionality
- Backend integration (future)

**Step 115:** Create search functionality
- Global search in header
- Search reconciliations
- Search transactions
- Search by date, amount, description

**Step 116:** Create filters & advanced search
- Multi-field filters
- Date range filters
- Amount range filters
- Bank filter
- Status filter

**Step 117:** Create data export features
- Export reconciliation history
- Export transactions
- Export match results
- CSV/Excel format options

**Step 118:** Add keyboard shortcuts
- Cmd/Ctrl + K for search
- Navigate between tabs with keyboard
- Accept match with Enter
- Shortcuts help modal

**Step 119:** Create responsive design
- Mobile-friendly layouts
- Tablet support
- Collapsible sidebar
- Touch-friendly buttons

**Step 120:** Test advanced features
- User management (add/edit/remove)
- Search & filters
- Export functionality
- Responsive design on different devices

---

### **Sub-Phase 4I: Tenant Branding & Theming (Steps 121-130)**

**Step 121:** Implement CSS custom properties for theming
- Define CSS variables for colors
- Define variables for fonts
- Define variables for spacing

**Step 122:** Create theme context
- Load theme from tenant settings
- Apply theme to root element
- Support light/dark mode toggle

**Step 123:** Apply tenant primary color
- Buttons
- Links
- Active navigation items
- Progress bars

**Step 124:** Apply tenant secondary color
- Secondary buttons
- Badges
- Tags
- Hover states

**Step 125:** Implement custom logo display
- Header logo from tenant settings
- Login page logo
- Favicon generation from logo

**Step 126:** Create theme preview component
- Preview theme changes before saving
- Show sample UI elements
- Color palette display

**Step 127:** Add font customization (optional)
- Font family selection
- Font size options
- Preview fonts

**Step 128:** Create white-label experience
- No "Banking Reconciliation System" branding for tenants
- Tenant name in all places
- Customizable app title

**Step 129:** Test tenant branding
- Upload logo and verify display
- Change colors and verify application
- Test multiple tenants with different branding
- Verify theme persistence

**Step 130:** Optimize theme performance
- Lazy load theme assets
- Cache theme settings
- Minimize repaints

---

### **Sub-Phase 4J: Testing & Polish (Steps 131-140)**

**Step 131:** Create E2E tests with Playwright
- Test authentication flow
- Test creating reconciliation
- Test matching workflow
- Test manual operations

**Step 132:** Add unit tests for components
- Test critical components
- Test form validation
- Test API service functions
- Test utility functions

**Step 133:** Add accessibility features
- ARIA labels
- Keyboard navigation
- Screen reader support
- Focus management

**Step 134:** Optimize bundle size
- Code splitting
- Lazy loading for routes
- Tree shaking
- Analyze bundle size

**Step 135:** Add loading skeletons
- Skeleton screens for data loading
- Smooth transitions
- Better perceived performance

**Step 136:** Implement caching strategy
- Cache API responses
- Invalidate cache on updates
- Cache tenant settings
- Service worker (optional)

**Step 137:** Add error monitoring
- Integrate Sentry (or similar)
- Log frontend errors
- Track user actions
- Performance monitoring

**Step 138:** Create production build configuration
- Environment variables
- API URL configuration
- Build optimizations
- Source maps

**Step 139:** Final integration testing
- Test all workflows end-to-end
- Test with multiple tenants
- Test edge cases
- Load testing (basic)

**Step 140:** Create deployment documentation
- Build instructions
- Environment setup
- Nginx configuration (example)
- Docker setup (optional)

---

## Technology Stack

### Core
- **React 18**: UI library
- **TypeScript 5**: Type safety
- **Vite**: Build tool (fast dev server, optimized builds)
- **React Router v6**: Routing

### UI Components
- **Ant Design 5**: Component library
- **Ant Design Icons**: Icon set
- **Styled Components** or **CSS Modules**: Styling

### State Management
- **Zustand**: Lightweight state management
- **React Query**: Server state management & caching

### API & Data
- **Axios**: HTTP client
- **jwt-decode**: JWT token parsing
- **date-fns**: Date manipulation

### Forms & Validation
- **React Hook Form**: Form management
- **Zod**: Schema validation

### Testing
- **Vitest**: Unit testing
- **Testing Library**: Component testing
- **Playwright**: E2E testing

### Build & Dev
- **ESLint**: Linting
- **Prettier**: Code formatting
- **Husky**: Git hooks

---

## Integration Points with Backend

### Authentication Service (Port 3004)
- POST /auth/register
- POST /auth/login
- GET /auth/profile

### State Manager Service (Port 3002)
- POST /state/reconciliation
- GET /state/reconciliation/:id
- GET /state/reconciliations
- POST /state/transactions/bulk
- GET /state/transactions
- PATCH /state/transactions/:id/status

### Match Orchestrator (Port 3005)
- POST /orchestrate/start
- GET /orchestrate/progress/:reconciliationId

### Data Prep Service (Port 3001)
- POST /data-prep/analyze-multi-bank-files

### Question Manager Service
- GET /questions/pending/:reconciliationId
- POST /questions/answer

### Learning Service
- GET /learning/entity-profiles/:reconciliationId
- POST /learning/feedback

### MT Services (MT-01 through MT-16)
- POST /match/exact (MT-01)
- POST /match/fuzzy (MT-02)
- ... etc

---

## Success Criteria

### Functional
- ✅ Users can register and create tenant
- ✅ Users can login with JWT authentication
- ✅ Users can create reconciliations with multi-bank support
- ✅ Users can upload files and see column mapping
- ✅ Users can start matching process
- ✅ Users can review match results
- ✅ Users can accept/reject matches
- ✅ Users can perform manual matching
- ✅ Users can answer deferred questions
- ✅ Tenant admin can manage users
- ✅ Tenant admin can customize branding

### Non-Functional
- ✅ Tenant isolation (all API calls include tenantId via JWT)
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Accessibility (WCAG 2.1 AA compliance)
- ✅ Performance (< 3s initial load, < 100ms interactions)
- ✅ Security (JWT validation, XSS protection, CSRF protection)
- ✅ Error handling (graceful failures, user-friendly messages)

---

## File Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   └── ...
│   │   ├── auth/
│   │   │   ├── LoginForm/
│   │   │   ├── RegisterForm/
│   │   │   └── ProtectedRoute/
│   │   ├── reconciliation/
│   │   │   ├── ReconciliationWizard/
│   │   │   ├── ReconciliationDetail/
│   │   │   ├── MatchesList/
│   │   │   └── ...
│   │   ├── tenant/
│   │   │   ├── TenantSettings/
│   │   │   ├── BrandingEditor/
│   │   │   └── ...
│   │   └── layout/
│   │       ├── Header/
│   │       ├── Sidebar/
│   │       ├── Footer/
│   │       └── ...
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── reconciliation/
│   │   │   ├── NewReconciliationPage.tsx
│   │   │   ├── ReconciliationDetailPage.tsx
│   │   │   └── ReconciliationHistoryPage.tsx
│   │   ├── tenant/
│   │   │   └── TenantSettingsPage.tsx
│   │   └── admin/
│   │       └── UserManagementPage.tsx
│   ├── services/
│   │   ├── api.ts                      # Axios instance
│   │   ├── authService.ts
│   │   ├── reconciliationService.ts
│   │   ├── tenantService.ts
│   │   └── ...
│   ├── store/
│   │   ├── authStore.ts                # Zustand store
│   │   ├── tenantStore.ts
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTenant.ts
│   │   ├── useReconciliation.ts
│   │   └── ...
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── reconciliation.types.ts
│   │   ├── transaction.types.ts
│   │   └── ...
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── validators.ts
│   │   └── ...
│   ├── styles/
│   │   ├── globals.css
│   │   ├── theme.css
│   │   └── ...
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env.development
├── .env.production
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Next Steps

Starting with Step 51: Create React application with TypeScript + Vite
