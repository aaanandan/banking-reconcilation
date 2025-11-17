# CLAUDE CODE IMPLEMENTATION GUIDE - PHASES 3-8

## Continuation: State Manager, Matching, Orchestrator, Learning Services

---

## PHASE 3: STATE MANAGER SERVICE (Steps 11-15)

### ✅ STEP 11: Create State Manager Service Skeleton

**Task:**
```bash
cd apps
nest generate app state-manager-service
```

**Update main.ts:**
```typescript
// apps/state-manager-service/src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3002);
  console.log('State Manager Service running on http://localhost:3002');
}
bootstrap();
```

**Verification:**
- [ ] Service starts on port 3002
- [ ] No errors

---

### ✅ STEP 12: Setup TypeORM Connection

**Task:** Connect to PostgreSQL database

**Update app.module.ts:**
```typescript
// apps/state-manager-service/src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '@app/shared/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'brs_user',
      password: 'brs_password',
      database: 'banking_reconciliation',
      entities: [Transaction],
      synchronize: true, // Auto-create tables (development only!)
    }),
    TypeOrmModule.forFeature([Transaction]),
  ],
})
export class AppModule {}
```

**Verification:**
- [ ] Service connects to database
- [ ] `transactions` table created automatically
- [ ] No connection errors
- [ ] Check table exists: `psql -h localhost -U brs_user -d banking_reconciliation -c "\dt"`

**Output:** Screenshot showing table created

---

### ✅ STEP 13: Implement Transaction Repository

**Task:** Create service to store/retrieve transactions

```typescript
// apps/state-manager-service/src/transaction-repository.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '@app/shared/entities/transaction.entity';
import { TransactionDto } from '@app/shared';

@Injectable()
export class TransactionRepositoryService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) {}

  /**
   * Store transactions in database
   */
  async storeTransactions(
    transactions: TransactionDto[],
    reconciliationId: string,
  ): Promise<void> {
    const entities = transactions.map(dto => {
      const entity = new Transaction();
      Object.assign(entity, dto);
      entity.reconciliationId = reconciliationId;
      return entity;
    });

    await this.transactionRepo.save(entities);
  }

  /**
   * Get all transactions for a reconciliation
   */
  async getTransactions(reconciliationId: string): Promise<Transaction[]> {
    return this.transactionRepo.find({
      where: { reconciliationId },
    });
  }

  /**
   * Get unmatched transactions
   */
  async getUnmatched(reconciliationId: string): Promise<Transaction[]> {
    return this.transactionRepo.find({
      where: {
        reconciliationId,
        status: 'unmatched',
      },
    });
  }

  /**
   * Update transaction status
   */
  async updateStatus(
    id: number,
    status: 'unmatched' | 'staged' | 'committed' | 'manual',
  ): Promise<void> {
    await this.transactionRepo.update(id, { status });
  }

  /**
   * Commit a match
   */
  async commitMatch(
    bankId: number,
    ledgerId: number,
  ): Promise<void> {
    await this.transactionRepo.update(bankId, {
      status: 'committed',
      matchedToId: ledgerId,
    });
  }
}
```

**Verification:**
- [ ] Can save transactions
- [ ] Can retrieve by reconciliation ID
- [ ] Can update status
- [ ] All database operations work

**Test:**
```typescript
// Test storing and retrieving
const testTxns: TransactionDto[] = [
  {
    id: 1,
    source: 'bank',
    date: '2025-01-15',
    amount: 1000,
    description: 'ABC Corp Payment',
    status: 'unmatched',
    reconciliationId: 'test-001',
  },
];

await service.storeTransactions(testTxns, 'test-001');
const retrieved = await service.getTransactions('test-001');
console.log('Retrieved:', retrieved);
```

---

### ✅ STEP 14: Create State Manager Controller

**Task:** Add REST API for state operations

