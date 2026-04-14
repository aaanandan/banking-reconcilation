// apps/auth-service/src/password-reset.service.ts

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from '@app/shared/entities/user.entity';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Request a password reset - generates token and sends email
   * @param email User's email address
   * @returns Success message (doesn't reveal if user exists)
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    // Don't reveal whether user exists (security best practice)
    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Check if user is OAuth-only (no password to reset)
    if (!user.passwordHash && user.authProvider !== 'local') {
      this.logger.warn(
        `Password reset requested for OAuth-only user: ${user.email}`,
      );
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate secure reset token
    const resetToken = this.generateResetToken();
    const hashedToken = this.hashToken(resetToken);

    // Set token and expiry (1 hour from now)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userRepository.save(user);

    // TODO: Send password reset email
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    this.logger.log(`Password reset token generated for user: ${user.email}`);

    // In development, log the token (REMOVE IN PRODUCTION!)
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Reset token for ${user.email}: ${resetToken}`);
    }

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * Validate a reset token
   * @param token Reset token from email
   * @returns User if token is valid
   */
  async validateResetToken(token: string): Promise<User> {
    const hashedToken = this.hashToken(token);

    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: hashedToken },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token has expired
    if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
      throw new BadRequestException('Reset token has expired');
    }

    return user;
  }

  /**
   * Reset password using valid token
   * @param token Reset token from email
   * @param newPassword New password
   * @returns Success message
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Validate token
    const user = await this.validateResetToken(token);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    user.passwordHash = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    // Also reset failed login attempts
    user.failedLoginAttempts = 0;
    user.lastFailedLoginAt = null;
    user.accountLockedUntil = null;

    await this.userRepository.save(user);

    this.logger.log(`Password reset successful for user: ${user.email}`);

    return {
      message: 'Password has been reset successfully. You can now log in with your new password.',
    };
  }

  /**
   * Verify reset token is valid (without resetting password)
   * Used for frontend to show password reset form
   * @param token Reset token from email
   * @returns Token validity status
   */
  async verifyResetToken(token: string): Promise<{
    valid: boolean;
    email?: string;
  }> {
    try {
      const user = await this.validateResetToken(token);
      return {
        valid: true,
        email: user.email,
      };
    } catch (error) {
      return {
        valid: false,
      };
    }
  }

  /**
   * Change password for authenticated user
   * @param userId User ID
   * @param currentPassword Current password
   * @param newPassword New password
   * @returns Success message
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // OAuth users can't change password this way
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Cannot change password for OAuth-only accounts',
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;

    await this.userRepository.save(user);

    this.logger.log(`Password changed for user: ${user.email}`);

    return {
      message: 'Password has been changed successfully.',
    };
  }

  /**
   * Clean up expired reset tokens (run periodically via cron)
   * @returns Number of tokens cleaned up
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.userRepository.update(
      {
        resetPasswordExpires: LessThan(new Date()),
      },
      {
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    );

    const count = result.affected || 0;

    if (count > 0) {
      this.logger.log(`Cleaned up ${count} expired password reset tokens`);
    }

    return count;
  }

  /**
   * Cancel password reset for a user (clear tokens)
   * @param userId User ID
   */
  async cancelPasswordReset(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    this.logger.log(`Password reset cancelled for user: ${userId}`);
  }

  /**
   * Generate a cryptographically secure reset token
   */
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex'); // 64-character hex string
  }

  /**
   * Hash a token using SHA-256
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
