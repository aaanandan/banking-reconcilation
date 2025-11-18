// libs/shared/src/utils/encryption.util.ts

import * as crypto from 'crypto';

/**
 * Encryption utility for sensitive data like 2FA secrets
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly AUTH_TAG_LENGTH = 16; // 128 bits
  private static readonly SALT_LENGTH = 64;

  /**
   * Get encryption key from environment or generate default
   * WARNING: In production, ALWAYS set ENCRYPTION_KEY environment variable
   */
  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
      console.warn(
        'WARNING: ENCRYPTION_KEY not set. Using default key. ' +
        'This is INSECURE for production. Set ENCRYPTION_KEY environment variable.',
      );
      // Default key for development only
      return crypto.scryptSync('default-dev-key-change-in-production', 'salt', 32);
    }

    // Derive key from environment variable using scrypt
    return crypto.scryptSync(key, 'banking-recon-salt', 32);
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param plaintext - Data to encrypt
   * @returns Encrypted data in format: iv:authTag:encryptedData (hex encoded)
   */
  static encrypt(plaintext: string): string {
    if (!plaintext) {
      throw new Error('Cannot encrypt empty string');
    }

    // Generate random IV (initialization vector)
    const iv = crypto.randomBytes(EncryptionUtil.IV_LENGTH);

    // Get encryption key
    const key = EncryptionUtil.getEncryptionKey();

    // Create cipher
    const cipher = crypto.createCipheriv(EncryptionUtil.ALGORITHM, key, iv);

    // Encrypt data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine IV, auth tag, and encrypted data
    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt data encrypted with encrypt()
   * @param ciphertext - Encrypted data in format: iv:authTag:encryptedData
   * @returns Decrypted plaintext
   */
  static decrypt(ciphertext: string): string {
    if (!ciphertext) {
      throw new Error('Cannot decrypt empty string');
    }

    try {
      // Split ciphertext into components
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format');
      }

      const [ivHex, authTagHex, encryptedHex] = parts;

      // Convert from hex
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');

      // Validate lengths
      if (iv.length !== EncryptionUtil.IV_LENGTH) {
        throw new Error('Invalid IV length');
      }
      if (authTag.length !== EncryptionUtil.AUTH_TAG_LENGTH) {
        throw new Error('Invalid auth tag length');
      }

      // Get encryption key
      const key = EncryptionUtil.getEncryptionKey();

      // Create decipher
      const decipher = crypto.createDecipheriv(EncryptionUtil.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt data
      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash data using SHA-256 (one-way hash, cannot be decrypted)
   * @param data - Data to hash
   * @returns SHA-256 hash in hex format
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Compare data with hash (constant-time comparison to prevent timing attacks)
   * @param data - Plain data
   * @param hash - Hash to compare against
   * @returns True if data matches hash
   */
  static compareHash(data: string, hash: string): boolean {
    const dataHash = EncryptionUtil.hash(data);
    return crypto.timingSafeEqual(
      Buffer.from(dataHash, 'hex'),
      Buffer.from(hash, 'hex'),
    );
  }

  /**
   * Generate cryptographically secure random string
   * @param length - Length of random string in bytes
   * @returns Random hex string
   */
  static generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
