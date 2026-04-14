import { IsString, IsEnum, IsOptional, IsArray, IsDate, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * STEP 48: Question Manager DTOs
 *
 * Data Transfer Objects for question management operations
 */

export enum QuestionType {
  ENTITY_IDENTITY = 'entity_identity',
  ENTITY_RELATIONSHIP = 'entity_relationship',
  BUSINESS_PATTERN = 'business_pattern',
  VALUE_PATTERN = 'value_pattern',
  TIMING_PATTERN = 'timing_pattern',
  FIELD_PREFERENCE = 'field_preference',
  EXCEPTION_REASON = 'exception_reason',
  GENERAL_CONTEXT = 'general_context',
}

export enum QuestionPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum QuestionTiming {
  IMMEDIATE = 'immediate',
  STEP_END = 'step_end',
  SESSION_END = 'session_end',
  DEFERRED = 'deferred',
}

export enum AnswerType {
  TEXT = 'text',
  CHOICE = 'choice',
  BOOLEAN = 'boolean',
  NUMBER = 'number',
}

/**
 * DTO for creating a new learning question
 */
export class CreateQuestionDto {
  @ApiProperty({ description: 'Unique question identifier' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ enum: QuestionType, description: 'Type of question' })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ enum: QuestionPriority, description: 'Question priority' })
  @IsEnum(QuestionPriority)
  priority: QuestionPriority;

  @ApiProperty({ enum: QuestionTiming, description: 'When to ask the question' })
  @IsEnum(QuestionTiming)
  timing: QuestionTiming;

  @ApiProperty({ description: 'The question text' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ description: 'Context for the question' })
  @IsString()
  context: string;

  @ApiPropertyOptional({ description: 'Suggested answer options', type: [String] })
  @IsArray()
  @IsOptional()
  suggestedAnswers?: string[];

  @ApiProperty({ enum: AnswerType, description: 'Expected answer type' })
  @IsEnum(AnswerType)
  answerType: AnswerType;

  @ApiPropertyOptional({ description: 'Related entity ID' })
  @IsString()
  @IsOptional()
  relatedEntityId?: string;

  @ApiPropertyOptional({ description: 'Related transaction IDs', type: [Number] })
  @IsArray()
  @IsOptional()
  relatedTransactionIds?: number[];

  @ApiPropertyOptional({ description: 'Related reconciliation ID' })
  @IsString()
  @IsOptional()
  relatedReconciliationId?: string;

  @ApiProperty({ description: 'Service or component that triggered the question' })
  @IsString()
  triggeredBy: string;

  @ApiPropertyOptional({ description: 'Help text for answering' })
  @IsString()
  @IsOptional()
  helpText?: string;

  @ApiPropertyOptional({ description: 'Example answer' })
  @IsString()
  @IsOptional()
  exampleAnswer?: string;

  @ApiPropertyOptional({ description: 'Question expiration date' })
  @IsDate()
  @IsOptional()
  expiresAt?: Date;
}

/**
 * DTO for answering a question
 */
export class AnswerQuestionDto {
  @ApiProperty({ description: 'The answer to the question' })
  @IsNotEmpty()
  answer: any;
}

/**
 * DTO for filtering questions
 */
export class FilterQuestionsDto {
  @ApiPropertyOptional({ enum: QuestionType, description: 'Filter by question type' })
  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  @ApiPropertyOptional({ enum: QuestionPriority, description: 'Filter by priority' })
  @IsEnum(QuestionPriority)
  @IsOptional()
  priority?: QuestionPriority;

  @ApiPropertyOptional({ enum: QuestionTiming, description: 'Filter by timing' })
  @IsEnum(QuestionTiming)
  @IsOptional()
  timing?: QuestionTiming;

  @ApiPropertyOptional({ description: 'Filter by answered status (true = answered, false = unanswered)' })
  @IsOptional()
  answered?: boolean;

  @ApiPropertyOptional({ description: 'Filter by related entity ID' })
  @IsString()
  @IsOptional()
  relatedEntityId?: string;

  @ApiPropertyOptional({ description: 'Filter by related reconciliation ID' })
  @IsString()
  @IsOptional()
  relatedReconciliationId?: string;

  @ApiPropertyOptional({ description: 'Filter by triggered by service' })
  @IsString()
  @IsOptional()
  triggeredBy?: string;
}

/**
 * DTO for question response
 */
export class QuestionResponseDto {
  @ApiProperty({ description: 'Question ID' })
  id: string;

  @ApiProperty({ description: 'Unique question identifier' })
  questionId: string;

  @ApiProperty({ enum: QuestionType, description: 'Type of question' })
  type: QuestionType;

  @ApiProperty({ enum: QuestionPriority, description: 'Question priority' })
  priority: QuestionPriority;

  @ApiProperty({ enum: QuestionTiming, description: 'When to ask the question' })
  timing: QuestionTiming;

  @ApiProperty({ description: 'The question text' })
  question: string;

  @ApiProperty({ description: 'Context for the question' })
  context: string;

  @ApiProperty({ description: 'Suggested answer options', type: [String], nullable: true })
  suggestedAnswers: string[] | null;

  @ApiProperty({ enum: AnswerType, description: 'Expected answer type' })
  answerType: AnswerType;

  @ApiProperty({ description: 'Related entity ID', nullable: true })
  relatedEntityId: string | null;

  @ApiProperty({ description: 'Related transaction IDs', type: [Number] })
  relatedTransactionIds: number[];

  @ApiProperty({ description: 'Related reconciliation ID', nullable: true })
  relatedReconciliationId: string | null;

  @ApiProperty({ description: 'Service or component that triggered the question' })
  triggeredBy: string;

  @ApiProperty({ description: 'The answer to the question', nullable: true })
  answer: any;

  @ApiProperty({ description: 'When the question was answered', nullable: true })
  answeredAt: Date | null;

  @ApiProperty({ description: 'Question expiration date', nullable: true })
  expiresAt: Date | null;

  @ApiProperty({ description: 'Help text for answering', nullable: true })
  helpText: string | null;

  @ApiProperty({ description: 'Example answer', nullable: true })
  exampleAnswer: string | null;

  @ApiProperty({ description: 'When the question was created' })
  createdAt: Date;
}

/**
 * DTO for question statistics
 */
export class QuestionStatsDto {
  @ApiProperty({ description: 'Total number of questions' })
  total: number;

  @ApiProperty({ description: 'Number of answered questions' })
  answered: number;

  @ApiProperty({ description: 'Number of unanswered questions' })
  unanswered: number;

  @ApiProperty({ description: 'Number of expired questions' })
  expired: number;

  @ApiProperty({ description: 'Questions by type', type: Object })
  byType: Record<QuestionType, number>;

  @ApiProperty({ description: 'Questions by priority', type: Object })
  byPriority: Record<QuestionPriority, number>;

  @ApiProperty({ description: 'Questions by timing', type: Object })
  byTiming: Record<QuestionTiming, number>;
}

/**
 * DTO for question queue response
 */
export class QuestionQueueDto {
  @ApiProperty({ description: 'Questions to be asked immediately', type: [QuestionResponseDto] })
  immediate: QuestionResponseDto[];

  @ApiProperty({ description: 'Questions to be asked at step end', type: [QuestionResponseDto] })
  stepEnd: QuestionResponseDto[];

  @ApiProperty({ description: 'Questions to be asked at session end', type: [QuestionResponseDto] })
  sessionEnd: QuestionResponseDto[];

  @ApiProperty({ description: 'Deferred questions', type: [QuestionResponseDto] })
  deferred: QuestionResponseDto[];
}
