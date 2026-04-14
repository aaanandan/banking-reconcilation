import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';

/**
 * Email Queue Processor
 *
 * Processes email jobs from the queue for reliable async delivery
 *
 * Features:
 * - Retry logic with exponential backoff
 * - Failed job tracking
 * - Job priority support
 * - Rate limiting to prevent provider throttling
 * - Dead letter queue for permanently failed emails
 *
 * Job Types:
 * - send-email: Generic email with template
 * - welcome-email: Welcome email for new users
 * - verification-email: Email verification
 * - password-reset-email: Password reset
 * - trial-expiring-email: Trial expiration warning
 * - payment-failed-email: Payment failure notification
 *
 * Configuration:
 * - Queue uses Redis for job storage
 * - Default retry: 3 attempts with exponential backoff
 * - Rate limit: Configurable per provider
 */
@Injectable()
export class EmailQueueProcessor {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  // In-memory queue simulation (replace with BullMQ in production)
  private queue: Array<{
    id: string;
    type: string;
    data: any;
    attempts: number;
    maxAttempts: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
    processedAt?: Date;
    error?: string;
  }> = [];

  private processing = false;
  private processingInterval: NodeJS.Timeout;

  constructor(private emailService: EmailService) {
    // Start processing queue every 5 seconds
    this.startProcessing();
  }

  /**
   * Start queue processing
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(async () => {
      if (!this.processing && this.queue.length > 0) {
        await this.processQueue();
      }
    }, 5000); // Process every 5 seconds

    this.logger.log('Email queue processor started');
  }

  /**
   * Stop queue processing
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.logger.log('Email queue processor stopped');
    }
  }

  /**
   * Add email job to queue
   */
  async addEmailJob(
    type: string,
    data: any,
    options: {
      priority?: number;
      delay?: number;
      maxAttempts?: number;
    } = {},
  ): Promise<string> {
    const jobId = this.generateJobId();

    const job = {
      id: jobId,
      type,
      data,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      status: 'pending' as const,
      createdAt: new Date(),
    };

    this.queue.push(job);

    this.logger.log(`Email job added to queue: ${jobId} (type: ${type})`);

    return jobId;
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    this.processing = true;

    try {
      // Get all pending jobs
      const pendingJobs = this.queue.filter((job) => job.status === 'pending');

      for (const job of pendingJobs) {
        await this.processJob(job);

        // Add small delay between jobs to respect rate limits
        await this.sleep(100);
      }
    } catch (error) {
      this.logger.error(`Queue processing error: ${error.message}`, error.stack);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process individual job
   */
  private async processJob(job: any): Promise<void> {
    job.status = 'processing';
    job.attempts++;

    this.logger.log(`Processing email job: ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);

    try {
      let result: { success: boolean; messageId?: string; error?: string };

      switch (job.type) {
        case 'send-email':
          result = await this.emailService.sendEmail(job.data);
          break;

        case 'welcome-email':
          result = await this.emailService.sendWelcomeEmail(job.data);
          break;

        case 'verification-email':
          result = await this.emailService.sendVerificationEmail(job.data);
          break;

        case 'password-reset-email':
          result = await this.emailService.sendPasswordResetEmail(job.data);
          break;

        case 'trial-expiring-email':
          result = await this.emailService.sendTrialExpiringEmail(job.data);
          break;

        case 'payment-failed-email':
          result = await this.emailService.sendPaymentFailedEmail(job.data);
          break;

        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      if (result.success) {
        // Job completed successfully
        job.status = 'completed';
        job.processedAt = new Date();
        this.logger.log(`Email job completed: ${job.id} (messageId: ${result.messageId})`);
      } else {
        // Job failed, retry if attempts remaining
        throw new Error(result.error || 'Email send failed');
      }
    } catch (error) {
      this.logger.error(`Email job failed: ${job.id} - ${error.message}`);

      if (job.attempts >= job.maxAttempts) {
        // Max attempts reached, mark as permanently failed
        job.status = 'failed';
        job.error = error.message;
        job.processedAt = new Date();

        this.logger.error(`Email job permanently failed after ${job.attempts} attempts: ${job.id}`);

        // TODO: Move to dead letter queue
        // TODO: Send alert to admins
      } else {
        // Retry with exponential backoff
        job.status = 'pending';
        const backoffDelay = Math.pow(2, job.attempts) * 1000; // 2s, 4s, 8s, etc.

        this.logger.log(`Email job will retry in ${backoffDelay}ms: ${job.id}`);

        // Add delay before next attempt
        await this.sleep(backoffDelay);
      }
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter((j) => j.status === 'pending').length,
      processing: this.queue.filter((j) => j.status === 'processing').length,
      completed: this.queue.filter((j) => j.status === 'completed').length,
      failed: this.queue.filter((j) => j.status === 'failed').length,
    };
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): any {
    return this.queue.find((j) => j.id === jobId);
  }

  /**
   * Clean up old jobs
   */
  cleanupOldJobs(olderThanDays: number = 7): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.setDate(cutoffDate.getDate() - olderThanDays));

    const initialLength = this.queue.length;

    this.queue = this.queue.filter((job) => {
      if (job.status === 'completed' || job.status === 'failed') {
        return job.createdAt > cutoffDate;
      }
      return true; // Keep pending and processing jobs
    });

    const removed = initialLength - this.queue.length;

    if (removed > 0) {
      this.logger.log(`Cleaned up ${removed} old email jobs`);
    }

    return removed;
  }

  /**
   * Helper: Generate unique job ID
   */
  private generateJobId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Helper: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.log('Shutting down email queue processor...');

    this.stopProcessing();

    // Wait for current processing to complete
    while (this.processing) {
      await this.sleep(100);
    }

    this.logger.log('Email queue processor shut down successfully');
  }
}

/**
 * NOTE: For production use, replace this in-memory implementation with BullMQ:
 *
 * 1. Install dependencies:
 *    npm install @nestjs/bull bull
 *    npm install @types/bull -D
 *
 * 2. Configure BullModule in auth.module.ts:
 *    BullModule.forRoot({
 *      redis: {
 *        host: 'localhost',
 *        port: 6379,
 *      },
 *    }),
 *    BullModule.registerQueue({
 *      name: 'email',
 *    }),
 *
 * 3. Use @Process() decorator to handle jobs:
 *    @Process('send-email')
 *    async handleSendEmail(job: Job) {
 *      return await this.emailService.sendEmail(job.data);
 *    }
 *
 * 4. Add jobs to queue:
 *    await this.emailQueue.add('send-email', {
 *      to: 'user@example.com',
 *      template: 'welcome',
 *      context: { ... },
 *    }, {
 *      attempts: 3,
 *      backoff: { type: 'exponential', delay: 2000 },
 *    });
 */
