# CLAUDE CODE IMPLEMENTATION GUIDE - COMPLETE & UPDATED

## Banking Reconciliation System with Multi-Bank & Date Range Support

---

## 🎯 BEFORE YOU START

### **READ THESE FIRST:**
1. **HANDOVER_TO_NEW_SESSION.md** - Complete context
2. **DATABASE_SCHEMAS_COMPLETE.md** - All entities (copy these exactly)
3. **API_ENDPOINTS_REFERENCE.md** - All endpoints
4. **MT_SERVICES_DESCRIPTIONS.md** - Matching service logic

### **CRITICAL RULES:**
1. ✅ **ONE STEP AT A TIME** - Complete, test, verify before next
2. ✅ **WORKING CODE ONLY** - Every step must compile and run
3. ✅ **TEST AFTER EACH STEP** - No skipping verification
4. ✅ **NO UNDO** - Don't rewrite working code
5. ✅ **INCREMENTAL** - Build on previous steps
6. ✅ **ASK IF UNCLEAR** - Pause and ask when needed

---

## 📋 MASTER CHECKLIST (Revised - 65 Steps)

### **PHASE 1: PROJECT SETUP (Steps 1-6)**
- [ ] Step 1: Initialize NestJS monorepo
- [ ] Step 2: Create shared library structure
- [ ] Step 3: Set up TypeORM + PostgreSQL
- [ ] Step 4: Create ALL DTOs (with multi-bank + date range)
- [ ] Step 5: Create ALL database entities (copy from DATABASE_SCHEMAS_COMPLETE.md)
- [ ] Step 6: Verify project builds & DB connects

### **PHASE 2: DATA PREP SERVICE (Steps 7-14)**
- [ ] Step 7: Create Data Prep scaffold
- [ ] Step 8: Implement column detection (reusable for multi-bank)
- [ ] Step 9: Implement date range detection
- [ ] Step 10: Implement auto-mapping per bank
- [ ] Step 11: Implement multi-file upload endpoint
- [ ] Step 12: Implement data normalization (with optional date filtering)
- [ ] Step 13: Add Swagger docs
- [ ] Step 14: Test with 2-3 bank files + date range

### **PHASE 3: STATE MANAGER SERVICE (Steps 15-21)**
- [ ] Step 15: Create State Manager scaffold
- [ ] Step 16: Implement reconciliation CRUD
- [ ] Step 17: Implement multi-bank file storage
- [ ] Step 18: Implement transaction bulk storage
- [ ] Step 19: Implement state snapshot (save/resume)
- [ ] Step 20: Create all REST endpoints
- [ ] Step 21: Test multi-bank transaction storage

### **PHASE 4: MATCHING SERVICE MT-01 (Steps 22-27)**
- [ ] Step 22: Create MT-01 scaffold
- [ ] Step 23: Implement exact match algorithm
- [ ] Step 24: Add bankId awareness
- [ ] Step 25: Create REST endpoint
- [ ] Step 26: Test with multi-bank data
- [ ] Step 27: Verify integration with State Manager

### **PHASE 5: MATCHING SERVICE MT-02 (Steps 28-33)**
- [ ] Step 28: Create MT-02 scaffold
- [ ] Step 29: Implement primary matching (core fields only)
- [ ] Step 30: Implement additional matching (optional fields)
- [ ] Step 31: Add per-bank field profile usage
- [ ] Step 32: Create REST endpoint
- [ ] Step 33: Test primary + additional candidates

### **PHASE 6: ORCHESTRATOR SERVICE (Steps 34-40)**
- [ ] Step 34: Create Orchestrator scaffold
- [ ] Step 35: Implement step sequencing
- [ ] Step 36: Add field profile passing to MT services
- [ ] Step 37: Implement progress tracking
- [ ] Step 38: Add convergence calculation
- [ ] Step 39: Create REST endpoints
- [ ] Step 40: Test full MT-01 → MT-02 flow

### **PHASE 7: LEARNING SERVICE (Steps 41-47)**
- [ ] Step 41: Create Learning Service scaffold
- [ ] Step 42: Implement user feedback recording
- [ ] Step 43: Implement entity profile creation
- [ ] Step 44: Add per-bank behavior tracking
- [ ] Step 45: Implement pattern learning
- [ ] Step 46: Create REST endpoints
- [ ] Step 47: Test entity profile building

