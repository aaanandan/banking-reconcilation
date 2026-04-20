import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { WebhookService } from './webhook.service';
import { WebhookEventEnum } from '@app/shared/entities/webhook.entity';

/**
 * Webhook Controller
 *
 * Provides webhook management endpoints for tenants:
 * - Create and configure webhooks
 * - List and view webhooks
 * - Update webhook settings
 * - Delete webhooks
 * - Rotate webhook secrets
 * - Test webhook delivery
 * - View delivery history
 *
 * All endpoints require authentication and are scoped to the user's tenant.
 */
@ApiTags('Webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  /**
   * Get all webhooks for current tenant
   */
  @Get()
  @ApiOperation({ summary: 'Get all webhooks' })
  @ApiResponse({
    status: 200,
    description: 'Webhooks retrieved successfully',
  })
  async getWebhooks(@Request() req: any): Promise<{
    webhooks: Array<{
      id: string;
      url: string;
      description?: string;
      events: WebhookEventEnum[];
      enabled: boolean;
      totalDeliveries: number;
      successfulDeliveries: number;
      failedDeliveries: number;
      successRate: number;
      lastDeliveryAt?: Date;
      createdAt: Date;
    }>;
  }> {
    const tenantId = req.user.tenantId;
    const webhooks = await this.webhookService.getWebhooks(tenantId);

    return {
      webhooks: webhooks.map((webhook) => ({
        id: webhook.id,
        url: webhook.url,
        description: webhook.description,
        events: webhook.events,
        enabled: webhook.enabled,
        totalDeliveries: webhook.totalDeliveries,
        successfulDeliveries: webhook.successfulDeliveries,
        failedDeliveries: webhook.failedDeliveries,
        successRate: webhook.getSuccessRate(),
        lastDeliveryAt: webhook.lastDeliveryAt,
        createdAt: webhook.createdAt,
      })),
    };
  }

  /**
   * Get webhook by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get webhook by ID' })
  @ApiResponse({
    status: 200,
    description: 'Webhook retrieved successfully',
  })
  async getWebhook(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{
    id: string;
    url: string;
    description?: string;
    events: WebhookEventEnum[];
    enabled: boolean;
    headers: Record<string, string>;
    maxRetries: number;
    timeoutMs: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
    lastDeliveryAt?: Date;
    lastSuccessAt?: Date;
    lastFailureAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const tenantId = req.user.tenantId;
    const webhook = await this.webhookService.getWebhook(id, tenantId);

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    return {
      id: webhook.id,
      url: webhook.url,
      description: webhook.description,
      events: webhook.events,
      enabled: webhook.enabled,
      headers: webhook.headers,
      maxRetries: webhook.maxRetries,
      timeoutMs: webhook.timeoutMs,
      totalDeliveries: webhook.totalDeliveries,
      successfulDeliveries: webhook.successfulDeliveries,
      failedDeliveries: webhook.failedDeliveries,
      successRate: webhook.getSuccessRate(),
      lastDeliveryAt: webhook.lastDeliveryAt,
      lastSuccessAt: webhook.lastSuccessAt,
      lastFailureAt: webhook.lastFailureAt,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    };
  }

  /**
   * Create new webhook
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new webhook' })
  @ApiResponse({
    status: 201,
    description: 'Webhook created successfully',
  })
  async createWebhook(
    @Body()
    createDto: {
      url: string;
      description?: string;
      events?: WebhookEventEnum[];
      headers?: Record<string, string>;
      maxRetries?: number;
      timeoutMs?: number;
    },
    @Request() req: any,
  ): Promise<{
    id: string;
    url: string;
    description?: string;
    events: WebhookEventEnum[];
    secret: string;
    enabled: boolean;
    createdAt: Date;
  }> {
    const tenantId = req.user.tenantId;

    const webhook = await this.webhookService.createWebhook(tenantId, {
      url: createDto.url,
      description: createDto.description,
      events: createDto.events || [],
      headers: createDto.headers,
      maxRetries: createDto.maxRetries,
      timeoutMs: createDto.timeoutMs,
    });

    return {
      id: webhook.id,
      url: webhook.url,
      description: webhook.description,
      events: webhook.events,
      secret: webhook.secret, // Only returned on creation
      enabled: webhook.enabled,
      createdAt: webhook.createdAt,
    };
  }

  /**
   * Update webhook
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook updated successfully',
  })
  async updateWebhook(
    @Param('id') id: string,
    @Body()
    updateDto: {
      url?: string;
      description?: string;
      events?: WebhookEventEnum[];
      headers?: Record<string, string>;
      enabled?: boolean;
      maxRetries?: number;
      timeoutMs?: number;
    },
    @Request() req: any,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const tenantId = req.user.tenantId;

    await this.webhookService.updateWebhook(id, tenantId, updateDto);

    return {
      success: true,
      message: 'Webhook updated successfully',
    };
  }

  /**
   * Delete webhook
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook deleted successfully',
  })
  async deleteWebhook(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const tenantId = req.user.tenantId;

    await this.webhookService.deleteWebhook(id, tenantId);

    return {
      success: true,
      message: 'Webhook deleted successfully',
    };
  }

  /**
   * Rotate webhook secret
   *
   * Generates a new secret for the webhook
   * Old secret is immediately invalid
   */
  @Post(':id/rotate-secret')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate webhook secret' })
  @ApiResponse({
    status: 200,
    description: 'Webhook secret rotated successfully',
  })
  async rotateSecret(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{
    success: boolean;
    secret: string;
    message: string;
  }> {
    const tenantId = req.user.tenantId;

    const newSecret = await this.webhookService.rotateSecret(id, tenantId);

    return {
      success: true,
      secret: newSecret,
      message: 'Webhook secret rotated successfully. Please update your verification code.',
    };
  }

  /**
   * Test webhook
   *
   * Sends a test event to verify webhook is configured correctly
   */
  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test webhook' })
  @ApiResponse({
    status: 200,
    description: 'Test webhook sent',
  })
  async testWebhook(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{
    success: boolean;
    deliveryId: string;
    status: string;
    message: string;
    responseStatus?: number;
    durationMs?: number;
    error?: string;
  }> {
    const tenantId = req.user.tenantId;

    const delivery = await this.webhookService.testWebhook(id, tenantId);

    return {
      success: delivery.status === 'success',
      deliveryId: delivery.id,
      status: delivery.status,
      message:
        delivery.status === 'success'
          ? 'Test webhook delivered successfully'
          : `Test webhook failed: ${delivery.errorMessage}`,
      responseStatus: delivery.responseStatus,
      durationMs: delivery.durationMs,
      error: delivery.errorMessage,
    };
  }

  /**
   * Get webhook delivery history
   */
  @Get(':id/deliveries')
  @ApiOperation({ summary: 'Get webhook delivery history' })
  @ApiResponse({
    status: 200,
    description: 'Delivery history retrieved successfully',
  })
  async getDeliveryHistory(
    @Param('id') id: string,
    @Query('limit') limit: number = 50,
    @Request() req: any,
  ): Promise<{
    deliveries: Array<{
      id: string;
      event: WebhookEventEnum;
      status: string;
      attempts: number;
      maxAttempts: number;
      responseStatus?: number;
      durationMs?: number;
      errorMessage?: string;
      createdAt: Date;
      sentAt?: Date;
      completedAt?: Date;
    }>;
  }> {
    const tenantId = req.user.tenantId;

    const deliveries = await this.webhookService.getDeliveryHistory(
      id,
      tenantId,
      limit,
    );

    return {
      deliveries: deliveries.map((delivery) => ({
        id: delivery.id,
        event: delivery.event,
        status: delivery.status,
        attempts: delivery.attempts,
        maxAttempts: delivery.maxAttempts,
        responseStatus: delivery.responseStatus,
        durationMs: delivery.durationMs,
        errorMessage: delivery.errorMessage,
        createdAt: delivery.createdAt,
        sentAt: delivery.sentAt,
        completedAt: delivery.completedAt,
      })),
    };
  }

  /**
   * Get delivery details
   */
  @Get(':webhookId/deliveries/:deliveryId')
  @ApiOperation({ summary: 'Get webhook delivery details' })
  @ApiResponse({
    status: 200,
    description: 'Delivery details retrieved successfully',
  })
  async getDelivery(
    @Param('webhookId') webhookId: string,
    @Param('deliveryId') deliveryId: string,
    @Request() req: any,
  ): Promise<{
    id: string;
    webhookId: string;
    event: WebhookEventEnum;
    payload: Record<string, any>;
    status: string;
    attempts: number;
    maxAttempts: number;
    requestUrl: string;
    requestHeaders?: Record<string, string>;
    requestBody?: Record<string, any>;
    responseStatus?: number;
    responseBody?: string;
    durationMs?: number;
    errorMessage?: string;
    errorCode?: string;
    createdAt: Date;
    sentAt?: Date;
    completedAt?: Date;
    nextRetryAt?: Date;
  }> {
    const tenantId = req.user.tenantId;

    const delivery = await this.webhookService.getDelivery(deliveryId, tenantId);

    if (!delivery || delivery.webhookId !== webhookId) {
      throw new Error('Delivery not found');
    }

    return {
      id: delivery.id,
      webhookId: delivery.webhookId,
      event: delivery.event,
      payload: delivery.payload,
      status: delivery.status,
      attempts: delivery.attempts,
      maxAttempts: delivery.maxAttempts,
      requestUrl: delivery.requestUrl,
      requestHeaders: delivery.requestHeaders,
      requestBody: delivery.requestBody,
      responseStatus: delivery.responseStatus,
      responseBody: delivery.responseBody,
      durationMs: delivery.durationMs,
      errorMessage: delivery.errorMessage,
      errorCode: delivery.errorCode,
      createdAt: delivery.createdAt,
      sentAt: delivery.sentAt,
      completedAt: delivery.completedAt,
      nextRetryAt: delivery.nextRetryAt,
    };
  }

  /**
   * Get available webhook events
   */
  @Get('events/list')
  @ApiOperation({ summary: 'Get available webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Events list retrieved successfully',
  })
  getAvailableEvents(): {
    events: Array<{
      name: WebhookEventEnum;
      category: string;
      description: string;
    }>;
  } {
    const events = [
      // Reconciliation events
      {
        name: WebhookEventEnum.RECONCILIATION_CREATED,
        category: 'Reconciliation',
        description: 'Fired when a new reconciliation is created',
      },
      {
        name: WebhookEventEnum.RECONCILIATION_COMPLETED,
        category: 'Reconciliation',
        description: 'Fired when a reconciliation is completed',
      },
      {
        name: WebhookEventEnum.RECONCILIATION_FAILED,
        category: 'Reconciliation',
        description: 'Fired when a reconciliation fails',
      },
      {
        name: WebhookEventEnum.MATCH_CREATED,
        category: 'Reconciliation',
        description: 'Fired when a new match is created',
      },
      {
        name: WebhookEventEnum.MATCH_APPROVED,
        category: 'Reconciliation',
        description: 'Fired when a match is approved',
      },
      {
        name: WebhookEventEnum.MATCH_REJECTED,
        category: 'Reconciliation',
        description: 'Fired when a match is rejected',
      },

      // User events
      {
        name: WebhookEventEnum.USER_CREATED,
        category: 'Users',
        description: 'Fired when a new user is created',
      },
      {
        name: WebhookEventEnum.USER_UPDATED,
        category: 'Users',
        description: 'Fired when a user is updated',
      },
      {
        name: WebhookEventEnum.USER_DELETED,
        category: 'Users',
        description: 'Fired when a user is deleted',
      },

      // Subscription events
      {
        name: WebhookEventEnum.SUBSCRIPTION_CREATED,
        category: 'Billing',
        description: 'Fired when a subscription is created',
      },
      {
        name: WebhookEventEnum.SUBSCRIPTION_UPDATED,
        category: 'Billing',
        description: 'Fired when a subscription is updated',
      },
      {
        name: WebhookEventEnum.SUBSCRIPTION_CANCELED,
        category: 'Billing',
        description: 'Fired when a subscription is canceled',
      },
      {
        name: WebhookEventEnum.TRIAL_ENDING,
        category: 'Billing',
        description: 'Fired when trial is ending soon (3 days)',
      },
      {
        name: WebhookEventEnum.TRIAL_ENDED,
        category: 'Billing',
        description: 'Fired when trial has ended',
      },

      // Payment events
      {
        name: WebhookEventEnum.PAYMENT_SUCCEEDED,
        category: 'Billing',
        description: 'Fired when a payment succeeds',
      },
      {
        name: WebhookEventEnum.PAYMENT_FAILED,
        category: 'Billing',
        description: 'Fired when a payment fails',
      },
      {
        name: WebhookEventEnum.INVOICE_CREATED,
        category: 'Billing',
        description: 'Fired when an invoice is created',
      },
      {
        name: WebhookEventEnum.INVOICE_PAID,
        category: 'Billing',
        description: 'Fired when an invoice is paid',
      },

      // Quota events
      {
        name: WebhookEventEnum.QUOTA_WARNING,
        category: 'System',
        description: 'Fired when quota usage reaches 80%',
      },
      {
        name: WebhookEventEnum.QUOTA_EXCEEDED,
        category: 'System',
        description: 'Fired when quota is exceeded',
      },

      // System events
      {
        name: WebhookEventEnum.EXPORT_COMPLETED,
        category: 'System',
        description: 'Fired when a data export is completed',
      },
      {
        name: WebhookEventEnum.IMPORT_COMPLETED,
        category: 'System',
        description: 'Fired when a data import is completed',
      },
    ];

    return { events };
  }
}
