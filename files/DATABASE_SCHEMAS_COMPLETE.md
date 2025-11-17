# COMPLETE DATABASE SCHEMAS - TYPEORM ENTITIES

## All Entities with Multi-Bank Support & Relationships

---

## 📊 ENTITY RELATIONSHIP DIAGRAM

```
Reconciliation (1) ←→ (N) BankFile
Reconciliation (1) ←→ (1) LedgerFile  
Reconciliation (1) ←→ (N) Transaction
Reconciliation (1) ←→ (N) MatchCandidate
Reconciliation (1) ←→ (N) ConvergenceMetrics

Transaction (1) ←→ (N) MatchCandidate
EntityProfile (1) ←→ (N) LearningQuestion

User (1) ←→ (N) Reconciliation
User (1) ←→ (N) UserFeedback
```

---

## 🗂️ COMPLETE ENTITIES (9 Total)

### **1. Reconciliation Entity** (Parent)

```typescript
// libs/shared/src/entities/reconciliation.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BankFile } from './bank-file.entity';
import { LedgerFile } from './ledger-file.entity';
import { Transaction } from './transaction.entity';
import { MatchCandidate } from './match-candidate.entity';
import { ConvergenceMetrics } from './convergence-metrics.entity';
import { User } from './user.entity';

@Entity('reconciliations')
export class Reconciliation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.reconciliations)
  user: User;

  // ══════════════════════════════════════════════════════════
  // Multi-Bank Support: One-to-Many with BankFile
  // ══════════════════════════════════════════════════════════
  @OneToMany(() => BankFile, bankFile => bankFile.reconciliation, {
    cascade: true,
    eager: true,
  })
  bankFiles: BankFile[];

  @OneToOne(() => LedgerFile, { cascade: true, eager: true })
  @JoinColumn()
  ledgerFile: LedgerFile;

  // ══════════════════════════════════════════════════════════
  // Date Range Configuration (Optional Filtering)
  // ══════════════════════════════════════════════════════════
  @Column({ default: true })
  includeAllDates: boolean;

  @Column({ type: 'date', nullable: true })
  dateRangeFrom: Date;

  @Column({ type: 'date', nullable: true })
  dateRangeTo: Date;

  @Column({ type: 'jsonb', nullable: true })
  dateRangeAnalysis: {
    bankDateRange: {
      earliest: string;
      latest: string;
      totalTransactions: number;
    };
    ledgerDateRange: {
      earliest: string;
      latest: string;
      totalTransactions: number;
    };
    hasDateMismatch: boolean;
  };

  // ══════════════════════════════════════════════════════════
  // Status & Progress
  // ══════════════════════════════════════════════════════════
  @Column({
    type: 'enum',
    enum: ['in_progress', 'paused', 'completed'],
    default: 'in_progress',
  })
  status: string;

  @Column({ nullable: true })
  currentStep: string;

  @Column({ type: 'simple-array', default: '' })
  completedSteps: string[];

  // ══════════════════════════════════════════════════════════
  // Field Profile (stored as JSON)
  // ══════════════════════════════════════════════════════════
  @Column({ type: 'jsonb', nullable: true })
  fieldProfile: {
    banks: Record<string, any>;  // Per-bank profiles
    ledger: any;
    compatibilityAnalysis: any;
  };

  // ══════════════════════════════════════════════════════════
  // Statistics
  // ══════════════════════════════════════════════════════════
  @Column({ default: 0 })
  totalTransactions: number;

  @Column({ default: 0 })
  matchedCount: number;

  @Column({ default: 0 })
  unmatchedCount: number;

  @Column({ default: 0 })
  manualCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  convergenceRate: number;

  // ══════════════════════════════════════════════════════════
  // Relationships
  // ══════════════════════════════════════════════════════════
  @OneToMany(() => Transaction, transaction => transaction.reconciliation)
  transactions: Transaction[];

  @OneToMany(() => MatchCandidate, match => match.reconciliation)
  matchCandidates: MatchCandidate[];

  @OneToMany(() => ConvergenceMetrics, metrics => metrics.reconciliation)
  convergenceMetrics: ConvergenceMetrics[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

### **2. BankFile Entity** (NEW - Multi-Bank Support)

```typescript
// libs/shared/src/entities/bank-file.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Reconciliation } from './reconciliation.entity';

