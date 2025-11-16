# ENHANCED LEARNING SERVICE - SEMANTIC INTELLIGENCE LAYER

## Complete Specification: Pattern Learning + Entity Understanding + Convergence Tracking + State Persistence

---

## 🎯 OVERVIEW

The Enhanced Learning Service operates on **FOUR dimensions**:

### 1️⃣ **Pattern Learning** (Original - Already Covered)
- Field effectiveness tracking
- Weight adjustments per entity
- Threshold tuning

### 2️⃣ **Entity Understanding** (NEW)
```
Who is this payer?
├─ Identity (legal name, aliases, relationships)
├─ Business Patterns (typical amounts, frequency)
├─ Timing Behavior (when they pay, consistency)
└─ Seasonal Patterns (quarterly spikes, etc.)
```

### 3️⃣ **Convergence Intelligence** (NEW)
```
What helps reconciliation succeed?
├─ Step Performance Tracking
├─ Bottleneck Identification
├─ Success Path Analysis
└─ Recommendation Generation
```

### 4️⃣ **Question Management** (NEW)
```
Collect knowledge from user:
├─ Immediate Questions (ask now)
├─ Step-End Questions (ask after step)
├─ Session-End Questions (ask after reconciliation)
└─ Deferred Questions (user answers anytime later)
```

### 5️⃣ **State Persistence** (NEW)
```
Save & Resume:
├─ Complete state snapshots
├─ Resume from any point
├─ Auto-save during reconciliation
└─ State history tracking
```

---

## 📊 TYPESCRIPT DTOS

### Entity Profile DTOs

```typescript
// libs/shared/src/dto/entity-profile.dto.ts

export class EntityIdentityDto {
  primaryName: string;                    // "ABC Corp"
  aliases: string[];                      // ["ABC Corporation", "ABC Co."]
  legalName?: string;                     // "ABC Corporation Inc."
  
  // Relationships
  relatedEntities: string[];              // ["ABC Asia", "ABC Europe"]
  parentCompany?: string;
  subsidiaries: string[];
  
  // Context
  industry?: string;
  location?: string;
  taxId?: string;                         // Encrypted
  userNotes?: string;
  tags: string[];                         // ["vendor", "high-priority"]
}

export class EntityBusinessPatternDto {
  // Amount patterns
  typicalAmountRange: {
    min: number;
    max: number;
    median: number;
    mode: number;                         // Most common
  };
  
  // Frequency
  frequency: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'irregular';
    expectedCount: number;
    actualCount: number;
    consistency: number;                  // 0.0 to 1.0
  };
  
  // Timing
  timing: {
    preferredDayOfMonth?: number;         // e.g., 15th
    preferredDayOfWeek?: string;          // e.g., "Friday"
    bankLeadTime: number;                 // Days before/after ledger
    consistency: number;
  };
  
  // Seasonality
  seasonality?: {
    hasPattern: boolean;
    peakMonths: number[];                 // [3, 6, 9, 12] = Quarterly
    lowMonths: number[];
    explanation?: string;
  };
  
  // Value patterns
  valuePatterns: {
    hasFixedAmount: boolean;              // Always $1,000?
    hasIncremental: boolean;              // $1K, $2K, $3K...?
    hasPercentagePattern: boolean;
    explanation?: string;
  };
}

export class EntityReconciliationBehaviorDto {
  totalTransactions: number;
  successfulMatches: number;
  manualInterventions: number;
  
  mostReliableField: string;              // Which field works best
  fieldReliabilityScores: Record<string, number>;
  
  commonExceptions: string[];             // ["date_offset_-2"]
  userOverrideRate: number;
  userPreferencePatterns: string[];
}

export class EntityProfileDto {
  entityId: string;
  identity: EntityIdentityDto;
  businessPattern: EntityBusinessPatternDto;
  reconciliationBehavior: EntityReconciliationBehaviorDto;
  
  confidence: number;                     // Profile confidence
  lastUpdated: Date;
  transactionCount: number;
  
  pendingQuestions: string[];             // Question IDs
  answeredQuestions: string[];
}
```

### Question Management DTOs

