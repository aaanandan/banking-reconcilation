import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString } from 'class-validator';
import { TransactionDto } from '@app/shared';

export class UnmatchedPoolRequestDto {
  @ApiProperty({ type: [TransactionDto] })
  @IsArray()
  transactions: TransactionDto[];
}

export class UnmatchedPoolResponseDto {
  @ApiProperty({ type: [TransactionDto] })
  unmatchedTransactions: TransactionDto[];

  @ApiProperty()
  @IsNumber()
  totalUnmatched: number;

  @ApiProperty()
  @IsString()
  algorithm: string;

  @ApiProperty()
  @IsString()
  timestamp: string;

  @ApiProperty()
  summary: {
    totalProcessed: number;
    unmatchedCount: number;
  };
}
