import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsOptional } from 'class-validator';
import { TransactionDto } from '@app/shared';

/**
 * Split payment match candidate (multiple bank → 1 ledger)
 */
export class SplitPaymentMatchDto {
  @ApiProperty({ description: 'Bank transaction IDs in the split group' })
  @IsArray()
  bankTxnIds: number[];

  @ApiProperty({ description: 'Ledger transaction ID' })
  @IsNumber()
  ledgerTxnId: number;

  @ApiProperty({ description: 'Total amount of bank transactions' })
  @IsNumber()
  totalBankAmount: number;

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

  @ApiProperty({ description: 'Number of transactions in split' })
  @IsNumber()
  splitCount: number;

  @ApiProperty({ description: 'Matching algorithm' })
  @IsString()
  algorithm: string;

  @ApiPropertyOptional({ description: 'Bank IDs involved (multi-bank support)' })
  @IsOptional()
  @IsArray()
  bankIds?: string[];

  @ApiPropertyOptional({ description: 'Common entity name across splits' })
  @IsOptional()
  @IsString()
  entityName?: string;
}

/**
 * Request to find split payment matches
 */
export class SplitPaymentMatchRequestDto {
  @ApiProperty({
    description: 'Unmatched bank transactions to check for splits',
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

  @ApiPropertyOptional({ description: 'Max transactions per split group (default: 5)' })
  @IsOptional()
  @IsNumber()
  maxSplitSize?: number;

  @ApiPropertyOptional({ description: 'Amount tolerance percentage (default: 0.01 = 1%)' })
  @IsOptional()
  @IsNumber()
  amountTolerance?: number;

  @ApiPropertyOptional({ description: 'Date tolerance in days (default: 1)' })
  @IsOptional()
  @IsNumber()
  dateTolerance?: number;
}

/**
 * Response with split payment matches
 */
export class SplitPaymentMatchResponseDto {
  @ApiProperty({
    description: 'Split payment matches found',
    type: [SplitPaymentMatchDto],
  })
  matches: SplitPaymentMatchDto[];

  @ApiProperty({ description: 'Total matches found' })
  @IsNumber()
  totalMatches: number;

  @ApiProperty({ description: 'Total bank transactions involved in splits' })
  @IsNumber()
  totalBankTransactions: number;

  @ApiProperty({ description: 'Total ledger transactions matched' })
  @IsNumber()
  totalLedgerTransactions: number;

  @ApiProperty({ description: 'Matching algorithm used' })
  @IsString()
  algorithm: string;

  @ApiProperty({ description: 'Timestamp of matching' })
  @IsString()
  timestamp: string;
}