```typescript
// apps/state-manager-service/src/state-manager.controller.ts

import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { TransactionRepositoryService } from './transaction-repository.service';
import { TransactionDto } from '@app/shared';

class StoreTransactionsDto {
  transactions: TransactionDto[];
  reconciliationId: string;
}

@Controller('state')
export class StateManagerController {
  constructor(
    private readonly transactionRepo: TransactionRepositoryService,
  ) {}

  @Post('transactions')
  async storeTransactions(@Body() dto: StoreTransactionsDto) {
    await this.transactionRepo.storeTransactions(
      dto.transactions,
      dto.reconciliationId,
    );
    return { success: true };
  }

  @Get('transactions/:reconciliationId')
  async getTransactions(@Param('reconciliationId') id: string) {
    return this.transactionRepo.getTransactions(id);
  }

  @Get('transactions/:reconciliationId/unmatched')
  async getUnmatched(@Param('reconciliationId') id: string) {
    return this.transactionRepo.getUnmatched(id);
  }
}
```

**Verification:**
- [ ] Can POST transactions
- [ ] Can GET transactions
- [ ] Can GET unmatched
- [ ] All endpoints work

**Test with curl:**
```bash
# Store transactions
curl -X POST http://localhost:3002/state/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "reconciliationId": "test-001",
    "transactions": [{
      "id": 1,
      "source": "bank",
      "date": "2025-01-15",
      "amount": 1000,
      "description": "ABC Corp",
      "status": "unmatched",
      "reconciliationId": "test-001"
    }]
  }'

# Retrieve
curl http://localhost:3002/state/transactions/test-001
```

**Output:** JSON responses showing data stored and retrieved

---

### ✅ STEP 15: Add Reconciliation State Entity

**Task:** Create entity for saving reconciliation state

```typescript
// libs/shared/src/entities/reconciliation-state.entity.ts

import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('reconciliation_states')
export class ReconciliationState {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  reconciliationId: string;

  @Column({ type: 'varchar', length: 50 })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  currentStep: string;

  @Column({ type: 'jsonb' })
  completedSteps: string[];

  @Column({ type: 'jsonb' })
  fieldProfile: any;

  @Column({ type: 'jsonb' })
  thresholds: any;

  @Column({ type: 'varchar', length: 20 })
  status: 'in_progress' | 'paused' | 'completed';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastUpdatedAt: Date;
}
```

**Add to TypeORM:**
```typescript
// Update app.module.ts
import { ReconciliationState } from '@app/shared/entities/reconciliation-state.entity';

TypeOrmModule.forRoot({
  entities: [Transaction, ReconciliationState],
  // ...
}),
```

**Verification:**
- [ ] Table created
- [ ] Can save/load state
- [ ] JSONB columns work

---

## PHASE 4: FIRST MATCHING SERVICE (Steps 16-20)

### ✅ STEP 16: Create MT-01 (Exact Match) Service

**Task:**
```bash
cd apps
mkdir -p matching-services/mt-01-exact-match/src
```

**Create service:**
```typescript
// apps/matching-services/mt-01-exact-match/src/mt-01.service.ts

import { Injectable } from '@nestjs/common';
import { TransactionDto } from '@app/shared';

interface MatchCandidate {
  bankId: number;
  ledgerId: number;
  confidence: number;
  reasoning: string;
}

@Injectable()
export class ExactMatchService {
  /**
   * Find exact matches (all fields identical)
   */
  findMatches(
    bankTxns: TransactionDto[],
    ledgerPool: TransactionDto[],
  ): MatchCandidate[] {
    const matches: MatchCandidate[] = [];

    for (const bankTxn of bankTxns) {
      for (const ledgerTxn of ledgerPool) {
        if (this.isExactMatch(bankTxn, ledgerTxn)) {
          matches.push({
            bankId: bankTxn.id,
            ledgerId: ledgerTxn.id,
            confidence: 1.0,
            reasoning: 'Exact match on date, amount, and description',
          });
        }
      }
    }

    return matches;
  }

  private isExactMatch(bank: TransactionDto, ledger: TransactionDto): boolean {
    return (
      bank.date === ledger.date &&
      bank.amount === ledger.amount &&
      bank.description.toLowerCase().trim() === ledger.description.toLowerCase().trim()
    );
  }
}
```

**Verification:**
- [ ] Service compiles
- [ ] Can find exact matches

**Test:**
```typescript
const bankTxns = [
  { id: 1, date: '2025-01-15', amount: 1000, description: 'ABC Corp' },
];

const ledgerTxns = [
  { id: 101, date: '2025-01-15', amount: 1000, description: 'ABC Corp' },
  { id: 102, date: '2025-01-16', amount: 2000, description: 'XYZ Ltd' },
];

const matches = service.findMatches(bankTxns, ledgerTxns);
// Should find 1 match: bank #1 to ledger #101
```

