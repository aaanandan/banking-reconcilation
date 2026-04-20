import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Webhook, WebhookEventEnum } from './webhook.entity';
import { Tenant } from './tenant.entity';

/**
 * Webhook Delivery Status Enum
 */
export enum WebhookDeliveryStatusEnum {
  PENDING = 'pending',
  SENDING = 'sending',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

/**
 * Webhook Delivery Entity
 *
 * Tracks individual webhook delivery attempts
 *
 * Features:
 * - Complete delivery history
 * - Retry tracking with attempts
 * - Request/response logging
 * - Error tracking
 * - Delivery duration tracking
 */
@Entity('webhook_deliveries')
@Index(['webhookId', 'createdAt'])
@Index(['tenantId', 'status'])
@Index(['status', 'nextRetryAt'])
export class WebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'webhook_id', type: 'uuid' })
  webhookId: string;

  @ManyToOne(() => Webhook, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'webhook_id' })
  webhook: Webhook;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  /**
   * Event that triggered the webhook
   */
  @Column({ type: 'varchar', length: 100 })
  event: WebhookEventEnum;

  /**
   * Webhook payload (event data)
   */
  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  /**
   * Delivery status
   */
  @Column({
    type: 'enum',
    enum: WebhookDeliveryStatusEnum,
    default: WebhookDeliveryStatusEnum.PENDING,
  })
  status: WebhookDeliveryStatusEnum;

  /**
   * Number of delivery attempts
   */
  @Column({ type: 'int', default: 0 })
  attempts: number;

  /**
   * Maximum retry attempts
   */
  @Column({ name: 'max_attempts', type: 'int', default: 3 })
  maxAttempts: number;

  /**
   * Next retry time (for exponential backoff)
   */
  @Column({ name: 'next_retry_at', type: 'timestamptz', nullable: true })
  nextRetryAt?: Date;

  /**
   * HTTP request details
   */
  @Column({ name: 'request_url', type: 'varchar', length: 500 })
  requestUrl: string;

  @Column({ name: 'request_method', type: 'varchar', length: 10, default: 'POST' })
  requestMethod: string;

  @Column({ name: 'request_headers', type: 'jsonb', nullable: true })
  requestHeaders?: Record<string, string>;

  @Column({ name: 'request_body', type: 'jsonb', nullable: true })
  requestBody?: Record<string, any>;

  /**
   * HTTP response details
   */
  @Column({ name: 'response_status', type: 'int', nullable: true })
  responseStatus?: number;

  @Column({ name: 'response_headers', type: 'jsonb', nullable: true })
  responseHeaders?: Record<string, string>;

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody?: string;

  /**
   * Delivery duration in milliseconds
   */
  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs?: number;

  /**
   * Error information
   */
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'error_code', type: 'varchar', length: 50, nullable: true })
  errorCode?: string;

  /**
   * Timestamps
   */
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  /**
   * Mark delivery as successful
   */
  markSuccess(responseStatus: number, responseBody: string, durationMs: number): void {
    this.status = WebhookDeliveryStatusEnum.SUCCESS;
    this.responseStatus = responseStatus;
    this.responseBody = responseBody;
    this.durationMs = durationMs;
    this.completedAt = new Date();
  }

  /**
   * Mark delivery as failed
   */
  markFailed(errorMessage: string, errorCode?: string, responseStatus?: number): void {
    this.status = WebhookDeliveryStatusEnum.FAILED;
    this.errorMessage = errorMessage;
    this.errorCode = errorCode;
    this.responseStatus = responseStatus;
    this.completedAt = new Date();
  }

  /**
   * Increment attempt and schedule retry
   */
  scheduleRetry(): void {
    this.attempts++;

    if (this.attempts >= this.maxAttempts) {
      this.markFailed('Max retry attempts reached', 'MAX_RETRIES_EXCEEDED');
      return;
    }

    this.status = WebhookDeliveryStatusEnum.RETRYING;

    // Exponential backoff: 2^attempt seconds
    const backoffSeconds = Math.pow(2, this.attempts);
    this.nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);
  }

  /**
   * Check if delivery is ready for retry
   */
  isReadyForRetry(): boolean {
    if (this.status !== WebhookDeliveryStatusEnum.RETRYING) {
      return false;
    }

    if (!this.nextRetryAt) {
      return true;
    }

    return this.nextRetryAt <= new Date();
  }

  /**
   * Check if delivery should be retried
   */
  shouldRetry(): boolean {
    return (
      this.status === WebhookDeliveryStatusEnum.FAILED &&
      this.attempts < this.maxAttempts
    );
  }

  /**
   * Get delivery summary for logging
   */
  getSummary(): string {
    return `Webhook delivery ${this.id}: ${this.event} to ${this.requestUrl} - ${this.status} (${this.attempts}/${this.maxAttempts} attempts)`;
  }
}
