import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Tenant } from './tenant.entity';

/**
 * Session Status Enum
 */
export enum SessionStatusEnum {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  SUSPICIOUS = 'suspicious',
}

/**
 * User Session Entity
 *
 * Enhanced session tracking with:
 * - Device fingerprinting and trust management
 * - Location tracking and anomaly detection
 * - Activity tracking per session
 * - Security monitoring
 * - Multi-device support
 *
 * Features:
 * - Session lifecycle management
 * - Device trust and "remember me" functionality
 * - Location-based anomaly detection
 * - Concurrent session limits
 * - Suspicious activity flagging
 * - Last activity tracking
 */
@Entity('user_sessions')
@Index(['userId', 'status'])
@Index(['sessionToken'])
@Index(['deviceFingerprint'])
@Index(['expiresAt'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  /**
   * Session token (hashed)
   */
  @Column({ name: 'session_token', type: 'varchar', length: 255, unique: true })
  sessionToken: string;

  /**
   * Session status
   */
  @Column({
    type: 'enum',
    enum: SessionStatusEnum,
    default: SessionStatusEnum.ACTIVE,
  })
  status: SessionStatusEnum;

  /**
   * IP address
   */
  @Column({ name: 'ip_address', type: 'varchar', length: 45 })
  ipAddress: string;

  /**
   * Location information
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  country?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  timezone?: string;

  /**
   * Device information
   */
  @Column({ name: 'user_agent', type: 'text' })
  userAgent: string;

  @Column({ name: 'device_type', type: 'varchar', length: 50, nullable: true })
  deviceType?: string; // desktop, mobile, tablet

  @Column({ name: 'device_name', type: 'varchar', length: 200, nullable: true })
  deviceName?: string; // e.g., "Chrome on Windows", "Safari on iPhone"

  @Column({ type: 'varchar', length: 100, nullable: true })
  browser?: string;

  @Column({ name: 'browser_version', type: 'varchar', length: 50, nullable: true })
  browserVersion?: string;

  @Column({ name: 'operating_system', type: 'varchar', length: 100, nullable: true })
  operatingSystem?: string;

  @Column({ name: 'os_version', type: 'varchar', length: 50, nullable: true })
  osVersion?: string;

  /**
   * Device fingerprint (hashed)
   * Used for device recognition and trust
   */
  @Column({ name: 'device_fingerprint', type: 'varchar', length: 64 })
  deviceFingerprint: string;

  /**
   * Device trust
   */
  @Column({ name: 'is_trusted_device', type: 'boolean', default: false })
  isTrustedDevice: boolean;

  @Column({ name: 'trusted_at', type: 'timestamptz', nullable: true })
  trustedAt?: Date;

  /**
   * Remember me flag
   */
  @Column({ name: 'remember_me', type: 'boolean', default: false })
  rememberMe: boolean;

  /**
   * Session expiry
   */
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  /**
   * Last activity
   */
  @Column({ name: 'last_activity_at', type: 'timestamptz' })
  lastActivityAt: Date;

  /**
   * Activity counters
   */
  @Column({ name: 'activity_count', type: 'int', default: 0 })
  activityCount: number;

  @Column({ name: 'api_calls_count', type: 'int', default: 0 })
  apiCallsCount: number;

  /**
   * Security flags
   */
  @Column({ name: 'is_suspicious', type: 'boolean', default: false })
  isSuspicious: boolean;

  @Column({ name: 'risk_score', type: 'int', default: 0 })
  riskScore: number;

  /**
   * Security metadata
   */
  @Column({ name: 'login_method', type: 'varchar', length: 50, nullable: true })
  loginMethod?: string; // password, oauth, sso, api_key

  @Column({ name: 'two_factor_verified', type: 'boolean', default: false })
  twoFactorVerified: boolean;

  /**
   * Additional metadata
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'terminated_at', type: 'timestamptz', nullable: true })
  terminatedAt?: Date;

  /**
   * Check if session is active
   */
  isActive(): boolean {
    if (this.status !== SessionStatusEnum.ACTIVE) {
      return false;
    }

    if (this.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Check if session is expired
   */
  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  /**
   * Update last activity
   */
  updateActivity(): void {
    this.lastActivityAt = new Date();
    this.activityCount++;
  }

  /**
   * Increment API call counter
   */
  incrementApiCalls(): void {
    this.apiCallsCount++;
  }

  /**
   * Terminate session
   */
  terminate(reason?: string): void {
    this.status = SessionStatusEnum.TERMINATED;
    this.terminatedAt = new Date();

    if (reason) {
      this.metadata = {
        ...this.metadata,
        terminationReason: reason,
      };
    }
  }

  /**
   * Mark as suspicious
   */
  markSuspicious(riskScore: number, reason?: string): void {
    this.isSuspicious = true;
    this.riskScore = riskScore;
    this.status = SessionStatusEnum.SUSPICIOUS;

    if (reason) {
      this.metadata = {
        ...this.metadata,
        suspiciousReason: reason,
      };
    }
  }

  /**
   * Trust this device
   */
  trustDevice(): void {
    this.isTrustedDevice = true;
    this.trustedAt = new Date();
  }

  /**
   * Revoke device trust
   */
  revokeTrust(): void {
    this.isTrustedDevice = false;
    this.trustedAt = undefined;
  }

  /**
   * Extend session expiry
   */
  extend(hours: number = 24): void {
    this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  /**
   * Get session duration in minutes
   */
  getDuration(): number {
    const now = this.terminatedAt || new Date();
    return Math.floor((now.getTime() - this.createdAt.getTime()) / (1000 * 60));
  }

  /**
   * Get time since last activity in minutes
   */
  getIdleTime(): number {
    const now = new Date();
    return Math.floor((now.getTime() - this.lastActivityAt.getTime()) / (1000 * 60));
  }

  /**
   * Check if IP changed
   */
  hasIpChanged(newIp: string): boolean {
    return this.ipAddress !== newIp;
  }

  /**
   * Check if location changed significantly
   */
  hasLocationChanged(newCountry: string, newCity?: string): boolean {
    if (this.country !== newCountry) {
      return true;
    }

    if (newCity && this.city && this.city !== newCity) {
      return true;
    }

    return false;
  }

  /**
   * Get session summary
   */
  getSummary(): string {
    return `${this.deviceName || this.deviceType} from ${this.city || this.country || this.ipAddress}`;
  }
}
