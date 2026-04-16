# Step 138: API Integration

## Overview

Step 138 creates the API integration layer for connecting the frontend to backend services. This includes a configured axios client with authentication, request/response interceptors, error handling, and feature-specific API modules for all application functionality.

## Files Created

### 1. src/api/types.ts (280 lines)

Common types and interfaces for API requests and responses.

**Common Types:**
- `ApiResponse<T>` - Standard API response wrapper
- `PaginatedResponse<T>` - Paginated list response
- `ApiError` - Standardized error format
- `PaginationParams` - Pagination query parameters
- `FilterParams` - Filtering query parameters

**Feature-Specific Types:**
- Auth: LoginRequest, LoginResponse, RegisterRequest, VerifyEmailRequest
- Reconciliation: ReconciliationListItem, ReconciliationDetail, CreateReconciliationRequest
- Transaction: Transaction, Match
- Learning: LearningQuestion, AnswerQuestionRequest, EntityProfile
- Reports: ReportConfig, Report
- Settings: Settings
- Users: User, InviteUserRequest, UpdateUserRequest

### 2. src/api/apiClient.ts (170 lines)

Axios-based HTTP client with interceptors and utilities.

**Configuration:**
- Base URL: `process.env.REACT_APP_API_URL` or `http://localhost:3000/api`
- Timeout: 30 seconds
- Default headers: `Content-Type: application/json`

**Request Interceptor:**
- Adds `Authorization: Bearer <token>` header
- Adds `X-Tenant-ID` header from stored user
- Automatic token injection for all authenticated requests

**Response Interceptor:**
- Auto-refreshes expired tokens (401 handling)
- Standardizes error responses
- Network error detection
- Automatic redirect to login on auth failure

**Token Refresh Flow:**
```
1. Request returns 401 Unauthorized
2. Check if request hasn't been retried
3. Get refresh token from storage
4. POST /auth/refresh with refresh token
5. Store new access and refresh tokens
6. Retry original request with new token
7. If refresh fails: clear auth data, redirect to /login
```

**Utility Functions:**
- `uploadFile()` - Upload single file with progress tracking
- `uploadFiles()` - Upload multiple files with progress
- `downloadFile()` - Download file with blob handling
- `api` wrapper - Type-safe GET, POST, PUT, PATCH, DELETE methods

### 3. src/api/modules.ts (340 lines)

Feature-specific API endpoints organized by module.

**API Modules:**

**authApi:**
- `login()` - Email/password authentication
- `register()` - Create new account
- `verifyEmail()` - Verify email with code
- `resendVerification()` - Resend verification code
- `forgotPassword()` - Request password reset
- `resetPassword()` - Reset password with token
- `refreshToken()` - Refresh access token
- `logout()` - End session

**reconciliationApi:**
- `list()` - Get all reconciliations with pagination
- `getById()` - Get reconciliation details
- `create()` - Create new reconciliation
- `uploadFiles()` - Upload files for reconciliation
- `startProcessing()` - Start processing
- `delete()` - Delete reconciliation

**transactionApi:**
- `list()` - Get transactions for reconciliation
- `getById()` - Get transaction details
- `getUnmatched()` - Get unmatched transactions

**matchApi:**
- `list()` - Get matches for reconciliation
- `getById()` - Get match details
- `approve()` - Approve match
- `reject()` - Reject match with reason
- `createManual()` - Create manual match
- `getAlternatives()` - Get alternative matches

**learningApi:**
- `getQuestions()` - Get learning questions
- `getQuestionById()` - Get question details
- `answerQuestion()` - Answer learning question
- `skipQuestion()` - Skip question
- `getProfiles()` - Get entity profiles
- `getProfileById()` - Get profile details
- `updateProfile()` - Update entity profile
- `deleteProfile()` - Delete entity profile

**reportsApi:**
- `generate()` - Generate new report
- `list()` - Get all reports
- `getById()` - Get report details
- `download()` - Download report file
- `delete()` - Delete report

**settingsApi:**
- `get()` - Get current settings
- `update()` - Update settings
- `reset()` - Reset to defaults

**usersApi:**
- `list()` - Get all users
- `getById()` - Get user details
- `me()` - Get current user
- `invite()` - Invite new user
- `update()` - Update user
- `delete()` - Delete user
- `resendInvitation()` - Resend invitation

**helpApi:**
- `getArticles()` - Get help articles
- `getArticleById()` - Get article details
- `search()` - Search help articles

