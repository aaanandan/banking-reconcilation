import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString } from 'class-validator';
import { TransactionDto } from '@app/shared';

export class StandingOrderGroupDto {
  @ApiProperty()
  @IsString()
  pattern: string;

  @ApiProperty()
  @IsNumber()
  transactionCount: number;

  @ApiProperty()
  @IsArray()
  transactionIds: number[];

  @ApiProperty()
  @IsNumber()
  averageAmount: number;

  @ApiProperty()
  @IsNumber()
  confidence: number;

  @ApiProperty()
  @IsString()
  reasoning: string;
}

export class StandingOrderMatchingRequestDto {
  @ApiProperty({ type: [TransactionDto] })
  @IsArray()
  bankTransactions: TransactionDto[];

  @ApiProperty({ required: false })
  @IsNumber()
  minOccurrences?: number; // Default: 3
}

export class StandingOrderMatchingResponseDto {
  @ApiProperty({ type: [StandingOrderGroupDto] })
  groups: StandingOrderGroupDto[];

  @ApiProperty()
  @IsNumber()
  totalGroups: number;

  @ApiProperty()
  @IsString()
  algorithm: string;

  @ApiProperty()
  @IsString()
  timestamp: string;

  @ApiProperty()
  summary: {
    totalProcessed: number;
    standingOrdersFound: number;
    minOccurrences: number;
  };
}
