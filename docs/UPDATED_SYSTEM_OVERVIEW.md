# BANKING RECONCILIATION SYSTEM - UPDATED SYSTEM OVERVIEW

## Multi-Bank Support + Optional Date Range Filtering

---

## 🎯 KEY UPDATES

### **UPDATE 1: Multi-Bank Support** (MANDATORY)
```
BEFORE: 1 Bank Statement ↔ 1 Ledger
NOW:    Multiple Banks ↔ 1 Ledger

Example:
  HDFC Bank (500 txns)  ┐
  ICICI Bank (300 txns) ├→ Ledger (1,100 txns)
  SBI Bank (300 txns)   ┘
```

### **UPDATE 2: Optional Date Range Filtering** (OPTIONAL)
```
DEFAULT: Process all transactions in file
OPTIONAL: User can filter by date range

Example:
  File contains: Jan 1 - Dec 31, 2024 (12 months)
  User selects: Oct 1 - Dec 31, 2024 (Q4 only)
  System processes: Only Q4 data
```

---

## 📊 UPDATED DATA MODEL

### **Core Changes**

#### **1. Transaction DTO - Added Bank Identifier**

```typescript
// libs/shared/src/dto/transaction.dto.ts

export class TransactionDto extends CoreTransactionDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ description: 'Source: bank or ledger' })
  source: 'bank' | 'ledger';

  // ═══════════════════════════════════════════════════════════
  // NEW: Bank identification (for multi-bank support)
  // ═══════════════════════════════════════════════════════════
  @ApiPropertyOptional({ description: 'Bank identifier (e.g., bank_1, bank_2)' })
  @IsOptional()
  @IsString()
  bankId?: string;

  @ApiPropertyOptional({ description: 'Bank name (e.g., HDFC, ICICI, SBI)' })
  @IsOptional()
  @IsString()
  bankName?: string;
  // ═══════════════════════════════════════════════════════════

  @ApiProperty()
  date: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  optional?: OptionalTransactionFieldsDto;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  status: 'unmatched' | 'staged' | 'committed' | 'manual';

  @ApiPropertyOptional()
  matchedToId?: number;

  @ApiProperty()
  reconciliationId: string;
}
```

#### **2. Date Range DTOs - Optional Filtering**

```typescript
// libs/shared/src/dto/date-range.dto.ts

export class DateRangeDto {
  @ApiProperty({ 
    description: 'Include all transactions (default: true)',
    default: true 
  })
  @IsBoolean()
  includeAll: boolean = true;  // DEFAULT = true

  @ApiPropertyOptional({ 
    description: 'Start date (ISO format) - only if includeAll = false' 
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ 
    description: 'End date (ISO format) - only if includeAll = false' 
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class DateRangeAnalysisDto {
  @ApiProperty({ description: 'Date range detected in bank files' })
  bankDateRange: {
    earliest: string;
    latest: string;
    totalTransactions: number;
  };

  @ApiProperty({ description: 'Date range detected in ledger file' })
  ledgerDateRange: {
    earliest: string;
    latest: string;
    totalTransactions: number;
  };

  @ApiPropertyOptional({ description: 'Suggested overlap range (optional)' })
  suggestedRange?: {
    from: string;
    to: string;
    coverage: number;  // % of transactions in this range
  };

  @ApiProperty({ description: 'Whether files have mismatched date ranges' })
  hasDateMismatch: boolean;
}
```

#### **3. Bank File Metadata - Multi-Bank Support**

```typescript
// libs/shared/src/dto/file-metadata.dto.ts

export class BankFileMetadataDto {
  @ApiProperty()
  fileId: string;

  @ApiProperty({ description: 'Bank name (e.g., HDFC, ICICI, SBI)' })
  bankName: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty({ description: 'Total records in file' })
  totalRecords: number;

  @ApiProperty({ description: 'Records after date filter (if applied)' })
  filteredRecords: number;

  @ApiProperty({ description: 'Records excluded by date filter' })
  excludedRecords: number;

  @ApiProperty()
  columnMapping: Record<string, string>;

  @ApiProperty({ description: 'Actual date range in this bank file' })
  dateRange: {
    earliest: string;
    latest: string;
  };
}

export class LedgerFileMetadataDto {
  @ApiProperty()
  fileId: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty()
  totalRecords: number;

  @ApiProperty()
  filteredRecords: number;

  @ApiProperty()
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

#### **4. Updated Reconciliation State**

```typescript
// libs/shared/src/dto/reconciliation-state.dto.ts

