import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import axios, { AxiosError } from 'axios';
import {
  Webhook,
  WebhookEventEnum,
  WebhookDelivery,
  WebhookDeliveryStatusEnum,
} from '@app/shared/entities';

/**
 * Webhook Service
 *
 * Handles webhook delivery with:
 * - HMAC signature verification
 * - Retry logic with exponential backoff
 * - Delivery tracking
 * - Error handling
 * - Rate limiting
 *
 * Webhook Signature:
 * - Uses HMAC-SHA256
 * - Signature format: sha256=<hex_digest>
 * - Sent in X-Webhook-Signature header
 * - Timestamp sent in X-Webhook-Timestamp header
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookDelivery)
    private webhookDeliveryRepository: Repository<WebhookDelivery>,
  ) {}

  /**
   * Trigger webhook for an event
   *
   * Finds all webhooks subscribed to the event and creates delivery records
   */
  async triggerEvent(
    tenantId: string,
    event: WebhookEventEnum,
    payload: Record<string, any>,
  ): Promise<WebhookDelivery[]> {
    // Find all enabled webhooks for this tenant subscribed to this event
    const webhooks = await this.webhookRepository.find({
      where: { tenantId, enabled: true },
    });

    const subscribedWebhooks = webhooks.filter((webhook) =>
      webhook.isSubscribedToEvent(event),
    );

    if (subscribedWebhooks.length === 0) {
      this.logger.debug(`No webhooks subscribed to ${event} for tenant ${tenantId}`);
      return [];
    }

    this.logger.log(
      `Triggering ${event} for ${subscribedWebhooks.length} webhooks (tenant: ${tenantId})`,
    );

    // Create delivery records for each webhook
    const deliveries: WebhookDelivery[] = [];

    for (const webhook of subscribedWebhooks) {
      const delivery = await this.createDelivery(webhook, event, payload);
      deliveries.push(delivery);

      // Deliver immediately (async)
      this.deliverWebhook(delivery).catch((error) => {
        this.logger.error(`Failed to deliver webhook: ${error.message}`);
      });
    }

    return deliveries;
  }

  /**
   * Create webhook delivery record
   */
  private async createDelivery(
    webhook: Webhook,
    event: WebhookEventEnum,
    payload: Record<string, any>,
  ): Promise<WebhookDelivery> {
    const delivery = this.webhookDeliveryRepository.create({
      webhookId: webhook.id,
      tenantId: webhook.tenantId,
      event,
      payload,
      requestUrl: webhook.url,
      requestMethod: 'POST',
      maxAttempts: webhook.maxRetries,
      status: WebhookDeliveryStatusEnum.PENDING,
    });

    return this.webhookDeliveryRepository.save(delivery);
  }

  /**
   * Deliver webhook
   *
   * Sends HTTP POST request with HMAC signature
   */
  async deliverWebhook(delivery: WebhookDelivery): Promise<void> {
    const webhook = await this.webhookRepository.findOne({
      where: { id: delivery.webhookId },
    });

    if (!webhook) {
      this.logger.error(`Webhook not found: ${delivery.webhookId}`);
      return;
    }

    if (!webhook.enabled) {
      this.logger.warn(`Webhook ${webhook.id} is disabled, skipping delivery`);
      return;
    }

    // Update status to sending
    delivery.status = WebhookDeliveryStatusEnum.SENDING;
    delivery.attempts++;
    delivery.sentAt = new Date();
    await this.webhookDeliveryRepository.save(delivery);

    const startTime = Date.now();

    try {
      // Prepare request
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const requestBody = {
        id: delivery.id,
        event: delivery.event,
        created_at: delivery.createdAt.toISOString(),
        data: delivery.payload,
      };

      const signature = this.generateSignature(webhook.secret, timestamp, requestBody);

      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'BankingReconciliation-Webhooks/1.0',
        'X-Webhook-ID': delivery.id,
        'X-Webhook-Event': delivery.event,
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Timestamp': timestamp,
        ...webhook.headers, // Custom headers
      };

      delivery.requestHeaders = headers;
      delivery.requestBody = requestBody;

      // Send request
      this.logger.log(`Delivering webhook ${delivery.id} to ${webhook.url}`);

      const response = await axios.post(webhook.url, requestBody, {
        headers,
        timeout: webhook.timeoutMs,
        validateStatus: (status) => status >= 200 && status < 500, // Don't throw on 4xx
      });

      const durationMs = Date.now() - startTime;

      // Check if success (2xx status code)
      if (response.status >= 200 && response.status < 300) {
        delivery.markSuccess(
          response.status,
          JSON.stringify(response.data),
          durationMs,
        );

        webhook.recordDelivery(true);

        this.logger.log(
          `Webhook delivered successfully: ${delivery.id} (${response.status}, ${durationMs}ms)`,
        );
      } else {
        // Non-2xx status code, consider as failure
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        if (delivery.attempts < delivery.maxAttempts) {
          delivery.scheduleRetry();
          this.logger.warn(
            `Webhook delivery failed, scheduling retry: ${delivery.id} - ${errorMessage}`,
          );
        } else {
          delivery.markFailed(errorMessage, 'HTTP_ERROR', response.status);
          webhook.recordDelivery(false);
          this.logger.error(
            `Webhook delivery failed permanently: ${delivery.id} - ${errorMessage}`,
          );
        }
      }

      delivery.responseStatus = response.status;
      delivery.responseHeaders = response.headers as Record<string, string>;
      delivery.responseBody = JSON.stringify(response.data);
      delivery.durationMs = durationMs;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      delivery.durationMs = durationMs;

      let errorMessage = error.message;
      let errorCode = 'UNKNOWN_ERROR';

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.code === 'ECONNABORTED') {
          errorCode = 'TIMEOUT';
          errorMessage = `Request timeout after ${webhook.timeoutMs}ms`;
        } else if (axiosError.code === 'ENOTFOUND') {
          errorCode = 'DNS_ERROR';
          errorMessage = 'Domain not found';
        } else if (axiosError.code === 'ECONNREFUSED') {
          errorCode = 'CONNECTION_REFUSED';
          errorMessage = 'Connection refused';
        } else if (axiosError.response) {
          errorCode = 'HTTP_ERROR';
          errorMessage = `HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`;
          delivery.responseStatus = axiosError.response.status;
          delivery.responseBody = JSON.stringify(axiosError.response.data);
        }
      }

      if (delivery.attempts < delivery.maxAttempts) {
        delivery.scheduleRetry();
        this.logger.warn(
          `Webhook delivery failed, scheduling retry (attempt ${delivery.attempts}/${delivery.maxAttempts}): ${delivery.id} - ${errorMessage}`,
        );
      } else {
        delivery.markFailed(errorMessage, errorCode);
        webhook.recordDelivery(false);
        this.logger.error(
          `Webhook delivery failed permanently after ${delivery.attempts} attempts: ${delivery.id} - ${errorMessage}`,
        );
      }
    }

    await this.webhookDeliveryRepository.save(delivery);
    await this.webhookRepository.save(webhook);
  }

  /**
   * Generate HMAC signature for webhook
   *
   * Signature format: sha256=<hex_digest>
   * Signed payload: {timestamp}.{json_body}
   */
  private generateSignature(
    secret: string,
    timestamp: string,
    body: Record<string, any>,
  ): string {
    const payload = `${timestamp}.${JSON.stringify(body)}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return hmac.digest('hex');
  }

  /**
   * Verify webhook signature
   *
   * Used by webhook consumers to verify authenticity
   */
  static verifySignature(
    secret: string,
    signature: string,
    timestamp: string,
    body: Record<string, any>,
  ): boolean {
    const expectedSignature = this.prototype.generateSignature(secret, timestamp, body);
    const providedSignature = signature.replace('sha256=', '');

    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex'),
    );
  }

  /**
   * Retry failed deliveries
   *
   * Finds deliveries that are ready for retry and attempts delivery
   */
  async retryFailedDeliveries(): Promise<number> {
    const retryableDeliveries = await this.webhookDeliveryRepository
      .createQueryBuilder('delivery')
      .where('delivery.status = :status', {
        status: WebhookDeliveryStatusEnum.RETRYING,
      })
      .andWhere('delivery.next_retry_at <= :now', { now: new Date() })
      .getMany();

    this.logger.log(
      `Found ${retryableDeliveries.length} webhook deliveries ready for retry`,
    );

    for (const delivery of retryableDeliveries) {
      await this.deliverWebhook(delivery);

      // Small delay to prevent overwhelming the system
      await this.sleep(100);
    }

    return retryableDeliveries.length;
  }

  /**
   * Get webhook by ID
   */
  async getWebhook(id: string, tenantId: string): Promise<Webhook | null> {
    return this.webhookRepository.findOne({
      where: { id, tenantId },
    });
  }

  /**
   * Get all webhooks for tenant
   */
  async getWebhooks(tenantId: string): Promise<Webhook[]> {
    return this.webhookRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Create webhook
   */
  async createWebhook(
    tenantId: string,
    data: {
      url: string;
      description?: string;
      events: WebhookEventEnum[];
      headers?: Record<string, string>;
      maxRetries?: number;
      timeoutMs?: number;
    },
  ): Promise<Webhook> {
    // Validate URL
    if (!Webhook.isValidUrl(data.url, true)) {
      throw new Error('Invalid webhook URL - must be HTTPS');
    }

    // Generate secret
    const secret = this.generateWebhookSecret();

    const webhook = this.webhookRepository.create({
      tenantId,
      url: data.url,
      description: data.description,
      events: data.events || [],
      headers: data.headers || {},
      secret,
      maxRetries: data.maxRetries || 3,
      timeoutMs: data.timeoutMs || 5000,
      enabled: true,
    });

    return this.webhookRepository.save(webhook);
  }

  /**
   * Update webhook
   */
  async updateWebhook(
    id: string,
    tenantId: string,
    data: {
      url?: string;
      description?: string;
      events?: WebhookEventEnum[];
      headers?: Record<string, string>;
      enabled?: boolean;
      maxRetries?: number;
      timeoutMs?: number;
    },
  ): Promise<Webhook> {
    const webhook = await this.getWebhook(id, tenantId);

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    if (data.url && !Webhook.isValidUrl(data.url, true)) {
      throw new Error('Invalid webhook URL - must be HTTPS');
    }

    Object.assign(webhook, data);

    return this.webhookRepository.save(webhook);
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id: string, tenantId: string): Promise<void> {
    const webhook = await this.getWebhook(id, tenantId);

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    await this.webhookRepository.remove(webhook);
  }

  /**
   * Rotate webhook secret
   */
  async rotateSecret(id: string, tenantId: string): Promise<string> {
    const webhook = await this.getWebhook(id, tenantId);

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const newSecret = webhook.rotateSecret();
    await this.webhookRepository.save(webhook);

    return newSecret;
  }

  /**
   * Test webhook
   *
   * Sends a test event to verify webhook is working
   */
  async testWebhook(id: string, tenantId: string): Promise<WebhookDelivery> {
    const webhook = await this.getWebhook(id, tenantId);

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const delivery = await this.createDelivery(
      webhook,
      'test.event' as WebhookEventEnum,
      {
        message: 'This is a test webhook',
        timestamp: new Date().toISOString(),
      },
    );

    await this.deliverWebhook(delivery);

    const result = await this.webhookDeliveryRepository.findOne({
      where: { id: delivery.id },
    });

    if (!result) {
      throw new Error('Failed to retrieve webhook delivery after test');
    }

    return result;
  }

  /**
   * Get delivery history for webhook
   */
  async getDeliveryHistory(
    webhookId: string,
    tenantId: string,
    limit: number = 50,
  ): Promise<WebhookDelivery[]> {
    // Verify webhook belongs to tenant
    const webhook = await this.getWebhook(webhookId, tenantId);

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    return this.webhookDeliveryRepository.find({
      where: { webhookId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get delivery by ID
   */
  async getDelivery(id: string, tenantId: string): Promise<WebhookDelivery | null> {
    return this.webhookDeliveryRepository.findOne({
      where: { id, tenantId },
    });
  }

  /**
   * Generate webhook secret
   */
  private generateWebhookSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = 'whsec_';

    for (let i = 0; i < 40; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return secret;
  }

  /**
   * Helper: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
