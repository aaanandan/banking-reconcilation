// libs/shared/src/entities/match-candidate.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Reconciliation } from './reconciliation.entity';
import { Transaction } from './transaction.entity';

@Entity('match_candidates')
@Index(['reconciliationId', 'matchType'])
@Index(['reconciliationId', 'stepName'])
export class MatchCandidate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bankTransactionId: number;

  @Column()
  ledgerTransactionId: number;

  @ManyToOne(() => Transaction, txn => txn.matchCandidates)
  bankTransaction: Transaction;

  @ManyToOne(() => Transaction)
  ledgerTransaction: Transaction;

  // ══════════════════════════════════════════════════════════
  // Scores (Primary vs Additional matching)
  // ══════════════════════════════════════════════════════════
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  coreScore: number;  // 0.00 to 1.00

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  additionalScore: number;  // null for primary matches

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  overallScore: number;

  @Column({
    type: 'enum',
    enum: ['primary', 'additional'],
  })
  matchType: string;

  @Column({
    type: 'enum',
    enum: ['high', 'medium', 'low'],
  })
  confidence: string;

  // ══════════════════════════════════════════════════════════
  // Field-level breakdown
  // ══════════════════════════════════════════════════════════
  @Column({ type: 'jsonb' })
  fieldScores: {
    dateScore: number;
    amountScore: number;
    descriptionScore: number;
    refNumberScore?: number;
    payerPayeeScore?: number;
  };

  @Column({ type: 'text', nullable: true })
  matchReason: string;  // Human-readable explanation

  // ══════════════════════════════════════════════════════════
  // User decision tracking
  // ══════════════════════════════════════════════════════════
  @Column({
    type: 'enum',
    enum: ['approved', 'rejected', 'overridden', 'pending'],
    default: 'pending',
  })
  userDecision: string;

  @Column({ nullable: true })
  userSelectedAlternativeId: number;  // If user chose different match

  @Column({ type: 'text', nullable: true })
  userComment: string;

  // ══════════════════════════════════════════════════════════
  // Context
  // ══════════════════════════════════════════════════════════
  @Column()
  stepName: string;  // "MT-01", "MT-02", etc.

  @Column()
  @Index()
  reconciliationId: string;

  @ManyToOne(() => Reconciliation, recon => recon.matchCandidates, {
    onDelete: 'CASCADE',
  })
  reconciliation: Reconciliation;

  @CreateDateColumn()
  createdAt: Date;
}
