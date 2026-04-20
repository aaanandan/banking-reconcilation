import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Tenant } from './tenant.entity';

/**
 * Activity Type Enum
 *
 * Categories of user activities tracked in the system
 */
export enum ActivityTypeEnum {
  // Authentication
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  EMAIL_VERIFIED = 'email_verified',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',

  // User management
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  PROFILE_UPDATED = 'profile_updated',

  // Reconciliation
  RECONCILIATION_CREATED = 'reconciliation_created',
  RECONCILIATION_STARTED = 'reconciliation_started',
  RECONCILIATION_COMPLETED = 'reconciliation_completed',
  MATCH_APPROVED = 'match_approved',
  MATCH_REJECTED = 'match_rejected',

  // Files
  FILE_UPLOADED = 'file_uploaded',
  FILE_DOWNLOADED = 'file_downloaded',
  FILE_DELETED = 'file_deleted',
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',

  // Billing
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_UPDATED = 'subscription_updated',
  SUBSCRIPTION_CANCELED = 'subscription_canceled',
  PAYMENT_METHOD_ADDED = 'payment_method_added',
  PAYMENT_METHOD_UPDATED = 'payment_method_updated',

  // Settings
  SETTINGS_UPDATED = 'settings_updated',
  WEBHOOK_CREATED = 'webhook_created',
  WEBHOOK_UPDATED = 'webhook_updated',
  WEBHOOK_DELETED = 'webhook_deleted',
  API_KEY_CREATED = 'api_key_created',
  API_KEY_REVOKED = 'api_key_revoked',

  // Security
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  SESSION_TERMINATED = 'session_terminated',
  DEVICE_TRUSTED = 'device_trusted',
  DEVICE_REVOKED = 'device_revoked',
}

/**
 * User Activity Entity
 *
 * Tracks all user actions in the system for:
 * - Security monitoring
 * - Compliance (GDPR, SOC2)
 * - User behavior analytics
 * - Suspicious activity detection
 * - Audit trails
 *
 * Features:
 * - Activity type categorization
 * - IP address and location tracking
 * - Device and browser fingerprinting
 * - Request metadata (method, path, status)
 * - Custom metadata for activity-specific data
 * - Performance tracking (duration)
 */
@Entity('user_activities')
@Index(['userId', 'createdAt'])
@Index(['tenantId', 'activityType'])
@Index(['ipAddress', 'createdAt'])
@Index(['createdAt'])
export class UserActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  /**
   * Activity type
   */
  @Column({ name: 'activity_type', type: 'varchar', length: 100 })
  activityType: ActivityTypeEnum;

  /**
   * Activity description
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  /**
   * Resource affected by activity
   * E.g., "reconciliation:123", "user:456"
   */
  @Column({ name: 'resource_type', type: 'varchar', length: 100, nullable: true })
  resourceType?: string;

  @Column({ name: 'resource_id', type: 'varchar', length: 100, nullable: true })
  resourceId?: string;

  /**
   * HTTP request details
   */
  @Column({ name: 'request_method', type: 'varchar', length: 10, nullable: true })
  requestMethod?: string;

  @Column({ name: 'request_path', type: 'varchar', length: 500, nullable: true })
  requestPath?: string;

  @Column({ name: 'response_status', type: 'int', nullable: true })
  responseStatus?: number;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs?: number;

  /**
   * IP address and location
   */
  @Column({ name: 'ip_address', type: 'varchar', length: 45 })
  ipAddress: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  /**
   * Device and browser information
   */
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'device_type', type: 'varchar', length: 50, nullable: true })
  deviceType?: string; // desktop, mobile, tablet

  @Column({ type: 'varchar', length: 100, nullable: true })
  browser?: string;

  @Column({ name: 'browser_version', type: 'varchar', length: 50, nullable: true })
  browserVersion?: string;

  @Column({ name: 'operating_system', type: 'varchar', length: 100, nullable: true })
  operatingSystem?: string;

  /**
   * Device fingerprint (hashed)
   */
  @Column({ name: 'device_fingerprint', type: 'varchar', length: 64, nullable: true })
  deviceFingerprint?: string;

  /**
   * Session ID
   */
  @Column({ name: 'session_id', type: 'varchar', length: 100, nullable: true })
  sessionId?: string;

  /**
   * Success/failure flag
   */
  @Column({ type: 'boolean', default: true })
  success: boolean;

  /**
   * Error message if failed
   */
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  /**
   * Additional metadata
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  /**
   * Suspicious activity flag
   */
  @Column({ name: 'is_suspicious', type: 'boolean', default: false })
  isSuspicious: boolean;

  /**
   * Risk score (0-100)
   */
  @Column({ name: 'risk_score', type: 'int', default: 0 })
  riskScore: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  /**
   * Mark activity as suspicious
   */
  markSuspicious(riskScore: number, reason?: string): void {
    this.isSuspicious = true;
    this.riskScore = riskScore;

    if (reason) {
      this.metadata = {
        ...this.metadata,
        suspiciousReason: reason,
      };
    }
  }

  /**
   * Get activity summary
   */
  getSummary(): string {
    const user = this.userId ? `User ${this.userId}` : 'Anonymous';
    const resource = this.resourceId ? ` on ${this.resourceType}:${this.resourceId}` : '';
    return `${user} performed ${this.activityType}${resource} from ${this.ipAddress}`;
  }

  /**
   * Check if activity is from mobile device
   */
  isMobileDevice(): boolean {
    return this.deviceType === 'mobile' || this.deviceType === 'tablet';
  }

  /**
   * Check if activity is recent (within minutes)
   */
  isRecent(minutes: number = 5): boolean {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.createdAt > cutoff;
  }
}
