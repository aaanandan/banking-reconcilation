import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: '64-character-hex-token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewSecurePassword123!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty()
  newPassword: string;
}

export class VerifyResetTokenDto {
  @ApiProperty({ example: '64-character-hex-token' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPassword123!' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewSecurePassword123!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty()
  newPassword: string;
}

export class PasswordResetResponseDto {
  @ApiProperty()
  message: string;
}

export class VerifyResetTokenResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiProperty({ required: false })
  email?: string;
}