```typescript
// libs/shared/src/dto/learning-questions.dto.ts

export enum QuestionType {
  ENTITY_IDENTITY = 'entity_identity',
  ENTITY_RELATIONSHIP = 'entity_relationship',
  BUSINESS_PATTERN = 'business_pattern',
  VALUE_PATTERN = 'value_pattern',
  TIMING_PATTERN = 'timing_pattern',
  FIELD_PREFERENCE = 'field_preference',
  EXCEPTION_REASON = 'exception_reason',
  GENERAL_CONTEXT = 'general_context',
}

export enum QuestionPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum QuestionTiming {
  IMMEDIATE = 'immediate',               // Ask now (blocking)
  STEP_END = 'step_end',                 // Ask at step completion
  SESSION_END = 'session_end',           // Ask at reconciliation end
  DEFERRED = 'deferred',                 // User answers anytime
}

export class LearningQuestionDto {
  questionId: string;
  type: QuestionType;
  priority: QuestionPriority;
  timing: QuestionTiming;
  
  question: string;
  context: string;                        // Why we're asking
  suggestedAnswers?: string[];            // Multiple choice
  answerType: 'text' | 'choice' | 'boolean' | 'number';
  
  // Context
  relatedEntityId?: string;
  relatedTransactionIds: number[];
  relatedReconciliationId?: string;
  triggeredBy: string;
  
  // Metadata
  createdAt: Date;
  expiresAt?: Date;
  answeredAt?: Date;
  answer?: any;
  
  // Display
  helpText?: string;
  exampleAnswer?: string;
}

export class QuestionQueueDto {
  reconciliationId: string;
  
  immediate: LearningQuestionDto[];
  stepEnd: LearningQuestionDto[];
  sessionEnd: LearningQuestionDto[];
  deferred: LearningQuestionDto[];
  
  totalPending: number;
  criticalCount: number;
  highPriorityCount: number;
}
```

### Convergence Tracking DTOs

```typescript
// libs/shared/src/dto/convergence-tracking.dto.ts

export class StepConvergenceMetricsDto {
  stepName: string;
  
  candidatesFound: number;
  candidatesMatched: number;
  successRate: number;
  
  contributionScore: number;              // 0.0 to 1.0
  isBottleneck: boolean;
  
  userApprovalsWithoutEdit: number;
  userOverrides: number;
  userRejects: number;
  
  avgTimeSpent: number;                   // Seconds
  
  fieldsThatHelped: string[];
  fieldsThatDidntHelp: string[];
}

export class ReconciliationConvergenceDto {
  reconciliationId: string;
  
  totalTransactions: number;
  matchedCount: number;
  unmatchedCount: number;
  manualCount: number;
  convergenceRate: number;
  
  stepMetrics: StepConvergenceMetricsDto[];
  
  mostEffectiveSteps: string[];
  leastEffectiveSteps: string[];
  bottleneckSteps: string[];
  
  userInterventionRate: number;
  avgTimePerTransaction: number;
  
  recommendations: string[];
}

export class HistoricalConvergenceDto {
  reconciliationHistory: {
    date: Date;
    convergenceRate: number;
    userInterventionRate: number;
    avgTimePerTransaction: number;
  }[];
  
  improvementRate: number;
  projectedFuturePerformance: {
    expectedConvergenceRate: number;
    expectedUserInterventionRate: number;
    confidenceLevel: number;
  };
  
  anomalies: {
    date: Date;
    type: string;
    description: string;
    possibleCauses: string[];
  }[];
}
```

### State Persistence DTOs

