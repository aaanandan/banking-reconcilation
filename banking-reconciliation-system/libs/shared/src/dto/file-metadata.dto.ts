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

// ═══════════════════════════════════════════════════════════
// Multi-File Analysis DTOs (Step 11)
// ═══════════════════════════════════════════════════════════

export class BankFileAnalysisDto {
  @ApiProperty({ description: 'Bank identifier (bank_1, bank_2, etc.)' })
  bankId: string;

  @ApiProperty({ description: 'Bank name from filename or user input' })
  bankName: string;

  @ApiProperty({ description: 'Original filename' })
  filename: string;

  @ApiProperty({ description: 'Total rows in CSV file' })
  totalRows: number;

  @ApiProperty({ description: 'Column detection results' })
  columnDetection: {
    coreFields: {
      date: { index: number; name: string; confidence: number } | null;
      amount: { index: number; name: string; confidence: number } | null;
      description: { index: number; name: string; confidence: number } | null;
    };
    optionalFields: Record<string, { index: number; name: string; confidence: number }>;
    additionalColumns: Array<{ index: number; name: string }>;
    confidence: number;
  };

  @ApiProperty({ description: 'Date range detected in transactions' })
  dateRange: {
    earliest: string;
    latest: string;
    totalTransactions: number;
    hasGaps?: boolean;
  };

  @ApiProperty({ description: 'Auto-generated column mapping' })
  autoMapping: {
    core: {
      date: string;
      amount: string;
      description: string;
    };
    optional: Record<string, string>;
    metadata: Record<string, string>;
    confidence: number;
  };
}

export class MultiFilesAnalysisResponseDto {
  @ApiProperty({ description: 'Analysis results for each bank file', type: [BankFileAnalysisDto] })
  bankFiles: BankFileAnalysisDto[];

  @ApiProperty({ description: 'Ledger file analysis' })
  ledgerFile: {
    filename: string;
    totalRows: number;
    columnDetection: any;
    dateRange: {
      earliest: string;
      latest: string;
      totalTransactions: number;
      hasGaps?: boolean;
    };
    autoMapping: any;
  };

  @ApiProperty({ description: 'Date range analysis comparing banks and ledger' })
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
    suggestedRange?: {
      from: string;
      to: string;
      coverage: number;
    };
  };

  @ApiProperty({ description: 'Overall summary' })
  summary: {
    totalBankFiles: number;
    totalBankTransactions: number;
    totalLedgerTransactions: number;
    allMappingsValid: boolean;
    averageConfidence: number;
    readyForReconciliation: boolean;
  };
}
