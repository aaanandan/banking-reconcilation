// libs/shared/src/entities/transaction.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Reconciliation } from './reconciliation.entity';
import { MatchCandidate } from './match-candidate.entity';

@Entity('transactions')
@Index(['reconciliationId', 'source'])
@Index(['reconciliationId', 'bankId'])
@Index(['reconciliationId', 'status'])
@Index(['date'])
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  // ═══════════════════════════════════════════════════════════
  // MULTI-TENANCY
  // ═══════════════════════════════════════════════════════════
  @Column()
  @Index()
  tenantId: string;
  // ═══════════════════════════════════════════════════════════

  @Column()
  source: string;  // 'bank' | 'ledger'

  // ══════════════════════════════════════════════════════════
  // Multi-Bank Support
  // ══════════════════════════════════════════════════════════
  @Column({ nullable: true })
  @Index()
  bankId: string;

  @Column({ nullable: true })
  bankName: string;
  // ══════════════════════════════════════════════════════════

  // Core fields
  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'text' })
  description: string;

  // Optional fields (stored as JSON)
  @Column({ type: 'jsonb', nullable: true })
  optional: {
    txnType?: 'credit' | 'debit';
    refNumber?: string;
    payerPayee?: string;
    currency?: string;
    runningBalance?: number;
    checkNumber?: string;
    category?: string;
  };

  // Additional metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Match status
  @Column({
    type: 'enum',
    enum: ['unmatched', 'staged', 'committed', 'manual'],
    default: 'unmatched',
  })
  status: string;

  @Column({ nullable: true })
  matchedToId: number;

  @Column()
  @Index()
  reconciliationId: string;

  @ManyToOne(() => Reconciliation, recon => recon.transactions, {
    onDelete: 'CASCADE',
  })
  reconciliation: Reconciliation;

  @OneToMany(() => MatchCandidate, match => match.bankTransaction)
  matchCandidates: MatchCandidate[];

  @CreateDateColumn()
  createdAt: Date;
}
