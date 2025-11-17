# DOCUMENT 2: FRONTEND UI/UX DESIGN (REACT) - PART 1

## Complete User Interface Specification for SaaS Platform

**Version:** 1.0  
**Date:** November 16, 2025  
**Status:** Ready for Implementation  
**Technology:** React 18+ with TypeScript + Ant Design  
**Implementation Time:** 4-6 weeks  

---

## 📋 **OVERVIEW**

This document provides complete specifications for building the frontend React application.

**Total Screens:** 15+  
**Components:** 30+ reusable  
**User Flows:** 5 major workflows  

---

## 🎨 **TECHNOLOGY STACK**

```json
{
  "core": {
    "react": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  },
  "ui": {
    "antd": "^5.12.0",
    "@ant-design/icons": "^5.2.6"
  },
  "state": {
    "@reduxjs/toolkit": "^2.0.0",
    "@tanstack/react-query": "^5.0.0"
  },
  "routing": {
    "react-router-dom": "^6.20.0"
  },
  "forms": {
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0"
  },
  "charts": {
    "recharts": "^2.10.0"
  },
  "upload": {
    "react-dropzone": "^14.2.3"
  }
}
```

---

## 📱 **SCREEN LIST (15 Screens)**

1. Login (`/login`)
2. Registration (`/register`)
3. Dashboard (`/dashboard`)
4. Multi-Bank Upload (`/reconciliation/new`)
5. Column Mapping (`/reconciliation/mapping`)
6. Date Range Selection (`/reconciliation/date-range`)
7. Transaction Review (`/reconciliation/:id/review`)
8. Match Approval (`/reconciliation/:id/matches/:matchId`)
9. Unmatched Pool (`/reconciliation/:id/unmatched`)
10. Learning Questions (`/questions`)
11. Entity Profiles (`/profiles`)
12. Reports & Analytics (`/reports`)
13. Settings (`/settings`)
14. User Management (`/users`)
15. Help & Documentation (`/help`)

---

## 🎨 **DESIGN SYSTEM**

### Colors
```typescript
export const colors = {
  primary: '#1890FF',
  success: '#52C41A',
  warning: '#FAAD14',
  error: '#FF4D4F',
  neutral: {
    50: '#FAFAFA',
    500: '#8C8C8C',
    900: '#000000',
  },
};
```

### Typography
```typescript
export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
  },
};
```

---

## 📐 **KEY SCREENS (Detailed)**

### Screen 1: Login
- Email/password form
- Remember me checkbox
- Forgot password link
- SSO buttons (Google, Microsoft)
- Registration link

### Screen 2: Registration (Multi-Step)
- Step 1: Company Info
- Step 2: User Details
- Step 3: Email Verification

### Screen 3: Dashboard
- Statistics cards (4 cards)
- Recent reconciliations table
- Usage quotas (progress bars)
- Convergence trend chart
- Quick actions

### Screen 4-6: Upload Flow
- Multi-bank file upload
- Column mapping wizard (per file)
- Date range selector (optional)

### Screen 7-9: Review Flow
- Transaction list with filters
- Match approval interface
- Alternative matches selector
- Unmatched pool management

### Screen 10-11: Learning
- Pending questions queue
- Entity profile viewer
- Pattern insights

### Screen 12-15: Management
- Reports generation
- Settings management
- User administration
- Help documentation

---

## 🔄 **USER FLOWS**

### Flow 1: Onboarding (New User)
1. Visit website
2. Click "Sign Up"
3. Enter company info
4. Enter user details
5. Verify email
6. Login
7. Tour dashboard

### Flow 2: Upload & Reconciliation
1. Click "New Reconciliation"
2. Upload 1-3 bank files
3. Upload ledger file
4. Review files
5. Map columns (per file)
6. Select date range (optional)
7. Start processing
8. View progress

