// apps/auth-service/src/brute-force-protection.service.ts

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/shared/entities/user.entity';

export interface BruteForceConfig {
  maxAttempts: number; // Maximum failed login attempts before lockout
  lockoutDurationMinutes: number; // How long to lock account
  attemptWindowMinutes: number; // Time window for counting attempts
}

@Injectable()
export class BruteForceProtectionService {
  private readonly logger = new Logger(BruteForceProtectionService.name);

  // Default configuration
  private readonly config: BruteForceConfig = {
    maxAttempts: 5, // Lock after 5 failed attempts
    lockoutDurationMinutes: 15, // Lock for 15 minutes
    attemptWindowMinutes: 15, // Count attempts within 15 minutes
  };

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Check if account is currently locked
   * @param user User entity
   * @returns true if account is locked
   */
  isAccountLocked(user: User): boolean {
    if (!user.accountLockedUntil) {
      return false;
    }

    const now = new Date();
    if (now < user.accountLockedUntil) {
      return true; // Still locked
    }

    // Lock expired - will be cleared on next check
    return false;
  }

  /**
   * Check if account is locked and throw exception if it is
   * @param user User entity
   * @throws UnauthorizedException if account is locked
   */
  async checkAccountLock(user: User): Promise<void> {
    if (this.isAccountLocked(user) && user.accountLockedUntil) {
      const lockExpiresIn = Math.ceil(
        (user.accountLockedUntil.getTime() - Date.now()) / 1000 / 60,
      );

      this.logger.warn(
        `Login attempt for locked account: ${user.email} (locked for ${lockExpiresIn} more minutes)`,
      );

      throw new UnauthorizedException(
        `Account is temporarily locked due to multiple failed login attempts. ` +
        `Please try again in ${lockExpiresIn} minute(s).`,
      );
    }

    // If lock expired, clear it
    if (user.accountLockedUntil && new Date() >= user.accountLockedUntil) {
      await this.resetLoginAttempts(user.id);
    }
  }

  /**
   * Record a failed login attempt
   * @param userId User ID
   * @returns true if account should be locked
   */
  async recordFailedAttempt(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return false;
    }

    const now = new Date();

    // Check if last failed attempt was outside the attempt window
    if (user.lastFailedLoginAt) {
      const minutesSinceLastAttempt =
        (now.getTime() - user.lastFailedLoginAt.getTime()) / 1000 / 60;

      if (minutesSinceLastAttempt > this.config.attemptWindowMinutes) {
        // Reset counter if outside window
        user.failedLoginAttempts = 1;
      } else {
        // Increment counter
        user.failedLoginAttempts += 1;
      }
    } else {
      // First failed attempt
      user.failedLoginAttempts = 1;
    }

    user.lastFailedLoginAt = now;

    // Check if we should lock the account
    if (user.failedLoginAttempts >= this.config.maxAttempts) {
      user.accountLockedUntil = new Date(
        now.getTime() + this.config.lockoutDurationMinutes * 60 * 1000,
      );

      this.logger.warn(
        `Account locked for user: ${user.email} (${user.failedLoginAttempts} failed attempts)`,
      );

      await this.userRepository.save(user);
      return true; // Account locked
    }

    await this.userRepository.save(user);

    this.logger.log(
      `Failed login attempt ${user.failedLoginAttempts}/${this.config.maxAttempts} for user: ${user.email}`,
    );

    return false; // Not locked yet
  }

  /**
   * Reset failed login attempts (called on successful login)
   * @param userId User ID
   */
  async resetLoginAttempts(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      failedLoginAttempts: 0,
      lastFailedLoginAt: null,
      accountLockedUntil: null,
    });

    this.logger.log(`Reset login attempts for user: ${userId}`);
  }

  /**
   * Get remaining attempts before lockout
   * @param user User entity
   * @returns number of remaining attempts
   */
  getRemainingAttempts(user: User): number {
    if (this.isAccountLocked(user)) {
      return 0;
    }

    // Check if attempts are outside the window
    if (user.lastFailedLoginAt) {
      const minutesSinceLastAttempt =
        (Date.now() - user.lastFailedLoginAt.getTime()) / 1000 / 60;

      if (minutesSinceLastAttempt > this.config.attemptWindowMinutes) {
        return this.config.maxAttempts; // Reset
      }
    }

    return Math.max(
      0,
      this.config.maxAttempts - (user.failedLoginAttempts || 0),
    );
  }

  /**
   * Manually unlock an account (admin function)
   * @param userId User ID
   */
  async unlockAccount(userId: string): Promise<void> {
    await this.resetLoginAttempts(userId);
    this.logger.log(`Manually unlocked account: ${userId}`);
  }

  /**
   * Get lockout status for a user
   * @param user User entity
   * @returns lockout information
   */
  getLockoutStatus(user: User): {
    isLocked: boolean;
    remainingAttempts: number;
    lockExpiresAt: Date | null;
    lockExpiresInMinutes: number | null;
  } {
    const isLocked = this.isAccountLocked(user);
    const remainingAttempts = this.getRemainingAttempts(user);

    let lockExpiresInMinutes: number | null = null;
    if (isLocked && user.accountLockedUntil) {
      lockExpiresInMinutes = Math.ceil(
        (user.accountLockedUntil.getTime() - Date.now()) / 1000 / 60,
      );
    }

    return {
      isLocked,
      remainingAttempts,
      lockExpiresAt: isLocked ? user.accountLockedUntil : null,
      lockExpiresInMinutes,
    };
  }
}