```typescript
// libs/shared/src/dto/reconciliation-state.dto.ts

export class ReconciliationStateDto {
  reconciliationId: string;
  userId: string;
  
  bankFileMetadata: {
    filename: string;
    uploadedAt: Date;
    totalRecords: number;
    columnMapping: Record<string, string>;
  };
  ledgerFileMetadata: {
    filename: string;
    uploadedAt: Date;
    totalRecords: number;
    columnMapping: Record<string, string>;
  };
  fieldProfile: FieldProfileDto;
  
  currentStep: string;
  completedSteps: string[];
  
  transactions: {
    bank: TransactionDto[];
    ledger: TransactionDto[];
  };
  matches: {
    committed: MatchCandidateDto[];
    staged: MatchCandidateDto[];
    rejected: { bankId: number; reason: string }[];
  };
  
  entityProfiles: EntityProfileDto[];
  pendingQuestions: LearningQuestionDto[];
  answeredQuestions: LearningQuestionDto[];
  
  convergenceMetrics: ReconciliationConvergenceDto;
  
  thresholds: MatchThresholdsDto;
  userPreferences: Record<string, any>;
  
  createdAt: Date;
  lastUpdatedAt: Date;
  status: 'in_progress' | 'paused' | 'completed';
  
  resumePoint: {
    step: string;
    transactionIndex: number;
    instructions: string;
  };
}
```

---

## 🔧 TYPESCRIPT SERVICES

### Entity Profile Service

