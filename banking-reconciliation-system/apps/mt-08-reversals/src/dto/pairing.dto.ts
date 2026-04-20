import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsOptional } from 'class-validator';
import { TransactionDto } from '@app/shared';

/**
 * Reversal pair (two transactions that cancel each other)
 */
export class ReversalPairDto {
  @ApiProperty({ description: 'Original transaction ID' })
  @IsNumber()
  originalTxnId: number;

  @ApiProperty({ description: 'Reversal transaction ID' })
  @IsNumber()
  reversalTxnId: number;

  @ApiProperty({ description: 'Original amount' })
  @IsNumber()
  originalAmount: number;

  @ApiProperty({ description: 'Reversal amount (opposite sign)' })
  @IsNumber()
  reversalAmount: number;

  @ApiProperty({ description: 'Net amount (should be close to 0)' })
  @IsNumber()
  netAmount: number;

  @ApiProperty({ description: 'Confidence score (0.0 to 1.0)' })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'Reasoning for pairing' })
  @IsString()
  reasoning: string;

  @ApiProperty({ description: 'Number of days between transactions' })
  @IsNumber()
  daysBetween: number;

  @ApiProperty({ description: 'Matching algorithm' })
  @IsString()
  algorithm: string;

  @ApiPropertyOptional({ description: 'Bank ID' })
  @IsOptional()
  @IsString()
  bankId?: string;
}

/**
 * Request to find reversal pairs
 */
export class ReversalPairingRequestDto {
  @ApiProperty({
    description: 'Unmatched bank transactions to check for reversals',
    type: [TransactionDto],
  })
  @IsArray()
  bankTransactions: TransactionDto[];
}

/**
 * Response with reversal pairs
 */
export class ReversalPairingResponseDto {
  @ApiProperty({
    description: 'Reversal pairs found',
    type: [ReversalPairDto],
  })
  pairs: ReversalPairDto[];

  @ApiProperty({ description: 'Total pairs identified' })
  @IsNumber()
  totalPairs: number;

  @ApiProperty({ description: 'Total transactions involved' })
  @IsNumber()
  totalTransactions: number;

  @ApiProperty({ description: 'Matching algorithm used' })
  @IsString()
  algorithm: string;

  @ApiProperty({ description: 'Timestamp of pairing' })
  @IsString()
  timestamp: string;
}
