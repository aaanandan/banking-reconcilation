# Step 214: Tenant Onboarding Flow

**Status**: ✅ Completed
**Date**: 2025-11-18
**Component**: Auth Service - Onboarding Module

## Overview

This step implements a comprehensive tenant onboarding system to guide new users through the initial setup process, ensuring they successfully adopt the platform. The onboarding flow includes:

- Multi-step guided workflow with progress tracking
- Trial period management (14-day default)
- Company information collection
- Bank account setup guidance
- First transaction and reconciliation walkthrough
- Team invitation prompts
- Plan selection and payment setup
- Detailed checklist with actionable items
- Personalized recommendations
- Onboarding analytics for optimization

## Implementation Summary

### 1. Files Created

#### Onboarding DTOs (`apps/auth-service/src/dto/onboarding.dto.ts`)

**Enums**:
- `OnboardingStepEnum`: 10 onboarding steps (welcome → complete)
- `OnboardingStatusEnum`: Step statuses (not_started, in_progress, completed, skipped)

**Core DTOs**:

1. **StartOnboardingDto**: Initialize onboarding for new tenant
   - `tenantId`, `referralSource`, `interests`, `companySize`, `industry`

2. **OnboardingProgressDto**: Complete progress overview
   - Overall progress percentage (0-100)
   - Completed vs. total steps
   - Current step
   - Array of all steps with statuses
   - Start and completion timestamps

3. **CompleteStepDto**: Mark step as complete
   - `step`, optional `metadata`

4. **SkipStepDto**: Skip optional step
   - `step`, optional `reason`

5. **CompanyInfoDto**: Company information
   - `companyName`, `companySize`, `industry`, `website`, `address`, etc.

6. **TrialStatusDto**: Trial period information
   - `isOnTrial`, `trialStartDate`, `trialEndDate`, `daysRemaining`
   - `trialExtended`, `conversionStatus`

7. **OnboardingChecklistDto**: Detailed checklist
   - Organized by categories
   - Items with completion status
   - Progress per category
   - Action URLs and labels

8. **OnboardingRecommendationDto**: Personalized suggestions
   - Prioritized recommendations (high/medium/low)
   - Action items based on progress
   - Suggested next steps
   - Estimated time to completion

9. **OnboardingMetricsDto**: Platform-wide metrics (admin)
   - Total, completed, and abandoned onboarding
   - Average completion time
   - Completion and conversion rates
   - Step-level metrics
   - Common drop-off points

10. **OnboardingGuideDto**: Step-by-step guides
    - Title, description, content (HTML/Markdown)
    - Video URL, estimated time
    - Tips and navigation

#### OnboardingChecklist Entity (`libs/shared/src/entities/onboarding-checklist.entity.ts`)

**Key Fields**:
- `tenantId`: Foreign key to tenant
- `userId`: Optional user who initiated onboarding
- `overallProgress`: 0-100 percentage
- `currentStep`: Current onboarding step
- `isComplete`: Completion flag
- `steps`: JSONB column storing step statuses and metadata
- `referralSource`, `interests`, `companySize`, `industry`: Onboarding context
- `trialStartDate`, `trialEndDate`: Trial period tracking
- `trialExtended`, `trialExtensionDays`: Trial extension tracking
- `convertedToPaid`, `convertedAt`: Conversion tracking
- `startedAt`, `completedAt`: Timestamps

**Helper Methods**:
- `isStepComplete(step)`: Check if step is completed
- `getCompletedStepsCount()`: Count completed steps
- `calculateProgress()`: Auto-calculate progress percentage
- `getTrialDaysRemaining()`: Calculate remaining trial days

#### OnboardingService (`apps/auth-service/src/onboarding.service.ts`)

**Core Methods**:

1. **startOnboarding(dto)**: Initialize onboarding
   - Creates OnboardingChecklist record
   - Sets up trial period (14 days default)
   - Initializes all steps as NOT_STARTED
   - Marks welcome step as in progress
   - Returns initial progress

