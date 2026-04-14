import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString } from 'class-validator';
import { TransactionDto } from '@app/shared';

export class PayerGroupDto {
  @ApiProperty()
  @IsString()
  payerName: string;

  @ApiProperty()
  @IsNumber()
  transactionCount: number;

  @ApiProperty()
  @IsArray()
  transactionIds: number[];

  @ApiProperty()
  @IsNumber()
  totalAmount: number;

  @ApiProperty()
  @IsNumber()
  confidence: number;

  @ApiProperty()
  @IsString()
  reasoning: string;
}

export class HighVolumeMatchingRequestDto {
  @ApiProperty({ type: [TransactionDto] })
  @IsArray()
  bankTransactions: TransactionDto[];

  @ApiProperty({ required: false })
  @IsNumber()
  volumeThreshold?: number; // Minimum transactions to be "high-volume" (default: 5)
}

export class HighVolumeMatchingResponseDto {
  @ApiProperty({ type: [PayerGroupDto] })
  groups: PayerGroupDto[];

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
    highVolumePayersFound: number;
    volumeThreshold: number;
  };
}