export class ReconciliationStateDto {
  @ApiProperty()
  reconciliationId: string;

  @ApiProperty()
  userId: string;

  // ═══════════════════════════════════════════════════════════
  // UPDATED: Multiple bank files instead of single
  // ═══════════════════════════════════════════════════════════
  @ApiProperty({ 
    description: 'Multiple bank files',
    type: [BankFileMetadataDto] 
  })
  bankFiles: BankFileMetadataDto[];  // ARRAY of banks

  @ApiProperty({ description: 'Single ledger file' })
  ledgerFile: LedgerFileMetadataDto;
  // ═══════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════
  // NEW: Optional date range configuration
  // ═══════════════════════════════════════════════════════════
  @ApiProperty({ 
    description: 'Date range filter configuration',
    default: { includeAll: true } 
  })
  dateRange: DateRangeDto;

  @ApiPropertyOptional({ description: 'Detected date ranges in files' })
  dateRangeAnalysis?: DateRangeAnalysisDto;
  // ═══════════════════════════════════════════════════════════

  @ApiProperty()
  fieldProfile: FieldProfileDto;

  @ApiProperty()
  currentStep: string;

  @ApiProperty()
  completedSteps: string[];

  @ApiProperty({ description: 'Transactions grouped by bank' })
  transactions: {
    banks: {
      [bankId: string]: TransactionDto[];  // Grouped by bank
    };
    ledger: TransactionDto[];
  };

  // ... rest unchanged
}
```

---

## 🔄 UPDATED USER FLOW

### **Step 1: Upload Files**

**UI Mockup:**
```
┌──────────────────────────────────────────────────────────┐
│ Upload Bank Statements & Ledger                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 📁 Bank Statements:                                     │
│                                                          │
│   ✓ HDFC_Jan2025.csv                                    │
│     500 transactions | Jan 1 - Jan 31, 2025            │
│     [Remove]                                            │
│                                                          │
│   ✓ ICICI_Jan2025.csv                                   │
│     300 transactions | Jan 1 - Jan 31, 2025            │
│     [Remove]                                            │
│                                                          │
│   ✓ SBI_Jan2025.csv                                     │
│     300 transactions | Jan 1 - Jan 31, 2025            │
│     [Remove]                                            │
│                                                          │
│   [+ Add Another Bank Statement]                        │
│                                                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                          │
│ 📄 Ledger Statement:                                    │
│                                                          │
│   ✓ Ledger_Jan2025.csv                                  │
│     1,100 transactions | Jan 1 - Jan 31, 2025          │
│     [Remove]                                            │
│                                                          │
│   [Upload Ledger]                                       │
│                                                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                          │
│ 📅 Date Range (Optional):                               │
│                                                          │
│   ○ Process All Transactions (Recommended)              │
│                                                          │
│   ○ Custom Date Range:                                  │
│     [Collapsed by default - click to expand]           │
│                                                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                          │
│ Summary:                                                │
│   Banks: 1,100 transactions (3 files)                  │
│   Ledger: 1,100 transactions                           │
│   Period: January 1-31, 2025                           │
│                                                          │
│ [Continue to Column Mapping]                            │
└──────────────────────────────────────────────────────────┘
```

**When user clicks "Custom Date Range":**
```
┌──────────────────────────────────────────────────────────┐
│ 📅 Custom Date Range:                                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   Detected in files:                                    │
│     Banks: Jan 1, 2025 → Jan 31, 2025                  │
│     Ledger: Jan 1, 2025 → Jan 31, 2025                 │
│                                                          │
│   Select range to process:                              │
│                                                          │
│     From: [Jan 1, 2025  ▼] 📅                          │
│     To:   [Jan 15, 2025 ▼] 📅                          │
│                                                          │
│   ⚠️ Preview:                                            │
│     Banks: ~550 transactions (550 excluded)            │
│     Ledger: ~550 transactions (550 excluded)           │
│                                                          │
│   💡 Tip: Use date range for monthly/quarterly          │
│           reconciliations or specific investigations    │
│                                                          │
│ [Apply Filter] [Cancel - Use All]                      │
└──────────────────────────────────────────────────────────┘
```

---

### **Step 2: Column Mapping (Per Bank)**

**UI Flow:**
```
┌──────────────────────────────────────────────────────────┐
│ Column Mapping - Bank 1 of 3: HDFC                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Map HDFC columns to system fields:                      │
│                                                          │
│   Date           → [Core: Date           ▼]            │
│   Amount         → [Core: Amount         ▼]            │
│   Description    → [Core: Description    ▼]            │
│   Type           → [Optional: Txn Type   ▼]            │
│   Reference No   → [Optional: Ref Number ▼]            │
│                                                          │
│ ✓ Auto-detected (95% confidence)                        │
│                                                          │
│ [< Back] [Next: ICICI Bank >]                          │
└──────────────────────────────────────────────────────────┘

