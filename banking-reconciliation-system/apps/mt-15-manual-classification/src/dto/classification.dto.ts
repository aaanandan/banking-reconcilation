import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class ManualClassificationRequestDto {
  @ApiProperty()
  @IsNumber()
  transactionId: number;

  @ApiProperty()
  @IsString()
  classification: string;

  @ApiProperty()
  @IsString()
  notes: string;
}

export class ManualClassificationResponseDto {
  @ApiProperty()
  @IsNumber()
  transactionId: number;

  @ApiProperty()
  @IsString()
  classification: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsString()
  timestamp: string;
}
