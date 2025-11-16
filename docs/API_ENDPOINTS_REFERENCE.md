# API ENDPOINTS REFERENCE - ALL SERVICES

## Simple Reference for Claude Code Implementation

---

## 📋 FORMAT

Each endpoint includes:
- Method & Path
- Purpose (one line)
- Request structure (key fields only)
- Response structure (key fields only)
- **No detailed implementations** - Claude Code will write these

---

## 🔧 DATA PREP SERVICE (Port: 3001)

### **POST /data-prep/analyze-multi-bank**
**Purpose:** Analyze multiple bank files + ledger, detect date ranges

**Request:**
```typescript
{
  bankFiles: Array<{ file: File, bankName: string }>,
  ledgerFile: File
}
```

**Response:**
```typescript
{
  banks: Array<{
    bankId: string,
    bankName: string,
    columns: string[],
    suggestions: ColumnSuggestion[],
    dateRange: { earliest: string, latest: string },
    totalRecords: number
  }>,
  ledger: {
    columns: string[],
    suggestions: ColumnSuggestion[],
    dateRange: { earliest: string, latest: string },
    totalRecords: number
  },
  dateRangeAnalysis: DateRangeAnalysisDto
}
```

---

### **POST /data-prep/validate-and-prepare**
**Purpose:** Validate column mappings, normalize data, apply optional date filter

**Request:**
```typescript
{
  bankMappings: Array<{
    bankId: string,
    bankName: string,
    file: File,
    columnMapping: Record<string, string>
  }>,
  ledgerMapping: {
    file: File,
    columnMapping: Record<string, string>
  },
  dateRange?: DateRangeDto  // Optional
}
```

**Response:**
```typescript
{
  status: 'ready' | 'error',
  totalTxns: number,
  diagnostics: {
    bankFiles: BankFileMetadataDto[],
    ledgerFile: LedgerFileMetadataDto,
    fieldProfile: FieldProfileDto,
    dateRangeApplied: boolean
  }
}
```

---

## 🗄️ STATE MANAGER SERVICE (Port: 3002)

### **POST /state/reconciliation**
**Purpose:** Create new reconciliation session

**Request:**
```typescript
{
  userId: string,
  bankFiles: BankFileMetadataDto[],
  ledgerFile: LedgerFileMetadataDto,
  dateRange: DateRangeDto,
  fieldProfile: FieldProfileDto
}
```

**Response:**
```typescript
{
  reconciliationId: string
}
```

---

### **GET /state/reconciliation/:id**
**Purpose:** Get complete reconciliation state

**Response:**
```typescript
ReconciliationStateDto
```

---

### **PATCH /state/reconciliation/:id**
**Purpose:** Update reconciliation state (progress, status, etc.)

**Request:**
```typescript
Partial<ReconciliationStateDto>
```

**Response:**
```typescript
{ success: boolean }
```

---

### **POST /state/transactions/bulk**
**Purpose:** Store normalized transactions (bank + ledger)

**Request:**
```typescript
{
  reconciliationId: string,
  transactions: TransactionDto[]
}
```

**Response:**
```typescript
{
  inserted: number,
  transactionIds: number[]
}
```

---

### **GET /state/transactions**
**Purpose:** Query transactions by various filters

**Query Params:**
```
reconciliationId: string (required)
source?: 'bank' | 'ledger'
bankId?: string  // Multi-bank filtering
status?: 'unmatched' | 'staged' | 'committed' | 'manual'
```

**Response:**
```typescript
TransactionDto[]
```

---

### **POST /state/snapshot**
**Purpose:** Save complete state snapshot (for resume)

**Request:**
```typescript
{
  reconciliationId: string
}
```

**Response:**
```typescript
{
  snapshotId: string,
  timestamp: Date
}
```

---

## 🎯 ORCHESTRATOR SERVICE (Port: 3003)

### **POST /orchestrator/start**
**Purpose:** Start reconciliation process

**Request:**
```typescript
{
  reconciliationId: string
}
```

**Response:**
```typescript
{
  status: 'started',
  currentStep: string
}
```

---

