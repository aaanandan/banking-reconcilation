# Step 137: Layout Components

## Overview

Step 137 creates the main application layout components that provide the structural framework for all protected routes. This includes a responsive sidebar with navigation, a header with user controls, and a content area wrapper.

## Files Created

### 1. src/components/Layout/layoutConfig.ts (180 lines)

Layout configuration with menu items, settings, and helper functions.

**Menu Configuration:**
- 4 menu groups: Main, Learning, Management, Support
- 10 menu items total with icons and paths
- Role-based access control for sensitive routes

**MENU_ITEMS:**
```typescript
Main Group:
- Dashboard (/dashboard)
- Reconciliations (/reconciliations)
  - New Reconciliation (/reconciliation/new)

Learning Group:
- Learning Questions (/questions)
- Entity Profiles (/profiles)

Management Group:
- Reports & Analytics (/reports)
- Settings (/settings) - Admin/Manager only
- User Management (/users) - Admin only

Support Group:
- Help & Documentation (/help)
```

**LAYOUT_CONFIG:**
- Sidebar width: 256px (expanded), 80px (collapsed)
- Header height: 64px
- Content padding: 24px
- Breakpoint: lg (992px)
- Default theme: light

**Helper Functions:**
- `filterMenuByRole()` - Filter menu items by user role
- `convertToAntdMenuItems()` - Convert to Ant Design Menu format
- `getSelectedKeyFromPath()` - Get active menu key from URL
- `getMenuItemByKey()` - Find menu item by key

### 2. src/components/Layout/Header.tsx (180 lines)

Top navigation bar with logo, breadcrumbs, notifications, and user menu.

**Features:**
- Sidebar toggle button (MenuFoldOutlined/MenuUnfoldOutlined)
- Logo and brand name (BankOutlined icon + "Banking Reconciliation")
- Breadcrumbs (generated from current route)
- Notifications dropdown:
  * Badge with count
  * Recent notifications list
  * "View all" link
- User menu dropdown:
  * User avatar with initials
  * Display name and role
  * My Profile option
  * Settings option
  * Sign Out option

**Props:**
```typescript
interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}
```

**Layout:**
- Fixed/sticky positioning at top
- White background with bottom border
- Left: Toggle + Logo + Breadcrumbs
- Right: Notifications + User Menu

### 3. src/components/Layout/Sidebar.tsx (140 lines)

Navigation sidebar with collapsible menu.

**Features:**
- Collapsible sidebar (256px ↔ 80px)
- Dark theme menu
- Icon-based navigation
- Role-filtered menu items
- Auto-selected current route
- Nested menu items (Reconciliations submenu)
- Group labels (when expanded)
- Responsive breakpoint handling

**Props:**
```typescript
interface SidebarProps {
  collapsed: boolean;
}
```

**Icon Mapping:**
- Dashboard: DashboardOutlined
- Reconciliations: ReconciliationOutlined
- New: PlusOutlined
- Questions: QuestionCircleOutlined
- Profiles: TeamOutlined
- Reports: BarChartOutlined
- Settings: SettingOutlined
- Users: UserOutlined
- Help: BookOutlined

**Menu Structure:**
- Fixed position (left: 0)
- Full height (100vh)
- Scrollable overflow
- Group dividers
- Group labels (hidden when collapsed)

### 4. src/components/Layout/MainLayout.tsx (55 lines)

Main layout wrapper component.

**Features:**
- Combines Sidebar + Header + Content
- Manages collapsed state
- Responsive margin adjustment
- Full viewport height
- Gray background for content area

**Props:**
```typescript
interface MainLayoutProps {
  children: React.ReactNode;
}
```

**Structure:**
```
Layout (full height)
├── Sidebar (fixed left, full height)
└── Layout (with margin-left)
    ├── Header (sticky top)
    └── Content (scrollable, gray background)
        └── {children}
```

### 5. src/components/Layout/index.ts

Barrel exports for all layout components and utilities.

## Integration Example

```typescript
// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/Layout';
import { ProtectedRoute } from './routes';
import { Dashboard } from './components/Dashboard';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes without layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes with layout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  {/* Other routes */}
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
```

## Workflow

### Layout Rendering:

1. **User accesses protected route**
   - Example: `/dashboard`

2. **ProtectedRoute checks authentication**
   - If not authenticated: Redirect to login
   - If authenticated: Continue

3. **MainLayout renders**
   - State: `collapsed = false`
   - Render Sidebar with `collapsed={false}`
   - Render Header with `collapsed={false}` and `onToggle={handleToggle}`
   - Render Content with children (Dashboard component)

4. **Sidebar menu**
   - Get user from storage
   - Filter menu items by user role
   - Convert to Ant Design menu format
   - Get selected key from `/dashboard` → `'dashboard'`
   - Highlight Dashboard menu item

5. **Header breadcrumbs**
   - Generate breadcrumbs from `/dashboard`
   - Result: `[{title: 'Home', path: '/dashboard'}]`
   - Render Breadcrumb component

### Sidebar Toggle:

1. **User clicks toggle button in header**
   - Triggers `onToggle()` callback

2. **MainLayout updates state**
   - `setCollapsed(!collapsed)`
   - New state: `collapsed = true`