```typescript
// apps/learning-service/src/modules/entity-profiling/entity-profile.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class EntityProfileService {
  async buildEntityProfile(
    entityName: string,
    transactions: TransactionDto[],
    userFeedback: UserFeedbackDto[],
  ): Promise<EntityProfileDto> {
    const identity = await this.consolidateIdentity(entityName, transactions);
    const businessPattern = this.analyzeBusinessPatterns(transactions);
    const reconciliationBehavior = this.analyzeReconciliationBehavior(transactions, userFeedback);
    const confidence = this.calculateProfileConfidence(transactions.length, userFeedback.length);
    
    return {
      entityId: this.generateEntityId(entityName),
      identity,
      businessPattern,
      reconciliationBehavior,
      confidence,
      lastUpdated: new Date(),
      transactionCount: transactions.length,
      pendingQuestions: [],
      answeredQuestions: [],
    };
  }
  
  private async consolidateIdentity(
    entityName: string,
    transactions: TransactionDto[],
  ): Promise<EntityIdentityDto> {
    // Detect all name variations
    const variations = new Set<string>();
    
    for (const txn of transactions) {
      const extracted = this.extractEntityName(txn.description);
      if (extracted && this.isSimilarTo(extracted, entityName, 0.8)) {
        variations.add(extracted);
      }
      
      if (txn.optional?.payerPayee) {
        if (this.isSimilarTo(txn.optional.payerPayee, entityName, 0.8)) {
          variations.add(txn.optional.payerPayee);
        }
      }
    }
    
    return {
      primaryName: entityName,
      aliases: Array.from(variations).filter(v => v !== entityName),
      relatedEntities: [],
      parentCompany: undefined,
      subsidiaries: [],
      tags: [],
    };
  }
  
  private analyzeBusinessPatterns(transactions: TransactionDto[]): EntityBusinessPatternDto {
    const amounts = transactions.map(t => t.amount).sort((a, b) => a - b);
    const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
    
    return {
      typicalAmountRange: {
        min: Math.min(...amounts),
        max: Math.max(...amounts),
        median: this.calculateMedian(amounts),
        mode: this.calculateMode(amounts),
      },
      frequency: this.analyzeFrequency(dates),
      timing: this.analyzeTiming(transactions),
      seasonality: this.detectSeasonality(dates, amounts),
      valuePatterns: this.detectValuePatterns(amounts),
    };
  }
  
  private analyzeFrequency(dates: Date[]): any {
    if (dates.length < 2) {
      return {
        pattern: 'irregular',
        expectedCount: 0,
        actualCount: dates.length,
        consistency: 0,
      };
    }
    
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      const daysDiff = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(daysDiff);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const stdDev = this.calculateStdDev(intervals);
    const consistency = 1 - Math.min(stdDev / avgInterval, 1);
    
    let pattern: any = 'irregular';
    if (avgInterval <= 1.5) pattern = 'daily';
    else if (avgInterval <= 10) pattern = 'weekly';
    else if (avgInterval <= 35) pattern = 'monthly';
    else if (avgInterval <= 100) pattern = 'quarterly';
    else pattern = 'annual';
    
    return { pattern, expectedCount: dates.length, actualCount: dates.length, consistency };
  }
  
  private detectSeasonality(dates: Date[], amounts: number[]): any {
    if (dates.length < 12) {
      return { hasPattern: false, peakMonths: [], lowMonths: [] };
    }
    
    const monthlyData: Record<number, { count: number; totalAmount: number }> = {};
    
    for (let i = 0; i < dates.length; i++) {
      const month = dates[i].getMonth() + 1;
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, totalAmount: 0 };
      }
      monthlyData[month].count++;
      monthlyData[month].totalAmount += amounts[i];
    }
    
    const avgCount = Object.values(monthlyData).reduce((sum, v) => sum + v.count, 0) / 12;
    
    const peakMonths = Object.entries(monthlyData)
      .filter(([_, v]) => v.count > avgCount * 1.5)
      .map(([m, _]) => parseInt(m));
    
    const lowMonths = Object.entries(monthlyData)
      .filter(([_, v]) => v.count < avgCount * 0.5)
      .map(([m, _]) => parseInt(m));
    
    return {
      hasPattern: peakMonths.length > 0 || lowMonths.length > 0,
      peakMonths,
      lowMonths,
      explanation: peakMonths.length > 0 ? 'Seasonal increase detected' : undefined,
    };
  }
  
  private detectValuePatterns(amounts: number[]): any {
    const mode = this.calculateMode(amounts);
    const modeCount = amounts.filter(a => a === mode).length;
    const hasFixedAmount = modeCount / amounts.length > 0.8;
    
    return {
      hasFixedAmount,
      hasIncremental: false,
      hasPercentagePattern: false,
      explanation: hasFixedAmount ? `Always $${mode}` : undefined,
    };
  }
  
  // Helper methods
  private calculateMedian(arr: number[]): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }
  
  private calculateMode<T>(arr: T[]): T {
    const frequency: Map<T, number> = new Map();
    for (const item of arr) {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    }
    let maxFreq = 0;
    let mode: T = arr[0];
    for (const [item, freq] of frequency) {
      if (freq > maxFreq) {
        maxFreq = freq;
        mode = item;
      }
    }
    return mode;
  }
  
  private calculateStdDev(arr: number[]): number {
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    const squaredDiffs = arr.map(v => Math.pow(v - avg, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(variance);
  }
  
  private analyzeTiming(transactions: TransactionDto[]): any {
    const daysOfMonth = transactions.map(t => new Date(t.date).getDate());
    const mode = this.calculateMode(daysOfMonth);
    const consistency = daysOfMonth.filter(d => d === mode).length / daysOfMonth.length;
    
    return {
      preferredDayOfMonth: consistency > 0.5 ? mode : undefined,
      preferredDayOfWeek: undefined,
      bankLeadTime: 0,
      consistency,
    };
  }
  
  private analyzeReconciliationBehavior(txns: TransactionDto[], feedback: UserFeedbackDto[]): EntityReconciliationBehaviorDto {
    return {
      totalTransactions: txns.length,
      successfulMatches: txns.filter(t => t.status === 'committed').length,
      manualInterventions: txns.filter(t => t.status === 'manual').length,
      mostReliableField: 'description',
      fieldReliabilityScores: {},
      commonExceptions: [],
      userOverrideRate: 0,
      userPreferencePatterns: [],
    };
  }
  
  private calculateProfileConfidence(txnCount: number, feedbackCount: number): number {
    const txnScore = Math.min(txnCount / 20, 1.0);
    const feedbackScore = Math.min(feedbackCount / 5, 1.0);
    return txnScore * 0.6 + feedbackScore * 0.4;
  }
  
  private generateEntityId(name: string): string {
    return `entity_${name.toLowerCase().replace(/\s+/g, '_')}`;
  }
  
  private isSimilarTo(str1: string, str2: string, threshold: number): boolean {
    return true; // Placeholder
  }
  
  private extractEntityName(description: string): string | null {
    return null; // Placeholder
  }
}
```

### Question Generator Service

