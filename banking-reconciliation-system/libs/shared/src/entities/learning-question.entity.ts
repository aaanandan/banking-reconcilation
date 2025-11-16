// libs/shared/src/entities/learning-question.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { EntityProfile } from './entity-profile.entity';

@Entity('learning_questions')
@Index(['timing', 'priority'])
@Index(['answeredAt'])
export class LearningQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  questionId: string;

  @Column({
    type: 'enum',
    enum: [
      'entity_identity',
      'entity_relationship',
      'business_pattern',
      'value_pattern',
      'timing_pattern',
      'field_preference',
      'exception_reason',
      'general_context',
    ],
  })
  type: string;

  @Column({
    type: 'enum',
    enum: ['critical', 'high', 'medium', 'low'],
  })
  priority: string;

  @Column({
    type: 'enum',
    enum: ['immediate', 'step_end', 'session_end', 'deferred'],
  })
  timing: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text' })
  context: string;

  @Column({ type: 'simple-array', nullable: true })
  suggestedAnswers: string[];

  @Column()
  answerType: string;  // 'text' | 'choice' | 'boolean' | 'number'

  // Context
  @Column({ nullable: true })
  relatedEntityId: string;

  @ManyToOne(() => EntityProfile, profile => profile.pendingQuestions, {
    nullable: true,
  })
  entityProfile: EntityProfile;

  @Column({ type: 'simple-array', default: '' })
  relatedTransactionIds: number[];

  @Column({ nullable: true })
  relatedReconciliationId: string;

  @Column()
  triggeredBy: string;

  // Answer tracking
  @Column({ type: 'jsonb', nullable: true })
  answer: any;

  @Column({ nullable: true })
  answeredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  // Display hints
  @Column({ type: 'text', nullable: true })
  helpText: string;

  @Column({ type: 'text', nullable: true })
  exampleAnswer: string;

  @CreateDateColumn()
  createdAt: Date;
}
