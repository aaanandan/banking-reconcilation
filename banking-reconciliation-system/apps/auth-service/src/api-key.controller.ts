// apps/auth-service/src/api-key.controller.ts

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto, ApiKeyResponseDto } from './dto/api-key.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('API Keys')
@Controller('api-keys')
@UseGuards(ThrottlerGuard)
@ApiBearerAuth()
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({
    status: 201,
    description: 'API key created successfully',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createApiKey(
    @Body() dto: CreateApiKeyDto,
    @Body('userId') userId: string,
    @Body('tenantId') tenantId: string,
  ): Promise<ApiKeyResponseDto> {
    // NOTE: In production, userId and tenantId should come from authenticated JWT token
    return this.apiKeyService.generateApiKey(userId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all API keys for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of API keys',
    type: [ApiKeyResponseDto],
  })
  async listApiKeys(
    @Query('userId') userId: string,
    @Query('tenantId') tenantId: string,
  ): Promise<ApiKeyResponseDto[]> {
    // NOTE: In production, userId and tenantId should come from authenticated JWT token
    return this.apiKeyService.listApiKeys(userId, tenantId);
  }

  @Get(':keyId')
  @ApiOperation({ summary: 'Get API key details by ID' })
  @ApiResponse({
    status: 200,
    description: 'API key details',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async getApiKey(
    @Param('keyId') keyId: string,
    @Query('userId') userId: string,
    @Query('tenantId') tenantId: string,
  ): Promise<ApiKeyResponseDto> {
    // NOTE: In production, userId and tenantId should come from authenticated JWT token
    return this.apiKeyService.getApiKey(keyId, userId, tenantId);
  }

  @Post(':keyId/revoke')
  @ApiOperation({ summary: 'Revoke (deactivate) an API key' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async revokeApiKey(
    @Param('keyId') keyId: string,
    @Query('userId') userId: string,
    @Query('tenantId') tenantId: string,
  ): Promise<{ message: string }> {
    // NOTE: In production, userId and tenantId should come from authenticated JWT token
    await this.apiKeyService.revokeApiKey(keyId, userId, tenantId);
    return { message: 'API key revoked successfully' };
  }

  @Post(':keyId/rotate')
  @ApiOperation({ summary: 'Rotate an API key (create new, revoke old)' })
  @ApiResponse({
    status: 200,
    description: 'API key rotated successfully',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async rotateApiKey(
    @Param('keyId') keyId: string,
    @Query('userId') userId: string,
    @Query('tenantId') tenantId: string,
  ): Promise<ApiKeyResponseDto> {
    // NOTE: In production, userId and tenantId should come from authenticated JWT token
    return this.apiKeyService.rotateApiKey(keyId, userId, tenantId);
  }

  @Delete(':keyId')
  @ApiOperation({ summary: 'Permanently delete an API key' })
  @ApiResponse({ status: 200, description: 'API key deleted successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async deleteApiKey(
    @Param('keyId') keyId: string,
    @Query('userId') userId: string,
    @Query('tenantId') tenantId: string,
  ): Promise<{ message: string }> {
    // NOTE: In production, userId and tenantId should come from authenticated JWT token
    await this.apiKeyService.deleteApiKey(keyId, userId, tenantId);
    return { message: 'API key deleted successfully' };
  }
}