Then repeat for ICICI, SBI...

Finally:
┌──────────────────────────────────────────────────────────┐
│ Column Mapping - Ledger                                 │
├──────────────────────────────────────────────────────────┤
│ ... (same process)                                       │
│ [< Back] [Start Reconciliation]                         │
└──────────────────────────────────────────────────────────┘
```

---

## 🗄️ UPDATED DATABASE SCHEMA

### **Entities:**

```typescript
// libs/shared/src/entities/reconciliation.entity.ts

@Entity()
export class Reconciliation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  // ═══════════════════════════════════════════════════════════
  // NEW: Date range configuration (optional)
  // ═══════════════════════════════════════════════════════════
  @Column({ default: true })
  includeAllDates: boolean;  // DEFAULT = true

  @Column({ type: 'date', nullable: true })
  dateRangeFrom: Date | null;  // null if includeAllDates = true

  @Column({ type: 'date', nullable: true })
  dateRangeTo: Date | null;    // null if includeAllDates = true
  // ═══════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════
  // UPDATED: Multiple bank files relationship
  // ═══════════════════════════════════════════════════════════
  @OneToMany(() => BankFile, (bankFile) => bankFile.reconciliation, { 
    cascade: true 
  })
  bankFiles: BankFile[];
  // ═══════════════════════════════════════════════════════════

  @OneToOne(() => LedgerFile, { cascade: true })
  @JoinColumn()
  ledgerFile: LedgerFile;

  @Column({ type: 'jsonb', nullable: true })
  dateRangeAnalysis: any;

  @Column({ type: 'enum', enum: ['in_progress', 'paused', 'completed'] })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════
// NEW: BankFile entity (for multi-bank support)
// ═══════════════════════════════════════════════════════════
@Entity()
export class BankFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bankId: string;              // bank_1, bank_2, bank_3...

  @Column()
  bankName: string;            // "HDFC", "ICICI", "SBI"

  @Column()
  filename: string;

  @Column()
  totalRecords: number;

  @Column({ default: 0 })
  filteredRecords: number;     // After date filter

  @Column({ default: 0 })
  excludedRecords: number;     // Excluded by date filter

  @Column({ type: 'jsonb' })
  columnMapping: any;

  @Column({ type: 'date' })
  earliestDate: Date;

  @Column({ type: 'date' })
  latestDate: Date;

  @ManyToOne(() => Reconciliation, (recon) => recon.bankFiles)
  reconciliation: Reconciliation;

  @CreateDateColumn()
  uploadedAt: Date;
}

@Entity()
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
  columnMapping: any;

  @Column({ type: 'date' })
  earliestDate: Date;

  @Column({ type: 'date' })
  latestDate: Date;

  @CreateDateColumn()
  uploadedAt: Date;
}