**dashboardApi:**
- `getStats()` - Get dashboard statistics
- `getActivity()` - Get recent activity

### 4. src/api/index.ts

Barrel exports for all API functionality.

## Integration Example

**Basic API Call:**
```typescript
import { authApi } from './api';

const handleLogin = async (email: string, password: string) => {
  try {
    const response = await authApi.login({ email, password });
    console.log('User:', response.data.user);
    console.log('Token:', response.data.tokens.accessToken);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

**Using in Component:**
```typescript
import React, { useEffect, useState } from 'react';
import { reconciliationApi, ReconciliationListItem } from './api';

const ReconciliationsList: React.FC = () => {
  const [reconciliations, setReconciliations] = useState<ReconciliationListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReconciliations = async () => {
      setLoading(true);
      try {
        const response = await reconciliationApi.list({ page: 1, pageSize: 10 });
        setReconciliations(response.data.data);
      } catch (error) {
        console.error('Failed to fetch reconciliations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReconciliations();
  }, []);

  return <div>{/* Render reconciliations */}</div>;
};
```

**File Upload with Progress:**
```typescript
import { uploadFiles } from './api';

const handleUpload = async (files: File[]) => {
  try {
    const response = await uploadFiles(
      '/reconciliations/upload',
      files,
      (progress) => {
        console.log(`Upload progress: ${progress}%`);
        setUploadProgress(progress);
      }
    );
    console.log('Upload complete:', response.data);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

**Error Handling:**
```typescript
import { matchApi, ApiError } from './api';

const handleApprove = async (reconciliationId: string, matchId: string) => {
  try {
    await matchApi.approve(reconciliationId, matchId);
    message.success('Match approved successfully');
  } catch (error) {
    const apiError = error as ApiError;
    
    if (apiError.status === 404) {
      message.error('Match not found');
    } else if (apiError.status === 409) {
      message.error('Match already processed');
    } else {
      message.error(apiError.message || 'Failed to approve match');
    }
  }
};
```

## Workflow

### Authenticated Request Flow:

1. **Component makes API call**
   - Example: `reconciliationApi.list()`

2. **Request interceptor runs**
   - Get access token from `getAccessToken()`
   - Add `Authorization: Bearer <token>` header
   - Get user from localStorage
   - Add `X-Tenant-ID: <tenantId>` header

3. **Request sent to backend**
   - Headers: Authorization, X-Tenant-ID, Content-Type
   - URL: `http://localhost:3000/api/reconciliations`

4. **Backend processes request**
   - Validates JWT token
   - Checks tenant ID
   - Returns data or error

5. **Response interceptor runs**
   - If 200 OK: Return response.data
   - If 401 Unauthorized: Attempt token refresh
   - If other error: Create ApiError

6. **Component receives response**
   - Success: `response.data`
   - Error: Catch block with ApiError

### Token Refresh Flow:

1. **Request returns 401**
   - Access token expired

2. **Response interceptor detects 401**
   - Check `originalRequest._retry` flag
   - If not retried: proceed with refresh

3. **Refresh token request**
   - GET refresh token from storage
   - POST `/auth/refresh` with refresh token

4. **Backend validates refresh token**
   - If valid: Return new access and refresh tokens
   - If invalid: Return 401

5. **Store new tokens**
   - Call `storeTokens()` with new tokens
   - Update localStorage/sessionStorage

6. **Retry original request**
   - Update Authorization header with new token
   - Resend original request
   - Set `_retry = true` to prevent infinite loop

7. **If refresh fails**
   - Call `clearAuthData()` to remove all auth data
   - Redirect to `/login`
   - User must re-authenticate

### File Upload Flow:

1. **Component triggers upload**
   - Example: `uploadFiles('/reconciliations/upload', files, onProgress)`

2. **Create FormData**
   - Append each file: `formData.append('file0', file)`

3. **POST with multipart/form-data**
   - Headers: `Content-Type: multipart/form-data`
   - Body: FormData with files

4. **Track upload progress**
   - `onUploadProgress` event fires
   - Calculate percentage: `(loaded / total) * 100`
   - Call `onProgress(percentage)` callback

5. **Backend receives files**
   - Parse multipart data
   - Save files to storage
   - Return file metadata

6. **Component receives response**
   - File IDs, URLs, sizes
   - Update UI with success state

## Key Features

✅ **Axios HTTP Client**
   - Configured with base URL and timeout
   - Custom request/response interceptors
   - Type-safe wrapper methods

✅ **Authentication**
   - Automatic token injection
   - Token refresh on 401
   - Tenant ID header
   - Logout and redirect on auth failure

✅ **Error Handling**
   - Standardized ApiError format
   - Network error detection
   - HTTP status code handling
   - Error message extraction

✅ **File Operations**
   - Single file upload with progress
   - Multiple file upload
   - File download with blob handling
   - FormData construction

✅ **Type Safety**
   - TypeScript interfaces for all requests/responses
   - Generic API response wrapper
   - Paginated response type
   - Feature-specific types

✅ **API Modules**
   - 10 feature modules
   - 60+ API endpoints
   - Consistent naming conventions
   - Pagination and filtering support

✅ **Token Management**
   - Access token storage
   - Refresh token storage
   - Automatic refresh
   - Expiration handling

## Business Logic

### Authentication Flow:
```
Login:
1. POST /auth/login with email and password
2. Backend validates credentials
3. Backend returns user + tokens
4. Frontend stores tokens using storeTokens()
5. Frontend stores user using storeUser()
6. Frontend navigates to /dashboard

Token Refresh:
1. Access token expires (detected by 401 response)
2. Frontend gets refresh token from storage
3. POST /auth/refresh with refresh token
4. Backend validates refresh token
5. Backend returns new access + refresh tokens
6. Frontend stores new tokens
7. Frontend retries original request

Logout:
1. POST /auth/logout
2. Frontend calls clearAuthData()
3. Frontend navigates to /login
```

### Reconciliation Creation Flow:
```
1. Upload files: POST /reconciliations/upload
   - Returns file IDs

2. Create reconciliation: POST /reconciliations
   - Body: { files, columnMappings, dateRange }
   - Returns reconciliation ID

3. Start processing: POST /reconciliations/:id/process
   - Backend begins async processing
   - Returns processing status

4. Poll for status: GET /reconciliations/:id
   - Check status: pending → processing → completed
   - Display progress to user
```

### Error Handling Strategy:
```
Network Error:
- Message: "Network error. Please check your connection."
- Code: NETWORK_ERROR
- Action: Show error message, allow retry

401 Unauthorized:
- Attempt token refresh
- If refresh succeeds: Retry request
- If refresh fails: Redirect to login

403 Forbidden:
- Message: "You don't have permission to perform this action."
- Action: Show error message, navigate to dashboard

404 Not Found:
- Message: "The requested resource was not found."
- Action: Show error message

500 Server Error:
- Message: Backend error message or generic error
- Action: Show error message, log to error tracking
```

## Configuration

### Environment Variables:
```
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_TIMEOUT=30000
```

### Axios Instance:
```typescript
baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
timeout: 30000 // 30 seconds
headers: {
  'Content-Type': 'application/json'
}
```

### Headers:
```
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_id>
Content-Type: application/json (or multipart/form-data for uploads)
```

## Implementation Notes

1. **Interceptor Ordering**: Request interceptors run before request, response interceptors run after response
2. **Token Storage**: Uses localStorage or sessionStorage based on "remember me"
3. **Retry Logic**: Prevents infinite loops with `_retry` flag
4. **Error Extraction**: Extracts message and errors from backend response
5. **Type Safety**: All API methods return typed responses
6. **Pagination**: Consistent pagination params across all list endpoints
7. **Filtering**: Flexible filter params support various query options

## Security Considerations

1. **Token Security**: Tokens stored in localStorage/sessionStorage (consider httpOnly cookies for production)
2. **HTTPS**: Enforce HTTPS in production for encrypted transmission
3. **Token Expiration**: Short-lived access tokens (15-60 min), longer refresh tokens (7-30 days)
4. **Tenant Isolation**: X-Tenant-ID header ensures data isolation
5. **CORS**: Configure backend to allow frontend origin
6. **XSS Protection**: Sanitize all user inputs
7. **CSRF**: Use CSRF tokens for state-changing requests

## Next Steps

After Step 138, the application has:
- Complete API integration layer
- Type-safe API modules
- Authentication with token refresh
- File upload/download utilities

Next steps:
- Integrate API calls into components
- Add loading states and error handling
- Implement optimistic updates
- Add caching with React Query or SWR

---

Step 138 implements complete API integration with authentication, error handling, and feature-specific modules.

**Files:** 4 files, ~790 lines
**Progress:** Step 138/280 (49.3%)
**Next:** Step 139+ - Testing, Final Integration
