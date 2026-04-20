import { IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DateRangeDto {
  @ApiProperty({
    description: 'Include all transactions (default: true)',
    default: true
  })
  @IsBoolean()
  includeAll: boolean = true;  // DEFAULT

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class DateRangeAnalysisDto {
  @ApiProperty()
  bankDateRange: {
    earliest: string;
    latest: string;
    totalTransactions: number;
  };

  @ApiProperty()
  ledgerDateRange: {
    earliest: string;
    latest: string;
    totalTransactions: number;
  };

  @ApiPropertyOptional()
  suggestedRange?: {
    from: string;
    to: string;
    coverage: number;
  };

  @ApiProperty()
  hasDateMismatch: boolean;
}
