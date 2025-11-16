import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Bank Transaction DTO
 * Represents a transaction from a bank statement
 */
export class BankTransactionDto {
  @ApiProperty({ description: 'Unique transaction ID', example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Transaction date (ISO 8601 format)',
    example: '2024-01-15',
  })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Transaction amount', example: 5000.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Office Rent Payment',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Bank identifier (bank_1, bank_2, etc.)',
    example: 'bank_1',
  })
  @IsString()
  bankId: string;

  @ApiProperty({ description: 'Bank name (HDFC, ICICI, SBI, etc.)', example: 'HDFC Bank' })
  @IsString()
  bankName: string;
}

/**
 * Ledger Transaction DTO
 * Represents a transaction from the internal ledger
 */
export class LedgerTransactionDto {
  @ApiProperty({ description: 'Unique transaction ID', example: 101 })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Transaction date (ISO 8601 format)',
    example: '2024-01-15',
  })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Transaction amount', example: 5000.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Office Rent Payment',
  })
  @IsString()
  description: string;
}

/**
 * Fuzzy Match Thresholds DTO
 * Configuration for fuzzy matching algorithm (MT-02)
 */
export class FuzzyThresholdsDto {
  @ApiProperty({
    description: 'Date tolerance in days (±)',
    example: 2,
    required: false,
    default: 2,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  dateTolerance?: number;

  @ApiProperty({
    description: 'Amount tolerance as percentage (0.01 = 1%)',
    example: 0.05,
    required: false,
    default: 0.05,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  amountTolerance?: number;

  @ApiProperty({
    description: 'Minimum description similarity (0.0 to 1.0)',
    example: 0.7,
    required: false,
    default: 0.7,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  descriptionSimilarity?: number;

  @ApiProperty({
    description: 'Minimum overall confidence required for a match (0.0 to 1.0)',
    example: 0.7,
    required: false,
    default: 0.7,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minConfidence?: number;
}

/**
 * Reconciliation Request DTO
 * Input for the orchestration workflow
 */
export class ReconciliationRequestDto {
  @ApiProperty({
    description: 'Array of bank transactions to reconcile',
    type: [BankTransactionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BankTransactionDto)
  bankTransactions: BankTransactionDto[];

  @ApiProperty({
    description: 'Array of ledger transactions to match against',
    type: [LedgerTransactionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LedgerTransactionDto)
  ledgerTransactions: LedgerTransactionDto[];

  @ApiProperty({
    description: 'Optional fuzzy matching thresholds (for MT-02 algorithm)',
    type: FuzzyThresholdsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FuzzyThresholdsDto)
  fuzzyThresholds?: FuzzyThresholdsDto;
}

/**
 * Match Result DTO
 * Unified format for both exact and fuzzy matches
 */
export class MatchResultDto {
  @ApiProperty({ description: 'Bank transaction ID' })
  bankTxnId: number;

  @ApiProperty({ description: 'Ledger transaction ID' })
  ledgerTxnId: number;

  @ApiProperty({
    description: 'Confidence score (1.0 for exact, 0.0-1.0 for fuzzy)',
    example: 1.0,
  })
  confidence: number;

  @ApiProperty({
    description: 'Matching algorithm used',
    example: 'MT-01',
    enum: ['MT-01', 'MT-02'],
  })
  algorithm: string;

  @ApiProperty({
    description: 'Reason for the match',
    example: 'Exact match on all fields',
  })
  reasoning: string;

  @ApiProperty({
    description: 'Bank identifier (bank_1, bank_2, etc.)',
    required: false,
  })
  bankId?: string;

  @ApiProperty({
    description: 'Bank name (HDFC, ICICI, SBI, etc.)',
    required: false,
  })
  bankName?: string;

  @ApiProperty({
    description: 'Detailed scores (only for fuzzy matches)',
    required: false,
    example: { date: 0.75, amount: 1.0, description: 0.95 },
  })
  scores?: {
    date?: number;
    amount?: number;
    description?: number;
  };
}

/**
 * Bank Statistics DTO
 * Statistics for a single bank
 */
export class BankStatisticsDto {
  @ApiProperty({ description: 'Bank identifier', example: 'bank_1' })
  bankId: string;

  @ApiProperty({ description: 'Bank name', example: 'HDFC Bank' })
  bankName: string;

  @ApiProperty({ description: 'Total transactions from this bank', example: 10 })
  totalTransactions: number;

  @ApiProperty({ description: 'Exact matches (MT-01)', example: 4 })
  exactMatches: number;

  @ApiProperty({ description: 'Fuzzy matches (MT-02)', example: 5 })
  fuzzyMatches: number;

  @ApiProperty({ description: 'Total matches', example: 9 })
  totalMatches: number;

  @ApiProperty({ description: 'Unmatched transactions', example: 1 })
  unmatched: number;

  @ApiProperty({ description: 'Match rate (0.0 to 1.0)', example: 0.9 })
  matchRate: number;
}

/**
 * Algorithm Statistics DTO
 * Statistics for a single matching algorithm
 */
export class AlgorithmStatisticsDto {
  @ApiProperty({ description: 'Algorithm name', example: 'MT-01' })
  algorithm: string;

  @ApiProperty({ description: 'Number of matches found', example: 4 })
  matchesFound: number;

  @ApiProperty({ description: 'Match rate contribution', example: 0.4 })
  matchRate: number;
}

/**
 * Reconciliation Response DTO
 * Output from the orchestration workflow
 */
export class ReconciliationResponseDto {
  @ApiProperty({
    description: 'Array of all matches found',
    type: [MatchResultDto],
  })
  matches: MatchResultDto[];

  @ApiProperty({
    description: 'Total number of bank transactions processed',
    example: 10,
  })
  totalBankTransactions: number;

  @ApiProperty({
    description: 'Total number of ledger transactions available',
    example: 9,
  })
  totalLedgerTransactions: number;

  @ApiProperty({ description: 'Total matches found', example: 9 })
  totalMatches: number;

  @ApiProperty({ description: 'Number of unmatched bank transactions', example: 1 })
  unmatched: number;

  @ApiProperty({ description: 'Overall match rate (0.0 to 1.0)', example: 0.9 })
  overallMatchRate: number;

  @ApiProperty({ description: 'Exact matches found by MT-01', example: 4 })
  exactMatches: number;

  @ApiProperty({ description: 'Fuzzy matches found by MT-02', example: 5 })
  fuzzyMatches: number;

  @ApiProperty({
    description: 'Statistics by bank',
    type: [BankStatisticsDto],
  })
  bankStatistics: BankStatisticsDto[];

  @ApiProperty({
    description: 'Statistics by algorithm',
    type: [AlgorithmStatisticsDto],
  })
  algorithmStatistics: AlgorithmStatisticsDto[];

  @ApiProperty({
    description: 'Timestamp of reconciliation',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Workflow executed',
    example: 'MT-01 → MT-02',
  })
  workflow: string;
}
