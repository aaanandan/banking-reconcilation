// apps/auth-service/src/session.service.ts

import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshToken, User } from '@app/shared';
import * as crypto from 'crypto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tenantId: string;
  tokenId: string;
}

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    // Generate access token (short-lived: 15 minutes)
    const accessTokenPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      expiresIn: '15m', // 15 minutes
    });

    // Generate refresh token (long-lived: 7 days)
    const refreshTokenValue = this.generateSecureToken();
    const hashedRefreshToken = this.hashToken(refreshTokenValue);

    // Store refresh token in database
    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId: user.id,
      token: hashedRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress,
      userAgent,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshTokenValue: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    // Hash the incoming refresh token
    const hashedToken = this.hashToken(refreshTokenValue);

    // Find the refresh token in database
    const refreshTokenEntity = await this.refreshTokenRepository.findOne({
      where: { token: hashedToken },
      relations: ['user'],
    });

    if (!refreshTokenEntity) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is valid
    if (!refreshTokenEntity.isValid()) {
      // Token is expired or revoked - remove it
      await this.refreshTokenRepository.remove(refreshTokenEntity);
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    // Check if user is still active
    if (!refreshTokenEntity.user.isActive) {
      throw new UnauthorizedException('User account is disabled');
    }

    // Security: Optionally validate IP address or user agent
    // This is commented out but can be enabled for stricter security
    // if (ipAddress && refreshTokenEntity.ipAddress !== ipAddress) {
    //   throw new UnauthorizedException('IP address mismatch');
    // }

    // Revoke old refresh token (token rotation)
    await this.revokeToken(refreshTokenEntity.id);

    // Generate new token pair
    return this.generateTokenPair(refreshTokenEntity.user, ipAddress, userAgent);
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeToken(tokenId: string): Promise<void> {
    const token = await this.refreshTokenRepository.findOne({
      where: { id: tokenId },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    token.isRevoked = true;
    token.revokedAt = new Date();

    await this.refreshTokenRepository.save(token);
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
      },
    );
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: {
        userId,
        isRevoked: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Clean up expired refresh tokens (run this periodically via cron)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    return result.affected || 0;
  }

  /**
   * Generate a cryptographically secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Hash a token using SHA-256
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Validate access token and extract payload
   */
  async validateAccessToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
