import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CoreTransactionDto {
  @ApiProperty({ description: 'Transaction date in ISO format' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Transaction description' })
  @IsNotEmpty()
  @IsString()
  description: string;
}

export class OptionalTransactionFieldsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['credit', 'debit'])
  txnType?: 'credit' | 'debit';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payerPayee?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;
}

export class TransactionDto extends CoreTransactionDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  source: 'bank' | 'ledger';

  // ═══════════════════════════════════════════════════════════
  // MULTI-BANK SUPPORT
  // ═══════════════════════════════════════════════════════════
  @ApiPropertyOptional({ description: 'Bank identifier (bank_1, bank_2, etc.)' })
  @IsOptional()
  @IsString()
  bankId?: string;

  @ApiPropertyOptional({ description: 'Bank name (HDFC, ICICI, SBI, etc.)' })
  @IsOptional()
  @IsString()
  bankName?: string;
  // ═══════════════════════════════════════════════════════════

  @ApiPropertyOptional()
  @IsOptional()
  optional?: OptionalTransactionFieldsDto;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  @IsString()
  status: 'unmatched' | 'staged' | 'committed' | 'manual';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  matchedToId?: number;

  @ApiProperty()
  @IsString()
  reconciliationId: string;
}