@Entity('bank_files')
export class BankFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bankId: string;  // bank_1, bank_2, bank_3...

  @Column()
  bankName: string;  // "HDFC", "ICICI", "SBI"

  @Column()
  filename: string;

  @Column()
  totalRecords: number;

  @Column({ default: 0 })
  filteredRecords: number;  // After date filter

  @Column({ default: 0 })
  excludedRecords: number;  // Excluded by date filter

  @Column({ type: 'jsonb' })
  columnMapping: Record<string, string>;

  @Column({ type: 'date' })
  earliestDate: Date;

  @Column({ type: 'date' })
  latestDate: Date;

  @ManyToOne(() => Reconciliation, recon => recon.bankFiles, {
    onDelete: 'CASCADE',
  })
  reconciliation: Reconciliation;

  @CreateDateColumn()
  uploadedAt: Date;
}
```

---

### **3. LedgerFile Entity**

```typescript
// libs/shared/src/entities/ledger-file.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('ledger_files')
export class LedgerFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  totalRecords: number;

  @Column({ default: 0 })
  filteredRecords: number;

  @Column({ default: 0 })
  excludedRecords: number;

  @Column({ type: 'jsonb' })
  columnMapping: Record<string, string>;

  @Column({ type: 'date' })
  earliestDate: Date;

  @Column({ type: 'date' })
  latestDate: Date;

  @CreateDateColumn()
  uploadedAt: Date;
}
```

---

### **4. Transaction Entity** (Updated with bankId)

```typescript
// libs/shared/src/entities/transaction.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Reconciliation } from './reconciliation.entity';
import { MatchCandidate } from './match-candidate.entity';

@Entity('transactions')
@Index(['reconciliationId', 'source'])
@Index(['reconciliationId', 'bankId'])
@Index(['reconciliationId', 'status'])
@Index(['date'])
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  source: string;  // 'bank' | 'ledger'

  // ══════════════════════════════════════════════════════════
  // Multi-Bank Support
  // ══════════════════════════════════════════════════════════
  @Column({ nullable: true })
  @Index()
  bankId: string;

  @Column({ nullable: true })
  bankName: string;
  // ══════════════════════════════════════════════════════════

  // Core fields
  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'text' })
  description: string;

  // Optional fields (stored as JSON)
  @Column({ type: 'jsonb', nullable: true })
  optional: {
    txnType?: 'credit' | 'debit';
    refNumber?: string;
    payerPayee?: string;
    currency?: string;
    runningBalance?: number;
    checkNumber?: string;
    category?: string;
  };

  // Additional metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Match status
  @Column({
    type: 'enum',
    enum: ['unmatched', 'staged', 'committed', 'manual'],
    default: 'unmatched',
  })
  status: string;

  @Column({ nullable: true })
  matchedToId: number;

  @Column()
  @Index()
  reconciliationId: string;

  @ManyToOne(() => Reconciliation, recon => recon.transactions, {
    onDelete: 'CASCADE',
  })
  reconciliation: Reconciliation;

  @OneToMany(() => MatchCandidate, match => match.bankTransaction)
  matchCandidates: MatchCandidate[];

  @CreateDateColumn()
  createdAt: Date;
}
```

---

### **5. MatchCandidate Entity**

```typescript
// libs/shared/src/entities/match-candidate.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Reconciliation } from './reconciliation.entity';
import { Transaction } from './transaction.entity';

@Entity('match_candidates')
@Index(['reconciliationId', 'matchType'])
@Index(['reconciliationId', 'stepName'])
export class MatchCandidate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bankTransactionId: number;

  @Column()
  ledgerTransactionId: number;

  @ManyToOne(() => Transaction, txn => txn.matchCandidates)
  bankTransaction: Transaction;

  @ManyToOne(() => Transaction)
  ledgerTransaction: Transaction;

  // ══════════════════════════════════════════════════════════
  // Scores (Primary vs Additional matching)
  // ══════════════════════════════════════════════════════════
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  coreScore: number;  // 0.00 to 1.00

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  additionalScore: number;  // null for primary matches

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  overallScore: number;

  @Column({
    type: 'enum',
    enum: ['primary', 'additional'],
  })
  matchType: string;

  @Column({
    type: 'enum',
    enum: ['high', 'medium', 'low'],
  })
  confidence: string;

  // ══════════════════════════════════════════════════════════
  // Field-level breakdown
  // ══════════════════════════════════════════════════════════
  @Column({ type: 'jsonb' })
  fieldScores: {
    dateScore: number;
    amountScore: number;
    descriptionScore: number;
    refNumberScore?: number;
    payerPayeeScore?: number;
  };

  @Column({ type: 'text', nullable: true })
  matchReason: string;  // Human-readable explanation

  // ══════════════════════════════════════════════════════════
  // User decision tracking
  // ══════════════════════════════════════════════════════════
  @Column({
    type: 'enum',
    enum: ['approved', 'rejected', 'overridden', 'pending'],
    default: 'pending',
  })
  userDecision: string;

  @Column({ nullable: true })
  userSelectedAlternativeId: number;  // If user chose different match

  @Column({ type: 'text', nullable: true })
  userComment: string;

  // ══════════════════════════════════════════════════════════
  // Context
  // ══════════════════════════════════════════════════════════
  @Column()
  stepName: string;  // "MT-01", "MT-02", etc.

  @Column()
  @Index()
  reconciliationId: string;

  @ManyToOne(() => Reconciliation, recon => recon.matchCandidates, {
    onDelete: 'CASCADE',
  })
  reconciliation: Reconciliation;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

