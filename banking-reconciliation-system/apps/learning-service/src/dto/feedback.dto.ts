import { IsString, IsNumber, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Feedback Type Enum
 */
export enum FeedbackType {
  OVERRIDE = 'override',        // User chose different match than suggested
  REJECTION = 'rejection',      // User rejected suggested match
  MANUAL_MATCH = 'manual_match', // User created manual match
  COMMENT = 'comment',          // User provided commentary/notes
}

/**
 * Record User Feedback DTO
 * Used when user provides feedback during reconciliation review
 */
export class RecordFeedbackDto {
  @ApiProperty({ description: 'Reconciliation ID' })
  @IsString()
  reconciliationId: string;

  @ApiProperty({ description: 'Transaction ID that feedback relates to' })
  @IsNumber()
  transactionId: number;

  @ApiProperty({
    description: 'Type of feedback',
    enum: FeedbackType,
    example: FeedbackType.OVERRIDE,
  })
  @IsEnum(FeedbackType)
  feedbackType: FeedbackType;

  @ApiPropertyOptional({
    description: 'Original suggestion from matching algorithm (if applicable)',
    example: {
      algorithm: 'MT-02',
      suggestedMatch: 123,
      confidence: 0.85,
    },
  })
  @IsOptional()
  @IsObject()
  originalSuggestion?: any;

  @ApiPropertyOptional({
    description: 'User choice/action taken',
    example: {
      action: 'matched_to',
      selectedMatch: 456,
      reason: 'Better description match',
    },
  })
  @IsOptional()
  @IsObject()
  userChoice?: any;

  @ApiPropertyOptional({
    description: 'User-provided reason or notes',
    example: 'This is the correct match based on invoice number',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'User ID who provided feedback' })
  @IsString()
  userId: string;
}

/**
 * Feedback Response DTO
 */
export class FeedbackResponseDto {
  @ApiProperty({ description: 'Feedback record ID' })
  id: number;

  @ApiProperty({ description: 'Reconciliation ID' })
  reconciliationId: string;

  @ApiProperty({ description: 'Transaction ID' })
  transactionId: number;

  @ApiProperty({ description: 'Feedback type', enum: FeedbackType })
  feedbackType: string;

  @ApiPropertyOptional({ description: 'Original suggestion' })
  originalSuggestion?: any;

  @ApiPropertyOptional({ description: 'User choice' })
  userChoice?: any;

  @ApiPropertyOptional({ description: 'User reason' })
  reason?: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Feedback timestamp' })
  createdAt: Date;
}

/**
 * Get Feedback Query DTO
 */
export class GetFeedbackDto {
  @ApiPropertyOptional({ description: 'Filter by reconciliation ID' })
  @IsOptional()
  @IsString()
  reconciliationId?: string;

  @ApiPropertyOptional({ description: 'Filter by transaction ID' })
  @IsOptional()
  @IsNumber()
  transactionId?: number;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by feedback type', enum: FeedbackType })
  @IsOptional()
  @IsEnum(FeedbackType)
  feedbackType?: FeedbackType;
}

/**
 * Feedback Statistics DTO
 */
export class FeedbackStatsDto {
  @ApiProperty({ description: 'Total feedback records' })
  totalFeedback: number;

  @ApiProperty({ description: 'Override count' })
  overrideCount: number;

  @ApiProperty({ description: 'Rejection count' })
  rejectionCount: number;

  @ApiProperty({ description: 'Manual match count' })
  manualMatchCount: number;

  @ApiProperty({ description: 'Comment count' })
  commentCount: number;

  @ApiProperty({ description: 'Override rate (0-1)' })
  overrideRate: number;

  @ApiProperty({ description: 'Most common feedback type' })
  mostCommonType: string;
}
