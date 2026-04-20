import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsBoolean } from 'class-validator';

/**
 * Match to validate
 */
export class MatchDto {
  @ApiProperty({ description: 'Bank transaction ID' })
  @IsNumber()
  bankTxnId: number;

  @ApiProperty({ description: 'Ledger transaction ID' })
  @IsNumber()
  ledgerTxnId: number;

  @ApiProperty({ description: 'Bank amount' })
  @IsNumber()
  bankAmount: number;

  @ApiProperty({ description: 'Ledger amount' })
  @IsNumber()
  ledgerAmount: number;

  @ApiProperty({ description: 'Bank date' })
  @IsString()
  bankDate: string;

  @ApiProperty({ description: 'Ledger date' })
  @IsString()
  ledgerDate: string;

  @ApiProperty({ description: 'Match confidence score' })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'Matching algorithm used' })
  @IsString()
  algorithm: string;
}

/**
 * Validation issue
 */
export class ValidationIssueDto {
  @ApiProperty({ description: 'Issue severity' })
  @IsString()
  severity: 'critical' | 'warning' | 'info';

  @ApiProperty({ description: 'Issue code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Issue message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Affected match indices' })
  @IsArray()
  affectedMatches: number[];
}

/**
 * Validation request
 */
export class ValidationRequestDto {
  @ApiProperty({
    description: 'Matches to validate',
    type: [MatchDto],
  })
  @IsArray()
  matches: MatchDto[];
}

/**
 * Validation response
 */
export class ValidationResponseDto {
  @ApiProperty({ description: 'Validation passed' })
  @IsBoolean()
  valid: boolean;

  @ApiProperty({ description: 'Total matches validated' })
  @IsNumber()
  totalMatches: number;

  @ApiProperty({ description: 'Matches that passed validation' })
  @IsNumber()
  validMatches: number;

  @ApiProperty({ description: 'Matches that failed validation' })
  @IsNumber()
  invalidMatches: number;

  @ApiProperty({
    description: 'Validation issues found',
    type: [ValidationIssueDto],
  })
  issues: ValidationIssueDto[];

  @ApiProperty({ description: 'Validation algorithm' })
  @IsString()
  algorithm: string;

  @ApiProperty({ description: 'Timestamp of validation' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'Coverage statistics' })
  coverage: {
    matchedPercentage: number;
    criticalIssues: number;
    warningIssues: number;
    lowConfidenceMatches: number;
  };
}
