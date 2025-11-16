import { IsString, IsOptional, IsArray, IsObject, ValidateNested, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BankFileMetadataDto, LedgerFileMetadataDto, DateRangeDto } from '@app/shared';

/**
 * FieldProfileDto
 * Per-bank and ledger field availability profiles
 */
export class FieldProfileDto {
  @ApiProperty({ description: 'Per-bank field profiles' })
  @IsObject()
  banks: Record<string, {
    hasTransactionType?: boolean;
    hasBalance?: boolean;
    hasReference?: boolean;
    hasCheckNumber?: boolean;
    hasCategory?: boolean;
    additional: string[];
  }>;

  @ApiProperty({ description: 'Ledger field profile' })
  @IsObject()
  ledger: {
    hasTransactionType?: boolean;
    hasBalance?: boolean;
    hasReference?: boolean;
    hasCheckNumber?: boolean;
    hasCategory?: boolean;
    additional: string[];
  };

  @ApiPropertyOptional({ description: 'Field compatibility analysis' })
  @IsOptional()
  @IsObject()
  compatibilityAnalysis?: {
    commonFields: string[];
    bankOnlyFields: string[];
    ledgerOnlyFields: string[];
  };
}

/**
 * CreateReconciliationDto
 * DTO for POST /state/reconciliation
 */
export class CreateReconciliationDto {
  @ApiProperty({ description: 'User ID who created this reconciliation' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Array of bank file metadata', type: [BankFileMetadataDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BankFileMetadataDto)
  bankFiles: BankFileMetadataDto[];

  @ApiProperty({ description: 'Ledger file metadata', type: LedgerFileMetadataDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LedgerFileMetadataDto)
  ledgerFile: LedgerFileMetadataDto;

  @ApiProperty({ description: 'Date range configuration', type: DateRangeDto })
  @IsObject()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange: DateRangeDto;

  @ApiProperty({ description: 'Field profile for all files', type: FieldProfileDto })
  @IsObject()
  @ValidateNested()
  @Type(() => FieldProfileDto)
  fieldProfile: FieldProfileDto;

  @ApiPropertyOptional({ description: 'Date range analysis from data prep service' })
  @IsOptional()
  @IsObject()
  dateRangeAnalysis?: {
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
}

/**
 * ReconciliationStateDto
 * DTO for GET /state/reconciliation/:id response
 */
export class ReconciliationStateDto {
  @ApiProperty({ description: 'Reconciliation ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Bank files information', type: [BankFileMetadataDto] })
  bankFiles: BankFileMetadataDto[];

  @ApiProperty({ description: 'Ledger file information', type: LedgerFileMetadataDto })
  ledgerFile: LedgerFileMetadataDto;

  @ApiProperty({ description: 'Date range configuration', type: DateRangeDto })
  dateRange: DateRangeDto;

  @ApiProperty({ description: 'Field profile', type: FieldProfileDto })
  fieldProfile: FieldProfileDto;

  @ApiPropertyOptional({ description: 'Date range analysis' })
  dateRangeAnalysis?: any;

  @ApiProperty({ description: 'Current status', enum: ['in_progress', 'paused', 'completed'] })
  status: string;

  @ApiPropertyOptional({ description: 'Current step name' })
  currentStep?: string;

  @ApiProperty({ description: 'Array of completed step names', type: [String] })
  completedSteps: string[];

  @ApiProperty({ description: 'Total transactions count' })
  totalTransactions: number;

  @ApiProperty({ description: 'Matched transactions count' })
  matchedCount: number;

  @ApiProperty({ description: 'Unmatched transactions count' })
  unmatchedCount: number;

  @ApiProperty({ description: 'Manual matches count' })
  manualCount: number;

  @ApiProperty({ description: 'Convergence rate percentage' })
  convergenceRate: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

/**
 * UpdateReconciliationDto
 * DTO for PATCH /state/reconciliation/:id
 * Allows partial updates
 */
export class UpdateReconciliationDto extends PartialType(CreateReconciliationDto) {
  @ApiPropertyOptional({ description: 'Update status', enum: ['in_progress', 'paused', 'completed'] })
  @IsOptional()
  @IsEnum(['in_progress', 'paused', 'completed'])
  status?: string;

  @ApiPropertyOptional({ description: 'Update current step' })
  @IsOptional()
  @IsString()
  currentStep?: string;

  @ApiPropertyOptional({ description: 'Update completed steps', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  completedSteps?: string[];

  @ApiPropertyOptional({ description: 'Update total transactions count' })
  @IsOptional()
  @IsNumber()
  totalTransactions?: number;

  @ApiPropertyOptional({ description: 'Update matched count' })
  @IsOptional()
  @IsNumber()
  matchedCount?: number;

  @ApiPropertyOptional({ description: 'Update unmatched count' })
  @IsOptional()
  @IsNumber()
  unmatchedCount?: number;

  @ApiPropertyOptional({ description: 'Update manual count' })
  @IsOptional()
  @IsNumber()
  manualCount?: number;

  @ApiPropertyOptional({ description: 'Update convergence rate' })
  @IsOptional()
  @IsNumber()
  convergenceRate?: number;

  @ApiPropertyOptional({ description: 'Update field profile', type: FieldProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FieldProfileDto)
  fieldProfile?: FieldProfileDto;
}

/**
 * CreateReconciliationResponseDto
 * DTO for POST /state/reconciliation response
 */
export class CreateReconciliationResponseDto {
  @ApiProperty({ description: 'Created reconciliation ID' })
  reconciliationId: string;
}

/**
 * UpdateReconciliationResponseDto
 * DTO for PATCH /state/reconciliation/:id response
 */
export class UpdateReconciliationResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;
}

/**
 * SaveSnapshotDto
 * DTO for POST /state/reconciliation/:id/snapshot
 */
export class SaveSnapshotDto {
  @ApiPropertyOptional({ description: 'Optional snapshot name/description' })
  @IsOptional()
  @IsString()
  snapshotName?: string;

  @ApiPropertyOptional({ description: 'Optional snapshot notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * SaveSnapshotResponseDto
 * Response for saving a snapshot
 */
export class SaveSnapshotResponseDto {
  @ApiProperty({ description: 'Snapshot ID' })
  snapshotId: string;

  @ApiProperty({ description: 'Reconciliation ID' })
  reconciliationId: string;

  @ApiProperty({ description: 'Snapshot timestamp' })
  snapshotTimestamp: Date;

  @ApiProperty({ description: 'Current reconciliation status at snapshot time' })
  status: string;

  @ApiProperty({ description: 'Current step at snapshot time' })
  currentStep: string;

  @ApiProperty({ description: 'Total transactions at snapshot time' })
  totalTransactions: number;

  @ApiProperty({ description: 'Matched count at snapshot time' })
  matchedCount: number;
}

/**
 * ResumeSnapshotResponseDto
 * Response for resuming from a snapshot
 */
export class ResumeSnapshotResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Reconciliation ID' })
  reconciliationId: string;

  @ApiProperty({ description: 'Snapshot ID that was resumed from' })
  snapshotId: string;

  @ApiProperty({ description: 'Restored state summary' })
  restoredState: {
    status: string;
    currentStep: string;
    totalTransactions: number;
    matchedCount: number;
  };
}