---

### ✅ STEP 17: Create MT-02 (Near-Exact) Service with Fuzzy Matching

**Task:** Implement fuzzy matching algorithms

```typescript
// apps/matching-services/mt-02-near-exact/src/mt-02.service.ts

import { Injectable } from '@nestjs/common';
import { TransactionDto } from '@app/shared';

interface MatchThresholds {
  dateTolerance: number;      // Days
  amountTolerance: number;    // Percentage
  descriptionSimilarity: number; // 0.0 to 1.0
  minConfidence: number;
}

@Injectable()
export class NearExactMatchService {
  findMatches(
    bankTxns: TransactionDto[],
    ledgerPool: TransactionDto[],
    thresholds: MatchThresholds,
  ) {
    const matches = [];

    for (const bankTxn of bankTxns) {
      for (const ledgerTxn of ledgerPool) {
        const dateScore = this.fuzzyDateMatch(
          bankTxn.date,
          ledgerTxn.date,
          thresholds.dateTolerance,
        );

        const amountScore = this.fuzzyAmountMatch(
          bankTxn.amount,
          ledgerTxn.amount,
          thresholds.amountTolerance,
        );

        const descScore = this.fuzzyTextMatch(
          bankTxn.description,
          ledgerTxn.description,
        );

        const confidence = dateScore * 0.3 + amountScore * 0.4 + descScore * 0.3;

        if (confidence >= thresholds.minConfidence) {
          matches.push({
            bankId: bankTxn.id,
            ledgerId: ledgerTxn.id,
            confidence,
            scores: { date: dateScore, amount: amountScore, description: descScore },
            reasoning: `Near-exact match (${(confidence * 100).toFixed(0)}% confidence)`,
          });
        }
      }
    }

    return matches;
  }

  private fuzzyDateMatch(date1: string, date2: string, tolerance: number): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffDays = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 1.0;
    if (diffDays <= tolerance) return 1.0 - diffDays / (tolerance * 2);
    return 0.0;
  }

  private fuzzyAmountMatch(amt1: number, amt2: number, tolerance: number): number {
    const diff = Math.abs(amt1 - amt2);
    if (diff === 0) return 1.0;

    const threshold = amt1 * tolerance;
    if (diff <= threshold) return 1.0 - diff / threshold;
    return 0.0;
  }

  private fuzzyTextMatch(text1: string, text2: string): number {
    const s1 = text1.toLowerCase().trim();
    const s2 = text2.toLowerCase().trim();

    if (s1 === s2) return 1.0;

    // Simple similarity: Levenshtein
    return this.levenshteinSimilarity(s1, s2);
  }

  private levenshteinSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[s2.length][s1.length];
  }
}
```

**Verification:**
- [ ] Fuzzy matching works
- [ ] Can find near-exact matches
- [ ] Confidence scores calculated correctly

**Test:**
```typescript
const bankTxns = [
  { id: 1, date: '2025-01-15', amount: 1000, description: 'ABC Corp Payment' },
];

const ledgerTxns = [
  { id: 101, date: '2025-01-14', amount: 1000, description: 'ABC Corporation' },
];

const thresholds = {
  dateTolerance: 2,
  amountTolerance: 0.01,
  descriptionSimilarity: 0.7,
  minConfidence: 0.7,
};

const matches = service.findMatches(bankTxns, ledgerTxns, thresholds);
// Should find match with ~85% confidence
```

---

### ✅ STEP 18: Create Matching Controller

**Task:** Add REST API for matching service

```typescript
// apps/matching-services/mt-02-near-exact/src/mt-02.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { NearExactMatchService } from './mt-02.service';
import { TransactionDto } from '@app/shared';

class FindMatchesDto {
  bankTxns: TransactionDto[];
  ledgerPool: TransactionDto[];
  thresholds: {
    dateTolerance: number;
    amountTolerance: number;
    descriptionSimilarity: number;
    minConfidence: number;
  };
}

@Controller('mt-02')
export class NearExactMatchController {
  constructor(private readonly service: NearExactMatchService) {}

  @Post('find-matches')
  async findMatches(@Body() dto: FindMatchesDto) {
    return this.service.findMatches(
      dto.bankTxns,
      dto.ledgerPool,
      dto.thresholds,
    );
  }
}
```

