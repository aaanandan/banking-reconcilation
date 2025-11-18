// apps/auth-service/src/api-key.service.ts

import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ApiKey } from '@app/shared/entities/api-key.entity';
import { User } from '@app/shared/entities/user.entity';
import * as crypto from 'crypto';

export interface CreateApiKeyDto {
  name: string;
  description?: string;
  scopes: string[];
  expiresInDays?: number; // 0 = never expires
  ipWhitelist?: string;
}

export interface ApiKeyResponse {
  id: string;
  key?: string; // Only returned on creation
  prefix: string;
  name: string;
  description: string;
  scopes: string[];
  isActive: boolean;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  usageCount: number;
  createdAt: Date;
}

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Generate a new API key for a user
   */
  async generateApiKey(
    userId: string,
    tenantId: string,
    dto: CreateApiKeyDto,
  ): Promise<ApiKeyResponse> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate secure API key
    const rawKey = this.generateSecureKey();
    const hashedKey = this.hashKey(rawKey);
    const prefix = rawKey.substring(0, 8); // First 8 characters for identification

    // Calculate expiration
    let expiresAt: Date | null = null;
    if (dto.expiresInDays && dto.expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + dto.expiresInDays);
    }

    // Create API key entity
    const apiKey = this.apiKeyRepository.create({
      userId,
      tenantId,
      keyHash: hashedKey,
      name: dto.name,
      description: dto.description || '',
      prefix,
      scopes: dto.scopes,
      expiresAt,
      ipWhitelist: dto.ipWhitelist || undefined,
      isActive: true,
      usageCount: 0,
    });

    await this.apiKeyRepository.save(apiKey);

    this.logger.log(`API key generated for user ${userId}: ${apiKey.name} (${prefix}...)`);

    return {
      id: apiKey.id,
      key: rawKey, // Only returned once on creation!
      prefix: apiKey.prefix,
      name: apiKey.name,
      description: apiKey.description,
      scopes: apiKey.scopes,
      isActive: apiKey.isActive,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      usageCount: apiKey.usageCount,
      createdAt: apiKey.createdAt,
    };
  }

  /**
   * Validate an API key and return associated tenant/user info
   */
  async validateApiKey(
    rawKey: string,
    requiredScope?: string,
    ipAddress?: string,
  ): Promise<ApiKey> {
    const hashedKey = this.hashKey(rawKey);

    const apiKey = await this.apiKeyRepository.findOne({
      where: { keyHash: hashedKey },
      relations: ['user', 'tenant'],
    });

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if key is valid
    if (!apiKey.isValid()) {
      throw new UnauthorizedException(
        apiKey.isExpired() ? 'API key has expired' : 'API key is inactive',
      );
    }

    // Check scope if required
    if (requiredScope && !apiKey.hasScope(requiredScope)) {
      throw new UnauthorizedException(
        `API key does not have required scope: ${requiredScope}`,
      );
    }

    // Check IP whitelist
    if (ipAddress && !apiKey.isIpAllowed(ipAddress)) {
      this.logger.warn(
        `API key ${apiKey.prefix}... used from unauthorized IP: ${ipAddress}`,
      );
      throw new UnauthorizedException('IP address not authorized for this API key');
    }

    // Update last used timestamp and usage count
    await this.apiKeyRepository.update(apiKey.id, {
      lastUsedAt: new Date(),
      usageCount: apiKey.usageCount + 1,
    });

    return apiKey;
  }

  /**
   * List all API keys for a user
   */
  async listApiKeys(userId: string, tenantId: string): Promise<ApiKeyResponse[]> {
    const apiKeys = await this.apiKeyRepository.find({
      where: { userId, tenantId },
      order: { createdAt: 'DESC' },
    });

    return apiKeys.map(key => ({
      id: key.id,
      prefix: key.prefix,
      name: key.name,
      description: key.description,
      scopes: key.scopes,
      isActive: key.isActive,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      usageCount: key.usageCount,
      createdAt: key.createdAt,
    }));
  }

  /**
   * Get API key details by ID
   */
  async getApiKey(keyId: string, userId: string, tenantId: string): Promise<ApiKeyResponse> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: keyId, userId, tenantId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    return {
      id: apiKey.id,
      prefix: apiKey.prefix,
      name: apiKey.name,
      description: apiKey.description,
      scopes: apiKey.scopes,
      isActive: apiKey.isActive,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      usageCount: apiKey.usageCount,
      createdAt: apiKey.createdAt,
    };
  }

  /**
   * Revoke (deactivate) an API key
   */
  async revokeApiKey(keyId: string, userId: string, tenantId: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: keyId, userId, tenantId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    apiKey.isActive = false;
    await this.apiKeyRepository.save(apiKey);

    this.logger.log(`API key revoked: ${apiKey.name} (${apiKey.prefix}...)`);
  }

  /**
   * Delete an API key permanently
   */
  async deleteApiKey(keyId: string, userId: string, tenantId: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: keyId, userId, tenantId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    await this.apiKeyRepository.remove(apiKey);

    this.logger.log(`API key deleted: ${apiKey.name} (${apiKey.prefix}...)`);
  }

  /**
   * Rotate an API key (create new, revoke old)
   */
  async rotateApiKey(
    keyId: string,
    userId: string,
    tenantId: string,
  ): Promise<ApiKeyResponse> {
    const oldKey = await this.apiKeyRepository.findOne({
      where: { id: keyId, userId, tenantId },
    });

    if (!oldKey) {
      throw new NotFoundException('API key not found');
    }

    // Create new key with same settings
    const newKey = await this.generateApiKey(userId, tenantId, {
      name: oldKey.name,
      description: oldKey.description,
      scopes: oldKey.scopes,
      expiresInDays: oldKey.expiresAt
        ? Math.ceil((oldKey.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0,
      ipWhitelist: oldKey.ipWhitelist,
    });

    // Revoke old key
    await this.revokeApiKey(keyId, userId, tenantId);

    this.logger.log(`API key rotated: ${oldKey.name} (${oldKey.prefix}... -> ${newKey.prefix}...)`);

    return newKey;
  }

  /**
   * Clean up expired API keys (run periodically via cron)
   */
  async cleanupExpiredKeys(): Promise<number> {
    const result = await this.apiKeyRepository.delete({
      expiresAt: LessThan(new Date()),
      isActive: false, // Only delete expired AND revoked keys
    });

    const count = result.affected || 0;

    if (count > 0) {
      this.logger.log(`Cleaned up ${count} expired API keys`);
    }

    return count;
  }

  /**
   * Generate a cryptographically secure API key
   */
  private generateSecureKey(): string {
    // Generate 32 bytes (256 bits) of random data
    // Format: prefix_randomdata
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `brs_${randomBytes}`; // brs = Banking Reconciliation System
  }

  /**
   * Hash an API key using SHA-256
   */
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}