3. **Sidebar collapses**
   - Width: 256px → 80px
   - Hide group labels
   - Hide menu item text
   - Show icons only

4. **Content area adjusts**
   - Margin-left: 256px → 80px
   - Smooth transition (0.2s)

### Menu Navigation:

1. **User clicks menu item**
   - Example: Click "Reports & Analytics"

2. **Menu onClick handler**
   - Find menu item by key: `'reports'`
   - Get path: `/reports`
   - Navigate to `/reports`

3. **URL updates**
   - Browser URL: `/reports`

4. **Menu selection updates**
   - `getSelectedKeyFromPath('/reports')` → `'reports'`
   - Highlight Reports menu item

5. **Breadcrumbs update**
   - `generateBreadcrumbs('/reports')` → `[{title: 'Home', path: '/dashboard'}, {title: 'Reports & Analytics'}]`
   - Render updated breadcrumbs

## Key Features

✅ **Responsive Layout**
   - Collapsible sidebar (256px ↔ 80px)
   - Mobile-friendly breakpoints
   - Smooth transitions

✅ **Navigation Menu**
   - 10 menu items organized in 4 groups
   - Icon-based navigation
   - Auto-selected current route
   - Nested menu items
   - Role-based filtering

✅ **Header Controls**
   - Sidebar toggle
   - Logo and branding
   - Breadcrumb navigation
   - Notifications with badge
   - User menu with avatar

✅ **User Menu**
   - User avatar with initials
   - Display name and role
   - Profile link
   - Settings link
   - Sign out

✅ **Breadcrumbs**
   - Auto-generated from route
   - Clickable navigation
   - Context-aware

✅ **Role-Based Menu**
   - Admin-only: User Management
   - Admin/Manager: Settings
   - All users: Other items

✅ **Fixed Positioning**
   - Sidebar: Fixed left
   - Header: Sticky top
   - Content: Scrollable

✅ **Theming**
   - Dark sidebar
   - Light header
   - Gray content background

## Business Logic

### Menu Filtering by Role:
```
1. Get current user role (e.g., 'user')
2. For each menu group:
   - For each menu item:
     - If no requiresRole: Include
     - If requiresRole and user.role in requiresRole: Include
     - Otherwise: Exclude
3. Remove empty groups
4. Return filtered menu
```

Example:
- User role: 'user'
- Settings (requires: ['admin', 'manager']) → Excluded
- Users (requires: ['admin']) → Excluded
- Dashboard (no requirement) → Included

### Menu Selection:
```
1. Get current pathname (e.g., '/reconciliation/123/review')
2. Parse pathname: ['reconciliation', '123', 'review']
3. Match to menu key:
   - /dashboard → 'dashboard'
   - /reconciliation/* → 'reconciliations'
   - /reconciliation/new → 'new-reconciliation'
   - /questions → 'questions'
   - etc.
4. Return menu key
```

### Sidebar Collapse:
```
Initial: collapsed = false, width = 256px
Toggle: collapsed = true, width = 80px
Toggle: collapsed = false, width = 256px

Content margin follows sidebar width with 0.2s transition
```

## Component Hierarchy

```
MainLayout
├── Sidebar (fixed left)
│   └── Menu
│       ├── Main Group
│       │   ├── Dashboard
│       │   └── Reconciliations
│       │       └── New Reconciliation
│       ├── Learning Group
│       │   ├── Learning Questions
│       │   └── Entity Profiles
│       ├── Management Group
│       │   ├── Reports & Analytics
│       │   ├── Settings (admin/manager)
│       │   └── User Management (admin)
│       └── Support Group
│           └── Help & Documentation
└── Layout (with margin)
    ├── Header (sticky)
    │   ├── Left
    │   │   ├── Toggle Button
    │   │   ├── Logo
    │   │   └── Breadcrumbs
    │   └── Right
    │       ├── Notifications
    │       └── User Menu
    └── Content
        └── {children}
```

## Styling

**Sidebar:**
- Background: Ant Design dark theme
- Width: 256px (expanded), 80px (collapsed)
- Position: Fixed left
- Height: 100vh

**Header:**
- Background: White (#fff)
- Height: 64px
- Border-bottom: 1px solid #f0f0f0
- Position: Sticky top
- Z-index: 10

**Content:**
- Background: Gray (#f0f2f5)
- Padding: 24px
- Min-height: calc(100vh - 64px)

## Implementation Notes

1. **React Router Integration**: Uses useNavigate and useLocation
2. **User Context**: Gets user from localStorage (getStoredUser)
3. **Dynamic Icons**: Icon mapping for menu items
4. **Responsive**: Breakpoint handling at lg (992px)
5. **State Management**: Local state for collapsed sidebar
6. **Transitions**: Smooth 0.2s transitions for width/margin

## Next Steps

After Step 137, the application has:
- Complete layout structure
- Navigation menu with role-based filtering
- Header with user controls
- Responsive sidebar

This layout wraps all protected routes and provides consistent navigation throughout the application.

---

Step 137 implements complete layout components with responsive sidebar, header, and content area.

**Files:** 5 files, ~560 lines
**Progress:** Step 137/280 (48.9%)
**Next:** Step 138+ - API Integration, Testing, Finalization
