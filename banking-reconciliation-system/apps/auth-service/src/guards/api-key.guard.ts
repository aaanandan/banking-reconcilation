// apps/auth-service/src/guards/api-key.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyService } from '../api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract API key from header
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Get required scope from decorator (if any)
    const requiredScope = this.reflector.get<string>(
      'api-key-scope',
      context.getHandler(),
    );

    // Get IP address
    const ipAddress = request.ip || request.connection.remoteAddress;

    try {
      // Validate API key
      const validatedKey = await this.apiKeyService.validateApiKey(
        apiKey,
        requiredScope,
        ipAddress,
      );

      // Attach tenant and user info to request
      request.apiKey = validatedKey;
      request.tenantId = validatedKey.tenantId;
      request.userId = validatedKey.userId;

      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid API key');
    }
  }

  /**
   * Extract API key from request headers
   * Supports multiple formats:
   * - Authorization: Bearer <key>
   * - Authorization: ApiKey <key>
   * - X-API-Key: <key>
   */
  private extractApiKey(request: any): string | null {
    // Check X-API-Key header
    if (request.headers['x-api-key']) {
      return request.headers['x-api-key'];
    }

    // Check Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader) {
      // Bearer token
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }

      // ApiKey token
      if (authHeader.startsWith('ApiKey ')) {
        return authHeader.substring(7);
      }
    }

    return null;
  }
}
