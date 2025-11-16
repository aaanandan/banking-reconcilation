import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BankFileMetadataDto {
  @ApiProperty()
  @IsString()
  fileId: string;

  @ApiProperty()
  @IsString()
  bankId: string;

  @ApiProperty()
  @IsString()
  bankName: string;

  @ApiProperty()
  @IsString()
  filename: string;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty()
  @IsNumber()
  totalRecords: number;

  @ApiProperty()
  @IsNumber()
  filteredRecords: number;

  @ApiProperty()
  @IsNumber()
  excludedRecords: number;

  @ApiProperty()
  columnMapping: Record<string, string>;

  @ApiProperty()
  dateRange: {
    earliest: string;
    latest: string;
  };
}

export class LedgerFileMetadataDto {
  @ApiProperty()
  @IsString()
  fileId: string;

  @ApiProperty()
  @IsString()
  filename: string;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty()
  @IsNumber()
  totalRecords: number;

  @ApiProperty()
  @IsNumber()
  filteredRecords: number;

  @ApiProperty()
  @IsNumber()
  excludedRecords: number;

  @ApiProperty()
  columnMapping: Record<string, string>;

  @ApiProperty()
  dateRange: {
    earliest: string;
    latest: string;
  };
}
