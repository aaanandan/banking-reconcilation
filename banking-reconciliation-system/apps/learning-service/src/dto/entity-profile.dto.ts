import { IsString, IsNumber, IsOptional, IsArray, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Create Entity Profile DTO
 * Used to create a new entity profile for a payer/payee
 */
export class CreateEntityProfileDto {
  @ApiProperty({ description: 'Unique entity identifier (e.g., "ABC Corp")' })
  @IsString()
  entityId: string;

  @ApiProperty({ description: 'Primary name for this entity' })
  @IsString()
  primaryName: string;

  @ApiPropertyOptional({ description: 'Aliases/alternate names', type: [String] })
  @IsOptional()
  @IsArray()
  aliases?: string[];

  @ApiPropertyOptional({ description: 'Legal registered name' })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ description: 'Industry/sector' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: 'Location/region' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Tags for categorization', type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

/**
 * Update Entity Profile DTO
 * For partial updates to existing profiles
 */
export class UpdateEntityProfileDto {
  @ApiPropertyOptional({ description: 'Update primary name' })
  @IsOptional()
  @IsString()
  primaryName?: string;

  @ApiPropertyOptional({ description: 'Update aliases', type: [String] })
  @IsOptional()
  @IsArray()
  aliases?: string[];

  @ApiPropertyOptional({ description: 'Update legal name' })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ description: 'Update industry' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: 'Update location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Update tags', type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Minimum typical amount' })
  @IsOptional()
  @IsNumber()
  typicalAmountMin?: number;

  @ApiPropertyOptional({ description: 'Maximum typical amount' })
  @IsOptional()
  @IsNumber()
  typicalAmountMax?: number;

  @ApiPropertyOptional({ description: 'Median typical amount' })
  @IsOptional()
  @IsNumber()
  typicalAmountMedian?: number;

  @ApiPropertyOptional({ description: 'Frequency pattern (daily, weekly, monthly, etc.)' })
  @IsOptional()
  @IsString()
  frequencyPattern?: string;

  @ApiPropertyOptional({ description: 'Preferred day of month (1-31)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  preferredDayOfMonth?: number;
}

/**
 * Entity Profile Response DTO
 * Complete entity profile data
 */
export class EntityProfileResponseDto {
  @ApiProperty({ description: 'Profile ID' })
  id: string;

  @ApiProperty({ description: 'Entity ID' })
  entityId: string;

  @ApiProperty({ description: 'Primary name' })
  primaryName: string;

  @ApiPropertyOptional({ description: 'Aliases', type: [String] })
  aliases?: string[];

  @ApiPropertyOptional({ description: 'Legal name' })
  legalName?: string;

  @ApiPropertyOptional({ description: 'Related entities', type: [String] })
  relatedEntities?: string[];

  @ApiPropertyOptional({ description: 'Parent company' })
  parentCompany?: string;

  @ApiPropertyOptional({ description: 'Subsidiaries', type: [String] })
  subsidiaries?: string[];

  @ApiPropertyOptional({ description: 'Industry' })
  industry?: string;

  @ApiPropertyOptional({ description: 'Location' })
  location?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Typical amount range minimum' })
  typicalAmountMin?: number;

  @ApiPropertyOptional({ description: 'Typical amount range maximum' })
  typicalAmountMax?: number;

  @ApiPropertyOptional({ description: 'Typical amount median' })
  typicalAmountMedian?: number;

  @ApiPropertyOptional({ description: 'Frequency pattern' })
  frequencyPattern?: string;

  @ApiPropertyOptional({ description: 'Preferred day of month' })
  preferredDayOfMonth?: number;

  @ApiPropertyOptional({ description: 'Seasonality pattern' })
  seasonality?: any;

  @ApiPropertyOptional({ description: 'Per-bank behavior patterns' })
  bankSpecificBehavior?: any;

  @ApiProperty({ description: 'Total transactions processed' })
  totalTransactions: number;

  @ApiProperty({ description: 'Successful matches' })
  successfulMatches: number;

  @ApiProperty({ description: 'Manual interventions' })
  manualInterventions: number;

  @ApiProperty({ description: 'User override rate (0-1)' })
  userOverrideRate: number;

  @ApiPropertyOptional({ description: 'Most reliable field for matching' })
  mostReliableField?: string;

  @ApiPropertyOptional({ description: 'Field reliability scores' })
  fieldReliabilityScores?: Record<string, number>;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  confidence: number;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: Date;
}

/**
 * Entity Profile Statistics DTO
 * Summary statistics for an entity
 */
export class EntityProfileStatsDto {
  @ApiProperty({ description: 'Entity ID' })
  entityId: string;

  @ApiProperty({ description: 'Entity name' })
  entityName: string;

  @ApiProperty({ description: 'Total transactions' })
  totalTransactions: number;

  @ApiProperty({ description: 'Successful match rate (0-1)' })
  matchRate: number;

  @ApiProperty({ description: 'User override rate (0-1)' })
  overrideRate: number;

  @ApiProperty({ description: 'Average transaction amount' })
  avgAmount: number;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  confidence: number;

  @ApiProperty({ description: 'Most common frequency pattern' })
  frequencyPattern: string;

  @ApiProperty({ description: 'Number of aliases' })
  aliasCount: number;
}

/**
 * Build Profile From Transactions DTO
 * Request to analyze transactions and build/update profile
 */
export class BuildProfileFromTransactionsDto {
  @ApiProperty({ description: 'Entity identifier to build profile for' })
  @IsString()
  entityId: string;

  @ApiProperty({ description: 'Reconciliation ID to analyze transactions from' })
  @IsString()
  reconciliationId: string;

  @ApiPropertyOptional({ description: 'Entity name if creating new profile' })
  @IsOptional()
  @IsString()
  entityName?: string;
}

/**
 * Bank Specific Behavior DTO
 * Per-bank behavior patterns for an entity
 */
export class BankSpecificBehaviorDto {
  @ApiProperty({ description: 'Date offset in days (e.g., -2 means bank is 2 days behind)' })
  @IsNumber()
  dateOffset: number;

  @ApiProperty({ description: 'Most reliable field for matching this entity at this bank' })
  @IsString()
  mostReliableField: string;

  @ApiPropertyOptional({ description: 'Reference number format pattern for this bank' })
  @IsOptional()
  @IsString()
  refNumberFormat?: string;
}

/**
 * Update Bank Behavior DTO
 * Update per-bank behavior for an entity
 */
export class UpdateBankBehaviorDto {
  @ApiProperty({ description: 'Bank ID' })
  @IsString()
  bankId: string;

  @ApiProperty({ description: 'Bank-specific behavior data', type: BankSpecificBehaviorDto })
  @IsObject()
  behavior: BankSpecificBehaviorDto;
}

/**
 * Bank Behavior Response DTO
 * Per-bank behavior data for an entity
 */
export class BankBehaviorResponseDto {
  @ApiProperty({ description: 'Entity ID' })
  entityId: string;

  @ApiProperty({ description: 'Bank ID' })
  bankId: string;

  @ApiProperty({ description: 'Bank-specific behavior', type: BankSpecificBehaviorDto })
  behavior: BankSpecificBehaviorDto;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: Date;
}

/**
 * All Banks Behavior Response DTO
 * All per-bank behaviors for an entity
 */
export class AllBanksBehaviorResponseDto {
  @ApiProperty({ description: 'Entity ID' })
  entityId: string;

  @ApiProperty({
    description: 'Per-bank behaviors',
    type: 'object',
    additionalProperties: {
      type: 'object',
      properties: {
        dateOffset: { type: 'number' },
        mostReliableField: { type: 'string' },
        refNumberFormat: { type: 'string' },
      },
    },
  })
  bankSpecificBehavior: Record<string, BankSpecificBehaviorDto>;

  @ApiProperty({ description: 'Number of banks tracked' })
  banksCount: number;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: Date;
}