2. **getProgress(tenantId)**: Get current progress
   - Retrieves onboarding record
   - Maps steps to DTOs with metadata
   - Calculates completion statistics
   - Returns comprehensive progress overview

3. **completeStep(tenantId, dto)**: Mark step complete
   - Updates step status to COMPLETED
   - Records completion timestamp and metadata
   - Advances to next incomplete step
   - Recalculates overall progress
   - Marks onboarding complete if all steps done

4. **skipStep(tenantId, dto)**: Skip optional step
   - Updates step status to SKIPPED
   - Records skip reason
   - Advances to next step
   - Updates progress (skipped ≠ completed)

5. **updateCompanyInfo(tenantId, dto)**: Update company details
   - Updates Tenant entity with company information
   - Automatically completes COMPANY_INFO step
   - Stores metadata

6. **getTrialStatus(tenantId)**: Get trial information
   - Calculates days remaining
   - Determines conversion status
   - Returns trial extension history

7. **extendTrial(dto)**: Extend trial period (admin)
   - Validates tenant is on trial
   - Extends trial end date
   - Tracks extension history
   - Logs extension reason

8. **markAsConverted(tenantId)**: Mark as paid
   - Sets convertedToPaid flag
   - Records conversion timestamp
   - Used when tenant subscribes

9. **getChecklist(tenantId)**: Get detailed checklist
   - Organizes items by categories:
     - Getting Started (welcome, account setup, company info)
     - Set Up Your Banking (bank account, transactions, reconciliation)
     - Invite Your Team (user invitations)
     - Choose Your Plan (plan selection, payment method)
   - Calculates progress per category
   - Provides action URLs and labels

10. **getGuide(step)**: Get step-specific guide
    - Returns detailed instructions
    - Includes tips and best practices
    - Links to video tutorials
    - Navigation to previous/next steps

11. **getRecommendations(tenantId)**: Personalized suggestions
    - Analyzes current progress
    - Checks trial status and expiration
    - Identifies incomplete required steps
    - Suggests next actions with priorities
    - Estimates time to completion

12. **getMetrics()**: Platform-wide analytics (admin)
    - Aggregates all onboarding records
    - Calculates completion rates
    - Identifies common drop-off points
    - Measures average completion time
    - Tracks trial-to-paid conversion rate

13. **resetOnboarding(dto)**: Reset onboarding (admin)
    - Full reset or keep progress option
    - Used for testing or special cases

**Helper Methods**:
- `initializeSteps()`: Create initial step structure
- `mapStepsToDto()`: Transform entity to DTO
- `getNextStep()`: Determine next step in sequence
- `getSuggestedNextStep()`: Recommend next action
- `isAbandoned()`: Check if onboarding is abandoned (7+ days inactive)

#### OnboardingController (`apps/auth-service/src/onboarding.controller.ts`)

**Endpoints**:

| Method | Endpoint | Description | Response Type |
|--------|----------|-------------|---------------|
| POST | `/onboarding/start` | Start onboarding for new tenant | OnboardingProgressDto |
| GET | `/onboarding/progress/:tenantId` | Get current progress | OnboardingProgressDto |
| POST | `/onboarding/complete-step/:tenantId` | Complete a step | OnboardingProgressDto |
| POST | `/onboarding/skip-step/:tenantId` | Skip a step | OnboardingProgressDto |
| PUT | `/onboarding/company-info/:tenantId` | Update company info | Success message |
| GET | `/onboarding/checklist/:tenantId` | Get detailed checklist | OnboardingChecklistDto |
| GET | `/onboarding/guide/:step` | Get step guide | OnboardingGuideDto |
| GET | `/onboarding/recommendations/:tenantId` | Get recommendations | OnboardingRecommendationDto |
| GET | `/onboarding/trial/status/:tenantId` | Get trial status | TrialStatusDto |
| POST | `/onboarding/trial/extend` | Extend trial (admin) | TrialStatusDto |
| POST | `/onboarding/convert/:tenantId` | Mark as converted | 204 No Content |
| GET | `/onboarding/metrics` | Get metrics (admin) | OnboardingMetricsDto |
| POST | `/onboarding/reset` | Reset onboarding (admin) | Success message |

