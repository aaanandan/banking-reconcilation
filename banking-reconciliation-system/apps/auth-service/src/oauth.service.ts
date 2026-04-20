// apps/auth-service/src/oauth.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/shared/entities/user.entity';
import { Tenant } from '@app/shared/entities/tenant.entity';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SessionService } from './session.service';

export interface OAuthProfile {
  provider: 'google' | 'microsoft';
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private jwtService: JwtService,
    private sessionService: SessionService,
  ) {}

  /**
   * Handle OAuth callback - find or create user
   * @param profile - OAuth profile from provider
   * @returns Auth response with JWT token
   */
  async handleOAuthCallback(profile: OAuthProfile): Promise<AuthResponseDto> {
    this.logger.log(`OAuth callback for ${profile.provider}: ${profile.email}`);

    // Try to find existing user by OAuth provider ID
    let user = await this.findUserByProviderId(profile.provider, profile.providerId);

    if (user) {
      this.logger.log(`Found existing user by ${profile.provider}Id: ${user.id}`);
    } else {
      // Try to find existing user by email
      user = await this.userRepository.findOne({
        where: { email: profile.email },
        relations: ['tenant'],
      });

      if (user) {
        // Link OAuth account to existing user
        this.logger.log(`Linking ${profile.provider} account to existing user: ${user.id}`);
        await this.linkOAuthAccount(user, profile);
      } else {
        // Create new user with OAuth
        this.logger.log(`Creating new user from ${profile.provider} OAuth`);
        user = await this.createUserFromOAuth(profile);
      }
    }

    // Ensure user has tenant relation
    if (!user.tenant) {
      user = await this.userRepository.findOne({
        where: { id: user.id },
        relations: ['tenant'],
      });
    }

    if (!user) {
      throw new Error('User not found after OAuth authentication');
    }

    // Email is verified by OAuth provider
    if (!user.emailVerified) {
      await this.userRepository.update(user.id, { emailVerified: true });
      user.emailVerified = true;
    }

    // Generate token pair (access + refresh)
    const tokenPair = await this.sessionService.generateTokenPair(user);

    this.logger.log(`OAuth login successful for user: ${user.id}`);

    return {
      token: tokenPair.accessToken, // Backward compatibility
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        tenantId: user.tenantId,
        companyName: user.tenant.companyName,
      },
    };
  }

  /**
   * Find user by OAuth provider ID
   */
  private async findUserByProviderId(
    provider: 'google' | 'microsoft',
    providerId: string,
  ): Promise<User | null> {
    const whereClause =
      provider === 'google'
        ? { googleId: providerId }
        : { microsoftId: providerId };

    return this.userRepository.findOne({
      where: whereClause,
      relations: ['tenant'],
    });
  }

  /**
   * Link OAuth account to existing user
   */
  private async linkOAuthAccount(user: User, profile: OAuthProfile): Promise<void> {
    const updateData: Partial<User> =
      profile.provider === 'google'
        ? { googleId: profile.providerId }
        : { microsoftId: profile.providerId };

    // Also update auth provider if not already set
    if (user.authProvider === 'local') {
      updateData.authProvider = profile.provider;
    }

    await this.userRepository.update(user.id, updateData);

    this.logger.log(`Linked ${profile.provider} account to user ${user.id}`);
  }

  /**
   * Create new user from OAuth profile
   */
  private async createUserFromOAuth(profile: OAuthProfile): Promise<User> {
    // Check if tenant exists for this email domain
    const emailDomain = profile.email.split('@')[1];
    let tenant = await this.tenantRepository.findOne({
      where: { email: profile.email },
    });

    // Create tenant if new user
    if (!tenant) {
      tenant = this.tenantRepository.create({
        tenantId: `tenant_${this.generateId()}`,
        companyName: `${profile.displayName}'s Organization`,
        email: profile.email,
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

      this.logger.log(`Created new tenant: ${tenant.tenantId}`);
    }

    // Create user with OAuth data
    const userData: Partial<User> = {
      tenantId: tenant.tenantId,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: 'tenant_admin', // First user is admin
      isActive: true,
      emailVerified: true, // OAuth providers verify email
      authProvider: profile.provider,
      passwordHash: undefined, // No password for OAuth users
    };

    // Set provider ID
    if (profile.provider === 'google') {
      userData.googleId = profile.providerId;
    } else if (profile.provider === 'microsoft') {
      userData.microsoftId = profile.providerId;
    }

    const user = this.userRepository.create(userData);
    await this.userRepository.save(user);

    this.logger.log(`Created new user from ${profile.provider} OAuth: ${user.id}`);

    // Reload with tenant relation
    const createdUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['tenant'],
    });

    if (!createdUser) {
      throw new Error('Failed to retrieve created user');
    }

    return createdUser;
  }

  /**
   * Generate random ID
   */
  private generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Unlink OAuth account from user
   * @param userId - User ID
   * @param provider - OAuth provider to unlink
   */
  async unlinkOAuthAccount(
    userId: string,
    provider: 'google' | 'microsoft',
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    // Ensure user has password if unlinking OAuth
    if (!user.passwordHash) {
      throw new Error(
        'Cannot unlink OAuth account. Please set a password first.',
      );
    }

    const updateData: Partial<User> =
      provider === 'google'
        ? { googleId: undefined }
        : { microsoftId: undefined };

    // Reset auth provider to local if no other OAuth linked
    if (
      (provider === 'google' && !user.microsoftId) ||
      (provider === 'microsoft' && !user.googleId)
    ) {
      updateData.authProvider = 'local';
    }

    await this.userRepository.update(userId, updateData);

    this.logger.log(`Unlinked ${provider} account from user ${userId}`);
  }
}