### **PHASE 8: QUESTION MANAGER (Steps 48-53)**
- [ ] Step 48: Create Question Manager scaffold
- [ ] Step 49: Implement question generator
- [ ] Step 50: Implement question queue management
- [ ] Step 51: Implement answer processing
- [ ] Step 52: Create REST endpoints
- [ ] Step 53: Test deferred question workflow

### **PHASE 9: REMAINING MT SERVICES (Steps 54-61)**
- [ ] Step 54: Implement MT-03 (Bank Fees)
- [ ] Step 55: Implement MT-04 (Interest)
- [ ] Step 56: Implement MT-05 (Split Payments)
- [ ] Step 57: Implement MT-06 (Consolidated Deposits - multi-bank)
- [ ] Step 58: Implement MT-09 (Timing Differences)
- [ ] Step 59: Implement MT-16 (Final Validation)
- [ ] Step 60: Implement remaining MT-07, 08, 10-15
- [ ] Step 61: Test all MT services

### **PHASE 10: INTEGRATION & TESTING (Steps 62-65)**
- [ ] Step 62: End-to-end test (upload → match → review)
- [ ] Step 63: Test multi-bank scenarios (3 banks)
- [ ] Step 64: Test date range filtering
- [ ] Step 65: Performance testing & optimization

---

## 📝 DETAILED STEP INSTRUCTIONS

---

## STEP 1: Initialize NestJS Monorepo

### **Goal:**
Create NestJS monorepo structure with proper configuration.

### **Commands:**
```bash
# Create new NestJS project
npx @nestjs/cli new banking-reconciliation-system

# Navigate to project
cd banking-reconciliation-system

# Generate shared library
nest g library shared

# Generate first microservice
nest g app data-prep-service
```

### **Expected File Structure:**
```
banking-reconciliation-system/
├── apps/
│   ├── banking-reconciliation-system/  (delete later)
│   └── data-prep-service/
├── libs/
│   └── shared/
├── package.json
├── nest-cli.json
└── tsconfig.json
```

### **Verification:**
```bash
npm run build
# Should compile without errors
```

### **Test:**
```bash
npm run start
# Should start default app
```

### **Success Criteria:**
- [x] Project created
- [x] Shared library exists
- [x] Data prep service exists
- [x] `npm run build` succeeds
- [x] No TypeScript errors

**STOP HERE. Report completion before Step 2.**

---

## STEP 2: Create Shared Library Structure

### **Goal:**
Organize shared library with proper folders.

### **Commands:**
```bash
cd libs/shared/src

# Create folder structure
mkdir -p dto
mkdir -p entities
mkdir -p interfaces
mkdir -p utils
mkdir -p constants
```

### **Update `libs/shared/src/index.ts`:**
```typescript
export * from './dto';
export * from './entities';
export * from './interfaces';
export * from './utils';
export * from './constants';
```

### **Create `libs/shared/src/dto/index.ts`:**
```typescript
// Will export all DTOs (created in Step 4)
```

### **Create `libs/shared/src/entities/index.ts`:**
```typescript
// Will export all entities (created in Step 5)
```

### **Verification:**
```bash
npm run build
# Should compile
```

### **Success Criteria:**
- [x] All folders created
- [x] Index files created
- [x] Build succeeds

**STOP HERE. Report completion before Step 3.**

---

## STEP 3: Set Up TypeORM + PostgreSQL

### **Goal:**
Add database support with TypeORM.

### **Install Dependencies:**
```bash
npm install --save @nestjs/typeorm typeorm pg
npm install --save @nestjs/config
```

### **Create `.env` file in project root:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=reconciliation_db
NODE_ENV=development
```

### **Update `libs/shared/src/shared.module.ts`:**
```typescript
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'reconciliation_db'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true, // ONLY for development
        logging: false,
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule, ConfigModule],
})
export class SharedModule {}
```

### **Start PostgreSQL (Docker):**
```bash
docker run --name postgres-recon \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=reconciliation_db \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps | grep postgres-recon
```

### **Verification:**
```bash
npm run build
# Should compile

# Check PostgreSQL connection
docker exec -it postgres-recon psql -U postgres -d reconciliation_db -c "\dt"
# Should connect (will show no tables yet)
```

### **Success Criteria:**
- [x] TypeORM installed
- [x] PostgreSQL running in Docker
- [x] `.env` file created
- [x] SharedModule configured
- [x] Build succeeds
- [x] Can connect to database

**STOP HERE. Report completion before Step 4.**

---

## STEP 4: Create ALL DTOs

### **Goal:**
Create all DTO files with multi-bank and date range support.

### **IMPORTANT:**
Copy DTOs from existing documentation. Create these files:

#### **4.1: Core Transaction DTOs**
File: `libs/shared/src/dto/transaction.dto.ts`

```typescript
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CoreTransactionDto {
  @ApiProperty({ description: 'Transaction date in ISO format' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Transaction description' })
  @IsNotEmpty()
  @IsString()
  description: string;
}

export class OptionalTransactionFieldsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['credit', 'debit'])
  txnType?: 'credit' | 'debit';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payerPayee?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;
}

