import { IsString, IsNotEmpty, IsArray, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production API Key' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'API key for production integration', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['read', 'write'], type: [String] })
  @IsArray()
  @IsNotEmpty()
  scopes: string[];

  @ApiProperty({ example: 365, required: false, description: '0 = never expires' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(3650) // Max 10 years
  expiresInDays?: number;

  @ApiProperty({ example: '192.168.1.1,10.0.0.0/24', required: false })
  @IsString()
  @IsOptional()
  ipWhitelist?: string;
}

export class ApiKeyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false, description: 'Only returned on creation' })
  key?: string;

  @ApiProperty()
  prefix: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: [String] })
  scopes: string[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  expiresAt: Date | null;

  @ApiProperty({ required: false })
  lastUsedAt: Date | null;

  @ApiProperty()
  usageCount: number;

  @ApiProperty()
  createdAt: Date;
}

export class RevokeApiKeyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  keyId: string;
}