### **GET /orchestrator/status/:reconciliationId**
**Purpose:** Get current progress

**Response:**
```typescript
{
  currentStep: string,
  completedSteps: string[],
  progress: number,  // 0-100
  matched: number,
  unmatched: number,
  convergenceRate: number
}
```

---

### **POST /orchestrator/next-step**
**Purpose:** Move to next matching step

**Request:**
```typescript
{
  reconciliationId: string,
  currentStep: string
}
```

**Response:**
```typescript
{
  nextStep: string | null,
  reason: string
}
```

---

## 🔍 MATCHING SERVICES (MT-01 to MT-16) (Ports: 3010-3025)

### **POST /matching/mt-{N}/find-matches**
**Purpose:** Find match candidates for a bank transaction

**Request:**
```typescript
{
  bankTransactionId: number,
  ledgerPool: number[],  // Available ledger transaction IDs
  fieldProfile: FieldProfileDto,
  thresholds: MatchThresholdsDto,
  bankId: string  // Multi-bank support
}
```

**Response:**
```typescript
{
  primary: MatchCandidateDto | null,
  additional: MatchCandidateDto[],
  reason: string
}
```

---

### **Specific MT Services:**

| Service | Port | Purpose |
|---------|------|---------|
| MT-01 | 3010 | Exact match (all fields) |
| MT-02 | 3011 | Near-exact (core + additional) |
| MT-03 | 3012 | Bank fees & charges |
| MT-04 | 3013 | Interest credits |
| MT-05 | 3014 | Split payments |
| MT-06 | 3015 | Consolidated deposits |
| MT-07 | 3016 | Duplicate postings |
| MT-08 | 3017 | Reversals & corrections |
| MT-09 | 3018 | Timing differences |
| MT-10 | 3019 | Currency conversion |
| MT-11 | 3020 | Rounding differences |
| MT-12 | 3021 | High-volume payer |
| MT-13 | 3022 | Standing orders |
| MT-14 | 3023 | Unmatched pool management |
| MT-15 | 3024 | Manual classification |
| MT-16 | 3025 | Final validation |

---

## 📚 LEARNING SERVICE (Port: 3004)

### **POST /learning/feedback**
**Purpose:** Record user feedback (approval, override, rejection)

**Request:**
```typescript
{
  reconciliationId: string,
  transactionId: number,
  feedbackType: 'override' | 'rejection' | 'manual_match',
  originalSuggestion: MatchCandidateDto,
  userChoice: any,
  reason?: string
}
```

**Response:**
```typescript
{ processed: boolean }
```

---

### **GET /learning/entity-profile/:entityName**
**Purpose:** Get entity profile (semantic understanding)

**Response:**
```typescript
EntityProfileDto | null
```

---

### **POST /learning/entity-profile**
**Purpose:** Update entity profile with new transaction data

**Request:**
```typescript
{
  entityName: string,
  transactions: TransactionDto[],
  userFeedback: UserFeedbackDto[]
}
```

**Response:**
```typescript
{
  profile: EntityProfileDto,
  questionsGenerated: number
}
```

---

## ❓ QUESTION MANAGER SERVICE (Port: 3005)

### **POST /questions/generate**
**Purpose:** Generate questions based on reconciliation

**Request:**
```typescript
{
  reconciliationId: string,
  entityProfiles: EntityProfileDto[],
  convergenceMetrics: ConvergenceMetricsDto[]
}
```

**Response:**
```typescript
{
  questionsCreated: number,
  byTiming: {
    immediate: number,
    step_end: number,
    session_end: number,
    deferred: number
  }
}
```

---

### **GET /questions/pending**
**Purpose:** Get pending questions for user

**Query Params:**
```
reconciliationId?: string
timing?: 'immediate' | 'step_end' | 'session_end' | 'deferred'
priority?: 'critical' | 'high' | 'medium' | 'low'
```

**Response:**
```typescript
{
  immediate: LearningQuestionDto[],
  stepEnd: LearningQuestionDto[],
  sessionEnd: LearningQuestionDto[],
  deferred: LearningQuestionDto[]
}
```

---

