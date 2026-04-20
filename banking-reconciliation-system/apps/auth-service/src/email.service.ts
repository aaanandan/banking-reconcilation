import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { Notification, NotificationChannelEnum } from '@app/shared/entities/notification.entity';

/**
 * Email Service
 *
 * Handles email sending with support for:
 * - Multiple email providers (SMTP, SendGrid, AWS SES)
 * - HTML template rendering with Handlebars
 * - Plain text fallback
 * - Attachment support
 * - Delivery tracking
 * - Error handling and retries
 *
 * Configuration (environment variables):
 * - EMAIL_PROVIDER: smtp | sendgrid | ses (default: smtp)
 * - EMAIL_FROM: Default sender email
 * - EMAIL_FROM_NAME: Default sender name
 *
 * For SMTP:
 * - SMTP_HOST: SMTP server host
 * - SMTP_PORT: SMTP server port (default: 587)
 * - SMTP_SECURE: Use TLS (default: false)
 * - SMTP_USER: SMTP username
 * - SMTP_PASS: SMTP password
 *
 * For SendGrid:
 * - SENDGRID_API_KEY: SendGrid API key
 *
 * For AWS SES:
 * - AWS_REGION: AWS region
 * - AWS_ACCESS_KEY_ID: AWS access key
 * - AWS_SECRET_ACCESS_KEY: AWS secret key
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templatesPath: string;
  private templateCache: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(
    private configService: ConfigService,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {
    this.templatesPath = path.join(__dirname, 'templates', 'email');
    this.initializeTransporter();
    this.registerHelpers();
  }

  /**
   * Initialize email transporter based on provider
   */
  private initializeTransporter(): void {
    const provider = this.configService.get('EMAIL_PROVIDER', 'smtp');

    switch (provider) {
      case 'sendgrid':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: this.configService.get('SENDGRID_API_KEY'),
          },
        });
        break;

      case 'ses':
        // AWS SES configuration
        this.transporter = nodemailer.createTransport({
          host: `email-smtp.${this.configService.get('AWS_REGION', 'us-east-1')}.amazonaws.com`,
          port: 587,
          secure: false,
          auth: {
            user: this.configService.get('AWS_ACCESS_KEY_ID'),
            pass: this.configService.get('AWS_SECRET_ACCESS_KEY'),
          },
        });
        break;

      case 'smtp':
      default:
        // Generic SMTP configuration
        this.transporter = nodemailer.createTransport({
          host: this.configService.get('SMTP_HOST', 'localhost'),
          port: parseInt(this.configService.get('SMTP_PORT', '587')),
          secure: this.configService.get('SMTP_SECURE', 'false') === 'true',
          auth: {
            user: this.configService.get('SMTP_USER'),
            pass: this.configService.get('SMTP_PASS'),
          },
        });
        break;
    }

    // Verify transporter configuration
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error(`Email transporter verification failed: ${error.message}`);
      } else {
        this.logger.log('Email transporter is ready');
      }
    });
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // Format currency
    handlebars.registerHelper('currency', (value: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    });

    // Format date
    handlebars.registerHelper('date', (value: Date | string) => {
      const date = typeof value === 'string' ? new Date(value) : value;
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    });

    // Format date and time
    handlebars.registerHelper('datetime', (value: Date | string) => {
      const date = typeof value === 'string' ? new Date(value) : value;
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }).format(date);
    });

    // Conditional equality
    handlebars.registerHelper('eq', (a, b) => a === b);

    // Conditional greater than
    handlebars.registerHelper('gt', (a, b) => a > b);

    // Current year
    handlebars.registerHelper('currentYear', () => new Date().getFullYear());
  }

  /**
   * Load and compile a Handlebars template
   */
  private async getTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      const cached = this.templateCache.get(templateName);
      if (cached) {
        return cached;
      }
    }

    // Load template from file
    const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);

    try {
      const templateSource = await fs.promises.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateSource);

      // Cache the compiled template
      this.templateCache.set(templateName, template);

      return template;
    } catch (error) {
      this.logger.error(`Failed to load template ${templateName}: ${error.message}`);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  /**
   * Generate plain text version from HTML
   */
  private htmlToPlainText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Send email using template
   */
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    template: string;
    context: Record<string, any>;
    from?: string;
    fromName?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Array<{
      filename: string;
      content?: Buffer | string;
      path?: string;
      contentType?: string;
    }>;
    notificationId?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Prepare context with defaults
      const context = {
        ...options.context,
        platformName: this.configService.get('PLATFORM_NAME', 'Banking Reconciliation'),
        year: new Date().getFullYear(),
        supportEmail: this.configService.get('SUPPORT_EMAIL', 'support@example.com'),
      };

      // Load and render template
      const template = await this.getTemplate(options.template);
      const html = template(context);
      const text = this.htmlToPlainText(html);

      // Prepare email options
      const from = options.fromName
        ? `${options.fromName} <${options.from || this.configService.get('EMAIL_FROM')}>`
        : options.from || this.configService.get('EMAIL_FROM');

      const mailOptions = {
        from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html,
        text,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        attachments: options.attachments,
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully: ${info.messageId}`);

      // Update notification if provided
      if (options.notificationId) {
        await this.updateNotificationDeliveryStatus(
          options.notificationId,
          NotificationChannelEnum.EMAIL,
          true,
        );
      }

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);

      // Update notification if provided
      if (options.notificationId) {
        await this.updateNotificationDeliveryStatus(
          options.notificationId,
          NotificationChannelEnum.EMAIL,
          false,
          error.message,
        );
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user: {
    email: string;
    firstName: string;
    companyName: string;
    plan: string;
    trialEndDate?: Date;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const dashboardUrl = `${this.configService.get('FRONTEND_URL')}/dashboard`;
    const helpUrl = `${this.configService.get('FRONTEND_URL')}/help`;

    return this.sendEmail({
      to: user.email,
      subject: `Welcome to ${this.configService.get('PLATFORM_NAME', 'Banking Reconciliation')}!`,
      template: 'welcome',
      context: {
        firstName: user.firstName,
        companyName: user.companyName,
        plan: user.plan,
        trialEndDate: user.trialEndDate,
        dashboardUrl,
        helpUrl,
      },
    });
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(user: {
    email: string;
    firstName: string;
    verificationCode?: string;
    verificationUrl?: string;
    expiryMinutes?: number;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address',
      template: 'email-verification',
      context: {
        firstName: user.firstName,
        verificationCode: user.verificationCode,
        verificationUrl: user.verificationUrl,
        expiryMinutes: user.expiryMinutes || 60,
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user: {
    email: string;
    firstName: string;
    resetUrl: string;
    expiryMinutes?: number;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      to: user.email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      context: {
        firstName: user.firstName,
        resetUrl: user.resetUrl,
        expiryMinutes: user.expiryMinutes || 60,
      },
    });
  }

  /**
   * Send trial expiring email
   */
  async sendTrialExpiringEmail(user: {
    email: string;
    firstName: string;
    daysRemaining: number;
    reconciliationsCount: number;
    transactionsCount: number;
    hoursSaved: number;
    matchRate: number;
    recommendedPlan: string;
    planFeatures: string[];
    planPrice: number;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const upgradeUrl = `${this.configService.get('FRONTEND_URL')}/billing/upgrade`;
    const contactUrl = `${this.configService.get('FRONTEND_URL')}/contact`;

    return this.sendEmail({
      to: user.email,
      subject: `Your Trial Ends in ${user.daysRemaining} Days`,
      template: 'trial-expiring',
      context: {
        ...user,
        upgradeUrl,
        contactUrl,
      },
    });
  }

  /**
   * Send payment failed email
   */
  async sendPaymentFailedEmail(user: {
    email: string;
    firstName: string;
    amount: number;
    plan: string;
    billingPeriod: string;
    paymentMethod: string;
    failureReason: string;
    attemptDate: Date;
    retryDays: number;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const updatePaymentUrl = `${this.configService.get('FRONTEND_URL')}/billing/payment-method`;

    return this.sendEmail({
      to: user.email,
      subject: 'Payment Failed - Action Required',
      template: 'payment-failed',
      context: {
        ...user,
        updatePaymentUrl,
        supportEmail: this.configService.get('SUPPORT_EMAIL', 'support@example.com'),
      },
    });
  }

  /**
   * Update notification delivery status
   */
  private async updateNotificationDeliveryStatus(
    notificationId: string,
    channel: NotificationChannelEnum,
    sent: boolean,
    error?: string,
  ): Promise<void> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id: notificationId },
      });

      if (notification) {
        notification.updateDeliveryStatus(channel, sent, error);
        await this.notificationRepository.save(notification);
      }
    } catch (err) {
      this.logger.error(`Failed to update notification delivery status: ${err.message}`);
    }
  }

  /**
   * Verify email transporter is working
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error(`Email connection verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(to: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      to,
      subject: 'Test Email',
      template: 'welcome',
      context: {
        firstName: 'Test User',
        companyName: 'Test Company',
        plan: 'Professional',
        dashboardUrl: '#',
        helpUrl: '#',
      },
    });
  }
}
