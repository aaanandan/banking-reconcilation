// libs/shared/src/entities/reconciliation.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { BankFile } from './bank-file.entity';
import { LedgerFile } from './ledger-file.entity';
import { Transaction } from './transaction.entity';
import { MatchCandidate } from './match-candidate.entity';
import { ConvergenceMetrics } from './convergence-metrics.entity';
import { User } from './user.entity';

@Entity('reconciliations')
export class Reconciliation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ═══════════════════════════════════════════════════════════
  // MULTI-TENANCY
  // ═══════════════════════════════════════════════════════════
  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, tenant => tenant.reconciliations)
  tenant: Tenant;
  // ═══════════════════════════════════════════════════════════

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.reconciliations)
  user: User;

  // ══════════════════════════════════════════════════════════
  // Multi-Bank Support: One-to-Many with BankFile
  // ══════════════════════════════════════════════════════════
  @OneToMany(() => BankFile, bankFile => bankFile.reconciliation)
  bankFiles: BankFile[];

  // Note: ledgerFile relationship removed - not in database schema

  // ══════════════════════════════════════════════════════════
  // Date Range Configuration (Optional Filtering)
  // ══════════════════════════════════════════════════════════
  @Column({ default: true, name: 'dateRangeIncludeAll' })
  includeAllDates: boolean;

  @Column({ type: 'date', nullable: true })
  dateRangeFrom: Date;

  @Column({ type: 'date', nullable: true })
  dateRangeTo: Date;

  // Note: dateRangeAnalysis removed - not in database schema

  // ══════════════════════════════════════════════════════════
  // Status & Progress
  // ══════════════════════════════════════════════════════════
  @Column({ default: 'created' })
  status: string;

  @Column({ type: 'int', default: 0 })
  currentStep: number;

  @Column({ type: 'int', default: 16 })
  totalSteps: number;

  // ══════════════════════════════════════════════════════════
  // Field Profile (stored as JSON)
  // ══════════════════════════════════════════════════════════
  @Column({ type: 'jsonb', nullable: true })
  fieldProfile: {
    banks: Record<string, any>;  // Per-bank profiles
    ledger: any;
    compatibilityAnalysis: any;
  };

  // ══════════════════════════════════════════════════════════
  // Statistics (aligned with database schema)
  // ══════════════════════════════════════════════════════════
  @Column({ default: 0 })
  totalBankTransactions: number;

  @Column({ default: 0 })
  totalLedgerTransactions: number;

  @Column({ default: 0 })
  matchedCount: number;

  @Column({ default: 0 })
  unmatchedBankCount: number;

  @Column({ default: 0 })
  unmatchedLedgerCount: number;

  @Column({ default: 0 })
  stagedMatchesCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  convergenceRate: number;

  @Column({ nullable: true })
  currentAlgorithm: string;

  @Column({ unique: true })
  reconciliationId: string;

  // ══════════════════════════════════════════════════════════
  // Relationships
  // ══════════════════════════════════════════════════════════
  @OneToMany(() => Transaction, transaction => transaction.reconciliation)
  transactions: Transaction[];

  @OneToMany(() => MatchCandidate, match => match.reconciliation)
  matchCandidates: MatchCandidate[];

  @OneToMany(() => ConvergenceMetrics, metrics => metrics.reconciliation)
  convergenceMetrics: ConvergenceMetrics[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
