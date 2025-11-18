// libs/shared/src/entities/audit-log.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Tenant } from './tenant.entity';

/**
 * AuditLog Entity
 *
 * Stores comprehensive audit trail of all security-sensitive operations
 * in the system for compliance, security monitoring, and forensic analysis.
 */
@Entity('audit_logs')
@Index(['tenantId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['eventType', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Tenant isolation
  @Column({ type: 'uuid', nullable: true })
  @Index()
  tenantId: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  // User who performed the action
  @Column({ type: 'uuid', nullable: true })
  @Index()
  userId: string | null;

  @Column({ nullable: true })
  userEmail: string | undefined; // Denormalized for quick access

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Event classification
  @Column({ length: 100 })
  @Index()
  eventType: string; // login, logout, register, password_reset, api_key_created, etc.

  @Column({ length: 100 })
  @Index()
  action: string; // Alias for eventType for backwards compatibility

  @Column({ length: 50 })
  @Index()
  eventCategory: string; // authentication, authorization, data_access, configuration, security

  @Column({ length: 20 })
  severity: string; // info, warning, error, critical

  // Event details
  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Additional context

  // Request information
  @Column({ length: 10, nullable: true })
  httpMethod: string | null; // GET, POST, PUT, DELETE, etc.

  @Column({ type: 'text', nullable: true })
  httpPath: string | null; // /api/auth/login

  @Column({ type: 'int', nullable: true })
  httpStatusCode: number | null; // 200, 401, 500, etc.

  @Column({ type: 'int', nullable: true })
  responseTime: number | null; // Response time in milliseconds

  // Client information
  @Column({ length: 45, nullable: true })
  @Index()
  ipAddress: string | null; // IPv4 or IPv6

  @Column({ type: 'text', nullable: true })
  userAgent: string | null; // Browser/client information

  @Column({ length: 255, nullable: true })
  deviceId: string | null; // Device identifier if available

  // Geolocation (optional, can be populated from IP)
  @Column({ length: 100, nullable: true })
  country: string | null;

  @Column({ length: 100, nullable: true })
  city: string | null;

  // Security indicators
  @Column({ default: false })
  isSuspicious: boolean; // Flagged as potentially suspicious

  @Column({ default: false })
  isSuccessful: boolean; // Whether the operation succeeded

  @Column({ type: 'text', nullable: true })
  failureReason: string | null; // Why operation failed

  // Resource tracking
  @Column({ length: 100, nullable: true })
  resourceType: string | null; // user, api_key, transaction, etc.

  @Column({ type: 'uuid', nullable: true })
  resourceId: string | null; // ID of the resource affected

  // Changes tracking (for update/delete operations)
  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any> | null; // Before state

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any> | null; // After state

  // Session tracking
  @Column({ type: 'uuid', nullable: true })
  sessionId: string | null; // Session or request ID for correlation

  // Timestamps
  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  timestamp: Date; // Alias for createdAt for backwards compatibility

  // Retention policy flag
  @Column({ default: false })
  isArchived: boolean; // For implementing data retention policies
}

/**
 * Event Type Constants
 * Standardized event types for consistent logging
 */
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  REGISTER = 'register',
  EMAIL_VERIFIED = 'email_verified',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  TWO_FACTOR_VERIFIED = 'two_factor_verified',
  TWO_FACTOR_FAILED = 'two_factor_failed',

  // OAuth events
  OAUTH_LOGIN_SUCCESS = 'oauth_login_success',
  OAUTH_LOGIN_FAILURE = 'oauth_login_failure',
  OAUTH_ACCOUNT_LINKED = 'oauth_account_linked',

  // Password events
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  PASSWORD_RESET_FAILED = 'password_reset_failed',

  // Session events
  SESSION_CREATED = 'session_created',
  SESSION_REFRESHED = 'session_refreshed',
  SESSION_REVOKED = 'session_revoked',
  SESSION_EXPIRED = 'session_expired',

  // API Key events
  API_KEY_CREATED = 'api_key_created',
  API_KEY_USED = 'api_key_used',
  API_KEY_REVOKED = 'api_key_revoked',
  API_KEY_ROTATED = 'api_key_rotated',
  API_KEY_DELETED = 'api_key_deleted',
  API_KEY_INVALID = 'api_key_invalid',

  // Account security events
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  FAILED_LOGIN_ATTEMPT = 'failed_login_attempt',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',

  // Data access events
  DATA_EXPORTED = 'data_exported',
  SENSITIVE_DATA_ACCESSED = 'sensitive_data_accessed',
  BULK_OPERATION = 'bulk_operation',

  // Configuration changes
  SETTINGS_CHANGED = 'settings_changed',
  PERMISSIONS_CHANGED = 'permissions_changed',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REVOKED = 'role_revoked',

  // System events
  SYSTEM_ERROR = 'system_error',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  CORS_VIOLATION = 'cors_violation',
  CSP_VIOLATION = 'csp_violation',
}

/**
 * Event Category Constants
 */
export enum AuditEventCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  CONFIGURATION = 'configuration',
  SECURITY = 'security',
  SYSTEM = 'system',
}

/**
 * Severity Levels
 */
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}