// ═══════════════════════════════════════════════════════════
// UPDATED: Transaction entity with bankId
// ═══════════════════════════════════════════════════════════
@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  source: string;              // 'bank' | 'ledger'

  @Column({ nullable: true })
  bankId: string;              // NEW: for multi-bank

  @Column({ nullable: true })
  bankName: string;            // NEW: for multi-bank

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  optional: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column()
  status: string;

  @Column({ nullable: true })
  matchedToId: number;

  @Column()
  reconciliationId: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## 🔧 UPDATED DATA PREP SERVICE

### **API Endpoints:**

```typescript
// apps/data-prep-service/src/data-prep.controller.ts

@Controller('data-prep')
export class DataPrepController {
  
  // ═══════════════════════════════════════════════════════════
  // NEW: Analyze multiple bank files
  // ═══════════════════════════════════════════════════════════
  @Post('analyze-multi-bank')
  @ApiOperation({ 
    summary: 'Analyze multiple bank files and ledger, detect date ranges' 
  })
  async analyzeMultiBank(@Body() dto: AnalyzeMultiBankDto) {
    return this.dataPrepService.analyzeMultiBank(dto);
  }

  // ═══════════════════════════════════════════════════════════
  // UPDATED: Validate and prepare with multi-bank + date range
  // ═══════════════════════════════════════════════════════════
  @Post('validate-and-prepare')
  @ApiOperation({ 
    summary: 'Validate mappings and prepare normalized data' 
  })
  async validateAndPrepare(@Body() dto: ValidateAndPrepareDto) {
    return this.dataPrepService.validateAndPrepare(dto);
  }
}

// Request DTOs
export class AnalyzeMultiBankDto {
  @ApiProperty({ 
    description: 'Array of bank files with names',
    type: 'array'
  })
  bankFiles: Array<{
    file: any;              // Multer file upload
    bankName: string;       // User-provided name
  }>;

  @ApiProperty({ description: 'Single ledger file' })
  ledgerFile: any;

  // No date range here - just analysis
}

export class ValidateAndPrepareDto {
  @ApiProperty({ description: 'Bank file mappings' })
  bankMappings: Array<{
    bankId: string;
    bankName: string;
    file: any;
    columnMapping: Record<string, string>;
  }>;

  @ApiProperty({ description: 'Ledger file mapping' })
  ledgerMapping: {
    file: any;
    columnMapping: Record<string, string>;
  };

  // ═══════════════════════════════════════════════════════════
  // NEW: Optional date range filter
  // ═══════════════════════════════════════════════════════════
  @ApiProperty({ 
    description: 'Optional date range filter',
    required: false,
    default: { includeAll: true }
  })
  dateRange?: DateRangeDto;
  // ═══════════════════════════════════════════════════════════
}
```

### **Service Implementation:**

