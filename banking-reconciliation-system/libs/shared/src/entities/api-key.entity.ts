// libs/shared/src/entities/api-key.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Tenant } from './tenant.entity';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true })
  @Index()
  keyHash: string; // Hashed API key (SHA-256)

  @Column()
  name: string; // Friendly name for the key

  @Column({ nullable: true, type: 'text' })
  description: string; // Purpose of this key

  @Column()
  prefix: string; // First 8 characters of key (for identification)

  @Column({ type: 'simple-array', nullable: true })
  scopes: string[]; // Permissions: ['read', 'write', 'delete', 'admin']

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  lastUsedAt: Date | null;

  @Column({ nullable: true, type: 'timestamp' })
  expiresAt: Date | null;

  @Column({ default: 0 })
  usageCount: number; // Track number of requests made with this key

  @Column({ nullable: true })
  ipWhitelist: string; // Comma-separated IPs or CIDR ranges

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Check if key is expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false; // No expiration set
    }
    return new Date() > this.expiresAt;
  }

  /**
   * Check if key is valid (active and not expired)
   */
  isValid(): boolean {
    return this.isActive && !this.isExpired();
  }

  /**
   * Check if key has specific scope
   */
  hasScope(scope: string): boolean {
    if (!this.scopes || this.scopes.length === 0) {
      return false;
    }
    return this.scopes.includes(scope) || this.scopes.includes('admin');
  }

  /**
   * Check if IP is whitelisted
   */
  isIpAllowed(ip: string): boolean {
    if (!this.ipWhitelist) {
      return true; // No whitelist = allow all
    }

    const allowedIps = this.ipWhitelist.split(',').map(i => i.trim());
    return allowedIps.includes(ip);
  }
}
