import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from '../../src/auth.controller';
import { AuthService } from '../../src/auth.service';
import { EmailVerificationService } from '../../src/email-verification.service';
import { TwoFactorService } from '../../src/two-factor.service';
import { SessionService } from '../../src/session.service';
import { BruteForceProtectionService } from '../../src/brute-force-protection.service';
import { PasswordResetService } from '../../src/password-reset.service';
import { OAuthService } from '../../src/oauth.service';
import { OAuthController } from '../../src/oauth.controller';
import { ApiKeyService } from '../../src/api-key.service';
import { ApiKeyController } from '../../src/api-key.controller';
import { AuditLogService } from '../../src/audit-log.service';
import { AuditLogController } from '../../src/audit-log.controller';
import { TenantService } from '../../src/tenant.service';
import { TenantController } from '../../src/tenant.controller';
import { StripeService } from '../../src/stripe.service';
import { BillingController } from '../../src/billing.controller';
import { AnalyticsService } from '../../src/analytics.service';
import { AnalyticsController } from '../../src/analytics.controller';
import { OnboardingService } from '../../src/onboarding.service';
import { OnboardingController } from '../../src/onboarding.controller';
import { FeatureFlagService } from '../../src/feature-flag.service';
import { FeatureFlagController } from '../../src/feature-flag.controller';
import { AdminDashboardService } from '../../src/admin-dashboard.service';
import { AdminController } from '../../src/admin.controller';
import { EmailService } from '../../src/email.service';
import { EmailQueueProcessor } from '../../src/email-queue.processor';
import { EmailController } from '../../src/email.controller';
import { WebhookService } from '../../src/webhook.service';
import { WebhookController } from '../../src/webhook.controller';
import { GoogleStrategy } from '../../src/strategies/google.strategy';
import { MicrosoftStrategy } from '../../src/strategies/microsoft.strategy';
import { AuditLoggingInterceptor } from '../../src/interceptors/audit-logging.interceptor';
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
import { TestSharedModule } from './test-shared.module';

@Module({
  imports: [
    TestSharedModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([User, Tenant, RefreshToken, ApiKey, AuditLog, OnboardingChecklist, FeatureFlag, Notification, Webhook, WebhookDelivery]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your-secret-key-change-in-production'),
        signOptions: {
          expiresIn: '7d',
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
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
  ],
})
export class TestAuthModule {}