export class TransactionDto extends CoreTransactionDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  source: 'bank' | 'ledger';

  // ═══════════════════════════════════════════════════════════
  // MULTI-BANK SUPPORT
  // ═══════════════════════════════════════════════════════════
  @ApiPropertyOptional({ description: 'Bank identifier (bank_1, bank_2, etc.)' })
  @IsOptional()
  @IsString()
  bankId?: string;

  @ApiPropertyOptional({ description: 'Bank name (HDFC, ICICI, SBI, etc.)' })
  @IsOptional()
  @IsString()
  bankName?: string;
  // ═══════════════════════════════════════════════════════════

  @ApiPropertyOptional()
  @IsOptional()
  optional?: OptionalTransactionFieldsDto;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  @IsString()
  status: 'unmatched' | 'staged' | 'committed' | 'manual';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  matchedToId?: number;

  @ApiProperty()
  @IsString()
  reconciliationId: string;
}
```

#### **4.2: Date Range DTOs**
File: `libs/shared/src/dto/date-range.dto.ts`

```typescript
import { IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DateRangeDto {
  @ApiProperty({ 
    description: 'Include all transactions (default: true)',
    default: true 
  })
  @IsBoolean()
  includeAll: boolean = true;  // DEFAULT

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class DateRangeAnalysisDto {
  @ApiProperty()
  bankDateRange: {
    earliest: string;
    latest: string;
    totalTransactions: number;
  };

  @ApiProperty()
  ledgerDateRange: {
    earliest: string;
    latest: string;
    totalTransactions: number;
  };

  @ApiPropertyOptional()
  suggestedRange?: {
    from: string;
    to: string;
    coverage: number;
  };

  @ApiProperty()
  hasDateMismatch: boolean;
}
```

#### **4.3: File Metadata DTOs**
File: `libs/shared/src/dto/file-metadata.dto.ts`

```typescript
import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BankFileMetadataDto {
  @ApiProperty()
  @IsString()
  fileId: string;

  @ApiProperty()
  @IsString()
  bankId: string;

  @ApiProperty()
  @IsString()
  bankName: string;

  @ApiProperty()
  @IsString()
  filename: string;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty()
  @IsNumber()
  totalRecords: number;

  @ApiProperty()
  @IsNumber()
  filteredRecords: number;

  @ApiProperty()
  @IsNumber()
  excludedRecords: number;

  @ApiProperty()
  columnMapping: Record<string, string>;

  @ApiProperty()
  dateRange: {
    earliest: string;
    latest: string;
  };
}

export class LedgerFileMetadataDto {
  @ApiProperty()
  @IsString()
  fileId: string;

  @ApiProperty()
  @IsString()
  filename: string;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty()
  @IsNumber()
  totalRecords: number;

  @ApiProperty()
  @IsNumber()
  filteredRecords: number;

  @ApiProperty()
  @IsNumber()
  excludedRecords: number;

  @ApiProperty()
  columnMapping: Record<string, string>;

  @ApiProperty()
  dateRange: {
    earliest: string;
    latest: string;
  };
}
```

#### **4.4: Update `libs/shared/src/dto/index.ts`:**
```typescript
export * from './transaction.dto';
export * from './date-range.dto';
export * from './file-metadata.dto';
// Add other DTOs as created
```

### **Verification:**
```bash
npm run build
# Should compile without errors
```

### **Success Criteria:**
- [x] All DTO files created
- [x] Multi-bank fields added (bankId, bankName)
- [x] Date range DTOs created
- [x] File metadata DTOs created
- [x] Proper validation decorators
- [x] Build succeeds

**STOP HERE. Report completion before Step 5.**

---

## STEP 5: Create ALL Database Entities

### **Goal:**
Create all 9 TypeORM entities exactly as specified in DATABASE_SCHEMAS_COMPLETE.md.

### **CRITICAL:**
**COPY ENTITIES EXACTLY** from DATABASE_SCHEMAS_COMPLETE.md document.

### **Files to Create:**

1. `libs/shared/src/entities/user.entity.ts`
2. `libs/shared/src/entities/reconciliation.entity.ts`
3. `libs/shared/src/entities/bank-file.entity.ts` ← NEW for multi-bank
4. `libs/shared/src/entities/ledger-file.entity.ts`
5. `libs/shared/src/entities/transaction.entity.ts` ← Updated with bankId
6. `libs/shared/src/entities/match-candidate.entity.ts`
7. `libs/shared/src/entities/entity-profile.entity.ts`
8. `libs/shared/src/entities/learning-question.entity.ts`
9. `libs/shared/src/entities/convergence-metrics.entity.ts`
10. `libs/shared/src/entities/user-feedback.entity.ts`

### **Update `libs/shared/src/entities/index.ts`:**
```typescript
export * from './user.entity';
export * from './reconciliation.entity';
export * from './bank-file.entity';
export * from './ledger-file.entity';
export * from './transaction.entity';
export * from './match-candidate.entity';
export * from './entity-profile.entity';
export * from './learning-question.entity';
export * from './convergence-metrics.entity';
export * from './user-feedback.entity';
```

### **Verification:**
```bash
npm run build
# Should compile

# Check if tables created in PostgreSQL
docker exec -it postgres-recon psql -U postgres -d reconciliation_db -c "\dt"
# Should show all 10 tables
```

### **Success Criteria:**
- [x] All 10 entity files created
- [x] BankFile entity has multi-bank fields
- [x] Transaction entity has bankId/bankName
- [x] All relationships defined
- [x] Build succeeds
- [x] Database tables created
- [x] No TypeORM errors

**STOP HERE. Report completion before Step 6.**

---

## STEP 6: Verify Project Builds & DB Connects

### **Goal:**
Complete verification that everything works together.

### **Verification Steps:**

#### **6.1: Clean Build**
```bash
rm -rf dist node_modules
npm install
npm run build
```

#### **6.2: Check Database Connection**
Create test file: `apps/data-prep-service/src/test-db.ts`
```typescript
import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'reconciliation_db',
  entities: ['libs/shared/src/entities/*.entity.ts'],
  synchronize: false,
});

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected successfully!');
    return AppDataSource.query('SELECT COUNT(*) FROM reconciliations');
  })
  .then((result) => {
    console.log('✅ Can query database:', result);
    return AppDataSource.destroy();
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });
```

Run test:
```bash
npx ts-node apps/data-prep-service/src/test-db.ts
```

#### **6.3: List All Tables**
```bash
docker exec -it postgres-recon psql -U postgres -d reconciliation_db -c "\dt"
```

Expected tables:
- users
- reconciliations
- bank_files ← NEW
- ledger_files
- transactions
- match_candidates
- entity_profiles
- learning_questions
- convergence_metrics
- user_feedback

### **Success Criteria:**
- [x] Clean build succeeds
- [x] Database connection test passes
- [x] All 10 tables exist
- [x] No TypeScript errors
- [x] No TypeORM errors

**STOP HERE. PHASE 1 COMPLETE. Report before Phase 2.**

---

## 🎯 PHASE 1 COMPLETE CHECKPOINT

Before proceeding to Phase 2, verify:

- [x] NestJS monorepo created
- [x] Shared library structured
- [x] PostgreSQL running
- [x] All DTOs created (with multi-bank + date range)
- [x] All 10 entities created
- [x] Database tables exist
- [x] Everything compiles
- [x] Database connection works

**If all checked, proceed to Phase 2: Data Prep Service**

---

## PHASE 2: DATA PREP SERVICE

Continue with Steps 7-14...

(Implementation guide continues with detailed steps for each phase)

---

## 📊 PROGRESS TRACKING FORMAT

After each step, report like this:

```
✅ STEP X COMPLETE: [Step Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: SUCCESS
Duration: X minutes
Files Created: [list]
Tests Passed: [X/Y]
Issues: None
Next Step: Step X+1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔗 REFERENCE DOCUMENTS

**Always Available:**
- DATABASE_SCHEMAS_COMPLETE.md - Copy entities from here
- API_ENDPOINTS_REFERENCE.md - API specs
- MT_SERVICES_DESCRIPTIONS.md - Matching logic
- HANDOVER_TO_NEW_SESSION.md - Complete context

---

**END OF IMPLEMENTATION GUIDE SECTION 1**

This guide continues with Steps 7-65 in detail.
Each step includes exact commands, file contents, verification, and testing.

---

Ready to implement! 🚀
