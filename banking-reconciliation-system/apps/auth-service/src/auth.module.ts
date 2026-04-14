import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrometheusModule, makeCounterProvider, makeGaugeProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MetricsService } from './metrics.service';
import { EmailVerificationService } from './email-verification.service';
import { TwoFactorService } from './two-factor.service';
import { SessionService } from './session.service';
import { BruteForceProtectionService } from './brute-force-protection.service';
import { PasswordResetService } from './password-reset.service';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { StripeService } from './stripe.service';
import { BillingController } from './billing.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { FeatureFlagService } from './feature-flag.service';
import { FeatureFlagController } from './feature-flag.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminController } from './admin.controller';
import { EmailService } from './email.service';
import { EmailQueueProcessor } from './email-queue.processor';
import { EmailController } from './email.controller';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { MicrosoftStrategy } from './strategies/microsoft.strategy';
import { AuditLoggingInterceptor } from './interceptors/audit-logging.interceptor';
import { User } from '@app/shared/entities/user.entity';
import { Tenant } from '@app/shared/entities/tenant.entity';
import { RefreshToken } from '@app/shared/entities/refresh-token.entity';
import { ApiKey } from '@app/shared/entities/api-key.entity';
import { AuditLog } from '@app/shared/entities/audit-log.entity';
import { OnboardingChecklist } from '@app/shared/entities/onboarding-checklist.entity';
import { FeatureFlag } from '@app/shared/entities/feature-flag.entity';
import { Notification } from '@app/shared/entities/notification.entity';
import { Webhook } from '@app/shared/entities/webhook.entity';
import { WebhookDelivery } from '@app/shared/entities/webhook-delivery.entity';
import { SharedModule } from '@app/shared';

@Module({
  imports: [
    SharedModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Prometheus metrics - Step 222
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/metrics',
      defaultLabels: {
        app: 'auth-service',
        environment: process.env.NODE_ENV || 'development',
      },
    }),
    TypeOrmModule.forFeature([User, Tenant, RefreshToken, ApiKey, AuditLog, OnboardingChecklist, FeatureFlag, Notification, Webhook, WebhookDelivery]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your-secret-key-change-in-production'),
        signOptions: {
          expiresIn: '7d', // Token expires in 7 days
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
  ],
  controllers: [AuthController, OAuthController, ApiKeyController, AuditLogController, TenantController, BillingController, AnalyticsController, OnboardingController, FeatureFlagController, AdminController, EmailController, WebhookController],
  providers: [
    AuthService,
    EmailVerificationService,
    TwoFactorService,
    SessionService,
    BruteForceProtectionService,
    PasswordResetService,
    OAuthService,
    ApiKeyService,
    AuditLogService,
    TenantService,
    StripeService,
    AnalyticsService,
    OnboardingService,
    FeatureFlagService,
    AdminDashboardService,
    EmailService,
    EmailQueueProcessor,
    WebhookService,
    GoogleStrategy,
    MicrosoftStrategy,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLoggingInterceptor,
    },
    // Metrics Service - Step 222
    MetricsService,
    // Prometheus Metric Providers - Step 222
    makeCounterProvider({ name: 'auth_login_attempts_total', help: 'Total number of login attempts' }),
    makeCounterProvider({ name: 'auth_login_success_total', help: 'Total number of successful logins' }),
    makeCounterProvider({ name: 'auth_login_failure_total', help: 'Total number of failed logins' }),
    makeCounterProvider({ name: 'auth_registration_total', help: 'Total number of user registrations' }),
    makeGaugeProvider({ name: 'tenants_active_total', help: 'Number of active tenants' }),
    makeCounterProvider({ name: 'tenants_created_total', help: 'Total number of tenants created' }),
    makeCounterProvider({ name: 'tenants_suspended_total', help: 'Total number of tenants suspended' }),
    makeGaugeProvider({ name: 'subscriptions_active_total', help: 'Number of active subscriptions' }),
    makeCounterProvider({ name: 'subscriptions_created_total', help: 'Total number of subscriptions created' }),
    makeCounterProvider({ name: 'subscriptions_cancelled_total', help: 'Total number of subscriptions cancelled' }),
    makeCounterProvider({ name: 'subscription_revenue_total', help: 'Total subscription revenue' }),
    makeGaugeProvider({ name: 'api_keys_active_total', help: 'Number of active API keys' }),
    makeCounterProvider({ name: 'api_key_requests_total', help: 'Total number of API key requests' }),
    makeGaugeProvider({ name: 'security_2fa_enabled_total', help: 'Number of users with 2FA enabled' }),
    makeCounterProvider({ name: 'security_failed_2fa_total', help: 'Total number of failed 2FA attempts' }),
    makeCounterProvider({ name: 'security_password_reset_total', help: 'Total number of password resets' }),
    makeCounterProvider({ name: 'webhooks_delivered_total', help: 'Total number of webhooks delivered' }),
    makeCounterProvider({ name: 'webhooks_failed_total', help: 'Total number of failed webhook deliveries' }),
    makeCounterProvider({ name: 'emails_sent_total', help: 'Total number of emails sent' }),
    makeCounterProvider({ name: 'emails_failed_total', help: 'Total number of failed email deliveries' }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    }),
  ],
  exports: [
    EmailVerificationService,
    TwoFactorService,
    SessionService,
    BruteForceProtectionService,
    PasswordResetService,
    OAuthService,
    ApiKeyService,
    AuditLogService,
    TenantService,
    StripeService,
    AnalyticsService,
    OnboardingService,
    FeatureFlagService,
    AdminDashboardService,
    EmailService,
    EmailQueueProcessor,
    WebhookService,
    MetricsService,
  ],
})
export class AuthModule {}