### **6. EntityProfile Entity**

```typescript
// libs/shared/src/entities/entity-profile.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { LearningQuestion } from './learning-question.entity';

@Entity('entity_profiles')
@Index(['entityId'], { unique: true })
export class EntityProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  entityId: string;  // Unique identifier for the payer/payee

  // ══════════════════════════════════════════════════════════
  // Identity
  // ══════════════════════════════════════════════════════════
  @Column()
  primaryName: string;

  @Column({ type: 'simple-array', default: '' })
  aliases: string[];

  @Column({ nullable: true })
  legalName: string;

  @Column({ type: 'simple-array', default: '' })
  relatedEntities: string[];

  @Column({ nullable: true })
  parentCompany: string;

  @Column({ type: 'simple-array', default: '' })
  subsidiaries: string[];

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'simple-array', default: '' })
  tags: string[];

  // ══════════════════════════════════════════════════════════
  // Business Patterns
  // ══════════════════════════════════════════════════════════
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  typicalAmountMin: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  typicalAmountMax: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  typicalAmountMedian: number;

  @Column({ nullable: true })
  frequencyPattern: string;  // 'daily', 'weekly', 'monthly', etc.

  @Column({ type: 'int', nullable: true })
  preferredDayOfMonth: number;

  @Column({ type: 'jsonb', nullable: true })
  seasonality: {
    hasPattern: boolean;
    peakMonths: number[];
    lowMonths: number[];
    explanation?: string;
  };

  // ══════════════════════════════════════════════════════════
  // Per-Bank Behavior (Multi-Bank Support)
  // ══════════════════════════════════════════════════════════
  @Column({ type: 'jsonb', nullable: true })
  bankSpecificBehavior: Record<string, {
    dateOffset: number;
    mostReliableField: string;
    refNumberFormat?: string;
  }>;

  // ══════════════════════════════════════════════════════════
  // Reconciliation Statistics
  // ══════════════════════════════════════════════════════════
  @Column({ default: 0 })
  totalTransactions: number;

  @Column({ default: 0 })
  successfulMatches: number;

  @Column({ default: 0 })
  manualInterventions: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  userOverrideRate: number;

  @Column({ nullable: true })
  mostReliableField: string;

  @Column({ type: 'jsonb', nullable: true })
  fieldReliabilityScores: Record<string, number>;

  // ══════════════════════════════════════════════════════════
  // Metadata
  // ══════════════════════════════════════════════════════════
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  confidence: number;

  @OneToMany(() => LearningQuestion, question => question.entityProfile)
  pendingQuestions: LearningQuestion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastUpdated: Date;
}
```

---

### **7. LearningQuestion Entity**

```typescript
// libs/shared/src/entities/learning-question.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { EntityProfile } from './entity-profile.entity';

@Entity('learning_questions')
@Index(['timing', 'priority'])
@Index(['answeredAt'])
export class LearningQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  questionId: string;

  @Column({
    type: 'enum',
    enum: [
      'entity_identity',
      'entity_relationship',
      'business_pattern',
      'value_pattern',
      'timing_pattern',
      'field_preference',
      'exception_reason',
      'general_context',
    ],
  })
  type: string;

  @Column({
    type: 'enum',
    enum: ['critical', 'high', 'medium', 'low'],
  })
  priority: string;

  @Column({
    type: 'enum',
    enum: ['immediate', 'step_end', 'session_end', 'deferred'],
  })
  timing: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text' })
  context: string;

  @Column({ type: 'simple-array', nullable: true })
  suggestedAnswers: string[];

  @Column()
  answerType: string;  // 'text' | 'choice' | 'boolean' | 'number'

  // Context
  @Column({ nullable: true })
  relatedEntityId: string;

  @ManyToOne(() => EntityProfile, profile => profile.pendingQuestions, {
    nullable: true,
  })
  entityProfile: EntityProfile;

  @Column({ type: 'simple-array', default: '' })
  relatedTransactionIds: number[];

  @Column({ nullable: true })
  relatedReconciliationId: string;

  @Column()
  triggeredBy: string;

  // Answer tracking
  @Column({ type: 'jsonb', nullable: true })
  answer: any;

  @Column({ nullable: true })
  answeredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  // Display hints
  @Column({ type: 'text', nullable: true })
  helpText: string;

  @Column({ type: 'text', nullable: true })
  exampleAnswer: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

### **8. ConvergenceMetrics Entity**

```typescript
// libs/shared/src/entities/convergence-metrics.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Reconciliation } from './reconciliation.entity';

