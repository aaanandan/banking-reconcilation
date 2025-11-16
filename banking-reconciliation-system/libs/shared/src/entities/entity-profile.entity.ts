// libs/shared/src/entities/entity-profile.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { LearningQuestion } from './learning-question.entity';

@Entity('entity_profiles')
@Index(['entityId'], { unique: true })
export class EntityProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  entityId: string;  // Unique identifier for the payer/payee

  // ══════════════════════════════════════════════════════════
  // Identity
  // ══════════════════════════════════════════════════════════
  @Column()
  primaryName: string;

  @Column({ type: 'simple-array', default: '' })
  aliases: string[];

  @Column({ nullable: true })
  legalName: string;

  @Column({ type: 'simple-array', default: '' })
  relatedEntities: string[];

  @Column({ nullable: true })
  parentCompany: string;

  @Column({ type: 'simple-array', default: '' })
  subsidiaries: string[];

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'simple-array', default: '' })
  tags: string[];

  // ══════════════════════════════════════════════════════════
  // Business Patterns
  // ══════════════════════════════════════════════════════════
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  typicalAmountMin: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  typicalAmountMax: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  typicalAmountMedian: number;

  @Column({ nullable: true })
  frequencyPattern: string;  // 'daily', 'weekly', 'monthly', etc.

  @Column({ type: 'int', nullable: true })
  preferredDayOfMonth: number;

  @Column({ type: 'jsonb', nullable: true })
  seasonality: {
    hasPattern: boolean;
    peakMonths: number[];
    lowMonths: number[];
    explanation?: string;
  };

  // ══════════════════════════════════════════════════════════
  // Per-Bank Behavior (Multi-Bank Support)
  // ══════════════════════════════════════════════════════════
  @Column({ type: 'jsonb', nullable: true })
  bankSpecificBehavior: Record<string, {
    dateOffset: number;
    mostReliableField: string;
    refNumberFormat?: string;
  }>;

  // ══════════════════════════════════════════════════════════
  // Reconciliation Statistics
  // ══════════════════════════════════════════════════════════
  @Column({ default: 0 })
  totalTransactions: number;

  @Column({ default: 0 })
  successfulMatches: number;

  @Column({ default: 0 })
  manualInterventions: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  userOverrideRate: number;

  @Column({ nullable: true })
  mostReliableField: string;

  @Column({ type: 'jsonb', nullable: true })
  fieldReliabilityScores: Record<string, number>;

  // ══════════════════════════════════════════════════════════
  // Metadata
  // ══════════════════════════════════════════════════════════
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  confidence: number;

  @OneToMany(() => LearningQuestion, question => question.entityProfile)
  pendingQuestions: LearningQuestion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastUpdated: Date;
}