### **POST /questions/:questionId/answer**
**Purpose:** Record answer to question

**Request:**
```typescript
{
  answer: any  // Type depends on question.answerType
}
```

**Response:**
```typescript
{
  success: boolean,
  profileUpdated: boolean
}
```

---

## 🧮 THRESHOLD CALCULATOR SERVICE (Port: 3006)

### **POST /threshold/calculate**
**Purpose:** Calculate optimal matching thresholds based on field profiles

**Request:**
```typescript
{
  fieldProfile: FieldProfileDto,
  historicalPerformance?: {
    exactMatchRate: number,
    userOverrideRate: number
  }
}
```

**Response:**
```typescript
{
  thresholds: MatchThresholdsDto,
  confidence: number,
  reasoning: string[]
}
```

---

## 🛡️ SAFETY SERVICE (Port: 3007)

### **POST /safety/validate-match**
**Purpose:** Validate match candidate for safety rules

**Request:**
```typescript
{
  bankTransaction: TransactionDto,
  ledgerTransaction: TransactionDto,
  matchCandidate: MatchCandidateDto
}
```

**Response:**
```typescript
{
  safe: boolean,
  warnings: string[],
  blockers: string[]  // Hard blocks (e.g., credit vs debit)
}
```

---

## 📊 CONVERGENCE TRACKER SERVICE (Port: 3008)

### **POST /convergence/track-step**
**Purpose:** Record step performance metrics

**Request:**
```typescript
{
  reconciliationId: string,
  stepName: string,
  candidatesFound: number,
  candidatesMatched: number,
  userApprovals: number,
  userOverrides: number,
  userRejects: number,
  timeSpent: number,
  fieldsUsed: string[]
}
```

**Response:**
```typescript
{
  recorded: boolean
}
```

---

### **GET /convergence/analysis/:reconciliationId**
**Purpose:** Get convergence analysis

**Response:**
```typescript
{
  overallConvergence: number,
  mostEffectiveSteps: string[],
  bottleneckSteps: string[],
  recommendations: string[]
}
```

---

## 🔐 AUTH SERVICE (Port: 3009)

### **POST /auth/register**
**Purpose:** Register new user

**Request:**
```typescript
{
  email: string,
  password: string,
  name: string,
  company?: string
}
```

**Response:**
```typescript
{
  userId: string,
  token: string
}
```

---

### **POST /auth/login**
**Purpose:** User login

**Request:**
```typescript
{
  email: string,
  password: string
}
```

**Response:**
```typescript
{
  userId: string,
  token: string,
  user: { email, name, company, role }
}
```

---

### **GET /auth/me**
**Purpose:** Get current user

**Headers:** `Authorization: Bearer {token}`

**Response:**
```typescript
UserDto
```

---

## 📝 ERROR RESPONSE FORMAT (All Services)

```typescript
{
  statusCode: number,
  message: string,
  error: string,
  details?: any  // Additional error context
}
```

---

## 🎯 SERVICE PORTS SUMMARY

| Service | Port | Purpose |
|---------|------|---------|
| Data Prep | 3001 | File analysis, normalization |
| State Manager | 3002 | Reconciliation state, transactions |
| Orchestrator | 3003 | Step sequencing, coordination |
| Learning | 3004 | Entity profiles, feedback |
| Question Manager | 3005 | Question generation, answers |
| Threshold Calculator | 3006 | Dynamic threshold calculation |
| Safety | 3007 | Match validation |
| Convergence Tracker | 3008 | Performance metrics |
| Auth | 3009 | User authentication |
| MT-01 to MT-16 | 3010-3025 | Matching services |

---

## ✅ USAGE NOTES FOR CLAUDE CODE

1. **Multi-bank awareness:** Most endpoints accept/return `bankId` for multi-bank filtering
2. **Date range is optional:** Default behavior = process all transactions
3. **Primary + Additional:** Matching services return both primary and additional candidates
4. **Error handling:** All services use consistent error format
5. **Async operations:** Long-running operations (matching) may need progress tracking

---

**This is all Claude Code needs to know about APIs!**

Next: Brief MT-03 to MT-16 descriptions