@Entity('convergence_metrics')
@Index(['reconciliationId', 'stepName'])
export class ConvergenceMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  reconciliationId: string;

  @ManyToOne(() => Reconciliation, recon => recon.convergenceMetrics, {
    onDelete: 'CASCADE',
  })
  reconciliation: Reconciliation;

  @Column()
  stepName: string;

  // Performance metrics
  @Column({ default: 0 })
  candidatesFound: number;

  @Column({ default: 0 })
  candidatesMatched: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  successRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  contributionScore: number;

  @Column({ default: false })
  isBottleneck: boolean;

  // User interaction metrics
  @Column({ default: 0 })
  userApprovalsWithoutEdit: number;

  @Column({ default: 0 })
  userOverrides: number;

  @Column({ default: 0 })
  userRejects: number;

  @Column({ type: 'int', default: 0 })
  avgTimeSpent: number;  // Seconds

  // Field effectiveness
  @Column({ type: 'simple-array', default: '' })
  fieldsThatHelped: string[];

  @Column({ type: 'simple-array', default: '' })
  fieldsThatDidntHelp: string[];

  @CreateDateColumn()
  createdAt: Date;
}
```

---

### **9. User & UserFeedback Entities**

```typescript
// libs/shared/src/entities/user.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Reconciliation } from './reconciliation.entity';
import { UserFeedback } from './user-feedback.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  company: string;

  @Column({ default: 'user' })
  role: string;  // 'admin' | 'user'

  @OneToMany(() => Reconciliation, recon => recon.user)
  reconciliations: Reconciliation[];

  @OneToMany(() => UserFeedback, feedback => feedback.user)
  feedbacks: UserFeedback[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// libs/shared/src/entities/user-feedback.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_feedback')
export class UserFeedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reconciliationId: string;

  @Column()
  transactionId: number;

  @Column({
    type: 'enum',
    enum: ['override', 'rejection', 'manual_match', 'comment'],
  })
  feedbackType: string;

  @Column({ type: 'jsonb', nullable: true })
  originalSuggestion: any;

  @Column({ type: 'jsonb', nullable: true })
  userChoice: any;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.feedbacks)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## 📝 INDEX SUMMARY

### **Critical Indexes for Performance:**

```typescript
// transactions table
@Index(['reconciliationId', 'source'])
@Index(['reconciliationId', 'bankId'])  // Multi-bank queries
@Index(['reconciliationId', 'status'])
@Index(['date'])

// match_candidates table
@Index(['reconciliationId', 'matchType'])
@Index(['reconciliationId', 'stepName'])

// entity_profiles table
@Index(['entityId'], { unique: true })

// learning_questions table
@Index(['timing', 'priority'])
@Index(['answeredAt'])

// convergence_metrics table
@Index(['reconciliationId', 'stepName'])
```

---

## ✅ USAGE EXAMPLE

```typescript
// Create reconciliation with multiple banks
const reconciliation = new Reconciliation();
reconciliation.userId = userId;
reconciliation.includeAllDates = true;  // Default: no date filtering

// Add multiple bank files
const hdfcBank = new BankFile();
hdfcBank.bankId = 'bank_1';
hdfcBank.bankName = 'HDFC';
hdfcBank.filename = 'hdfc_jan.csv';
// ...

const iciciBank = new BankFile();
iciciBank.bankId = 'bank_2';
iciciBank.bankName = 'ICICI';
// ...

reconciliation.bankFiles = [hdfcBank, iciciBank];

// Add ledger
const ledger = new LedgerFile();
ledger.filename = 'ledger_jan.csv';
// ...

reconciliation.ledgerFile = ledger;

await reconciliationRepo.save(reconciliation);  // Cascades to bank files and ledger
```

---

## ✅ COMPLETE!

**All 9 entities defined with:**
- ✅ TypeORM decorators
- ✅ Multi-bank support
- ✅ Date range support
- ✅ All relationships
- ✅ Performance indexes
- ✅ Proper types

**Claude Code can use these directly!**

Next: API Endpoints Reference
