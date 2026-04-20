import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationTypeEnum {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum NotificationChannelEnum {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationCategoryEnum {
  SYSTEM = 'system',
  BILLING = 'billing',
  SECURITY = 'security',
  ONBOARDING = 'onboarding',
  RECONCILIATION = 'reconciliation',
  TEAM = 'team',
  FEATURE = 'feature',
}

@Entity('notifications')
@Index(['recipientId', 'isRead'])
@Index(['recipientId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recipient_id', type: 'varchar', length: 255 })
  @Index()
  recipientId: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 255, nullable: true })
  @Index()
  tenantId?: string;

  @Column({ type: 'enum', enum: NotificationTypeEnum, default: NotificationTypeEnum.INFO })
  type: NotificationTypeEnum;

  @Column({ type: 'enum', enum: NotificationCategoryEnum, default: NotificationCategoryEnum.SYSTEM })
  category: NotificationCategoryEnum;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'action_url', type: 'varchar', length: 500, nullable: true })
  actionUrl?: string;

  @Column({ name: 'action_label', type: 'varchar', length: 100, nullable: true })
  actionLabel?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  @Index()
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt?: Date;

  @Column({ type: 'jsonb' })
  channels: NotificationChannelEnum[];

  @Column({ name: 'delivery_status', type: 'jsonb', default: {} })
  deliveryStatus: Record<NotificationChannelEnum, {
    sent: boolean;
    sentAt?: Date;
    error?: string;
  }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date;

  /**
   * Mark notification as read
   */
  markAsRead(): void {
    this.isRead = true;
    this.readAt = new Date();
  }

  /**
   * Mark notification as unread
   */
  markAsUnread(): void {
    this.isRead = false;
    this.readAt = undefined;
  }

  /**
   * Update delivery status for a channel
   */
  updateDeliveryStatus(
    channel: NotificationChannelEnum,
    sent: boolean,
    error?: string,
  ): void {
    if (!this.deliveryStatus) {
      this.deliveryStatus = {} as any;
    }

    this.deliveryStatus[channel] = {
      sent,
      sentAt: sent ? new Date() : undefined,
      error,
    };
  }

  /**
   * Check if notification has been delivered on all requested channels
   */
  isFullyDelivered(): boolean {
    if (!this.channels || this.channels.length === 0) {
      return false;
    }

    return this.channels.every(
      (channel) => this.deliveryStatus?.[channel]?.sent === true,
    );
  }

  /**
   * Get failed channels
   */
  getFailedChannels(): NotificationChannelEnum[] {
    if (!this.deliveryStatus) {
      return [];
    }

    return this.channels.filter(
      (channel) => this.deliveryStatus[channel]?.sent === false && this.deliveryStatus[channel]?.error,
    );
  }

  /**
   * Check if notification is expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }

    return new Date() > this.expiresAt;
  }
}
