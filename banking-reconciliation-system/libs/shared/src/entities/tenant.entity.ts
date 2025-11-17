// libs/shared/src/entities/tenant.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Reconciliation } from './reconciliation.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  tenantId: string; // "tenant_abc123"

  @Column()
  companyName: string;

  @Column({ unique: true })
  email: string; // Primary contact email

  @Column({ nullable: true })
  domain: string; // "acme.com" (optional custom domain)

  @Column({ default: 'active' })
  status: string; // 'active' | 'suspended' | 'trial' | 'cancelled'

  // PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
  // SUBSCRIPTION & BILLING
  // PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
  @Column({ default: 'free' })
  plan: string; // 'free' | 'starter' | 'professional' | 'enterprise'

  @Column({ type: 'date', nullable: true })
  trialEndsAt: Date;

  @Column({ type: 'date', nullable: true })
  subscriptionEndsAt: Date;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripeSubscriptionId: string;
  // PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP

  // PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
  // RESOURCE QUOTAS
  // PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
  @Column({ type: 'jsonb', nullable: true })
  quotas: {
    maxBankAccounts: number;      // e.g., 3 for starter
    maxTransactionsPerMonth: number; // e.g., 1000 for starter
    maxStorageMB: number;          // e.g., 100 MB for starter
    maxUsers: number;              // e.g., 5 for starter
  };

  @Column({ type: 'jsonb', nullable: true })
  currentUsage: {
    bankAccounts: number;
    transactionsThisMonth: number;
    storageMB: number;
    users: number;
  };
  // PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP

  // PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
  // CONFIGURATION
  // PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
  @Column({ type: 'jsonb', nullable: true })
  settings: {
    timezone: string;
    currency: string;
    dateFormat: string;
    allowMultipleBanks: boolean;
    features: string[]; // ['advanced_matching', 'api_access', etc.]
  };
  // PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP

  @OneToMany(() => User, user => user.tenant)
  users: User[];

  @OneToMany(() => Reconciliation, recon => recon.tenant)
  reconciliations: Reconciliation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
