// libs/shared/src/entities/convergence-metrics.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Reconciliation } from './reconciliation.entity';

@Entity('convergence_metrics')
@Index(['reconciliationId', 'stepName'])
export class ConvergenceMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  reconciliationId: string;

  @ManyToOne(() => Reconciliation, recon => recon.convergenceMetrics, {
    onDelete: 'CASCADE',
  })
  reconciliation: Reconciliation;

  @Column()
  stepName: string;

  // Performance metrics
  @Column({ default: 0 })
  candidatesFound: number;

  @Column({ default: 0 })
  candidatesMatched: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  successRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  contributionScore: number;

  @Column({ default: false })
  isBottleneck: boolean;

  // User interaction metrics
  @Column({ default: 0 })
  userApprovalsWithoutEdit: number;

  @Column({ default: 0 })
  userOverrides: number;

  @Column({ default: 0 })
  userRejects: number;

  @Column({ type: 'int', default: 0 })
  avgTimeSpent: number;  // Seconds

  // Field effectiveness
  @Column({ type: 'simple-array', default: '' })
  fieldsThatHelped: string[];

  @Column({ type: 'simple-array', default: '' })
  fieldsThatDidntHelp: string[];

  @CreateDateColumn()
  createdAt: Date;
}