```typescript
// apps/learning-service/src/modules/questions/question-generator.service.ts

@Injectable()
export class QuestionGeneratorService {
  generateEntityIdentityQuestions(
    entityName: string,
    profile: EntityProfileDto,
  ): LearningQuestionDto[] {
    const questions: LearningQuestionDto[] = [];
    
    if (profile.identity.aliases.length > 0) {
      questions.push({
        questionId: this.generateId(),
        type: QuestionType.ENTITY_IDENTITY,
        priority: QuestionPriority.HIGH,
        timing: QuestionTiming.SESSION_END,
        question: `Are "${entityName}" and "${profile.identity.aliases[0]}" the same company?`,
        context: `Confirming helps improve matching accuracy.`,
        suggestedAnswers: ['Yes, same company', 'No, different companies', 'Not sure'],
        answerType: 'choice',
        relatedEntityId: profile.entityId,
        relatedTransactionIds: [],
        triggeredBy: 'alias_detection',
        createdAt: new Date(),
        helpText: 'This helps us recognize all variations of the same payer',
      });
    }
    
    questions.push({
      questionId: this.generateId(),
      type: QuestionType.ENTITY_IDENTITY,
      priority: QuestionPriority.MEDIUM,
      timing: QuestionTiming.DEFERRED,
      question: `What is the full legal name of "${entityName}"?`,
      context: `Helps with accurate record-keeping and compliance.`,
      answerType: 'text',
      relatedEntityId: profile.entityId,
      relatedTransactionIds: [],
      triggeredBy: 'entity_profile_completion',
      createdAt: new Date(),
      exampleAnswer: 'ABC Corporation Inc.',
    });
    
    return questions;
  }
  
  generateBusinessPatternQuestions(
    entityName: string,
    profile: EntityProfileDto,
  ): LearningQuestionDto[] {
    const questions: LearningQuestionDto[] = [];
    
    questions.push({
      questionId: this.generateId(),
      type: QuestionType.BUSINESS_PATTERN,
      priority: QuestionPriority.MEDIUM,
      timing: QuestionTiming.DEFERRED,
      question: `What is the typical/nominal purchase amount for "${entityName}"?`,
      context: `Observed range: $${profile.businessPattern.typicalAmountRange.min} to $${profile.businessPattern.typicalAmountRange.max}. This helps validate unusual amounts.`,
      answerType: 'number',
      relatedEntityId: profile.entityId,
      relatedTransactionIds: [],
      triggeredBy: 'amount_variance_detection',
      createdAt: new Date(),
      helpText: 'Enter the amount you typically pay this vendor',
      exampleAnswer: '1000.00',
    });
    
    questions.push({
      questionId: this.generateId(),
      type: QuestionType.BUSINESS_PATTERN,
      priority: QuestionPriority.MEDIUM,
      timing: QuestionTiming.DEFERRED,
      question: `How often do you typically transact with "${entityName}"?`,
      context: `Detected pattern: ${profile.businessPattern.frequency.pattern}. Confirming helps flag missing transactions.`,
      suggestedAnswers: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'Irregular'],
      answerType: 'choice',
      relatedEntityId: profile.entityId,
      relatedTransactionIds: [],
      triggeredBy: 'frequency_analysis',
      createdAt: new Date(),
    });
    
    if (profile.businessPattern.seasonality?.hasPattern) {
      questions.push({
        questionId: this.generateId(),
        type: QuestionType.BUSINESS_PATTERN,
        priority: QuestionPriority.LOW,
        timing: QuestionTiming.DEFERRED,
        question: `Why do transactions with "${entityName}" peak in months ${profile.businessPattern.seasonality.peakMonths.join(', ')}?`,
        context: `Noticed increased activity during these months.`,
        answerType: 'text',
        relatedEntityId: profile.entityId,
        relatedTransactionIds: [],
        triggeredBy: 'seasonality_detection',
        createdAt: new Date(),
        exampleAnswer: 'Quarterly subscription renewal',
      });
    }
    
    return questions;
  }
  
  private generateId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

This is a massive specification. Would you like me to:
1. Continue with remaining services (Question Manager, Convergence Tracker, State Persistence)?
2. Create UI mockups for question display?
3. Create complete API contracts?
4. Focus on a specific component in more detail?

Let me copy this to outputs first:
