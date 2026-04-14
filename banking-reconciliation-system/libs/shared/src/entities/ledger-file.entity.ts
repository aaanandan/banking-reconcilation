// libs/shared/src/entities/ledger-file.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('ledger_files')
export class LedgerFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ═══════════════════════════════════════════════════════════
  // MULTI-TENANCY
  // ═══════════════════════════════════════════════════════════
  @Column()
  @Index()
  tenantId: string;
  // ═══════════════════════════════════════════════════════════

  @Column()
  filename: string;

  @Column()
  totalRecords: number;

  @Column({ default: 0 })
  filteredRecords: number;

  @Column({ default: 0 })
  excludedRecords: number;

  @Column({ type: 'jsonb' })
  columnMapping: Record<string, string>;

  @Column({ type: 'date' })
  earliestDate: Date;

  @Column({ type: 'date' })
  latestDate: Date;

  @CreateDateColumn()
  uploadedAt: Date;
}
