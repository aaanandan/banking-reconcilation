import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsBoolean } from 'class-validator';
import { TransactionDto } from '@app/shared';

/**
 * Rounding difference classification for a single transaction
 */
export class RoundingClassificationDto {
  @ApiProperty({ description: 'Bank transaction ID' })
  @IsNumber()
  bankTxnId: number;

  @ApiProperty({ description: 'Classified as rounding difference' })
  @IsBoolean()
  isRoundingDifference: boolean;

  @ApiProperty({ description: 'Bank amount' })
  @IsNumber()
  bankAmount: number;

  @ApiProperty({ description: 'Expected amount (from potential ledger match)' })
  @IsNumber()
  expectedAmount: number;

  @ApiProperty({ description: 'Rounding difference (absolute)' })
  @IsNumber()
  roundingDifference: number;

  @ApiProperty({ description: 'Confidence score (0.0 to 1.0)' })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'Reasoning for classification' })
  @IsString()
  reasoning: string;

  @ApiProperty({ description: 'Algorithm used for detection' })
  @IsString()
  algorithm: string;

  @ApiProperty({ description: 'Bank ID' })
  @IsString()
  bankId: string;
}

/**
 * Rounding difference classification request
 */
export class RoundingClassificationRequestDto {
  @ApiProperty({
    description: 'Bank transactions to classify for rounding differences',
    type: [TransactionDto],
  })
  @IsArray()
  bankTransactions: TransactionDto[];

  @ApiProperty({
    description: 'Optional maximum rounding threshold (default: 0.01)',
    required: false,
  })
  @IsNumber()
  roundingThreshold?: number;
}

/**
 * Rounding difference classification response
 */
export class RoundingClassificationResponseDto {
  @ApiProperty({
    description: 'Rounding difference classifications',
    type: [RoundingClassificationDto],
  })
  classifications: RoundingClassificationDto[];

  @ApiProperty({ description: 'Total rounding differences found' })
  @IsNumber()
  totalRoundingDifferences: number;

  @ApiProperty({ description: 'Algorithm used' })
  @IsString()
  algorithm: string;

  @ApiProperty({ description: 'Timestamp of classification' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalProcessed: number;
    roundingDifferencesFound: number;
    averageRoundingDifference: number;
    maxRoundingDifference: number;
    roundingThreshold: number;
  };
}
