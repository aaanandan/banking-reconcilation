import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { EmailService } from './email.service';
import { EmailQueueProcessor } from './email-queue.processor';

/**
 * Email Controller
 *
 * Provides endpoints for email operations:
 * - Send test emails
 * - Verify email connection
 * - Queue statistics
 * - Manual email sending (admin only)
 *
 * All endpoints require authentication.
 * Admin-only endpoints are protected by AdminGuard.
 */
@ApiTags('Email')
@Controller('email')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly emailQueueProcessor: EmailQueueProcessor,
  ) {}

  /**
   * Send test email (admin only)
   *
   * Sends a test welcome email to verify email service is working
   */
  @Post('test')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send test email (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Test email sent successfully',
  })
  async sendTestEmail(@Body('to') to: string): Promise<{
    success: boolean;
    message: string;
    messageId?: string;
    error?: string;
  }> {
    const result = await this.emailService.sendTestEmail(to);

    return {
      success: result.success,
      message: result.success
        ? 'Test email sent successfully'
        : `Failed to send test email: ${result.error}`,
      messageId: result.messageId,
      error: result.error,
    };
  }

  /**
   * Verify email service connection (admin only)
   *
   * Checks if the email transporter is properly configured and can connect
   */
  @Get('verify')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Verify email service connection (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Email service connection status',
  })
  async verifyConnection(): Promise<{
    connected: boolean;
    message: string;
  }> {
    const connected = await this.emailService.verifyConnection();

    return {
      connected,
      message: connected
        ? 'Email service is connected and ready'
        : 'Email service connection failed - check configuration',
    };
  }

  /**
   * Get email queue statistics (admin only)
   *
   * Returns current queue status and job counts
   */
  @Get('queue/stats')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get email queue statistics (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved successfully',
  })
  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    return this.emailQueueProcessor.getQueueStats();
  }

  /**
   * Send custom email (admin only)
   *
   * Allows admins to send custom emails using templates
   */
  @Post('send')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send custom email (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Email sent successfully',
  })
  async sendCustomEmail(
    @Body()
    emailDto: {
      to: string | string[];
      subject: string;
      template: string;
      context: Record<string, any>;
      cc?: string | string[];
      bcc?: string | string[];
    },
  ): Promise<{
    success: boolean;
    message: string;
    messageId?: string;
    error?: string;
  }> {
    const result = await this.emailService.sendEmail(emailDto);

    return {
      success: result.success,
      message: result.success ? 'Email sent successfully' : `Failed to send email: ${result.error}`,
      messageId: result.messageId,
      error: result.error,
    };
  }

  /**
   * Queue email for async delivery
   *
   * Adds email to queue for reliable async delivery with retries
   */
  @Post('queue')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Queue email for async delivery (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Email queued successfully',
  })
  async queueEmail(
    @Body()
    queueDto: {
      type: string;
      data: any;
      priority?: number;
      maxAttempts?: number;
    },
  ): Promise<{
    success: boolean;
    jobId: string;
    message: string;
  }> {
    const jobId = await this.emailQueueProcessor.addEmailJob(queueDto.type, queueDto.data, {
      priority: queueDto.priority,
      maxAttempts: queueDto.maxAttempts,
    });

    return {
      success: true,
      jobId,
      message: 'Email queued successfully',
    };
  }

  /**
   * Get email job status (admin only)
   */
  @Get('queue/job/:jobId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get email job status (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved successfully',
  })
  async getJobStatus(@Body('jobId') jobId: string): Promise<any> {
    const job = this.emailQueueProcessor.getJobStatus(jobId);

    if (!job) {
      return {
        found: false,
        message: 'Job not found',
      };
    }

    return {
      found: true,
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        createdAt: job.createdAt,
        processedAt: job.processedAt,
        error: job.error,
      },
    };
  }
}
