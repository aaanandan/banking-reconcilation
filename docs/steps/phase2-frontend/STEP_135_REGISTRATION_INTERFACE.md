# Step 135: Registration Interface

## Overview

Step 135 creates the Registration Interface for new user onboarding. This is a multi-step registration flow that collects company information, user details, and verifies email addresses. The interface provides a smooth, progressive experience with validation at each step.

## Files Created/Modified

### 1. src/utils/authUtils.ts (Updated - added 242 lines)

Extended authentication utilities with registration-specific types and validation.

**Registration Types:**
- `CompanyInfo` - Company name, size, industry, country
- `CompanySize` - Enum: SOLO, SMALL, MEDIUM, LARGE, ENTERPRISE
- `UserDetails` - First name, last name, email, password, confirmPassword, acceptedTerms
- `RegistrationData` - Combined company info + user details
- `VerificationCodeData` - Code + email for verification

**Constants:**
- `COMPANY_SIZE_OPTIONS` - 5 size options with labels and descriptions
- `INDUSTRY_OPTIONS` - 15 industry categories

**Validation Functions:**
- `validateCompanyName()` - Length validation (2-100 chars)
- `validateCompanyInfo()` - Company name, size, country validation
- `validateFirstName()` - Length validation (2-50 chars)
- `validateLastName()` - Length validation (2-50 chars)
- `validatePasswordConfirmation()` - Password match validation
- `validateUserDetails()` - All user fields + terms acceptance
- `validateVerificationCode()` - 6-digit numeric code validation
- `formatVerificationCode()` - Format as XXX-XXX for display

### 2. src/components/Auth/CompanyInfoStep.tsx (155 lines)

First step: Collect company information.

**Features:**
- Company name input with ShopOutlined icon
- Company size dropdown with descriptions
- Industry dropdown (optional, searchable)
- Country dropdown (searchable)
- Real-time validation
- Continue button with ArrowRightOutlined icon

**Fields:**
- Company Name: Required, 2-100 chars
- Company Size: Required, 5 options (Solo → Enterprise)
- Industry: Optional, 15 predefined + Other
- Country: Required, searchable list

**Props:**
```typescript
interface CompanyInfoStepProps {
  initialValues?: Partial<CompanyInfo>;
  onNext: (data: CompanyInfo) => void;
  loading?: boolean;
}
```

### 3. src/components/Auth/UserDetailsStep.tsx (230 lines)

Second step: Collect user personal details and create account.

**Features:**
- First name and last name inputs
- Email address input
- Password input with strength indicator
- Confirm password input
- Real-time password strength checking (0-4 score)
- Progress bar for password strength
- Feedback suggestions for weak passwords
- Terms of Service acceptance checkbox
- Back and Create Account buttons

**Password Strength:**
- Score 0 (Very Weak) - Red
- Score 1 (Weak) - Orange
- Score 2 (Fair) - Yellow
- Score 3 (Good) - Green
- Score 4 (Strong) - Dark Green

**Fields:**
- First Name: Required, 2-50 chars
- Last Name: Required, 2-50 chars
- Email: Required, email format
- Password: Required, min 8 chars
- Confirm Password: Required, must match
- Accept Terms: Required checkbox

**Props:**
```typescript
interface UserDetailsStepProps {
  initialValues?: Partial<UserDetails>;
  onNext: (data: UserDetails) => void;
  onBack: () => void;
  loading?: boolean;
}
```

### 4. src/components/Auth/EmailVerificationStep.tsx (180 lines)

Third step: Verify email with 6-digit code.

**Features:**
- Large verification code input (formatted as XXX-XXX)
- Auto-submit when 6 digits entered
- Info alert about email location
- Error alert for invalid codes
- Resend code with 60-second cooldown
- Email displayed for reference
- Help/support link

**Verification Code:**
- 6 numeric digits
- Formatted as XXX-XXX
- Auto-submits on completion
- Expires in 15 minutes

**Resend Code:**
- 60-second cooldown between resends
- Shows countdown timer
- Disabled during cooldown

**Props:**
```typescript
interface EmailVerificationStepProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResendCode?: () => Promise<void>;
  loading?: boolean;
  error?: string;
}
```

**VerificationSuccess Component:**
- Result component shown after successful verification
- Success status with checkmark
- Email confirmation message
- "Continue to Dashboard" button

### 5. src/components/Auth/Register.tsx (240 lines)

Main registration page orchestrating the multi-step flow.

**Features:**
- Steps progress indicator (1. Company → 2. User → 3. Verify)
- State management for all three steps
- Gradient background (same as Login)
- Logo and title
- Back/forward navigation
- Error handling with user-friendly messages
- Success state after verification
- Login link for existing users
- Terms and Privacy links
- Demo verification code (development)

**Flow Management:**
- Step 1: Company Info → Store data, advance to Step 2
- Step 2: User Details → Call registration API, advance to Step 3
- Step 3: Email Verification → Verify code, show success, store tokens
- Success: Navigate to Dashboard