**Security**:
- Rate limiting via `@UseGuards(ThrottlerGuard)`
- Bearer token authentication (`@ApiBearerAuth`)
- Tenant isolation (all operations scoped to tenantId)

### 2. Onboarding Steps

The onboarding flow consists of 10 steps:

1. **WELCOME**: Introduction and platform overview
2. **ACCOUNT_SETUP**: Configure account settings and preferences
3. **COMPANY_INFO**: Provide company details
4. **BANK_ACCOUNT_SETUP**: Connect first bank account
5. **USER_INVITATION**: Invite team members (optional)
6. **FIRST_TRANSACTION**: Upload first transaction file
7. **FIRST_RECONCILIATION**: Complete first reconciliation
8. **PLAN_SELECTION**: Choose subscription plan
9. **PAYMENT_METHOD**: Add payment information
10. **COMPLETE**: Onboarding finished

### 3. Module Integration

**`apps/auth-service/src/auth.module.ts`** - Added:
- Import: `OnboardingService`, `OnboardingController`, `OnboardingChecklist` entity
- TypeORM: `OnboardingChecklist` added to forFeature
- Controller: `OnboardingController`
- Provider: `OnboardingService`
- Export: `OnboardingService` (for use by other modules)

**`libs/shared/src/entities/index.ts`** - Added:
- Export: `OnboardingChecklist` entity

## Usage Examples

### 1. Start Onboarding (Registration)

```bash
curl -X POST http://localhost:3001/onboarding/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "tenantId": "tenant_abc123",
    "referralSource": "google_ads",
    "interests": ["transaction_matching", "automation"],
    "companySize": "10-50",
    "industry": "Accounting"
  }'
```

**Response**:
```json
{
  "tenantId": "tenant_abc123",
  "overallProgress": 10,
  "completedSteps": 1,
  "totalSteps": 9,
  "currentStep": "account_setup",
  "steps": [
    {
      "step": "welcome",
      "status": "completed",
      "title": "Welcome",
      "description": "Get started with the platform",
      "order": 1,
      "completedAt": "2025-11-18T10:00:00Z",
      "isOptional": false,
      "actionUrl": "/onboarding/welcome",
      "actionLabel": "Start"
    },
    {
      "step": "account_setup",
      "status": "in_progress",
      "title": "Account Setup",
      "description": "Configure your account settings",
      "order": 2,
      "isOptional": false,
      "actionUrl": "/settings/account",
      "actionLabel": "Set Up"
    }
    // ... other steps
  ],
  "isComplete": false,
  "startedAt": "2025-11-18T10:00:00Z"
}
```

### 2. Get Current Progress

```bash
curl http://localhost:3001/onboarding/progress/tenant_abc123 \
  -H "Authorization: Bearer <token>"
```

### 3. Complete a Step

```bash
curl -X POST http://localhost:3001/onboarding/complete-step/tenant_abc123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "step": "account_setup",
    "metadata": {
      "timezone": "America/New_York",
      "notifications_enabled": true
    }
  }'
```

### 4. Update Company Information

```bash
curl -X PUT http://localhost:3001/onboarding/company-info/tenant_abc123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "companyName": "Acme Corp",
    "companySize": "10-50",
    "industry": "Accounting",
    "website": "https://acme.com",
    "country": "United States"
  }'
```

### 5. Get Detailed Checklist

