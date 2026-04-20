import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsOptional } from 'class-validator';
import { TransactionDto } from '@app/shared';

/**
 * Classification result for a single transaction
 */
export class ClassificationDto {
  @ApiProperty({ description: 'Bank transaction ID' })
  @IsNumber()
  bankTxnId: number;

  @ApiProperty({ description: 'Classified as bank fee' })
  isBankFee: boolean;

  @ApiProperty({ description: 'Confidence score (0.0 to 1.0)' })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'Reasoning for classification' })
  @IsString()
  reasoning: string;

  @ApiProperty({ description: 'Fee keywords detected' })
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
export class ClassificationRequestDto {
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
export class ClassificationResponseDto {
  @ApiProperty({
    description: 'Classified transactions',
    type: [ClassificationDto],
  })
  classifications: ClassificationDto[];

  @ApiProperty({ description: 'Total bank fees identified' })
  @IsNumber()
  totalBankFees: number;

  @ApiProperty({ description: 'Classification algorithm used' })
  @IsString()
  algorithm: string;

  @ApiProperty({ description: 'Timestamp of classification' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalProcessed: number;
    bankFeesFound: number;
    totalFeeAmount: number;
  };
}