```typescript
// apps/data-prep-service/src/data-prep.service.ts

@Injectable()
export class DataPrepService {
  
  async analyzeMultiBank(dto: AnalyzeMultiBankDto) {
    const bankAnalyses = [];
    
    // Analyze each bank file
    for (const bankFile of dto.bankFiles) {
      const data = await this.parseCSV(bankFile.file);
      const dateRange = this.detectDateRange(data.rows);
      const suggestions = await this.columnMappingService.autoDetect(
        data.headers,
        data.rows
      );
      
      bankAnalyses.push({
        bankId: this.generateBankId(),
        bankName: bankFile.bankName,
        columns: data.headers,
        suggestions,
        dateRange,
        totalRecords: data.rows.length
      });
    }
    
    // Analyze ledger file
    const ledgerData = await this.parseCSV(dto.ledgerFile);
    const ledgerDateRange = this.detectDateRange(ledgerData.rows);
    const ledgerSuggestions = await this.columnMappingService.autoDetect(
      ledgerData.headers,
      ledgerData.rows
    );
    
    // Calculate suggested date range (overlap)
    const suggestedRange = this.calculateOptimalDateRange(
      bankAnalyses,
      ledgerDateRange
    );
    
    // Check for date mismatches
    const hasDateMismatch = this.checkDateMismatch(
      bankAnalyses,
      ledgerDateRange
    );
    
    return {
      banks: bankAnalyses,
      ledger: {
        columns: ledgerData.headers,
        suggestions: ledgerSuggestions,
        dateRange: ledgerDateRange,
        totalRecords: ledgerData.rows.length
      },
      dateRangeAnalysis: {
        bankDateRange: {
          earliest: this.getEarliestDate(bankAnalyses),
          latest: this.getLatestDate(bankAnalyses),
          totalTransactions: this.getTotalTransactions(bankAnalyses)
        },
        ledgerDateRange: {
          earliest: ledgerDateRange.earliest,
          latest: ledgerDateRange.latest,
          totalTransactions: ledgerData.rows.length
        },
        suggestedRange,
        hasDateMismatch
      }
    };
  }
  
  async validateAndPrepare(dto: ValidateAndPrepareDto) {
    // Validate core field mappings for each bank
    for (const bankMapping of dto.bankMappings) {
      this.validateCoreMappings(bankMapping.columnMapping, `Bank: ${bankMapping.bankName}`);
    }
    this.validateCoreMappings(dto.ledgerMapping.columnMapping, 'Ledger');
    
    // Normalize each bank file
    const normalizedBanks: Record<string, TransactionDto[]> = {};
    
    for (const bankMapping of dto.bankMappings) {
      const data = await this.parseCSV(bankMapping.file);
      
      // ═══════════════════════════════════════════════════════════
      // Apply optional date range filter (default: no filtering)
      // ═══════════════════════════════════════════════════════════
      const normalized = this.normalizeData(
        data.rows,
        bankMapping.columnMapping,
        'bank',
        bankMapping.bankName,
        dto.dateRange  // Optional - defaults to { includeAll: true }
      );
      
      normalizedBanks[bankMapping.bankId] = normalized;
    }
    
    // Normalize ledger file
    const ledgerData = await this.parseCSV(dto.ledgerMapping.file);
    const normalizedLedger = this.normalizeData(
      ledgerData.rows,
      dto.ledgerMapping.columnMapping,
      'ledger',
      undefined,
      dto.dateRange
    );
    
    // Generate field profile
    const fieldProfile = this.generateFieldProfile(
      normalizedBanks,
      normalizedLedger
    );
    
    // Calculate filtered counts
    const bankFileMetadata = Object.entries(normalizedBanks).map(([bankId, txns]) => {
      const bankMapping = dto.bankMappings.find(b => b.bankId === bankId);
      return {
        fileId: bankId,
        bankName: bankMapping.bankName,
        filename: bankMapping.file.originalname,
        totalRecords: this.getTotalRecordsFromFile(bankMapping.file),
        filteredRecords: txns.length,
        excludedRecords: this.getTotalRecordsFromFile(bankMapping.file) - txns.length,
        columnMapping: bankMapping.columnMapping,
        dateRange: this.getDateRangeFromTransactions(txns),
        uploadedAt: new Date()
      };
    });
    
    return {
      status: 'ready',
      totalTxns: Object.values(normalizedBanks).flat().length + normalizedLedger.length,
      diagnostics: {
        bankFiles: bankFileMetadata,
        ledgerFile: {
          // ... similar metadata
        },
        fieldProfile,
        dateRangeApplied: dto.dateRange?.includeAll === false
      }
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // Normalize data with OPTIONAL date filtering
  // ═══════════════════════════════════════════════════════════
  private normalizeData(
    rows: any[],
    mapping: Record<string, string>,
    source: 'bank' | 'ledger',
    bankName?: string,
    dateRange?: DateRangeDto
  ): TransactionDto[] {
    
    let filteredRows = rows;
    
    // ═══════════════════════════════════════════════════════════
    // Apply date range filter ONLY if includeAll = false
    // ═══════════════════════════════════════════════════════════
    if (dateRange && !dateRange.includeAll && dateRange.fromDate && dateRange.toDate) {
      const fromDate = new Date(dateRange.fromDate);
      const toDate = new Date(dateRange.toDate);
      
      filteredRows = rows.filter(row => {
        const dateField = this.findDateColumn(row, mapping);
        const txnDate = new Date(row[dateField]);
        
        return txnDate >= fromDate && txnDate <= toDate;
      });
    }
    // ═══════════════════════════════════════════════════════════
    
    return filteredRows.map((row, index) => {
      const transaction: Partial<TransactionDto> = {
        id: this.generateId(source, bankName, index),
        source,
        bankId: source === 'bank' ? this.generateBankId(bankName) : undefined,
        bankName: source === 'bank' ? bankName : undefined,
        status: 'unmatched',
        reconciliationId: 'temp',
      };
      
      // Map core fields
      for (const [sourceCol, targetField] of Object.entries(mapping)) {
        const value = row[sourceCol];
        
        if (targetField === 'core.date') {
          transaction.date = this.normalizeDate(value);
        } else if (targetField === 'core.amount') {
          transaction.amount = this.normalizeAmount(value);
        } else if (targetField === 'core.description') {
          transaction.description = this.normalizeDescription(value);
        } else if (targetField.startsWith('optional.')) {
          const optField = targetField.replace('optional.', '');
          transaction.optional = transaction.optional || {};
          transaction.optional[optField] = this.normalizeOptionalField(optField, value);
        } else if (targetField.startsWith('metadata.')) {
          const metaField = targetField.replace('metadata.', '');
          transaction.metadata = transaction.metadata || {};
          transaction.metadata[metaField] = value;
        }
      }
      
      return transaction as TransactionDto;
    });
  }
}
```

