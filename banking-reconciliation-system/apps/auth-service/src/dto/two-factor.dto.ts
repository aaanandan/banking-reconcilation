// apps/auth-service/src/dto/two-factor.dto.ts

import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Enable2FADto {
  @ApiProperty({
    description: '6-digit TOTP token from authenticator app',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^[0-9]+$/, { message: 'Token must contain only digits' })
  token: string;
}

export class Verify2FADto {
  @ApiProperty({
    description: '6-digit TOTP token from authenticator app',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^[0-9]+$/, { message: 'Token must contain only digits' })
  token: string;
}

export class Disable2FADto {
  @ApiProperty({
    description: 'User password for verification',
    example: 'MySecurePassword123!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: '6-digit TOTP token from authenticator app (if 2FA is enabled)',
    example: '123456',
    required: false,
  })
  @IsString()
  @Length(6, 6)
  @Matches(/^[0-9]+$/, { message: 'Token must contain only digits' })
  token?: string;
}

export class Generate2FASecretResponseDto {
  @ApiProperty({
    description: 'Base32 encoded TOTP secret',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret: string;

  @ApiProperty({
    description: 'QR code data URL for scanning with authenticator app',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSU...',
  })
  qrCode: string;

  @ApiProperty({
    description: 'Backup codes for account recovery (save these securely)',
    example: ['A1B2C3D4', 'E5F6G7H8', 'I9J0K1L2', 'M3N4O5P6', 'Q7R8S9T0', 'U1V2W3X4', 'Y5Z6A7B8', 'C9D0E1F2'],
    type: [String],
  })
  backupCodes: string[];
}

export class TwoFactorStatusDto {
  @ApiProperty({
    description: 'Whether 2FA is currently enabled',
    example: true,
  })
  enabled: boolean;

  @ApiProperty({
    description: 'Whether user has set up a 2FA secret (may not be enabled yet)',
    example: true,
  })
  hasSecret: boolean;
}

export class LoginWith2FADto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password',
    example: 'MySecurePassword123!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: '6-digit TOTP token (required if 2FA is enabled)',
    example: '123456',
    required: false,
  })
  @IsString()
  @Length(6, 6)
  @Matches(/^[0-9]+$/, { message: 'Token must contain only digits' })
  twoFactorToken?: string;
}
