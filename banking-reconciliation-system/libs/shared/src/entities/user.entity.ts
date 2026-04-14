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

  @Column({ nullable: true })
  passwordHash: string; // Nullable for OAuth users

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: 'user' })
  role: string;  // 'admin' | 'user'

  @Column({ default: true })
  isActive: boolean;

  // ═══════════════════════════════════════════════════════════
  // OAUTH / SOCIAL LOGIN
  // ═══════════════════════════════════════════════════════════
  @Column({ nullable: true })
  @Index()
  googleId: string; // Google OAuth ID

  @Column({ nullable: true })
  @Index()
  microsoftId: string; // Microsoft OAuth ID

  @Column({ default: 'local' })
  authProvider: string; // 'local' | 'google' | 'microsoft'
  // ═══════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════
  // TWO-FACTOR AUTHENTICATION (2FA/TOTP)
  // ═══════════════════════════════════════════════════════════
  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({ nullable: true })
  twoFactorSecret: string; // Encrypted TOTP secret
  // ═══════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════
  // BRUTE FORCE PROTECTION
  // ═══════════════════════════════════════════════════════════
  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ nullable: true, type: 'timestamp' })
  lastFailedLoginAt: Date | null;

  @Column({ nullable: true, type: 'timestamp' })
  accountLockedUntil: Date | null;
  // ═══════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════
  // PASSWORD RESET
  // ═══════════════════════════════════════════════════════════
  @Column({ nullable: true })
  resetPasswordToken: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  resetPasswordExpires: Date | null;
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
