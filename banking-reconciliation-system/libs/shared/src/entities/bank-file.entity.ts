// libs/shared/src/entities/bank-file.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Reconciliation } from './reconciliation.entity';

@Entity('bank_files')
export class BankFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bankId: string;  // bank_1, bank_2, bank_3...

  @Column()
  bankName: string;  // "HDFC", "ICICI", "SBI"

  @Column()
  filename: string;

  @Column()
  totalRecords: number;

  @Column({ default: 0 })
  filteredRecords: number;  // After date filter

  @Column({ default: 0 })
  excludedRecords: number;  // Excluded by date filter

  @Column({ type: 'jsonb' })
  columnMapping: Record<string, string>;

  @Column({ type: 'date' })
  earliestDate: Date;

  @Column({ type: 'date' })
  latestDate: Date;

  @ManyToOne(() => Reconciliation, recon => recon.bankFiles, {
    onDelete: 'CASCADE',
  })
  reconciliation: Reconciliation;

  @CreateDateColumn()
  uploadedAt: Date;
}
