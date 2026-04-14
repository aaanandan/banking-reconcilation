// apps/auth-service/src/two-factor.service.ts

import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/shared/entities/user.entity';
import { EncryptionUtil } from '@app/shared/utils/encryption.util';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Generate 2FA secret and QR code for user
   * @param userId - User ID to generate 2FA secret for
   * @returns Secret (base32) and QR code (data URL)
   */
  async generateSecret(userId: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    this.logger.log(`Generating 2FA secret for user: ${userId}`);

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if email is verified (security requirement)
    if (!user.emailVerified) {
      throw new BadRequestException('Email must be verified before enabling 2FA');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Banking Recon (${user.email})`,
      issuer: 'Banking Reconciliation',
      length: 32, // 256-bit secret
    });

    this.logger.log(`Secret generated for user ${userId}`);

    // Store encrypted secret (not enabled yet)
    const encryptedSecret = EncryptionUtil.encrypt(secret.base32);
    await this.userRepository.update(userId, {
      twoFactorSecret: encryptedSecret,
      // twoFactorEnabled remains false until user verifies token
    });

    // Generate QR code for authenticator apps
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes (8 codes, 8 characters each)
    const backupCodes = this.generateBackupCodes(8);

    this.logger.log(`QR code generated for user ${userId}`);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes, // User should save these securely
    };
  }

  /**
   * Verify TOTP token for user
   * @param userId - User ID
   * @param token - 6-digit TOTP token
   * @returns True if token is valid
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    this.logger.log(`Verifying 2FA token for user: ${userId}`);

    if (!token || token.length !== 6) {
      throw new BadRequestException('Token must be 6 digits');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('2FA not set up for this user');
    }

    // Decrypt secret
    const decryptedSecret = EncryptionUtil.decrypt(user.twoFactorSecret);

    // Verify token
    const isValid = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after (±60 seconds)
    });

    if (isValid) {
      this.logger.log(`2FA token verified successfully for user ${userId}`);
    } else {
      this.logger.warn(`Invalid 2FA token for user ${userId}`);
    }

    return isValid;
  }

  /**
   * Enable 2FA for user after verifying initial token
   * @param userId - User ID
   * @param token - 6-digit TOTP token to verify setup
   */
  async enableTwoFactor(userId: string, token: string): Promise<void> {
    this.logger.log(`Enabling 2FA for user: ${userId}`);

    // Verify the token first
    const isValid = await this.verifyToken(userId, token);

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA token. Please check your authenticator app.');
    }

    // Enable 2FA
    await this.userRepository.update(userId, {
      twoFactorEnabled: true,
    });

    this.logger.log(`2FA enabled successfully for user ${userId}`);
  }

  /**
   * Disable 2FA for user
   * @param userId - User ID
   * @param password - User's password for verification
   * @param token - Current 2FA token (if 2FA is enabled)
   */
  async disableTwoFactor(
    userId: string,
    password: string,
    token?: string,
  ): Promise<void> {
    this.logger.log(`Disabling 2FA for user: ${userId}`);

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    // Verify password (security requirement)
    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // If 2FA is enabled, require valid token
    if (user.twoFactorEnabled && token) {
      const isTokenValid = await this.verifyToken(userId, token);
      if (!isTokenValid) {
        throw new BadRequestException('Invalid 2FA token');
      }
    }

    // Disable 2FA and remove secret
    await this.userRepository.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });

    this.logger.log(`2FA disabled successfully for user ${userId}`);
  }

  /**
   * Check if user has 2FA enabled
   * @param userId - User ID
   * @returns Boolean indicating if 2FA is enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'twoFactorEnabled'],
    });

    return user?.twoFactorEnabled || false;
  }

  /**
   * Require 2FA for sensitive operations
   * Throws error if 2FA is not enabled
   * @param userId - User ID
   */
  async requireTwoFactor(userId: string): Promise<void> {
    const isEnabled = await this.isTwoFactorEnabled(userId);

    if (!isEnabled) {
      throw new BadRequestException(
        'Two-factor authentication required. Please enable 2FA before performing this action.',
      );
    }
  }

  /**
   * Validate 2FA token during login
   * @param userId - User ID
   * @param token - 6-digit TOTP token
   * @throws UnauthorizedException if token is invalid
   */
  async validateLoginToken(userId: string, token: string): Promise<void> {
    const isValid = await this.verifyToken(userId, token);

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA token');
    }
  }

  /**
   * Generate backup codes for account recovery
   * @param count - Number of backup codes to generate
   * @returns Array of backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = EncryptionUtil.generateRandomString(4).toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Get 2FA status for user (for display purposes)
   * @param userId - User ID
   * @returns 2FA status information
   */
  async getTwoFactorStatus(userId: string): Promise<{
    enabled: boolean;
    hasSecret: boolean;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'twoFactorEnabled', 'twoFactorSecret'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      enabled: user.twoFactorEnabled,
      hasSecret: !!user.twoFactorSecret,
    };
  }
}
