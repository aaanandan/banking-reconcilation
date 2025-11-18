// libs/shared/src/entities/user.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { Reconciliation } from './reconciliation.entity';
import { UserFeedback } from './user-feedback.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ═══════════════════════════════════════════════════════════
  // MULTI-TENANCY
  // ═══════════════════════════════════════════════════════════
  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, tenant => tenant.users)
  tenant: Tenant;
  // ═══════════════════════════════════════════════════════════

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: 'user' })
  role: string;  // 'admin' | 'user'

  @Column({ default: true })
  isActive: boolean;

  // ═══════════════════════════════════════════════════════════
  // EMAIL VERIFICATION
  // ═══════════════════════════════════════════════════════════
  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken: string;

  @Column({ nullable: true, type: 'timestamp' })
  emailVerificationExpires: Date;
  // ═══════════════════════════════════════════════════════════

  @OneToMany(() => Reconciliation, recon => recon.user)
  reconciliations: Reconciliation[];

  @OneToMany(() => UserFeedback, feedback => feedback.user)
  feedbacks: UserFeedback[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
