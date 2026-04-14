// apps/auth-service/src/dto/verify-email.dto.ts

import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token received via email',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResendVerificationDto {
  @ApiProperty({
    description: 'Email address to resend verification email to',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyEmailResponseDto {
  @ApiProperty({
    description: 'Whether verification was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Verification result message',
    example: 'Email successfully verified',
  })
  message: string;
}