**Error Handling:**
- 409 (Conflict): Email already exists
- 400: Invalid verification code
- 410: Expired verification code
- Network errors
- Generic fallback errors

**Props:**
```typescript
interface RegisterProps {
  onRegister?: (data: RegistrationData) => Promise<any>;
  onVerifyEmail?: (email: string, code: string) => Promise<any>;
  onResendCode?: (email: string) => Promise<void>;
}
```

### 6. src/components/Auth/index.ts (Updated)

Added exports for all registration components.

## Integration Example

```typescript
import React from 'react';
import { Register } from './components/Auth';
import { RegistrationData } from './utils/authUtils';
import { authApi } from './api/auth';

const RegisterPage: React.FC = () => {
  const handleRegister = async (data: RegistrationData) => {
    // Create account and send verification email
    const response = await authApi.register(data);
    return response.data; // Should trigger email sending
  };

  const handleVerifyEmail = async (email: string, code: string) => {
    // Verify code and return tokens
    const response = await authApi.verifyEmail(email, code);
    return response.data; // { user, tokens }
  };

  const handleResendCode = async (email: string) => {
    // Resend verification email
    await authApi.resendVerificationCode(email);
  };

  return (
    <Register
      onRegister={handleRegister}
      onVerifyEmail={handleVerifyEmail}
      onResendCode={handleResendCode}
    />
  );
};
```

## Workflow

### User Flow:

1. **Step 1: Company Information**
   - Land on registration page
   - See Steps progress indicator (Company highlighted)
   - Enter company name (e.g., "Acme Corporation")
   - Select company size from dropdown (e.g., "2-10 people")
   - Optionally select industry (e.g., "Technology")
   - Select country from searchable dropdown (e.g., "United States")
   - Click "Continue to User Details" button
   - System validates fields
   - If valid: Advance to Step 2

2. **Step 2: User Details**
   - See Steps progress indicator (User highlighted)
   - Enter first name (e.g., "John")
   - Enter last name (e.g., "Doe")
   - Enter email address (e.g., "john.doe@acme.com")
   - Enter password
   - See real-time password strength indicator
   - Review feedback for weak passwords
   - Enter confirm password
   - Check "I accept the Terms of Service" checkbox
   - Click "Create Account" button (or "Back" to return)
   - System validates all fields
   - System calls registration API
   - Backend creates account and sends verification email
   - If successful: Advance to Step 3

3. **Step 3: Email Verification**
   - See Steps progress indicator (Verify highlighted)
   - See message: "We've sent a 6-digit code to john.doe@acme.com"
   - Check email inbox for verification code
   - Enter 6-digit code (formatted as XXX-XXX)
   - System auto-submits when 6 digits entered
   - Backend verifies code
   - If valid: Show success message
   - Click "Continue to Dashboard"
   - Navigate to dashboard

4. **Resend Code (If Needed)**
   - Click "Resend code" link
   - System sends new verification email
   - 60-second cooldown before next resend
   - Countdown timer displayed

5. **Already Have Account**
   - Click "Sign in" link at bottom
   - Navigate to login page

## Key Features

✅ **Multi-Step Flow**
   - 3 progressive steps with visual progress indicator
   - Forward and backward navigation
   - Data persistence between steps
   - Graceful error handling at each step

✅ **Company Info Collection**
   - Company name (2-100 chars)
   - Company size (5 options with descriptions)
   - Industry (optional, 15 categories)
   - Country (searchable dropdown)

✅ **User Account Creation**
   - First and last name (2-50 chars)
   - Email validation
   - Password with strength checking
   - Password confirmation matching
   - Terms of Service acceptance

✅ **Password Strength Indicator**
   - 5-level scoring (0-4)
   - Real-time feedback
   - Color-coded progress bar
   - Specific improvement suggestions
   - Checks length, variety, common patterns

✅ **Email Verification**
   - 6-digit numeric code
   - Formatted display (XXX-XXX)
   - Auto-submit on completion
   - Resend with cooldown
   - 15-minute expiration

✅ **Error Handling**
   - Field-level validation errors
   - Step-level submission errors
   - Email already exists detection
   - Invalid/expired code handling
   - Network error handling

✅ **User Experience**
   - Steps progress visualization
   - Loading states during API calls
   - Disabled buttons during submission
   - Clear error messages
   - Help and support links
   - Terms and Privacy links
   - Login link for existing users

✅ **Responsive Design**
   - Mobile-first layout
   - Breakpoint-aware card sizing
   - Touch-friendly inputs
   - Readable typography
   - Full-screen gradient background

## Business Logic

### Registration Flow:

**Step 1: Company Info**
```
1. User fills form
2. Client validates:
   - Company name: 2-100 chars
   - Company size: selected
   - Country: selected
3. If valid: Store data, advance to Step 2
4. If invalid: Show field errors
```

