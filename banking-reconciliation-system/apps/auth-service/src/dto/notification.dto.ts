import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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

export enum EmailTemplateEnum {
  WELCOME = 'welcome',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  TRIAL_EXPIRING = 'trial_expiring',
  TRIAL_EXPIRED = 'trial_expired',
  SUBSCRIPTION_CONFIRMED = 'subscription_confirmed',
  PAYMENT_FAILED = 'payment_failed',
  INVOICE_PAID = 'invoice_paid',
  ONBOARDING_INCOMPLETE = 'onboarding_incomplete',
  QUOTA_WARNING = 'quota_warning',
  QUOTA_EXCEEDED = 'quota_exceeded',
  TEAM_INVITATION = 'team_invitation',
  RECONCILIATION_COMPLETE = 'reconciliation_complete',
  WEEKLY_REPORT = 'weekly_report',
  MONTHLY_REPORT = 'monthly_report',
}

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  recipientId: string;

  @ApiProperty({ enum: NotificationTypeEnum })
  @IsEnum(NotificationTypeEnum)
  type: NotificationTypeEnum;

  @ApiProperty({ enum: NotificationCategoryEnum })
  @IsEnum(NotificationCategoryEnum)
  category: NotificationCategoryEnum;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  actionLabel?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ type: [String], enum: NotificationChannelEnum })
  @IsArray()
  @IsEnum(NotificationChannelEnum, { each: true })
  channels: NotificationChannelEnum[];
}

export class NotificationDto {
  id: string;
  recipientId: string;
  type: NotificationTypeEnum;
  category: NotificationCategoryEnum;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  channels: NotificationChannelEnum[];
  deliveryStatus: Record<NotificationChannelEnum, {
    sent: boolean;
    sentAt?: Date;
    error?: string;
  }>;
  createdAt: Date;
}

export class SendEmailDto {
  @ApiProperty()
  @IsEmail()
  to: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ enum: EmailTemplateEnum, required: false })
  @IsEnum(EmailTemplateEnum)
  @IsOptional()
  template?: EmailTemplateEnum;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  htmlContent?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  textContent?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  variables?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
  }>;
}

export class NotificationPreferencesDto {
  @ApiProperty()
  @IsBoolean()
  emailEnabled: boolean;

  @ApiProperty()
  @IsBoolean()
  smsEnabled: boolean;

  @ApiProperty()
  @IsBoolean()
  pushEnabled: boolean;

  @ApiProperty()
  @IsObject()
  categories: Record<NotificationCategoryEnum, {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  }>;
}

export class UpdateNotificationPreferencesDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  smsEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  categories?: Partial<Record<NotificationCategoryEnum, {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    inApp?: boolean;
  }>>;
}

export class MarkAsReadDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  notificationIds: string[];
}

export class NotificationListDto {
  notifications: NotificationDto[];
  unreadCount: number;
  total: number;
  page: number;
  pageSize: number;
}

export class NotificationStatsDto {
  totalSent: number;
  totalRead: number;
  totalUnread: number;
  readRate: number;
  byCategory: Record<NotificationCategoryEnum, {
    sent: number;
    read: number;
    unread: number;
  }>;
  byChannel: Record<NotificationChannelEnum, {
    sent: number;
    delivered: number;
    failed: number;
  }>;
}

export class BulkNotificationDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  recipientIds: string[];

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ enum: NotificationTypeEnum })
  @IsEnum(NotificationTypeEnum)
  type: NotificationTypeEnum;

  @ApiProperty({ enum: NotificationCategoryEnum })
  @IsEnum(NotificationCategoryEnum)
  category: NotificationCategoryEnum;

  @ApiProperty({ type: [String], enum: NotificationChannelEnum })
  @IsArray()
  @IsEnum(NotificationChannelEnum, { each: true })
  channels: NotificationChannelEnum[];

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class EmailQueueStatusDto {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  retrying: number;
  totalInQueue: number;
}

export class NotificationTemplateVariables {
  // Common variables
  userName?: string;
  userEmail?: string;
  companyName?: string;

  // Onboarding
  onboardingProgress?: number;
  nextStep?: string;

  // Billing
  planName?: string;
  amount?: number;
  currency?: string;
  invoiceUrl?: string;
  trialDaysRemaining?: number;

  // Security
  verificationCode?: string;
  resetLink?: string;

  // Quota
  resourceType?: string;
  currentUsage?: number;
  limit?: number;
  usagePercentage?: number;

  // Team
  inviterName?: string;
  inviteLink?: string;

  // Reconciliation
  reconciliationId?: string;
  matchRate?: number;
  totalTransactions?: number;

  // Reports
  reportUrl?: string;
  reportPeriod?: string;

  // Generic
  actionUrl?: string;
  actionLabel?: string;
  [key: string]: any;
}