### Flow 3: Review & Approval
1. View match list
2. Filter by confidence
3. Review match details
4. Approve/reject/override
5. Handle alternatives
6. Manual match unmatched
7. Commit changes

### Flow 4: Learning Questions
1. View pending questions
2. Sort by priority
3. Read question context
4. Provide answer
5. System learns
6. Continue reviewing

### Flow 5: Generate Reports
1. Go to Reports
2. Select date range
3. Choose format (PDF/Excel)
4. Apply filters
5. Preview report
6. Download

---

## 🧩 **COMPONENT LIBRARY (30+ Components)**

### Layout Components
- `<MainLayout>` - App shell with sidebar
- `<PageHeader>` - Page title + actions
- `<Sidebar>` - Navigation menu

### Form Components
- `<FormInput>` - Text input with validation
- `<FormSelect>` - Dropdown selector
- `<FormDatePicker>` - Date selector
- `<FormUpload>` - File upload with drag-drop

### Data Display
- `<DataTable>` - Sortable/filterable table
- `<StatCard>` - Statistic display card
- `<ProgressBar>` - Usage/progress indicator
- `<Chart>` - Recharts wrapper

### Transaction Components
- `<TransactionList>` - Transaction table
- `<TransactionDetails>` - Single transaction view
- `<MatchCard>` - Match candidate card
- `<ConfidenceScore>` - Visual confidence indicator

### Feedback Components
- `<SuccessMessage>` - Success notification
- `<ErrorMessage>` - Error notification
- `<LoadingSpinner>` - Loading indicator
- `<EmptyState>` - No data state

---

## 🔌 **API INTEGRATION**

### Setup
```typescript
// src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### API Modules
```typescript
// src/api/reconciliation.ts
export const reconciliationApi = {
  getAll: () => apiClient.get('/reconciliations'),
  getOne: (id: string) => apiClient.get(`/reconciliations/${id}`),
  create: (data: any) => apiClient.post('/reconciliations', data),
  update: (id: string, data: any) => apiClient.put(`/reconciliations/${id}`, data),
  delete: (id: string) => apiClient.delete(`/reconciliations/${id}`),
};
```

---

## 📦 **STATE MANAGEMENT**

### Redux Slices
```typescript
// src/store/slices/auth.slice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const response = await authApi.login(email, password);
    return response.data;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});
```

---

## 📱 **RESPONSIVE DESIGN**

### Breakpoints
```typescript
export const breakpoints = {
  xs: '480px',   // Mobile
  sm: '576px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '992px',   // Desktop
  xl: '1200px',  // Large desktop
  xxl: '1600px', // Extra large
};
```

### Mobile-First Approach
- Design for mobile first
- Progressive enhancement for larger screens
- Touch-friendly targets (44x44px minimum)
- Responsive typography
- Adaptive layouts

---

## ✅ **IMPLEMENTATION CHECKLIST**

### Week 1: Setup & Core
- [ ] Initialize React + Vite project
- [ ] Install dependencies
- [ ] Setup routing
- [ ] Setup Redux store
- [ ] Setup API client
- [ ] Create design system tokens

### Week 2-3: Authentication & Layout
- [ ] Login screen
- [ ] Registration screen
- [ ] Main layout component
- [ ] Sidebar navigation
- [ ] Protected routes
- [ ] Auth guards

### Week 4-5: Dashboard & Upload
- [ ] Dashboard screen
- [ ] Statistics cards
- [ ] File upload screen
- [ ] Column mapping screen
- [ ] Date range selector

### Week 6-7: Review Flow
- [ ] Transaction review screen
- [ ] Match approval interface
- [ ] Unmatched pool screen
- [ ] Learning questions screen

### Week 8: Polish & Testing
- [ ] Reports screen
- [ ] Settings screen
- [ ] User management
- [ ] E2E testing
- [ ] Performance optimization

---

**END OF PART 1**

**Next:** Part 2 will include complete code for all 15 screens + component library