```bash
curl http://localhost:3001/onboarding/checklist/tenant_abc123 \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "tenantId": "tenant_abc123",
  "categories": [
    {
      "name": "Getting Started",
      "progress": 66,
      "items": [
        {
          "id": "welcome",
          "category": "Getting Started",
          "title": "Welcome to the Platform",
          "description": "Complete the welcome tour",
          "isComplete": true,
          "isRequired": true,
          "actionUrl": "/onboarding/welcome",
          "actionLabel": "Start Tour",
          "completedAt": "2025-11-18T10:00:00Z",
          "order": 1
        },
        {
          "id": "account_setup",
          "category": "Getting Started",
          "title": "Set Up Your Account",
          "description": "Configure your account settings",
          "isComplete": true,
          "isRequired": true,
          "completedAt": "2025-11-18T10:05:00Z",
          "order": 2
        },
        {
          "id": "company_info",
          "category": "Getting Started",
          "title": "Add Company Information",
          "description": "Tell us about your company",
          "isComplete": false,
          "isRequired": true,
          "actionUrl": "/settings/company",
          "actionLabel": "Add Info",
          "order": 3
        }
      ]
    },
    {
      "name": "Set Up Your Banking",
      "progress": 0,
      "items": [
        // Bank setup items
      ]
    }
  ],
  "overallProgress": 33,
  "totalItems": 9,
  "completedItems": 3
}
```

### 6. Get Personalized Recommendations

```bash
curl http://localhost:3001/onboarding/recommendations/tenant_abc123 \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "tenantId": "tenant_abc123",
  "recommendations": [
    {
      "type": "upgrade",
      "priority": "high",
      "title": "Trial Ending Soon - 2 Days Left",
      "description": "Upgrade to a paid plan to continue using all features",
      "actionUrl": "/billing/plans",
      "actionLabel": "Upgrade Now"
    },
    {
      "type": "action",
      "priority": "high",
      "title": "Connect Your Bank Account",
      "description": "You need to connect a bank account to start reconciling transactions",
      "actionUrl": "/bank-accounts/add",
      "actionLabel": "Add Bank Account"
    },
    {
      "type": "tip",
      "priority": "low",
      "title": "Collaborate with Your Team",
      "description": "Invite team members to work together on reconciliations",
      "actionUrl": "/settings/team",
      "actionLabel": "Invite Team"
    }
  ],
  "suggestedNextStep": "bank_account_setup",
  "estimatedTimeToComplete": 30
}
```

### 7. Get Trial Status

```bash
curl http://localhost:3001/onboarding/trial/status/tenant_abc123 \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "tenantId": "tenant_abc123",
  "isOnTrial": true,
  "trialStartDate": "2025-11-01T00:00:00Z",
  "trialEndDate": "2025-11-15T23:59:59Z",
  "daysRemaining": 2,
  "trialExtended": false,
  "conversionStatus": "not_converted"
}
```

### 8. Extend Trial (Admin)

```bash
curl -X POST http://localhost:3001/onboarding/trial/extend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "tenantId": "tenant_abc123",
    "extensionDays": 7,
    "reason": "Customer requested more time to evaluate features"
  }'
```

### 9. Get Onboarding Metrics (Admin)

```bash
curl http://localhost:3001/onboarding/metrics \
  -H "Authorization: Bearer <admin_token>"
```

**Response**:
```json
{
  "totalOnboarding": 1000,
  "completedOnboarding": 650,
  "abandonedOnboarding": 200,
  "averageCompletionTime": 4.5,
  "completionRate": 65,
  "conversionRate": 45,
  "stepCompletionRates": [
    {
      "step": "welcome",
      "completionRate": 98,
      "averageTimeToComplete": 5
    },
    {
      "step": "bank_account_setup",
      "completionRate": 72,
      "averageTimeToComplete": 15
    }
    // ... other steps
  ],
  "commonDropOffPoints": [
    {
      "step": "bank_account_setup",
      "dropOffRate": 28
    },
    {
      "step": "first_reconciliation",
      "dropOffRate": 25
    },
    {
      "step": "payment_method",
      "dropOffRate": 22
    }
  ]
}
```

## Frontend Integration

### 1. Onboarding Progress Widget

