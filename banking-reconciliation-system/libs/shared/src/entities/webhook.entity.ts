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
import { Tenant } from './tenant.entity';

/**
 * Webhook Event Enum
 *
 * Available webhook events that tenants can subscribe to
 */
export enum WebhookEventEnum {
  // Reconciliation events
  RECONCILIATION_CREATED = 'reconciliation.created',
  RECONCILIATION_COMPLETED = 'reconciliation.completed',
  RECONCILIATION_FAILED = 'reconciliation.failed',
  MATCH_CREATED = 'match.created',
  MATCH_APPROVED = 'match.approved',
  MATCH_REJECTED = 'match.rejected',

  // User events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',

  // Subscription events
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELED = 'subscription.canceled',
  TRIAL_ENDING = 'trial.ending',
  TRIAL_ENDED = 'trial.ended',

  // Payment events
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  INVOICE_CREATED = 'invoice.created',
  INVOICE_PAID = 'invoice.paid',

  // Quota events
  QUOTA_WARNING = 'quota.warning',
  QUOTA_EXCEEDED = 'quota.exceeded',

  // System events
  EXPORT_COMPLETED = 'export.completed',
  IMPORT_COMPLETED = 'import.completed',
}

/**
 * Webhook Entity
 *
 * Stores webhook endpoint configurations for tenants
 *
 * Features:
 * - Per-tenant webhook endpoints
 * - Event filtering (subscribe to specific events)
 * - HMAC signature verification
 * - Active/inactive status
 * - Custom headers support
 * - Secret rotation
 */
@Entity('webhooks')
@Index(['tenantId', 'enabled'])
@Index(['tenantId', 'events'])
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  /**
   * Webhook endpoint URL
   * Must be HTTPS in production
   */
  @Column({ type: 'varchar', length: 500 })
  url: string;

  /**
   * Webhook description/label
   */
  @Column({ type: 'varchar', length: 200, nullable: true })
  description?: string;

  /**
   * Events to listen for
   * Empty array = listen to all events
   */
  @Column({ type: 'jsonb', default: [] })
  events: WebhookEventEnum[];

  /**
   * Secret key for HMAC signature verification
   * Generated automatically, can be rotated
   */
  @Column({ type: 'varchar', length: 100 })
  secret: string;

  /**
   * Whether webhook is enabled
   */
  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  /**
   * Custom HTTP headers to send with webhook
   * E.g., { "Authorization": "Bearer token", "X-Custom": "value" }
   */
  @Column({ type: 'jsonb', default: {} })
  headers: Record<string, string>;

  /**
   * Maximum number of delivery attempts before marking as failed
   */
  @Column({ name: 'max_retries', type: 'int', default: 3 })
  maxRetries: number;

  /**
   * Timeout in milliseconds for webhook request
   */
  @Column({ name: 'timeout_ms', type: 'int', default: 5000 })
  timeoutMs: number;

  /**
   * Statistics
   */
  @Column({ name: 'total_deliveries', type: 'int', default: 0 })
  totalDeliveries: number;

  @Column({ name: 'successful_deliveries', type: 'int', default: 0 })
  successfulDeliveries: number;

  @Column({ name: 'failed_deliveries', type: 'int', default: 0 })
  failedDeliveries: number;

  @Column({ name: 'last_delivery_at', type: 'timestamptz', nullable: true })
  lastDeliveryAt?: Date;

  @Column({ name: 'last_success_at', type: 'timestamptz', nullable: true })
  lastSuccessAt?: Date;

  @Column({ name: 'last_failure_at', type: 'timestamptz', nullable: true })
  lastFailureAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  /**
   * Check if webhook is subscribed to event
   */
  isSubscribedToEvent(event: WebhookEventEnum): boolean {
    // Empty events array means subscribed to all events
    if (this.events.length === 0) {
      return true;
    }

    return this.events.includes(event);
  }

  /**
   * Update delivery statistics
   */
  recordDelivery(success: boolean): void {
    this.totalDeliveries++;
    this.lastDeliveryAt = new Date();

    if (success) {
      this.successfulDeliveries++;
      this.lastSuccessAt = new Date();
    } else {
      this.failedDeliveries++;
      this.lastFailureAt = new Date();
    }
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    if (this.totalDeliveries === 0) {
      return 0;
    }

    return (this.successfulDeliveries / this.totalDeliveries) * 100;
  }

  /**
   * Rotate webhook secret
   */
  rotateSecret(): string {
    this.secret = this.generateSecret();
    return this.secret;
  }

  /**
   * Generate webhook secret
   */
  private generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = 'whsec_';

    for (let i = 0; i < 40; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return secret;
  }

  /**
   * Validate webhook URL
   */
  static isValidUrl(url: string, requireHttps: boolean = true): boolean {
    try {
      const parsedUrl = new URL(url);

      if (requireHttps && parsedUrl.protocol !== 'https:') {
        return false;
      }

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}