**Run on port 3003:**
```typescript
// main.ts
await app.listen(3003);
```

**Verification:**
- [ ] Service accessible
- [ ] Can POST to /mt-02/find-matches
- [ ] Returns matches correctly

---

### ✅ STEP 19: Test End-to-End Matching Flow

**Task:** Test complete flow from data prep to matching

**Flow:**
1. Upload CSVs to Data Prep (port 3001)
2. Store transactions in State Manager (port 3002)
3. Call MT-02 for matching (port 3003)

**Test script:**
```bash
# 1. Analyze files
curl -X POST http://localhost:3001/data-prep/analyze \
  -H "Content-Type: application/json" \
  -d '{ "bankFileContent": "...", "ledgerFileContent": "..." }'

# 2. Store transactions
curl -X POST http://localhost:3002/state/transactions \
  -H "Content-Type: application/json" \
  -d '{ "reconciliationId": "test-001", "transactions": [...] }'

# 3. Find matches
curl -X POST http://localhost:3003/mt-02/find-matches \
  -H "Content-Type: application/json" \
  -d '{ "bankTxns": [...], "ledgerPool": [...], "thresholds": {...} }'
```

**Verification:**
- [ ] Full flow works
- [ ] Data flows correctly between services
- [ ] Matches found successfully

---

### ✅ STEP 20: Add Unit Tests for Matching

**Task:** Write comprehensive tests

```typescript
// mt-02.service.spec.ts

describe('NearExactMatchService', () => {
  let service: NearExactMatchService;

  beforeEach(() => {
    service = new NearExactMatchService();
  });

  it('should find exact match', () => {
    const bank = [{ id: 1, date: '2025-01-15', amount: 1000, description: 'ABC Corp' }];
    const ledger = [{ id: 101, date: '2025-01-15', amount: 1000, description: 'ABC Corp' }];
    
    const matches = service.findMatches(bank, ledger, {
      dateTolerance: 0,
      amountTolerance: 0,
      descriptionSimilarity: 1.0,
      minConfidence: 0.9,
    });

    expect(matches.length).toBe(1);
    expect(matches[0].confidence).toBe(1.0);
  });

  it('should find near-exact with date offset', () => {
    const bank = [{ id: 1, date: '2025-01-15', amount: 1000, description: 'ABC Corp' }];
    const ledger = [{ id: 101, date: '2025-01-14', amount: 1000, description: 'ABC Corp' }];
    
    const matches = service.findMatches(bank, ledger, {
      dateTolerance: 2,
      amountTolerance: 0,
      descriptionSimilarity: 1.0,
      minConfidence: 0.7,
    });

    expect(matches.length).toBe(1);
    expect(matches[0].confidence).toBeGreaterThan(0.7);
  });

  it('should not match if below threshold', () => {
    const bank = [{ id: 1, date: '2025-01-15', amount: 1000, description: 'ABC Corp' }];
    const ledger = [{ id: 101, date: '2025-01-20', amount: 2000, description: 'XYZ Ltd' }];
    
    const matches = service.findMatches(bank, ledger, {
      dateTolerance: 2,
      amountTolerance: 0.01,
      descriptionSimilarity: 0.7,
      minConfidence: 0.7,
    });

    expect(matches.length).toBe(0);
  });
});
```

**Run tests:**
```bash
npm test mt-02.service
```

**Verification:**
- [ ] All tests pass
- [ ] Edge cases covered

---

## 🎯 CHECKPOINT - PHASE 4 COMPLETE

**Before proceeding, verify:**

- [ ] MT-01 (Exact Match) works
- [ ] MT-02 (Near-Exact) works
- [ ] Fuzzy matching algorithms correct
- [ ] All tests pass
- [ ] End-to-end flow tested
- [ ] No errors

---

## WHAT'S NEXT?

**Phase 5:** Orchestrator Service (coordinates all matching services)
**Phase 6:** Learning Service (entity profiles, questions, convergence)
**Phase 7:** Remaining matching services (MT-03 through MT-16)
**Phase 8:** UI & Final integration

**Each phase will be delivered as separate document to avoid overwhelming Claude Code.**

---

**STOP HERE - DO NOT PROCEED TO PHASE 5 UNTIL PHASE 4 IS VERIFIED!**

