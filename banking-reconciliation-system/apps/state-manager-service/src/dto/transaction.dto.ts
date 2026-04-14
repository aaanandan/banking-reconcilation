import { IsString, IsOptional, IsArray, ValidateNested, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TransactionDto } from '@app/shared';

/**
 * BulkStoreTransactionsDto
 * DTO for POST /state/transactions/bulk
 */
export class BulkStoreTransactionsDto {
  @ApiProperty({ description: 'Reconciliation ID to associate transactions with' })
  @IsString()
  reconciliationId: string;

  @ApiProperty({ description: 'Array of normalized transactions to store', type: [TransactionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  transactions: TransactionDto[];
}

/**
 * BulkStoreTransactionsResponseDto
 * DTO for POST /state/transactions/bulk response
 */
export class BulkStoreTransactionsResponseDto {
  @ApiProperty({ description: 'Number of transactions inserted' })
  inserted: number;

  @ApiProperty({ description: 'Array of generated transaction IDs', type: [Number] })
  transactionIds: number[];
}

/**
 * QueryTransactionsDto
 * DTO for GET /state/transactions query parameters
 */
export class QueryTransactionsDto {
  @ApiProperty({ description: 'Reconciliation ID to query transactions for' })
  @IsString()
  reconciliationId: string;

  @ApiPropertyOptional({ description: 'Filter by source', enum: ['bank', 'ledger'] })
  @IsOptional()
  @IsEnum(['bank', 'ledger'])
  source?: 'bank' | 'ledger';

  @ApiPropertyOptional({ description: 'Filter by bank ID (multi-bank support)' })
  @IsOptional()
  @IsString()
  bankId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['unmatched', 'staged', 'committed', 'manual']
  })
  @IsOptional()
  @IsEnum(['unmatched', 'staged', 'committed', 'manual'])
  status?: 'unmatched' | 'staged' | 'committed' | 'manual';
}
