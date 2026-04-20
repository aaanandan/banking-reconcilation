// libs/shared/src/entities/refresh-token.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true })
  @Index()
  token: string; // Hashed refresh token

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  revokedAt: Date | null;

  @Column({ nullable: true })
  @Index()
  ipAddress: string;

  @Column({ nullable: true, type: 'text' })
  userAgent: string;

  @Column({ default: false })
  isRevoked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if token is valid (not expired and not revoked)
   */
  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked;
  }
}