**Step 2: User Details & Registration**
```
1. User fills form
2. Client validates:
   - First/last name: 2-50 chars
   - Email: format + not already used
   - Password: min 8 chars
   - Confirm: matches password
   - Terms: accepted
3. If valid: Submit to backend
4. Backend:
   - Check email uniqueness
   - Hash password
   - Create tenant record
   - Create user record
   - Generate verification code
   - Send verification email
   - Return success
5. Client: Advance to Step 3
```

**Step 3: Email Verification**
```
1. User receives email with 6-digit code
2. User enters code (formatted as XXX-XXX)
3. Client auto-submits on 6 digits
4. Backend:
   - Check code matches
   - Check code not expired (15 min)
   - Mark email as verified
   - Generate JWT tokens
   - Return user + tokens
5. Client:
   - Store tokens
   - Store user data
   - Show success message
   - Navigate to dashboard
```

### Password Strength Scoring:

```
Base score: 0

+1 if length >= 8
+1 if length >= 12
+1 if has lowercase AND uppercase
+1 if has numbers
+1 if has special chars
-2 if contains common pattern

Score 0: Very Weak (red)
Score 1: Weak (orange)
Score 2: Fair (yellow)
Score 3: Good (green)
Score 4: Strong (dark green)
```

### Verification Code:

- **Format**: 6 numeric digits (000000 to 999999)
- **Display**: XXX-XXX (e.g., 123-456)
- **Expiration**: 15 minutes from generation
- **Resend Cooldown**: 60 seconds between requests
- **Validation**: Exact match, not expired, not already used

## API Integration

### Registration Endpoint:
```typescript
POST /auth/register
Body: {
  companyInfo: {
    companyName: string,
    companySize: string,
    industry?: string,
    country: string
  },
  userDetails: {
    firstName: string,
    lastName: string,
    email: string,
    password: string
  }
}
Response: { message: 'Verification email sent' }
Errors: 409 (email exists), 400 (validation)
```

### Verification Endpoint:
```typescript
POST /auth/verify-email
Body: { email: string, code: string }
Response: { user: User, tokens: AuthTokens }
Errors: 400 (invalid code), 410 (expired), 404 (email not found)
```

### Resend Code Endpoint:
```typescript
POST /auth/resend-verification
Body: { email: string }
Response: { message: 'Verification email sent' }
Errors: 429 (too many requests), 404 (email not found)
```

## Component Architecture

```
Register (Page)
├── Card (Centered Layout)
│   ├── Logo & Title
│   │   └── BankOutlined icon + "Create your account"
│   ├── Steps Progress
│   │   └── 1. Company → 2. User → 3. Verify
│   ├── Step Content (conditional)
│   │   ├── CompanyInfoStep (Step 1)
│   │   │   ├── Company Name Input
│   │   │   ├── Company Size Select
│   │   │   ├── Industry Select (optional)
│   │   │   ├── Country Select
│   │   │   └── Continue Button
│   │   ├── UserDetailsStep (Step 2)
│   │   │   ├── First Name Input
│   │   │   ├── Last Name Input
│   │   │   ├── Email Input
│   │   │   ├── Password Input
│   │   │   ├── Password Strength Indicator
│   │   │   ├── Confirm Password Input
│   │   │   ├── Terms Checkbox
│   │   │   └── Back + Create Account Buttons
│   │   └── EmailVerificationStep (Step 3)
│   │       ├── SafetyOutlined Icon
│   │       ├── Email Display
│   │       ├── Info Alert
│   │       ├── Error Alert (if error)
│   │       ├── Verification Code Input
│   │       ├── Verify Button
│   │       └── Resend Link
│   ├── VerificationSuccess (after success)
│   │   └── Result + Continue Button
│   ├── Login Link
│   │   └── "Already have an account? Sign in"
│   └── Footer Links
│       └── Terms + Privacy
└── Demo Code Card (dev only, step 3)
```

## Security Considerations

1. **Password Security**: Hash with bcrypt/argon2, min 8 chars enforced
2. **Email Verification**: Required before account activation
3. **Verification Code**: 6 digits, 15-min expiration, one-time use
4. **Rate Limiting**: Limit registration and resend attempts
5. **Email Uniqueness**: Check at registration and verification
6. **HTTPS Only**: Enforce in production
7. **CSRF Protection**: Use tokens for state-changing requests
8. **Input Validation**: Client and server-side validation
9. **Terms Acceptance**: Require explicit checkbox acceptance
10. **Audit Logging**: Log all registration attempts

## Next Steps

After Step 135, users can:
- **Complete registration**: Verify email and access dashboard
- **Already registered**: Navigate to login page
- **Need help**: Contact support

---

Step 135 implements a complete Multi-Step Registration Interface with company info collection, user account creation, and email verification.

**Files:** 6 files (5 new + 1 updated), ~1050 lines
**Progress:** Step 135/280 (48.2%)
**Next:** Step 136+ - Testing, Integration, or Additional Features
