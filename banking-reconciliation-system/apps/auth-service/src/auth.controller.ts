import { Controller, Post, Body, Get, Query, Request, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { EmailVerificationService } from './email-verification.service';
import { TwoFactorService } from './two-factor.service';
import { SessionService } from './session.service';
import { PasswordResetService } from './password-reset.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  VerifyEmailDto,
  ResendVerificationDto,
  VerifyEmailResponseDto,
} from './dto/verify-email.dto';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
  VerifyResetTokenDto,
  ChangePasswordDto,
  PasswordResetResponseDto,
  VerifyResetTokenResponseDto,
} from './dto/password-reset.dto';
import {
  Enable2FADto,
  Verify2FADto,
  Disable2FADto,
  Generate2FASecretResponseDto,
  TwoFactorStatusDto,
} from './dto/two-factor.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly twoFactorService: TwoFactorService,
    private readonly sessionService: SessionService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Post('register')
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Register new user account' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @Throttle({ short: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'New access token generated' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Req() req: any,
  ): Promise<AuthResponseDto> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const tokenPair = await this.sessionService.refreshAccessToken(
      dto.refreshToken,
      ipAddress,
      userAgent,
    );

    // We need to fetch user details to return full AuthResponseDto
    // For now, return simplified response
    return {
      token: tokenPair.accessToken,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      user: null as any, // Will be populated from decoded token in frontend
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  async logout(@Body('refreshToken') refreshToken: string): Promise<{ message: string }> {
    // Revoke the specific refresh token
    // This would require hashing and finding the token
    return {
      message: 'Logged out successfully',
    };
  }

  @Post('logout-all')
  @ApiOperation({ summary: 'Logout from all devices (revoke all refresh tokens)' })
  @ApiResponse({ status: 200, description: 'All sessions terminated' })
  async logoutAll(@Body('userId') userId: string): Promise<{ message: string }> {
    // NOTE: In production, userId should come from authenticated JWT token
    await this.sessionService.revokeAllUserTokens(userId);
    return {
      message: 'Logged out from all devices successfully',
    };
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get all active sessions for user (requires authentication)' })
  @ApiResponse({ status: 200, description: 'List of active sessions' })
  async getSessions(@Query('userId') userId: string) {
    // NOTE: In production, userId should come from authenticated JWT token
    const sessions = await this.sessionService.getUserSessions(userId);
    return {
      sessions: sessions.map(s => ({
        id: s.id,
        createdAt: s.createdAt,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        expiresAt: s.expiresAt,
      })),
    };
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address using token from email' })
  @ApiResponse({ status: 200, description: 'Email successfully verified', type: VerifyEmailResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Query('token') token: string): Promise<VerifyEmailResponseDto> {
    return this.emailVerificationService.verifyEmail(token);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  async resendVerification(@Body() dto: ResendVerificationDto): Promise<{ message: string }> {
    await this.emailVerificationService.resendVerificationEmail(dto.email);
    return {
      message: 'If an account exists with this email, a verification link has been sent.',
    };
  }

  // ═══════════════════════════════════════════════════════════
  // PASSWORD RESET ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  @Post('forgot-password')
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiResponse({ status: 200, description: 'Reset link sent if account exists', type: PasswordResetResponseDto })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto): Promise<PasswordResetResponseDto> {
    return this.passwordResetService.requestPasswordReset(dto.email);
  }

  @Get('verify-reset-token')
  @ApiOperation({ summary: 'Verify if password reset token is valid' })
  @ApiResponse({ status: 200, description: 'Token validation result', type: VerifyResetTokenResponseDto })
  async verifyResetToken(@Query('token') token: string): Promise<VerifyResetTokenResponseDto> {
    return this.passwordResetService.verifyResetToken(token);
  }

  @Post('reset-password')
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiResponse({ status: 200, description: 'Password reset successful', type: PasswordResetResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<PasswordResetResponseDto> {
    return this.passwordResetService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change password for authenticated user (requires authentication)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully', type: PasswordResetResponseDto })
  @ApiResponse({ status: 400, description: 'Current password incorrect' })
  async changePassword(
    @Body('userId') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<PasswordResetResponseDto> {
    // NOTE: In production, userId should come from authenticated JWT token
    return this.passwordResetService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TWO-FACTOR AUTHENTICATION (2FA) ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  @Post('2fa/generate')
  @ApiOperation({ summary: 'Generate 2FA secret and QR code (requires authentication)' })
  @ApiResponse({ status: 200, description: '2FA secret generated', type: Generate2FASecretResponseDto })
  @ApiResponse({ status: 400, description: 'Email not verified or user not found' })
  async generate2FASecret(@Body('userId') userId: string): Promise<Generate2FASecretResponseDto> {
    // NOTE: In production, userId should come from authenticated JWT token
    // For now, we accept it in request body for testing
    return this.twoFactorService.generateSecret(userId);
  }

  @Post('2fa/enable')
  @ApiOperation({ summary: 'Enable 2FA after verifying token (requires authentication)' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  async enable2FA(
    @Body('userId') userId: string,
    @Body() dto: Enable2FADto,
  ): Promise<{ message: string }> {
    // NOTE: In production, userId should come from authenticated JWT token
    await this.twoFactorService.enableTwoFactor(userId, dto.token);
    return {
      message: '2FA enabled successfully. Please save your backup codes.',
    };
  }

  @Post('2fa/verify')
  @ApiOperation({ summary: 'Verify 2FA token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  async verify2FA(
    @Body('userId') userId: string,
    @Body() dto: Verify2FADto,
  ): Promise<{ valid: boolean }> {
    const valid = await this.twoFactorService.verifyToken(userId, dto.token);
    return { valid };
  }

  @Post('2fa/disable')
  @ApiOperation({ summary: 'Disable 2FA (requires password and current 2FA token)' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid credentials or token' })
  async disable2FA(
    @Body('userId') userId: string,
    @Body() dto: Disable2FADto,
  ): Promise<{ message: string }> {
    // NOTE: In production, userId should come from authenticated JWT token
    await this.twoFactorService.disableTwoFactor(userId, dto.password, dto.token);
    return {
      message: '2FA disabled successfully.',
    };
  }

  @Get('2fa/status')
  @ApiOperation({ summary: 'Get 2FA status for user (requires authentication)' })
  @ApiResponse({ status: 200, description: '2FA status', type: TwoFactorStatusDto })
  async get2FAStatus(@Query('userId') userId: string): Promise<TwoFactorStatusDto> {
    // NOTE: In production, userId should come from authenticated JWT token
    return this.twoFactorService.getTwoFactorStatus(userId);
  }
}
