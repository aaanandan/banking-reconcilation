import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsOptional } from 'class-validator';
import { TransactionDto } from '@app/shared';

/**
 * Consolidated deposit match (multiple banks → 1 ledger)
 */
export class ConsolidatedDepositMatchDto {
  @ApiProperty({ description: 'Bank transaction IDs in consolidation' })
  @IsArray()
  bankTxnIds: number[];

  @ApiProperty({ description: 'Ledger transaction ID' })
  @IsNumber()
  ledgerTxnId: number;

  @ApiProperty({ description: 'Total deposit amount from all banks' })
  @IsNumber()
  totalDepositAmount: number;

  @ApiProperty({ description: 'Ledger transaction amount' })
  @IsNumber()
  ledgerAmount: number;

  @ApiProperty({ description: 'Amount difference (absolute)' })
  @IsNumber()
  amountDifference: number;

  @ApiProperty({ description: 'Confidence score (0.0 to 1.0)' })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'Reasoning for match' })
  @IsString()
  reasoning: string;

  @ApiProperty({ description: 'Number of banks involved' })
  @IsNumber()
  bankCount: number;

  @ApiProperty({ description: 'Number of deposits consolidated' })
  @IsNumber()
  depositCount: number;

  @ApiProperty({ description: 'Matching algorithm' })
  @IsString()
  algorithm: string;

  @ApiProperty({ description: 'Bank IDs and their deposit amounts' })
  bankBreakdown: Array<{
    bankId: string;
    bankName?: string;
    amount: number;
    transactionIds: number[];
  }>;
}

/**
 * Request to find consolidated deposit matches
 */
export class ConsolidatedDepositRequestDto {
  @ApiProperty({
    description: 'Unmatched bank transactions (from multiple banks)',
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

  @ApiPropertyOptional({ description: 'Amount tolerance percentage (default: 0.01 = 1%)' })
  @IsOptional()
  @IsNumber()
  amountTolerance?: number;

  @ApiPropertyOptional({ description: 'Date tolerance in days (default: 0 = same day)' })
  @IsOptional()
  @IsNumber()
  dateTolerance?: number;
}

/**
 * Response with consolidated deposit matches
 */
export class ConsolidatedDepositResponseDto {
  @ApiProperty({
    description: 'Consolidated deposit matches found',
    type: [ConsolidatedDepositMatchDto],
  })
  matches: ConsolidatedDepositMatchDto[];

  @ApiProperty({ description: 'Total matches found' })
  @IsNumber()
  totalMatches: number;

  @ApiProperty({ description: 'Total bank transactions involved' })
  @IsNumber()
  totalBankTransactions: number;

  @ApiProperty({ description: 'Total ledger transactions matched' })
  @IsNumber()
  totalLedgerTransactions: number;

  @ApiProperty({ description: 'Number of unique banks involved' })
  @IsNumber()
  uniqueBanks: number;

  @ApiProperty({ description: 'Matching algorithm used' })
  @IsString()
  algorithm: string;

  @ApiProperty({ description: 'Timestamp of matching' })
  @IsString()
  timestamp: string;
}
