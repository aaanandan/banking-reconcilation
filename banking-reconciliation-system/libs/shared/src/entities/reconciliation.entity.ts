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
  @OneToMany(() => BankFile, bankFile => bankFile.reconciliation, {
    cascade: true,
    eager: true,
  })
  bankFiles: BankFile[];

  @OneToOne(() => LedgerFile, { cascade: true, eager: true })
  @JoinColumn()
  ledgerFile: LedgerFile;

  // ══════════════════════════════════════════════════════════
  // Date Range Configuration (Optional Filtering)
  // ══════════════════════════════════════════════════════════
  @Column({ default: true })
  includeAllDates: boolean;

  @Column({ type: 'date', nullable: true })
  dateRangeFrom: Date;

  @Column({ type: 'date', nullable: true })
  dateRangeTo: Date;

  @Column({ type: 'jsonb', nullable: true })
  dateRangeAnalysis: {
    bankDateRange: {
      earliest: string;
      latest: string;
      totalTransactions: number;
    };
    ledgerDateRange: {
      earliest: string;
      latest: string;
      totalTransactions: number;
    };
    hasDateMismatch: boolean;
  };

  // ══════════════════════════════════════════════════════════
  // Status & Progress
  // ══════════════════════════════════════════════════════════
  @Column({
    type: 'enum',
    enum: ['in_progress', 'paused', 'completed'],
    default: 'in_progress',
  })
  status: string;

  @Column({ nullable: true })
  currentStep: string;

  @Column({ type: 'simple-array', default: '' })
  completedSteps: string[];

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
  // Statistics
  // ══════════════════════════════════════════════════════════
  @Column({ default: 0 })
  totalTransactions: number;

  @Column({ default: 0 })
  matchedCount: number;

  @Column({ default: 0 })
  unmatchedCount: number;

  @Column({ default: 0 })
  manualCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  convergenceRate: number;

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
