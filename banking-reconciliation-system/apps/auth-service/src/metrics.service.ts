import { Injectable, Inject } from '@nestjs/common';
import { Counter, Gauge, Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

/**
 * MetricsService - Custom business metrics for Auth Service
 * Step 222: Configure Prometheus scraping targets
 */
@Injectable()
export class MetricsService {
  constructor(
    // Authentication Metrics
    @InjectMetric('auth_login_attempts_total')
    public loginAttemptsCounter: Counter<string>,

    @InjectMetric('auth_login_success_total')
    public loginSuccessCounter: Counter<string>,

    @InjectMetric('auth_login_failure_total')
    public loginFailureCounter: Counter<string>,

    @InjectMetric('auth_registration_total')
    public registrationCounter: Counter<string>,

    // Tenant Metrics
    @InjectMetric('tenants_active_total')
    public activeTenantsGauge: Gauge<string>,

    @InjectMetric('tenants_created_total')
    public tenantCreatedCounter: Counter<string>,

    @InjectMetric('tenants_suspended_total')
    public tenantSuspendedCounter: Counter<string>,

    // Subscription Metrics
    @InjectMetric('subscriptions_active_total')
    public activeSubscriptionsGauge: Gauge<string>,

    @InjectMetric('subscriptions_created_total')
    public subscriptionCreatedCounter: Counter<string>,

    @InjectMetric('subscriptions_cancelled_total')
    public subscriptionCancelledCounter: Counter<string>,

    @InjectMetric('subscription_revenue_total')
    public subscriptionRevenueCounter: Counter<string>,

    // API Key Metrics
    @InjectMetric('api_keys_active_total')
    public activeApiKeysGauge: Gauge<string>,

    @InjectMetric('api_key_requests_total')
    public apiKeyRequestsCounter: Counter<string>,

    // Security Metrics
    @InjectMetric('security_2fa_enabled_total')
    public twoFactorEnabledGauge: Gauge<string>,

    @InjectMetric('security_failed_2fa_total')
    public failedTwoFactorCounter: Counter<string>,

    @InjectMetric('security_password_reset_total')
    public passwordResetCounter: Counter<string>,

    // Webhook Metrics
    @InjectMetric('webhooks_delivered_total')
    public webhooksDeliveredCounter: Counter<string>,

    @InjectMetric('webhooks_failed_total')
    public webhooksFailedCounter: Counter<string>,

    // Email Metrics
    @InjectMetric('emails_sent_total')
    public emailsSentCounter: Counter<string>,

    @InjectMetric('emails_failed_total')
    public emailsFailedCounter: Counter<string>,

    // Response Time Metrics
    @InjectMetric('http_request_duration_seconds')
    public httpRequestDurationHistogram: Histogram<string>,
  ) {}

  /**
   * Track login attempt
   */
  trackLoginAttempt(tenantId: string, success: boolean): void {
    this.loginAttemptsCounter.inc({ tenant_id: tenantId });
    if (success) {
      this.loginSuccessCounter.inc({ tenant_id: tenantId });
    } else {
      this.loginFailureCounter.inc({ tenant_id: tenantId });
    }
  }

  /**
   * Track user registration
   */
  trackRegistration(tenantId: string): void {
    this.registrationCounter.inc({ tenant_id: tenantId });
  }

  /**
   * Update active tenants gauge
   */
  updateActiveTenants(count: number): void {
    this.activeTenantsGauge.set(count);
  }

  /**
   * Track tenant creation
   */
  trackTenantCreated(plan: string): void {
    this.tenantCreatedCounter.inc({ plan });
  }

  /**
   * Track tenant suspension
   */
  trackTenantSuspended(reason: string): void {
    this.tenantSuspendedCounter.inc({ reason });
  }

  /**
   * Update active subscriptions gauge
   */
  updateActiveSubscriptions(count: number): void {
    this.activeSubscriptionsGauge.set(count);
  }

  /**
   * Track subscription creation
   */
  trackSubscriptionCreated(plan: string, interval: string): void {
    this.subscriptionCreatedCounter.inc({ plan, interval });
  }

  /**
   * Track subscription cancellation
   */
  trackSubscriptionCancelled(plan: string, reason: string): void {
    this.subscriptionCancelledCounter.inc({ plan, reason });
  }

  /**
   * Track subscription revenue
   */
  trackRevenue(amount: number, currency: string, plan: string): void {
    this.subscriptionRevenueCounter.inc({ currency, plan }, amount);
  }

  /**
   * Update active API keys gauge
   */
  updateActiveApiKeys(count: number): void {
    this.activeApiKeysGauge.set(count);
  }

  /**
   * Track API key request
   */
  trackApiKeyRequest(apiKeyId: string, endpoint: string): void {
    this.apiKeyRequestsCounter.inc({ api_key_id: apiKeyId, endpoint });
  }

  /**
   * Update 2FA enabled users gauge
   */
  updateTwoFactorEnabled(count: number): void {
    this.twoFactorEnabledGauge.set(count);
  }

  /**
   * Track failed 2FA attempt
   */
  trackFailedTwoFactor(tenantId: string): void {
    this.failedTwoFactorCounter.inc({ tenant_id: tenantId });
  }

  /**
   * Track password reset
   */
  trackPasswordReset(method: string): void {
    this.passwordResetCounter.inc({ method });
  }

  /**
   * Track webhook delivery
   */
  trackWebhookDelivery(event: string, success: boolean): void {
    if (success) {
      this.webhooksDeliveredCounter.inc({ event });
    } else {
      this.webhooksFailedCounter.inc({ event });
    }
  }

  /**
   * Track email sending
   */
  trackEmailSent(type: string, success: boolean): void {
    if (success) {
      this.emailsSentCounter.inc({ type });
    } else {
      this.emailsFailedCounter.inc({ type });
    }
  }

  /**
   * Track HTTP request duration
   */
  trackRequestDuration(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestDurationHistogram.observe(
      { method, route, status_code: statusCode.toString() },
      duration,
    );
  }
}
