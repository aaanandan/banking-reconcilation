import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsOptional } from 'class-validator';
import { TransactionDto } from '@app/shared';

/**
 * Duplicate classification result
 */
export class DuplicateClassificationDto {
  @ApiProperty({ description: 'Bank transaction ID' })
  @IsNumber()
  bankTxnId: number;

  @ApiProperty({ description: 'Classified as duplicate' })
  isDuplicate: boolean;

  @ApiProperty({ description: 'IDs of duplicate transaction(s)' })
  @IsArray()
  duplicateOfIds: number[];

  @ApiProperty({ description: 'Confidence score (0.0 to 1.0)' })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'Reasoning for classification' })
  @IsString()
  reasoning: string;

  @ApiProperty({ description: 'Classification algorithm' })
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

  @ApiProperty({ description: 'Number of duplicates found for this transaction' })
  @IsNumber()
  duplicateCount: number;
}

/**
 * Request to classify duplicate transactions
 */
export class DuplicateClassificationRequestDto {
  @ApiProperty({
    description: 'Unmatched bank transactions to check for duplicates',
    type: [TransactionDto],
  })
  @IsArray()
  bankTransactions: TransactionDto[];
}

/**
 * Response with classified duplicates
 */
export class DuplicateClassificationResponseDto {
  @ApiProperty({
    description: 'Classified transactions',
    type: [DuplicateClassificationDto],
  })
  classifications: DuplicateClassificationDto[];

  @ApiProperty({ description: 'Total duplicates identified' })
  @IsNumber()
  totalDuplicates: number;

  @ApiProperty({ description: 'Classification algorithm used' })
  @IsString()
  algorithm: string;

  @ApiProperty({ description: 'Timestamp of classification' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalProcessed: number;
    duplicatesFound: number;
    uniqueGroups: number;
  };
}
