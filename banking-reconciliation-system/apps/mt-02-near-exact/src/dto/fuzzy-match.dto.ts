import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Max, Min, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionDto } from '@app/shared';

/**
 * Configurable thresholds for fuzzy matching
 */
export class FuzzyThresholdsDto {
  @ApiProperty({
    description: 'Date tolerance in days (±)',
    example: 2,
    minimum: 0,
    maximum: 30,
  })
  @IsNumber()
  @Min(0)
  @Max(30)
  dateTolerance: number;

  @ApiProperty({
    description: 'Amount tolerance as percentage (0.01 = 1%)',
    example: 0.05,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  amountTolerance: number;

  @ApiProperty({
    description: 'Minimum description similarity (0.0 to 1.0)',
    example: 0.7,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  descriptionSimilarity: number;

  @ApiProperty({
    description: 'Minimum overall confidence required for a match (0.0 to 1.0)',
    example: 0.7,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  minConfidence: number;
}

/**
 * FuzzyMatchRequestDto
 * DTO for POST /match/fuzzy request
 */
export class FuzzyMatchRequestDto {
  @ApiProperty({ description: 'Bank transactions to match', type: [TransactionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  bankTransactions: TransactionDto[];

  @ApiProperty({ description: 'Ledger transactions pool to match against', type: [TransactionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  ledgerTransactions: TransactionDto[];

  @ApiPropertyOptional({
    description: 'Optional custom thresholds (defaults used if not provided)',
    type: FuzzyThresholdsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FuzzyThresholdsDto)
  thresholds?: FuzzyThresholdsDto;

  @ApiPropertyOptional({
    description: 'Optional field profile for per-bank field quality/availability analysis',
  })
  @IsOptional()
  @IsObject()
  fieldProfile?: any;
}

/**
 * Detailed scoring breakdown for fuzzy match
 */
export class FuzzyScoresDto {
  @ApiProperty({ description: 'Date match score (0.0 to 1.0)' })
  date: number;

  @ApiProperty({ description: 'Amount match score (0.0 to 1.0)' })
  amount: number;

  @ApiProperty({ description: 'Description match score (0.0 to 1.0)' })
  description: number;
}

/**
 * FuzzyMatchCandidateDto
 * Represents a single fuzzy match candidate with detailed scoring
 */
export class FuzzyMatchCandidateDto {
  @ApiProperty({ description: 'Bank transaction ID' })
  bankTxnId: number;

  @ApiProperty({ description: 'Ledger transaction ID' })
  ledgerTxnId: number;

  @ApiProperty({
    description: 'Overall confidence score (0.0 to 1.0)',
    example: 0.85,
  })
  confidence: number;

  @ApiProperty({
    description: 'Detailed scoring breakdown',
    type: FuzzyScoresDto,
  })
  scores: FuzzyScoresDto;

  @ApiProperty({ description: 'Reason for the match' })
  reasoning: string;

  @ApiProperty({ description: 'Algorithm used', example: 'MT-02' })
  algorithm: string;

  // Multi-bank support
  @ApiProperty({ description: 'Bank identifier (bank_1, bank_2, etc.)', required: false })
  bankId?: string;

  @ApiProperty({ description: 'Bank name (HDFC, ICICI, SBI, etc.)', required: false })
  bankName?: string;
}

/**
 * FuzzyMatchResponseDto
 * DTO for POST /match/fuzzy response
 */
export class FuzzyMatchResponseDto {
  @ApiProperty({ description: 'Array of fuzzy match candidates', type: [FuzzyMatchCandidateDto] })
  matches: FuzzyMatchCandidateDto[];

  @ApiProperty({ description: 'Total number of matches found' })
  totalMatches: number;

  @ApiProperty({ description: 'Algorithm used', example: 'MT-02-Fuzzy' })
  algorithm: string;

  @ApiProperty({ description: 'Thresholds used for matching', type: FuzzyThresholdsDto })
  thresholds: FuzzyThresholdsDto;

  @ApiProperty({ description: 'Execution timestamp' })
  timestamp: string;
}
