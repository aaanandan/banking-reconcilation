import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
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
// Steps 217-220 - Re-enabled
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminController } from './admin.controller';
import { EmailService } from './email.service';
import { EmailQueueProcessor } from './email-queue.processor';
import { EmailController } from './email.controller';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { MicrosoftStrategy } from './strategies/microsoft.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuditLoggingInterceptor } from './interceptors/audit-logging.interceptor';
import { User } from '@app/shared/entities/user.entity';
import { Tenant } from '@app/shared/entities/tenant.entity';
import { RefreshToken } from '@app/shared/entities/refresh-token.entity';
import { ApiKey } from '@app/shared/entities/api-key.entity';
import { AuditLog } from '@app/shared/entities/audit-log.entity';
import { OnboardingChecklist } from '@app/shared/entities/onboarding-checklist.entity';
import { FeatureFlag } from '@app/shared/entities/feature-flag.entity';
import { Notification } from '@app/shared/entities/notification.entity';
// Steps 217-220 - Re-enabled
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
    AdminDashboardService, // Step 217 - Re-enabled
    EmailService, // Step 218 - Re-enabled
    EmailQueueProcessor, // Step 218 - Re-enabled
    WebhookService, // Step 219 - Re-enabled
    JwtStrategy,
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
    AdminDashboardService, // Step 217 - Re-enabled
    EmailService, // Step 218 - Re-enabled
    EmailQueueProcessor, // Step 218 - Re-enabled
    WebhookService, // Step 219 - Re-enabled
  ],
})
export class AuthModule {}
