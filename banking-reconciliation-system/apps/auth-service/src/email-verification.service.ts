// apps/auth-service/src/email-verification.service.ts

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/shared/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Generate a secure random token for email verification
   * @param userId - User ID to include in the token
   * @returns Verification token string
   */
  private generateVerificationToken(userId: string): string {
    // Create a token that includes user ID and random bytes
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now().toString();

    // Combine and hash for security
    const token = crypto
      .createHash('sha256')
      .update(`${userId}-${randomBytes}-${timestamp}`)
      .digest('hex');

    return token;
  }

  /**
   * Send verification email to user
   * @param userId - User ID to send verification email
   */
  async sendVerificationEmail(userId: string): Promise<void> {
    this.logger.log(`Sending verification email to user: ${userId}`);

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      this.logger.warn(`User ${userId} already verified, skipping email send`);
      return;
    }

    // Generate verification token (valid for 24 hours)
    const token = this.generateVerificationToken(userId);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in database
    await this.userRepository.update(userId, {
      emailVerificationToken: token,
      emailVerificationExpires: expiresAt,
    });

    this.logger.log(`Verification token generated for user ${userId}, expires at ${expiresAt}`);

    // TODO: Integrate with email service
    // For now, log the verification link (in production, this would be sent via email)
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    this.logger.log(`Verification link: ${verificationLink}`);
    this.logger.log(`Email would be sent to: ${user.email}`);

    // In production, you would send email like this:
    // await this.emailService.send({
    //   to: user.email,
    //   subject: 'Verify your email address',
    //   template: 'email-verification',
    //   context: {
    //     name: `${user.firstName} ${user.lastName}`,
    //     verificationLink,
    //   },
    // });
  }

  /**
   * Verify email using token
   * @param token - Verification token from email link
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Verifying email with token: ${token.substring(0, 10)}...`);

    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      this.logger.warn(`Invalid verification token: ${token.substring(0, 10)}...`);
      throw new BadRequestException('Invalid verification token');
    }

    // Check if already verified
    if (user.emailVerified) {
      this.logger.log(`User ${user.id} already verified`);
      return {
        success: true,
        message: 'Email already verified',
      };
    }

    // Check if token expired
    if (user.emailVerificationExpires < new Date()) {
      this.logger.warn(`Verification token expired for user ${user.id}`);
      throw new BadRequestException('Verification token expired. Please request a new verification email.');
    }

    // Mark email as verified and clear token
    await this.userRepository.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    this.logger.log(`Email successfully verified for user ${user.id}`);

    return {
      success: true,
      message: 'Email successfully verified',
    };
  }

  /**
   * Resend verification email to user
   * @param email - User email address
   */
  async resendVerificationEmail(email: string): Promise<void> {
    this.logger.log(`Resending verification email to: ${email}`);

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists or not for security
      this.logger.warn(`Resend verification requested for non-existent email: ${email}`);
      return;
    }

    if (user.emailVerified) {
      this.logger.log(`User ${user.id} already verified, skipping resend`);
      return;
    }

    // Send new verification email
    await this.sendVerificationEmail(user.id);
  }

  /**
   * Check if user's email is verified
   * @param userId - User ID to check
   * @returns Boolean indicating verification status
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'emailVerified'],
    });

    return user?.emailVerified || false;
  }

  /**
   * Require email verification for sensitive operations
   * Throws error if email not verified
   * @param userId - User ID to check
   */
  async requireEmailVerification(userId: string): Promise<void> {
    const isVerified = await this.isEmailVerified(userId);

    if (!isVerified) {
      throw new BadRequestException(
        'Email verification required. Please verify your email address before performing this action.',
      );
    }
  }
}
