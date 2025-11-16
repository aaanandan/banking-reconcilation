import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsOptional } from 'class-validator';
import { TransactionDto } from '@app/shared';

/**
 * Classification result for a single transaction
 */
export class InterestClassificationDto {
  @ApiProperty({ description: 'Bank transaction ID' })
  @IsNumber()
  bankTxnId: number;

  @ApiProperty({ description: 'Classified as interest income' })
  isInterest: boolean;

  @ApiProperty({ description: 'Confidence score (0.0 to 1.0)' })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'Reasoning for classification' })
  @IsString()
  reasoning: string;

  @ApiProperty({ description: 'Interest keywords detected' })
  @IsArray()
  detectedKeywords: string[];

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
}

/**
 * Request to classify bank transactions
 */
export class InterestClassificationRequestDto {
  @ApiProperty({
    description: 'Unmatched bank transactions to classify',
    type: [TransactionDto],
  })
  @IsArray()
  bankTransactions: TransactionDto[];
}

/**
 * Response with classified transactions
 */
export class InterestClassificationResponseDto {
  @ApiProperty({
    description: 'Classified transactions',
    type: [InterestClassificationDto],
  })
  classifications: InterestClassificationDto[];

  @ApiProperty({ description: 'Total interest transactions identified' })
  @IsNumber()
  totalInterest: number;

  @ApiProperty({ description: 'Classification algorithm used' })
  @IsString()
  algorithm: string;

  @ApiProperty({ description: 'Timestamp of classification' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalProcessed: number;
    interestFound: number;
    totalInterestAmount: number;
  };
}
