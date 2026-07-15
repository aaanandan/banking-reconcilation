// apps/auth-service/src/auth.service.ts

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/shared/entities/user.entity';
import { Tenant } from '@app/shared/entities/tenant.entity';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { EmailVerificationService } from './email-verification.service';
import { TwoFactorService } from './two-factor.service';
import { SessionService } from './session.service';
import { BruteForceProtectionService } from './brute-force-protection.service';
import { AuditLogService } from './audit-log.service';
import { AuditEventType } from '@app/shared/entities/audit-log.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private jwtService: JwtService,
    private emailVerificationService: EmailVerificationService,
    private twoFactorService: TwoFactorService,
    private sessionService: SessionService,
    private bruteForceProtection: BruteForceProtectionService,
    private auditLogService: AuditLogService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if tenant exists
    let tenant = await this.tenantRepository.findOne({
      where: { email: dto.companyEmail },
    });

    // Create tenant if new registration
    if (!tenant) {
      tenant = this.tenantRepository.create({
        tenantId: `tenant_${this.generateId()}`,
        companyName: dto.companyName,
        email: dto.companyEmail,
        status: 'trial',
        plan: 'free',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        quotas: {
          maxBankAccounts: 1,
          maxTransactionsPerMonth: 100,
          maxStorageMB: 10,
          maxUsers: 1,
        },
        currentUsage: {
          bankAccounts: 0,
          transactionsThisMonth: 0,
          storageMB: 0,
          users: 0,
        },
      });
      await this.tenantRepository.save(tenant);
    }

    // Create user
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      tenantId: tenant.tenantId,
      tenant: tenant,
      email: dto.email,
      passwordHash: hashedPassword,
      name: dto.name,
      role: 'tenant_admin', // First user is admin
      isActive: true,
      emailVerified: false, // User needs to verify email
    });
    await this.userRepository.save(user);

    // Send email verification (async, don't wait)
    this.emailVerificationService.sendVerificationEmail(user.id)
      .catch(err => this.logger.error(`Failed to send verification email: ${err.message}`));

    // Generate token pair (access + refresh)
    const tokenPair = await this.sessionService.generateTokenPair(user);

    // Audit log: User registration
    this.auditLogService.logAuthEvent({
      userId: user.id,
      tenantId: tenant.tenantId,
      eventType: AuditEventType.REGISTER,
      isSuccessful: true,
      metadata: {
        email: user.email,
        role: user.role,
        companyName: tenant.companyName,
      },
    }).catch(err => this.logger.error(`Failed to log registration audit: ${err.message}`));

    return {
      token: tokenPair.accessToken, // Backward compatibility
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: tenant.tenantId,
        companyName: tenant.companyName,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      relations: ['tenant'],
    });

    if (!user) {
      // Don't reveal whether user exists
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked due to failed attempts
    await this.bruteForceProtection.checkAccountLock(user);

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      // Record failed login attempt
      const isLocked = await this.bruteForceProtection.recordFailedAttempt(user.id);

      // Audit log: Failed login
      this.auditLogService.logAuthEvent({
        userId: user.id,
        tenantId: user.tenantId,
        eventType: AuditEventType.LOGIN_FAILURE,
        isSuccessful: false,
        failureReason: 'Invalid password',
        metadata: {
          email: user.email,
          remainingAttempts: this.bruteForceProtection.getRemainingAttempts(user),
        },
      }).catch(err => this.logger.error(`Failed to log failed login audit: ${err.message}`));

      if (isLocked) {
        throw new UnauthorizedException(
          'Account is temporarily locked due to multiple failed login attempts. ' +
          'Please try again in 15 minutes.',
        );
      }

      const remainingAttempts = this.bruteForceProtection.getRemainingAttempts(user);
      this.logger.warn(`Failed login attempt for user: ${user.email}, ${remainingAttempts} attempts remaining`);

      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user/tenant is active
    if (!user.isActive || user.tenant.status === 'suspended') {
      throw new UnauthorizedException('Account is not active');
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!dto.twoFactorToken) {
        throw new UnauthorizedException('2FA token required');
      }

      // Verify 2FA token
      const isTokenValid = await this.twoFactorService.verifyToken(user.id, dto.twoFactorToken);
      if (!isTokenValid) {
        // Record failed attempt for invalid 2FA token
        await this.bruteForceProtection.recordFailedAttempt(user.id);
        throw new UnauthorizedException('Invalid 2FA token');
      }

      this.logger.log(`User ${user.id} logged in with 2FA`);
    }

    // Successful login - reset failed attempts
    await this.bruteForceProtection.resetLoginAttempts(user.id);

    // Generate token pair (access + refresh)
    const tokenPair = await this.sessionService.generateTokenPair(user);

    // Audit log: Successful login
    this.auditLogService.logAuthEvent({
      userId: user.id,
      tenantId: user.tenantId,
      eventType: AuditEventType.LOGIN_SUCCESS,
      isSuccessful: true,
      metadata: {
        email: user.email,
        role: user.role,
        with2FA: user.twoFactorEnabled,
      },
    }).catch(err => this.logger.error(`Failed to log successful login audit: ${err.message}`));

    return {
      token: tokenPair.accessToken, // Backward compatibility
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        companyName: user.tenant.companyName,
      },
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}