```typescript
// React/Angular component example
import React, { useEffect, useState } from 'react';

const OnboardingProgress = ({ tenantId }: { tenantId: string }) => {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/onboarding/progress/${tenantId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setProgress);
  }, [tenantId]);

  if (!progress) return <div>Loading...</div>;

  return (
    <div className="onboarding-progress">
      <h2>Get Started</h2>
      <ProgressBar value={progress.overallProgress} max={100} />
      <p>{progress.completedSteps} of {progress.totalSteps} steps completed</p>

      <div className="current-step">
        <h3>Next: {progress.currentStepTitle}</h3>
        <button onClick={() => navigateTo(progress.currentStepUrl)}>
          Continue
        </button>
      </div>
    </div>
  );
};
```

### 2. Interactive Checklist

```typescript
const OnboardingChecklist = ({ tenantId }: { tenantId: string }) => {
  const [checklist, setChecklist] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/onboarding/checklist/${tenantId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setChecklist);
  }, [tenantId]);

  const completeStep = async (step) => {
    await fetch(`${API_URL}/onboarding/complete-step/${tenantId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ step })
    });
    // Refresh checklist
    fetchChecklist();
  };

  return (
    <div className="checklist">
      {checklist?.categories.map(category => (
        <div key={category.name} className="category">
          <h3>{category.name}</h3>
          <ProgressBar value={category.progress} />
          {category.items.map(item => (
            <div key={item.id} className="checklist-item">
              <Checkbox checked={item.isComplete} disabled />
              <div>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
              {!item.isComplete && (
                <button onClick={() => navigateTo(item.actionUrl)}>
                  {item.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
```

### 3. Trial Countdown

```typescript
const TrialCountdown = ({ tenantId }: { tenantId: string }) => {
  const [trialStatus, setTrialStatus] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/onboarding/trial/status/${tenantId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setTrialStatus);
  }, [tenantId]);

  if (!trialStatus?.isOnTrial) return null;

  const urgency = trialStatus.daysRemaining <= 3 ? 'urgent' : 'normal';

  return (
    <div className={`trial-banner ${urgency}`}>
      <p>
        {trialStatus.daysRemaining} days left in your trial
      </p>
      <button onClick={() => navigateTo('/billing/plans')}>
        Upgrade Now
      </button>
    </div>
  );
};
```

### 4. Onboarding Wizard

```typescript
const OnboardingWizard = ({ tenantId }: { tenantId: string }) => {
  const [currentStep, setCurrentStep] = useState(null);
  const [progress, setProgress] = useState(null);

  const goToStep = (step) => {
    // Navigate to step-specific page
    // Complete previous step if moving forward
    if (shouldCompleteCurrentStep()) {
      completeStep(currentStep).then(() => {
        setCurrentStep(step);
      });
    } else {
      setCurrentStep(step);
    }
  };

  return (
    <div className="wizard">
      <WizardSteps steps={progress.steps} currentStep={currentStep} />
      <WizardContent step={currentStep} />
      <WizardNavigation
        onPrevious={() => goToStep(getPreviousStep())}
        onNext={() => goToStep(getNextStep())}
        onSkip={() => skipStep(currentStep)}
      />
    </div>
  );
};
```

### 5. Recommendations Panel

```typescript
const RecommendationsPanel = ({ tenantId }: { tenantId: string }) => {
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/onboarding/recommendations/${tenantId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setRecommendations);
  }, [tenantId]);

  return (
    <div className="recommendations">
      <h3>Recommended for You</h3>
      {recommendations?.recommendations.map((rec, idx) => (
        <div key={idx} className={`recommendation ${rec.priority}`}>
          <div className="icon">{getIcon(rec.type)}</div>
          <div>
            <h4>{rec.title}</h4>
            <p>{rec.description}</p>
          </div>
          {rec.actionUrl && (
            <button onClick={() => navigateTo(rec.actionUrl)}>
              {rec.actionLabel}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
```

## Automation & Workflows

### 1. Auto-Complete Steps

```typescript
// In relevant services, automatically complete steps
@Injectable()
export class BankAccountService {
  constructor(private onboardingService: OnboardingService) {}

  async addBankAccount(tenantId: string, dto: AddBankAccountDto) {
    // Add bank account logic
    const bankAccount = await this.createBankAccount(dto);

    // Auto-complete onboarding step
    try {
      await this.onboardingService.completeStep(tenantId, {
        step: OnboardingStepEnum.BANK_ACCOUNT_SETUP,
        metadata: { bankAccountId: bankAccount.id }
      });
    } catch (error) {
      // Log but don't fail the main operation
      this.logger.warn(`Failed to complete onboarding step: ${error.message}`);
    }

    return bankAccount;
  }
}
```

### 2. Trial Expiration Job

```typescript
// Scheduled job to handle trial expirations
@Injectable()
export class TrialExpirationService {
  constructor(
    private onboardingService: OnboardingService,
    private emailService: EmailService,
  ) {}

  @Cron('0 0 * * *') // Daily at midnight
  async checkTrialExpirations() {
    const onboardings = await this.onboardingService.findAllOnTrial();

    for (const onboarding of onboardings) {
      const trialStatus = await this.onboardingService.getTrialStatus(onboarding.tenantId);

      // Send reminder emails
      if (trialStatus.daysRemaining === 3) {
        await this.emailService.sendTrialExpiringEmail(onboarding.tenantId, 3);
      } else if (trialStatus.daysRemaining === 1) {
        await this.emailService.sendTrialExpiringEmail(onboarding.tenantId, 1);
      } else if (trialStatus.daysRemaining === 0) {
        await this.emailService.sendTrialExpiredEmail(onboarding.tenantId);
        // Optionally downgrade to free plan or suspend account
      }
    }
  }
}
```

### 3. Onboarding Abandonment Follow-up

```typescript
@Injectable()
export class OnboardingFollowUpService {
  @Cron('0 */6 * * *') // Every 6 hours
  async sendFollowUpEmails() {
    const metrics = await this.onboardingService.getMetrics();

    // Find abandoned onboardings
    const abandoned = await this.findAbandonedOnboardings();

    for (const onboarding of abandoned) {
      const daysSinceUpdate = this.calculateDaysSinceUpdate(onboarding);
      const progress = await this.onboardingService.getProgress(onboarding.tenantId);

      // Send appropriate follow-up based on progress
      if (daysSinceUpdate === 1 && progress.completedSteps < 3) {
        await this.emailService.sendEarlyAbandonmentEmail(onboarding.tenantId);
      } else if (daysSinceUpdate === 3 && !progress.isComplete) {
        await this.emailService.sendMidOnboardingReminderEmail(onboarding.tenantId);
      } else if (daysSinceUpdate === 7) {
        await this.emailService.sendFinalOnboardingReminderEmail(onboarding.tenantId);
      }
    }
  }
}
```

## Testing

### Unit Tests

```typescript
describe('OnboardingService', () => {
  it('should start onboarding with 14-day trial', async () => {
    const result = await service.startOnboarding({
      tenantId: 'tenant_123',
      referralSource: 'google',
    });

    expect(result.overallProgress).toBe(10); // Welcome step completed
    expect(result.currentStep).toBe(OnboardingStepEnum.ACCOUNT_SETUP);

    const trialStatus = await service.getTrialStatus('tenant_123');
    expect(trialStatus.isOnTrial).toBe(true);
    expect(trialStatus.daysRemaining).toBe(14);
  });

  it('should complete steps and advance to next', async () => {
    await service.completeStep('tenant_123', {
      step: OnboardingStepEnum.ACCOUNT_SETUP,
    });

    const progress = await service.getProgress('tenant_123');
    expect(progress.completedSteps).toBe(2);
    expect(progress.currentStep).toBe(OnboardingStepEnum.COMPANY_INFO);
  });

  it('should calculate overall progress correctly', async () => {
    // Complete half the steps
    const steps = Object.values(OnboardingStepEnum).slice(0, 5);
    for (const step of steps) {
      await service.completeStep('tenant_123', { step });
    }

    const progress = await service.getProgress('tenant_123');
    expect(progress.overallProgress).toBeGreaterThanOrEqual(50);
  });

  it('should extend trial period', async () => {
    await service.extendTrial({
      tenantId: 'tenant_123',
      extensionDays: 7,
      reason: 'Customer request',
    });

    const trialStatus = await service.getTrialStatus('tenant_123');
    expect(trialStatus.trialExtended).toBe(true);
    expect(trialStatus.daysRemaining).toBe(21); // 14 + 7
  });
});
```

### Integration Tests

```typescript
describe('OnboardingController (e2e)', () => {
  it('/onboarding/start (POST)', () => {
    return request(app.getHttpServer())
      .post('/onboarding/start')
      .send({ tenantId: 'tenant_123', referralSource: 'google' })
      .expect(201)
      .expect((res) => {
        expect(res.body.tenantId).toBe('tenant_123');
        expect(res.body.overallProgress).toBeGreaterThan(0);
      });
  });

  it('/onboarding/checklist/:tenantId (GET)', () => {
    return request(app.getHttpServer())
      .get('/onboarding/checklist/tenant_123')
      .expect(200)
      .expect((res) => {
        expect(res.body.categories).toBeDefined();
        expect(res.body.categories.length).toBeGreaterThan(0);
      });
  });
});
```

## Production Considerations

### 1. Email Notifications

Integrate with email service to send:
- Welcome emails on onboarding start
- Step completion congratulations
- Trial expiration reminders (7 days, 3 days, 1 day, expired)
- Onboarding abandonment follow-ups
- Conversion confirmation

### 2. Analytics Integration

Track onboarding events:
```typescript
// Track with external analytics
await this.analyticsService.trackEvent({
  eventType: 'onboarding_step_completed',
  eventCategory: 'onboarding',
  tenantId,
  metadata: { step, completionTime },
});
```

### 3. A/B Testing

Test different onboarding flows:
- Step order variations
- Optional vs. required steps
- Trial period length (7, 14, 30 days)
- Different guides and messaging

### 4. Personalization

Customize onboarding based on:
- Company size (solo vs. enterprise)
- Industry (accounting, retail, etc.)
- Referral source
- Selected interests

### 5. Multi-Language Support

Translate onboarding content:
- Step titles and descriptions
- Guide content
- Email templates
- Error messages

### 6. Mobile Experience

Optimize for mobile:
- Responsive design
- Touch-friendly interactions
- Progressive disclosure
- Simplified checklist view

## Metrics to Track

1. **Completion Rate**: % of users who complete onboarding
2. **Abandonment Rate**: % of users who stop mid-onboarding
3. **Time to Complete**: Average hours from start to finish
4. **Step Drop-off**: Which steps have highest abandonment
5. **Conversion Rate**: % of trials that convert to paid
6. **Feature Adoption**: Which features are used post-onboarding
7. **Support Tickets**: Onboarding-related support volume
8. **NPS Score**: Satisfaction with onboarding process

## Future Enhancements

1. **Interactive Product Tours**: Guided tours with tooltips and highlights
2. **Video Walkthroughs**: Embedded video tutorials per step
3. **Gamification**: Badges and rewards for completion
4. **Social Proof**: "X users completed this step today"
5. **Live Chat Integration**: Help during onboarding
6. **Smart Scheduling**: Suggest best time to complete steps
7. **Team Onboarding**: Separate flows for admins vs. users
8. **Industry Templates**: Pre-configured setups by industry
9. **Import Wizard**: Bulk import existing data
10. **Certification**: Certificate of completion

## Related Steps

- **Step 211**: Tenant Management (quota limits affect onboarding)
- **Step 212**: Billing Integration (trial-to-paid conversion)
- **Step 213**: Analytics (onboarding metrics tracking)
- **Step 215**: Feature Flags (progressive feature rollout)

---

**Implementation Date**: 2025-11-18
**Implemented By**: Claude (AI Assistant)
**Reviewed By**: Pending
**Status**: ✅ Complete - Ready for Testing
