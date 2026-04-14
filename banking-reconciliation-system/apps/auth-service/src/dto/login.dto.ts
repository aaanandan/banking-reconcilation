import { IsEmail, IsString, IsNotEmpty, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsEmail()
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
    description: '6-digit 2FA token (required if 2FA is enabled)',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  @Matches(/^[0-9]+$/, { message: '2FA token must be 6 digits' })
  twoFactorToken?: string;
}