---

## 📋 UPDATED IMPLEMENTATION CHECKLIST

### **Phase 1: Project Setup (Steps 1-5)**
- [ ] Step 1: Initialize NestJS monorepo
- [ ] Step 2: Create shared library structure
- [ ] Step 3: Set up TypeORM + PostgreSQL
- [ ] Step 4: Create base DTOs (with multi-bank + date range)
- [ ] Step 5: Verify project builds

### **Phase 2: Data Prep Service (Steps 6-12)**
- [ ] Step 6: Create Data Prep microservice scaffold
- [ ] Step 7: Implement multi-file upload support
- [ ] Step 8: Implement per-bank column detection
- [ ] Step 9: Implement date range detection & analysis
- [ ] Step 10: Implement optional date filtering during normalization
- [ ] Step 11: Add REST endpoints (analyze-multi-bank, validate-and-prepare)
- [ ] Step 12: Test with multiple banks + date filtering

### **Phase 3: State Manager Service (Steps 13-18)**
- [ ] Step 13: Create State Manager scaffold
- [ ] Step 14: Create entities (Reconciliation, BankFile, LedgerFile, Transaction)
- [ ] Step 15: Implement multi-bank transaction storage
- [ ] Step 16: Implement state persistence with date range metadata
- [ ] Step 17: Create REST endpoints
- [ ] Step 18: Test State Manager service

---

## 🎯 KEY BEHAVIORS

### **Default Behavior (No Date Filter):**
```
User uploads files → System analyzes → Shows detected date ranges
→ User proceeds without selecting date range
→ System processes ALL transactions
→ dateRange = { includeAll: true }
```

### **Optional Date Filter:**
```
User uploads files → System analyzes → Shows detected date ranges
→ User clicks "Custom Date Range"
→ User selects: Jan 1 - Jan 15
→ System filters transactions during normalization
→ dateRange = { includeAll: false, fromDate: "2025-01-01", toDate: "2025-01-15" }
→ Only Jan 1-15 transactions processed
```

### **Multi-Bank Handling:**
```
Each bank file:
  → Has unique bankId
  → Has unique column mapping (can differ per bank)
  → Transactions tagged with bankId and bankName
  → Date filtering applied independently per bank
```

---

## ✅ SUMMARY OF CHANGES

### **Added:**
1. ✅ Multi-bank support (BankFile entity, bankId in transactions)
2. ✅ Optional date range filtering (DateRangeDto, default = all)
3. ✅ Per-bank column mapping
4. ✅ Date range detection and analysis
5. ✅ Bank-specific field profiles

### **Default Behaviors:**
1. ✅ Date filtering OFF by default (includeAll = true)
2. ✅ Process all transactions unless user explicitly filters
3. ✅ Support 1 to N bank files (no limit)
4. ✅ Each bank can have different column structures

---

**All documents will be updated with these changes. Proceeding to update remaining files...**
