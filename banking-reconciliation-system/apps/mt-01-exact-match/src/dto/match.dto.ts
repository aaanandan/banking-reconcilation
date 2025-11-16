import { IsArray, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TransactionDto } from '@app/shared';

/**
 * MatchRequestDto
 * DTO for POST /match/exact
 */
export class MatchRequestDto {
  @ApiProperty({ description: 'Bank transactions to match', type: [TransactionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  bankTransactions: TransactionDto[];

  @ApiProperty({ description: 'Ledger transactions pool to match against', type: [TransactionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  ledgerTransactions: TransactionDto[];
}

/**
 * MatchCandidateDto
 * Represents a single match candidate
 */
export class MatchCandidateDto {
  @ApiProperty({ description: 'Bank transaction ID' })
  bankTxnId: number;

  @ApiProperty({ description: 'Ledger transaction ID' })
  ledgerTxnId: number;

  @ApiProperty({ description: 'Match confidence (1.0 for exact match)' })
  confidence: number;

  @ApiProperty({ description: 'Reason for the match' })
  reasoning: string;

  @ApiProperty({ description: 'Algorithm used', example: 'MT-01' })
  algorithm: string;

  // ═══════════════════════════════════════════════════════════
  // MULTI-BANK SUPPORT (Step 24)
  // ═══════════════════════════════════════════════════════════
  @ApiProperty({ description: 'Bank identifier (bank_1, bank_2, etc.)', required: false })
  bankId?: string;

  @ApiProperty({ description: 'Bank name (HDFC, ICICI, SBI, etc.)', required: false })
  bankName?: string;
}

/**
 * MatchResponseDto
 * DTO for POST /match/exact response
 */
export class MatchResponseDto {
  @ApiProperty({ description: 'Array of match candidates', type: [MatchCandidateDto] })
  matches: MatchCandidateDto[];

  @ApiProperty({ description: 'Total number of matches found' })
  totalMatches: number;

  @ApiProperty({ description: 'Algorithm used', example: 'MT-01-Exact' })
  algorithm: string;

  @ApiProperty({ description: 'Execution timestamp' })
  timestamp: string;
}
