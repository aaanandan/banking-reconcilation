import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsOptional } from 'class-validator';
import { TransactionDto } from '@app/shared';

/**
 * Timing difference match (relaxed date matching)
 */
export class TimingDifferenceMatchDto {
  @ApiProperty({ description: 'Bank transaction ID' })
  @IsNumber()
  bankTxnId: number;

  @ApiProperty({ description: 'Ledger transaction ID' })
  @IsNumber()
  ledgerTxnId: number;

  @ApiProperty({ description: 'Bank transaction date' })
  @IsString()
  bankDate: string;

  @ApiProperty({ description: 'Ledger transaction date' })
  @IsString()
  ledgerDate: string;

  @ApiProperty({ description: 'Date difference in days (absolute)' })
  @IsNumber()
  dateDifference: number;

  @ApiProperty({ description: 'Amount match score (0.0 to 1.0)' })
  @IsNumber()
  amountMatchScore: number;

  @ApiProperty({ description: 'Description similarity score (0.0 to 1.0)' })
  @IsNumber()
  descriptionSimilarity: number;

  @ApiProperty({ description: 'Overall confidence score (0.0 to 1.0)' })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'Reasoning for match' })
  @IsString()
  reasoning: string;

  @ApiProperty({ description: 'Matching algorithm' })
  @IsString()
  algorithm: string;

  @ApiPropertyOptional({ description: 'Bank ID (multi-bank support)' })
  @IsOptional()
  @IsString()
  bankId?: string;

  @ApiPropertyOptional({ description: 'Bank name (multi-bank support)' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Entity name (for learning)' })
  @IsOptional()
  @IsString()
  entityName?: string;
}

/**
 * Request to find timing difference matches
 */
export class TimingDifferenceMatchRequestDto {
  @ApiProperty({
    description: 'Unmatched bank transactions',
    type: [TransactionDto],
  })
  @IsArray()
  bankTransactions: TransactionDto[];

  @ApiProperty({
    description: 'Available ledger transactions',
    type: [TransactionDto],
  })
  @IsArray()
  ledgerTransactions: TransactionDto[];

  @ApiPropertyOptional({ description: 'Max date difference in days (default: 5)' })
  @IsOptional()
  @IsNumber()
  maxDateDifference?: number;

  @ApiPropertyOptional({ description: 'Amount tolerance percentage (default: 0.001 = 0.1%)' })
  @IsOptional()
  @IsNumber()
  amountTolerance?: number;

  @ApiPropertyOptional({ description: 'Min description similarity (default: 0.7 = 70%)' })
  @IsOptional()
  @IsNumber()
  minDescriptionSimilarity?: number;
}

/**
 * Response with timing difference matches
 */
export class TimingDifferenceMatchResponseDto {
  @ApiProperty({
    description: 'Timing difference matches found',
    type: [TimingDifferenceMatchDto],
  })
  matches: TimingDifferenceMatchDto[];

  @ApiProperty({ description: 'Total matches found' })
  @IsNumber()
  totalMatches: number;

  @ApiProperty({ description: 'Matching algorithm used' })
  @IsString()
  algorithm: string;

  @ApiProperty({ description: 'Timestamp of matching' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'Timing pattern statistics' })
  timingStats: {
    avgDateDifference: number;
    mostCommonDifference: number;
    dateRangeUsed: string;
  };
}
