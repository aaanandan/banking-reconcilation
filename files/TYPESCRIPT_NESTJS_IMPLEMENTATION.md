# BANKING RECONCILIATION SYSTEM - TYPESCRIPT/NESTJS IMPLEMENTATION

## Complete NestJS Microservice Architecture with TypeScript

---

## TABLE OF CONTENTS

1. [Project Structure](#project-structure)
2. [Core DTOs & Interfaces](#core-dtos-and-interfaces)
3. [Data Prep Service (NestJS)](#data-prep-service)
4. [Matching Service (MT-02 Example)](#matching-service-example)
5. [Orchestrator Service](#orchestrator-service)
6. [Learning Service](#learning-service)
7. [State Manager Service](#state-manager-service)
8. [API Contracts](#api-contracts)

---

## PROJECT STRUCTURE

```
banking-reconciliation-system/
│
├── apps/
│   ├── data-prep-service/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── column-mapping/
│   │   │   │   ├── validation/
│   │   │   │   └── normalization/
│   │   │   ├── data-prep.controller.ts
│   │   │   ├── data-prep.service.ts
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   ├── orchestrator-service/
│   │   ├── src/
│   │   │   ├── orchestrator.controller.ts
│   │   │   ├── orchestrator.service.ts
│   │   │   ├── ml-model.service.ts
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   ├── matching-services/
│   │   ├── mt-01-exact-match/
│   │   ├── mt-02-near-exact/
│   │   ├── mt-03-bank-fees/
│   │   └── ... (MT-04 through MT-16)
│   │
│   ├── learning-service/
│   ├── state-manager-service/
│   ├── safety-service/
│   └── threshold-calculator-service/
│
├── libs/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── dto/
│   │   │   ├── interfaces/
│   │   │   ├── entities/
│   │   │   └── utils/
│   │   └── package.json
│   └── common/
│
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## CORE DTOs & INTERFACES

### Transaction DTOs

```typescript
// libs/shared/src/dto/transaction.dto.ts

import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Core Transaction DTO
 * Contains ONLY the mandatory fields required for reconciliation
 */
export class CoreTransactionDto {
  @ApiProperty({ description: 'Transaction date in ISO format' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Transaction amount (absolute value)' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Transaction description/narration' })
  @IsNotEmpty()
  @IsString()
  description: string;
}

/**
 * Optional Transaction Fields
 * Used for weight calculation and additional matching suggestions
 */
export class OptionalTransactionFieldsDto {
  @ApiPropertyOptional({ description: 'Transaction type: credit or debit' })
  @IsOptional()
  @IsString()
  txnType?: 'credit' | 'debit';

  @ApiPropertyOptional({ description: 'Reference number / Transaction ID' })
  @IsOptional()
  @IsString()
  refNumber?: string;

  @ApiPropertyOptional({ description: 'Payer or Payee name' })
  @IsOptional()
  @IsString()
  payerPayee?: string;

  @ApiPropertyOptional({ description: 'Currency code (ISO 4217)' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Running balance after transaction' })
  @IsOptional()
  @IsNumber()
  runningBalance?: number;

  @ApiPropertyOptional({ description: 'Check number' })
  @IsOptional()
  @IsString()
  checkNumber?: string;

  @ApiPropertyOptional({ description: 'Transaction category' })
  @IsOptional()
  @IsString()
  category?: string;
}

/**
 * Complete Transaction DTO
 * Combines core fields + optional fields + metadata
 * 
 * UPDATED: Added multi-bank support (bankId, bankName)
 */
export class TransactionDto extends CoreTransactionDto {
  @ApiProperty({ description: 'Unique transaction ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Source: bank or ledger' })
  @IsString()
  source: 'bank' | 'ledger';

  // ═══════════════════════════════════════════════════════════
  // MULTI-BANK SUPPORT: Added bankId and bankName
  // ═══════════════════════════════════════════════════════════
  @ApiPropertyOptional({ description: 'Bank identifier (e.g., bank_1, bank_2) - only for bank transactions' })
  @IsOptional()
  @IsString()
  bankId?: string;

  @ApiPropertyOptional({ description: 'Bank name (e.g., HDFC, ICICI, SBI) - only for bank transactions' })
  @IsOptional()
  @IsString()
  bankName?: string;
  // ═══════════════════════════════════════════════════════════

  @ApiPropertyOptional({ description: 'Optional transaction fields' })
  @IsOptional()
  optional?: OptionalTransactionFieldsDto;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON' })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Transaction status' })
  @IsString()
  status: 'unmatched' | 'staged' | 'committed' | 'manual';

  @ApiPropertyOptional({ description: 'Matched transaction ID (if matched)' })
  @IsOptional()
  @IsNumber()
  matchedToId?: number;

  @ApiProperty({ description: 'Reconciliation session ID' })
  @IsString()
  reconciliationId: string;
}
```

### Multi-Bank & Date Range DTOs (NEW)

```typescript
// libs/shared/src/dto/date-range.dto.ts

import { IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Date Range Filter DTO
 * Optional filtering - defaults to processing ALL transactions
 */
export class DateRangeDto {
  @ApiProperty({ 
    description: 'Include all transactions (default: true)',
    default: true 
  })
  @IsBoolean()
  includeAll: boolean = true;  // DEFAULT = true (no filtering)

  @ApiPropertyOptional({ 
    description: 'Start date (ISO format) - only used if includeAll = false' 
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ 
    description: 'End date (ISO format) - only used if includeAll = false' 
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

/**
 * Date Range Analysis DTO
 * Shows detected date ranges in uploaded files
 */
export class DateRangeAnalysisDto {
  @ApiProperty({ description: 'Date range detected across all bank files' })
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

  @ApiPropertyOptional({ description: 'Suggested overlap period (optimal range)' })
  suggestedRange?: {
    from: string;
    to: string;
    coverage: number;  // % of transactions in this range
  };

  @ApiProperty({ description: 'Whether bank and ledger have mismatched date ranges' })
  hasDateMismatch: boolean;
}

// libs/shared/src/dto/file-metadata.dto.ts

/**
 * Bank File Metadata DTO
 * For multi-bank support - one entry per bank file
 */
export class BankFileMetadataDto {
  @ApiProperty({ description: 'Unique file identifier' })
  @IsString()
  fileId: string;

  @ApiProperty({ description: 'Bank identifier (bank_1, bank_2, etc.)' })
  @IsString()
  bankId: string;

  @ApiProperty({ description: 'Bank name (HDFC, ICICI, SBI, etc.)' })
  @IsString()
  bankName: string;

  @ApiProperty({ description: 'Original filename' })
  @IsString()
  filename: string;

  @ApiProperty({ description: 'Upload timestamp' })
  uploadedAt: Date;

  @ApiProperty({ description: 'Total records in file' })
  @IsNumber()
  totalRecords: number;

  @ApiProperty({ description: 'Records after date filter applied' })
  @IsNumber()
  filteredRecords: number;

  @ApiProperty({ description: 'Records excluded by date filter' })
  @IsNumber()
  excludedRecords: number;

  @ApiProperty({ description: 'Column mapping configuration' })
  columnMapping: Record<string, string>;

  @ApiProperty({ description: 'Actual date range present in this bank file' })
  dateRange: {
    earliest: string;
    latest: string;
  };
}

/**
 * Ledger File Metadata DTO
 * Single ledger file per reconciliation
 */
export class LedgerFileMetadataDto {
  @ApiProperty({ description: 'Unique file identifier' })
  @IsString()
  fileId: string;

  @ApiProperty({ description: 'Original filename' })
  @IsString()
  filename: string;

  @ApiProperty({ description: 'Upload timestamp' })
  uploadedAt: Date;

  @ApiProperty({ description: 'Total records in file' })
  @IsNumber()
  totalRecords: number;

  @ApiProperty({ description: 'Records after date filter applied' })
  @IsNumber()
  filteredRecords: number;

  @ApiProperty({ description: 'Records excluded by date filter' })
  @IsNumber()
  excludedRecords: number;

  @ApiProperty({ description: 'Column mapping configuration' })
  columnMapping: Record<string, string>;

  @ApiProperty({ description: 'Actual date range present in ledger file' })
  dateRange: {
    earliest: string;
    latest: string;
  };
}
```

### Field Profile DTOs

```typescript
// libs/shared/src/dto/field-profile.dto.ts

export class FieldQualityDto {
  present: boolean;
  populatedRate: number; // 0.0 to 1.0
  qualityScore: number; // 0.0 to 1.0
  format?: string;
  avgLength?: number;
  uniqueness?: number; // For fields like ref_number
  diversity?: number; // For fields like payer_payee
  pattern?: string; // Regex pattern if detected
}

export class CoreFieldsProfileDto {
  date: FieldQualityDto;
  amount: FieldQualityDto;
  description: FieldQualityDto;
}

export class OptionalFieldsProfileDto {
  refNumber?: FieldQualityDto;
  txnType?: FieldQualityDto;
  payerPayee?: FieldQualityDto;
  currency?: FieldQualityDto;
  runningBalance?: FieldQualityDto;
  checkNumber?: FieldQualityDto;
  category?: FieldQualityDto;
}

export class FileProfileDto {
  totalRecords: number;
  coreFields: CoreFieldsProfileDto;
  optionalFields: OptionalFieldsProfileDto;
  metadataFields?: Record<string, FieldQualityDto>;
}

export class CompatibilityAnalysisDto {
  refNumber?: {
    bothPresent: boolean;
    overlapRate: number; // % of transactions with matching refs
    formatCompatible: boolean;
    matchingPotential: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  txnType?: {
    bothPresent: boolean;
    normalized: boolean;
    matchingPotential: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  payerPayee?: {
    bothPresent: boolean;
    bankMissing?: boolean;
    ledgerMissing?: boolean;
    matchingPotential: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

export class FieldProfileDto {
  reconciliationId: string;
  timestamp: Date;
  
  // ═══════════════════════════════════════════════════════════
  // UPDATED: Multi-bank support - banks is now a Record of bank profiles
  // ═══════════════════════════════════════════════════════════
  banks: Record<string, {
    bankId: string;
    bankName: string;
    profile: FileProfileDto;
  }>;
  // ═══════════════════════════════════════════════════════════
  
  ledger: FileProfileDto;
  compatibilityAnalysis: CompatibilityAnalysisDto;
  recommendedStrategy: {
    prioritizeRefMatching: boolean;
    enableTxnTypeSafety: boolean;
    usePayerFuzzyBoost: boolean;
    skipCurrencySteps: boolean;
    expectedExactMatchRate: number;
  };
}
```

### Matching DTOs

```typescript
// libs/shared/src/dto/matching.dto.ts

export class MatchThresholdsDto {
  dateTolerance: number; // Days
  amountTolerance: number; // Percentage or absolute value
  descriptionSimilarity: number; // 0.0 to 1.0
  minConfidence: number; // Minimum confidence to consider a match
}

export class MatchScoresDto {
  date: number; // 0.0 to 1.0
  amount: number; // 0.0 to 1.0
  description: number; // 0.0 to 1.0
  enhancement: number; // 0.0 to 1.0 (from optional fields)
  base: number; // Core fields score
}

export class MatchCandidateDto {
  bankId: number;
  ledgerId: number;
  confidence: number; // 0.0 to 1.0
  scores: MatchScoresDto;
  matchBasis: string[]; // e.g., ['date', 'amount', 'description']
  reasoning: string;
  veto?: boolean;
  vetoReason?: string;
}

export class AdditionalMatchCandidateDto {
  bankId: number;
  ledgerId: number;
  confidence: number;
  matchedOn: string; // e.g., 'ref_number', 'payer_payee'
  coreScore: number; // Score on core fields alone
  additionalScore: number; // Boost from additional field
  reasoning: string;
}

export class MatchResultDto {
  step: string;
  primaryCandidates: MatchCandidateDto[]; // Based on core fields
  additionalCandidates: AdditionalMatchCandidateDto[]; // Based on optional fields
  fieldUsage: {
    coreFieldsUsed: string[];
    refNumberMatched: number;
    payerUsed: number;
    txnTypeVetoed: number;
    avgConfidence: number;
  };
}
```

---

## DATA PREP SERVICE

### Column Mapping Module

```typescript
// apps/data-prep-service/src/modules/column-mapping/column-mapping.service.ts

import { Injectable } from '@nestjs/common';

interface ColumnSuggestion {
  sourceColumn: string;
  targetField: string;
  confidence: number;
}

@Injectable()
export class ColumnMappingService {
  /**
   * Auto-detect column mappings using heuristics
   */
  async autoDetectMappings(
    headers: string[],
    sampleData: Record<string, any>[],
  ): Promise<ColumnSuggestion[]> {
    const suggestions: ColumnSuggestion[] = [];

    for (const col of headers) {
      const colLower = col.toLowerCase().trim();
      const samples = sampleData.map(row => row[col]);

      // Date detection
      if (this.isDateColumn(colLower, samples)) {
        suggestions.push({
          sourceColumn: col,
          targetField: 'core.date',
          confidence: 0.95,
        });
      }
      // Amount detection
      else if (this.isAmountColumn(colLower, samples)) {
        suggestions.push({
          sourceColumn: col,
          targetField: 'core.amount',
          confidence: 0.90,
        });
      }
      // Description detection
      else if (this.isDescriptionColumn(colLower, samples)) {
        suggestions.push({
          sourceColumn: col,
          targetField: 'core.description',
          confidence: 0.85,
        });
      }
      // Transaction type detection
      else if (this.isTxnTypeColumn(colLower, samples)) {
        suggestions.push({
          sourceColumn: col,
          targetField: 'optional.txnType',
          confidence: 0.80,
        });
      }
      // Reference number detection
      else if (this.isRefNumberColumn(colLower, samples)) {
        suggestions.push({
          sourceColumn: col,
          targetField: 'optional.refNumber',
          confidence: 0.75,
        });
      }
      // Payer/Payee detection
      else if (this.isPayerColumn(colLower, samples)) {
        suggestions.push({
          sourceColumn: col,
          targetField: 'optional.payerPayee',
          confidence: 0.70,
        });
      }
      // Everything else → metadata
      else {
        suggestions.push({
          sourceColumn: col,
          targetField: `metadata.${col}`,
          confidence: 0.50,
        });
      }
    }

    return suggestions;
  }

  private isDateColumn(colName: string, samples: any[]): boolean {
    const dateKeywords = ['date', 'dt', 'time', 'when', 'day'];
    const hasKeyword = dateKeywords.some(kw => colName.includes(kw));

    if (!hasKeyword) return false;

    // Check if sample data looks like dates
    const validDates = samples.filter(val => {
      try {
        const date = new Date(val);
        return !isNaN(date.getTime());
      } catch {
        return false;
      }
    });

    return validDates.length / samples.length > 0.8;
  }

  private isAmountColumn(colName: string, samples: any[]): boolean {
    const amountKeywords = ['amount', 'amt', 'value', 'total', 'sum', 'price'];
    const hasKeyword = amountKeywords.some(kw => colName.includes(kw));

    if (!hasKeyword) return false;

    // Check if sample data is numeric
    const validNumbers = samples.filter(val => {
      const num = parseFloat(val);
      return !isNaN(num);
    });

    return validNumbers.length / samples.length > 0.9;
  }

  private isDescriptionColumn(colName: string, samples: any[]): boolean {
    const descKeywords = [
      'description', 'desc', 'narration', 'particulars', 
      'details', 'narrative', 'remarks'
    ];
    return descKeywords.some(kw => colName.includes(kw));
  }

  private isTxnTypeColumn(colName: string, samples: any[]): boolean {
    const typeKeywords = ['type', 'cr/dr', 'credit/debit', 'transaction type', 'dr/cr'];
    const hasKeyword = typeKeywords.some(kw => colName.includes(kw));

    if (!hasKeyword) return false;

    // Check if values are credit/debit variants
    const upperSamples = samples.map(v => String(v).toUpperCase());
    const creditDebitValues = ['CR', 'DR', 'C', 'D', 'CREDIT', 'DEBIT'];
    const matchCount = upperSamples.filter(v => 
      creditDebitValues.some(cd => v.includes(cd))
    ).length;

    return matchCount / samples.length > 0.7;
  }

  private isRefNumberColumn(colName: string, samples: any[]): boolean {
    const refKeywords = [
      'ref', 'reference', 'refno', 'transaction id', 
      'txn id', 'voucher', 'receipt'
    ];
    return refKeywords.some(kw => colName.includes(kw));
  }

  private isPayerColumn(colName: string, samples: any[]): boolean {
    const payerKeywords = [
      'payer', 'payee', 'name', 'party', 'vendor', 
      'customer', 'client', 'beneficiary'
    ];
    return payerKeywords.some(kw => colName.includes(kw));
  }
}
```

### Data Prep Controller & Service

```typescript
// apps/data-prep-service/src/data-prep.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { DataPrepService } from './data-prep.service';
import { DateRangeDto } from '@app/shared/dto/date-range.dto';

// ═══════════════════════════════════════════════════════════
// UPDATED: Multi-bank support - accept array of bank files
// ═══════════════════════════════════════════════════════════
class AnalyzeMultiBankDto {
  @ApiProperty({ 
    description: 'Array of bank files with bank names',
    type: 'array'
  })
  bankFiles: Array<{
    file: any;              // File upload (handled by Multer)
    bankName: string;       // User-provided name: "HDFC", "ICICI", etc.
  }>;

  @ApiProperty({ description: 'Single ledger file' })
  ledgerFile: any;          // File upload
}

class ValidateAndPrepareDto {
  @ApiProperty({ 
    description: 'Array of bank file mappings',
    type: 'array'
  })
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
  // NEW: Optional date range filter (default: process all)
  // ═══════════════════════════════════════════════════════════
  @ApiProperty({ 
    description: 'Optional date range filter (default: includeAll = true)',
    required: false
  })
  dateRange?: DateRangeDto;
}
// ═══════════════════════════════════════════════════════════

@ApiTags('Data Preparation')
@Controller('data-prep')
export class DataPrepController {
  constructor(private readonly dataPrepService: DataPrepService) {}

  // ═══════════════════════════════════════════════════════════
  // NEW: Multi-bank analysis endpoint
  // ═══════════════════════════════════════════════════════════
  @Post('analyze-multi-bank')
  @ApiOperation({ 
    summary: 'Analyze multiple bank files and ledger, detect date ranges',
    description: 'Supports multi-bank reconciliation. Returns column suggestions and date range analysis for each bank.'
  })
  async analyzeMultiBank(@Body() dto: AnalyzeMultiBankDto) {
    return this.dataPrepService.analyzeMultiBank(dto);
  }
  // ═══════════════════════════════════════════════════════════

  @Post('validate-and-prepare')
  @ApiOperation({ 
    summary: 'Validate mappings and prepare normalized data',
    description: 'Supports multi-bank and optional date filtering. Returns normalized transactions ready for matching.'
  })
  async validateAndPrepare(@Body() dto: ValidateAndPrepareDto) {
    return this.dataPrepService.validateAndPrepare(dto);
  }
}
```

```typescript
// apps/data-prep-service/src/data-prep.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { ColumnMappingService } from './modules/column-mapping/column-mapping.service';
import { FieldProfileDto, FileProfileDto } from '@app/shared/dto/field-profile.dto';

@Injectable()
export class DataPrepService {
  constructor(
    private readonly columnMappingService: ColumnMappingService,
  ) {}

  async analyzeFiles(bankFile: any, ledgerFile: any) {
    // Parse CSV files (use papaparse or similar)
    const bankData = await this.parseCSV(bankFile);
    const ledgerData = await this.parseCSV(ledgerFile);

    // Auto-detect mappings
    const bankSuggestions = await this.columnMappingService.autoDetectMappings(
      bankData.headers,
      bankData.rows.slice(0, 100), // First 100 rows for analysis
    );

    const ledgerSuggestions = await this.columnMappingService.autoDetectMappings(
      ledgerData.headers,
      ledgerData.rows.slice(0, 100),
    );

    // Generate warnings
    const warnings = this.generateWarnings(bankSuggestions, ledgerSuggestions);

    return {
      bankColumns: bankData.headers,
      bankSuggestions: this.formatSuggestions(bankSuggestions),
      ledgerColumns: ledgerData.headers,
      ledgerSuggestions: this.formatSuggestions(ledgerSuggestions),
      warnings,
    };
  }

  async validateAndPrepare(dto: ValidateAndPrepareDto) {
    // Validate core fields are mapped
    this.validateCoreMappings(dto.bankMapping, 'Bank');
    this.validateCoreMappings(dto.ledgerMapping, 'Ledger');

    // Parse and normalize data
    const bankData = await this.parseCSV(dto.bankFile);
    const ledgerData = await this.parseCSV(dto.ledgerFile);

    const normalizedBank = this.normalizeData(
      bankData.rows,
      dto.bankMapping,
      'bank',
    );

    const normalizedLedger = this.normalizeData(
      ledgerData.rows,
      dto.ledgerMapping,
      'ledger',
    );

    // Generate field profile
    const fieldProfile = this.generateFieldProfile(
      normalizedBank,
      normalizedLedger,
    );

    // Store in State Manager (would call State Manager service here)
    // await this.stateManagerClient.storeTransactions(...)

    return {
      status: 'ready',
      totalTxns: normalizedBank.length + normalizedLedger.length,
      diagnostics: fieldProfile,
    };
  }

  private validateCoreMappings(mapping: Record<string, string>, source: string) {
    const requiredFields = ['core.date', 'core.amount', 'core.description'];
    const mappedFields = Object.values(mapping);

    for (const required of requiredFields) {
      if (!mappedFields.includes(required)) {
        throw new BadRequestException(
          `${source}: Missing required field mapping - ${required}`,
        );
      }
    }
  }

  private normalizeData(
    rows: any[],
    mapping: Record<string, string>,
    source: 'bank' | 'ledger',
  ): TransactionDto[] {
    return rows.map((row, index) => {
      const transaction: Partial<TransactionDto> = {
        id: index + 1,
        source,
        status: 'unmatched',
        reconciliationId: 'temp', // Will be set by State Manager
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
          transaction.optional[optField] = this.normalizeOptionalField(
            optField,
            value,
          );
        } else if (targetField.startsWith('metadata.')) {
          const metaField = targetField.replace('metadata.', '');
          transaction.metadata = transaction.metadata || {};
          transaction.metadata[metaField] = value;
        }
      }

      return transaction as TransactionDto;
    });
  }

  private normalizeDate(value: any): string {
    const date = new Date(value);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private normalizeAmount(value: any): number {
    return Math.abs(parseFloat(value));
  }

  private normalizeDescription(value: any): string {
    return String(value).trim();
  }

  private normalizeOptionalField(field: string, value: any): any {
    if (field === 'txnType') {
      const upper = String(value).toUpperCase();
      if (['CR', 'C', 'CREDIT', 'IN', '+'].some(v => upper.includes(v))) {
        return 'credit';
      } else if (['DR', 'D', 'DEBIT', 'OUT', '-'].some(v => upper.includes(v))) {
        return 'debit';
      }
      return 'unknown';
    }

    if (field === 'refNumber') {
      // Strip common prefixes
      return String(value).replace(/^(REF-|TXN-|#)/, '').trim();
    }

    return value;
  }

  private generateFieldProfile(
    bankTxns: TransactionDto[],
    ledgerTxns: TransactionDto[],
  ): FieldProfileDto {
    // Implementation would analyze the normalized data
    // and generate comprehensive field profile
    // ... (similar to previous Python examples)
    return {} as FieldProfileDto; // Placeholder
  }

  private parseCSV(file: any): Promise<{ headers: string[]; rows: any[] }> {
    // Implementation using papaparse or similar library
    return Promise.resolve({ headers: [], rows: [] }); // Placeholder
  }

  private formatSuggestions(suggestions: any[]) {
    return suggestions.reduce((acc, s) => {
      acc[s.sourceColumn] = s.targetField;
      return acc;
    }, {});
  }

  private generateWarnings(bankSugg: any[], ledgerSugg: any[]): string[] {
    const warnings: string[] = [];

    const bankHasRef = bankSugg.some(s => s.targetField === 'optional.refNumber');
    const ledgerHasRef = ledgerSugg.some(s => s.targetField === 'optional.refNumber');

    if (!bankHasRef || !ledgerHasRef) {
      warnings.push('Reference numbers not detected in one or both files');
    }

    const bankHasPayer = bankSugg.some(s => s.targetField === 'optional.payerPayee');
    const ledgerHasPayer = ledgerSugg.some(s => s.targetField === 'optional.payerPayee');

    if (!bankHasPayer && !ledgerHasPayer) {
      warnings.push('No payer/payee columns detected - matching accuracy may be lower');
    }

    return warnings;
  }
}
```

---

## MATCHING SERVICE EXAMPLE (MT-02)

### Near-Exact Match Service

```typescript
// apps/matching-services/mt-02-near-exact/src/mt-02.service.ts

import { Injectable } from '@nestjs/common';
import {
  TransactionDto,
  MatchThresholdsDto,
  MatchResultDto,
  MatchCandidateDto,
  AdditionalMatchCandidateDto,
} from '@app/shared/dto';
import { FieldProfileDto } from '@app/shared/dto/field-profile.dto';

@Injectable()
export class NearExactMatchService {
  /**
   * Find matches using core fields primarily,
   * then use optional fields to find additional candidates
   */
  async findMatches(
    bankTxns: TransactionDto[],
    ledgerPool: TransactionDto[],
    thresholds: MatchThresholdsDto,
    fieldProfile: FieldProfileDto,
  ): Promise<MatchResultDto> {
    const primaryCandidates: MatchCandidateDto[] = [];
    const additionalCandidates: AdditionalMatchCandidateDto[] = [];

    // Track field usage
    let refNumberMatched = 0;
    let payerUsed = 0;
    let txnTypeVetoed = 0;

    for (const bankTxn of bankTxns) {
      // ════════════════════════════════════════════════════════
      // STEP 1: PRIMARY MATCHING (Core Fields Only)
      // ════════════════════════════════════════════════════════

      const coreMatches = this.findCoreMatches(
        bankTxn,
        ledgerPool,
        thresholds,
        fieldProfile,
      );

      primaryCandidates.push(...coreMatches.candidates);
      txnTypeVetoed += coreMatches.vetoed;

      // ════════════════════════════════════════════════════════
      // STEP 2: ADDITIONAL MATCHING (Using Optional Fields)
      // ════════════════════════════════════════════════════════

      const additionalMatches = this.findAdditionalMatches(
        bankTxn,
        ledgerPool,
        thresholds,
        fieldProfile,
        coreMatches.candidates, // Exclude primary matches
      );

      additionalCandidates.push(...additionalMatches.candidates);
      refNumberMatched += additionalMatches.refMatches;
      payerUsed += additionalMatches.payerMatches;
    }

    return {
      step: 'MT-02',
      primaryCandidates,
      additionalCandidates,
      fieldUsage: {
        coreFieldsUsed: ['date', 'amount', 'description'],
        refNumberMatched,
        payerUsed,
        txnTypeVetoed,
        avgConfidence: this.calculateAvgConfidence(primaryCandidates),
      },
    };
  }

  /**
   * Find matches using ONLY core fields (date, amount, description)
   */
  private findCoreMatches(
    bankTxn: TransactionDto,
    ledgerPool: TransactionDto[],
    thresholds: MatchThresholdsDto,
    fieldProfile: FieldProfileDto,
  ): { candidates: MatchCandidateDto[]; vetoed: number } {
    const candidates: MatchCandidateDto[] = [];
    let vetoed = 0;

    const hasBothTxnTypes =
      fieldProfile.bank.optionalFields.txnType?.present &&
      fieldProfile.ledger.optionalFields.txnType?.present;

    for (const ledgerTxn of ledgerPool) {
      // Core field matching
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
        thresholds.descriptionSimilarity,
      );

      // Base score (100% from core fields in primary matching)
      const baseScore = dateScore * 0.30 + amountScore * 0.40 + descScore * 0.30;

      const matchBasis = ['date', 'amount', 'description'];

      // Transaction type safety check
      let veto = false;
      let vetoReason: string | undefined;

      if (hasBothTxnTypes) {
        if (
          bankTxn.optional?.txnType &&
          ledgerTxn.optional?.txnType &&
          bankTxn.optional.txnType !== ledgerTxn.optional.txnType
        ) {
          veto = true;
          vetoReason = 'transaction_type_mismatch';
          vetoed++;
        }
      }

      const confidence = veto ? 0.0 : baseScore;

      if (confidence >= thresholds.minConfidence || veto) {
        candidates.push({
          bankId: bankTxn.id,
          ledgerId: ledgerTxn.id,
          confidence,
          scores: {
            date: dateScore,
            amount: amountScore,
            description: descScore,
            enhancement: 0, // No enhancement in core matching
            base: baseScore,
          },
          matchBasis,
          reasoning: this.generateReasoning(matchBasis, confidence, vetoReason),
          veto,
          vetoReason,
        });
      }
    }

    return { candidates, vetoed };
  }

  /**
   * Find ADDITIONAL matches using optional fields
   * These are candidates that might not score high on core fields
   * but have strong signals in optional fields (ref_number, payer, etc.)
   */
  private findAdditionalMatches(
    bankTxn: TransactionDto,
    ledgerPool: TransactionDto[],
    thresholds: MatchThresholdsDto,
    fieldProfile: FieldProfileDto,
    primaryCandidates: MatchCandidateDto[],
  ): { candidates: AdditionalMatchCandidateDto[]; refMatches: number; payerMatches: number } {
    const candidates: AdditionalMatchCandidateDto[] = [];
    let refMatches = 0;
    let payerMatches = 0;

    // Extract IDs of ledger transactions already in primary matches
    const primaryLedgerIds = new Set(primaryCandidates.map(c => c.ledgerId));

    const hasBothRefs =
      fieldProfile.bank.optionalFields.refNumber?.present &&
      fieldProfile.ledger.optionalFields.refNumber?.present;

    const hasLedgerPayer = fieldProfile.ledger.optionalFields.payerPayee?.present;

    for (const ledgerTxn of ledgerPool) {
      // Skip if already in primary candidates
      if (primaryLedgerIds.has(ledgerTxn.id)) continue;

      // Calculate core score (for comparison)
      const coreScore = this.calculateCoreScore(bankTxn, ledgerTxn, thresholds);

      // ────────────────────────────────────────────────────
      // ADDITIONAL MATCH #1: Reference Number Match
      // ────────────────────────────────────────────────────

      if (hasBothRefs && bankTxn.optional?.refNumber && ledgerTxn.optional?.refNumber) {
        const refMatch = this.fuzzyReferenceMatch(
          bankTxn.optional.refNumber,
          ledgerTxn.optional.refNumber,
        );

        if (refMatch > 0.9) {
          // Strong ref match, even if core score is medium
          if (coreScore >= 0.5) {
            // At least 50% core match required
            const totalConfidence = coreScore * 0.6 + refMatch * 0.4;

            candidates.push({
              bankId: bankTxn.id,
              ledgerId: ledgerTxn.id,
              confidence: totalConfidence,
              matchedOn: 'ref_number',
              coreScore,
              additionalScore: refMatch,
              reasoning: `Core match: ${(coreScore * 100).toFixed(0)}%, Strong reference number match: ${(refMatch * 100).toFixed(0)}%`,
            });

            refMatches++;
          }
        }
      }

      // ────────────────────────────────────────────────────
      // ADDITIONAL MATCH #2: Payer/Payee Match
      // ────────────────────────────────────────────────────

      if (hasLedgerPayer && ledgerTxn.optional?.payerPayee) {
        // Try to find payer name in bank description
        const payerInDesc = this.findEntityInText(
          ledgerTxn.optional.payerPayee,
          bankTxn.description,
        );

        if (payerInDesc > 0.8) {
          // Strong payer match
          if (coreScore >= 0.4) {
            // Lower threshold for payer matches
            const totalConfidence = coreScore * 0.7 + payerInDesc * 0.3;

            candidates.push({
              bankId: bankTxn.id,
              ledgerId: ledgerTxn.id,
              confidence: totalConfidence,
              matchedOn: 'payer_payee',
              coreScore,
              additionalScore: payerInDesc,
              reasoning: `Core match: ${(coreScore * 100).toFixed(0)}%, Payer name found in description: ${(payerInDesc * 100).toFixed(0)}%`,
            });

            payerUsed++;
          }
        }
      }
    }

    return { candidates, refMatches, payerMatches };
  }

  // ════════════════════════════════════════════════════════
  // HELPER METHODS: Fuzzy Matching Algorithms
  // ════════════════════════════════════════════════════════

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

    // Tolerance can be percentage or absolute
    const threshold = tolerance < 1 ? amt1 * tolerance : tolerance;

    if (diff <= threshold) return 1.0 - diff / threshold;
    return 0.0;
  }

  private fuzzyTextMatch(text1: string, text2: string, minSimilarity: number): number {
    // Use Levenshtein distance or similar algorithm
    const similarity = this.levenshteinSimilarity(text1, text2);
    return similarity >= minSimilarity ? similarity : 0.0;
  }

  private fuzzyReferenceMatch(ref1: string, ref2: string): number {
    // Clean references (remove prefixes)
    const clean1 = ref1.replace(/^(REF-|TXN-|#)/, '').toUpperCase();
    const clean2 = ref2.replace(/^(REF-|TXN-|#)/, '').toUpperCase();

    if (clean1 === clean2) return 1.0;

    return this.levenshteinSimilarity(clean1, clean2);
  }

  private findEntityInText(entity: string, text: string): number {
    const entityLower = entity.toLowerCase();
    const textLower = text.toLowerCase();

    if (textLower.includes(entityLower)) return 1.0;

    // Fuzzy match for partial names
    const words = entityLower.split(' ');
    const matchedWords = words.filter(word => textLower.includes(word));

    return matchedWords.length / words.length;
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

  private calculateCoreScore(
    bankTxn: TransactionDto,
    ledgerTxn: TransactionDto,
    thresholds: MatchThresholdsDto,
  ): number {
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
      thresholds.descriptionSimilarity,
    );

    return dateScore * 0.30 + amountScore * 0.40 + descScore * 0.30;
  }

  private generateReasoning(
    matchBasis: string[],
    confidence: number,
    vetoReason?: string,
  ): string {
    if (vetoReason) {
      return `Match vetoed: ${vetoReason}`;
    }

    const basis = matchBasis.join(', ');
    return `Match based on: ${basis} (confidence: ${(confidence * 100).toFixed(0)}%)`;
  }

  private calculateAvgConfidence(candidates: MatchCandidateDto[]): number {
    if (candidates.length === 0) return 0;
    const sum = candidates.reduce((acc, c) => acc + c.confidence, 0);
    return sum / candidates.length;
  }
}
```

### MT-02 Controller

```typescript
// apps/matching-services/mt-02-near-exact/src/mt-02.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NearExactMatchService } from './mt-02.service';
import { 
  TransactionDto, 
  MatchThresholdsDto,
  FieldProfileDto 
} from '@app/shared/dto';

class FindMatchesDto {
  txns: TransactionDto[];
  ledgerPool: TransactionDto[];
  thresholds: MatchThresholdsDto;
  fieldProfile: FieldProfileDto;
}

@ApiTags('Matching Service - MT-02')
@Controller('mt-02')
export class NearExactMatchController {
  constructor(private readonly service: NearExactMatchService) {}

  @Post('find-matches')
  @ApiOperation({ 
    summary: 'Find near-exact matches using core fields + additional field suggestions' 
  })
  async findMatches(@Body() dto: FindMatchesDto) {
    return this.service.findMatches(
      dto.txns,
      dto.ledgerPool,
      dto.thresholds,
      dto.fieldProfile,
    );
  }
}
```

---

## KEY TYPESCRIPT PATTERNS USED

### 1. **DTOs with Class-Validator**
```typescript
import { IsNotEmpty, IsNumber } from 'class-validator';

export class TransactionDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
```

### 2. **NestJS Dependency Injection**
```typescript
@Injectable()
export class DataPrepService {
  constructor(
    private readonly columnMappingService: ColumnMappingService,
  ) {}
}
```

### 3. **Swagger API Documentation**
```typescript
@ApiTags('Data Preparation')
@Controller('data-prep')
export class DataPrepController {
  @ApiOperation({ summary: 'Analyze files' })
  @Post('analyze')
  async analyzeFiles() {}
}
```

### 4. **Type Safety Throughout**
```typescript
// Strong typing for all function parameters and returns
async findMatches(
  bankTxns: TransactionDto[],
  ledgerPool: TransactionDto[],
  thresholds: MatchThresholdsDto,
  fieldProfile: FieldProfileDto,
): Promise<MatchResultDto> {
  // ...
}
```

---

## SUMMARY

This TypeScript/NestJS implementation provides:

✅ **Type-safe DTOs** for all data structures  
✅ **Separation of concerns** (core vs optional fields)  
✅ **Primary + Additional matching** strategy  
✅ **Field profile-aware** matching services  
✅ **Swagger documentation** out of the box  
✅ **Microservice-ready** architecture  

The matching strategy is clear:
1. **Primary matching:** Core fields only
2. **Additional candidates:** Found using optional fields
3. **User sees both:** Can choose primary or alternative

---

**Ready for orchestrator service, learning service, or other components?**
