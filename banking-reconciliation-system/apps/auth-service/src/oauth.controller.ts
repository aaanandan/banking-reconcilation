// apps/auth-service/src/oauth.controller.ts

import { Controller, Get, UseGuards, Req, Res, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { OAuthService, OAuthProfile } from './oauth.service';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('OAuth / Social Login')
@Controller('auth/oauth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(private readonly oauthService: OAuthService) {}

  // ═══════════════════════════════════════════════════════════
  // GOOGLE OAUTH
  // ═══════════════════════════════════════════════════════════

  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login page' })
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
    // This method is handled by passport strategy
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback endpoint' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated with Google' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    this.logger.log('Google OAuth callback received');

    try {
      const profile = req.user as OAuthProfile;
      const authResponse = await this.oauthService.handleOAuthCallback(profile);

      // In production, redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${authResponse.token}`;

      this.logger.log(`Redirecting to frontend: ${redirectUrl}`);

      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error(`Google OAuth callback error: ${error.message}`, error.stack);

      // Redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MICROSOFT OAUTH
  // ═══════════════════════════════════════════════════════════

  @Get('microsoft')
  @ApiOperation({ summary: 'Initiate Microsoft OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Microsoft login page' })
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth() {
    // Initiates Microsoft OAuth flow
    // This method is handled by passport strategy
  }

  @Get('microsoft/callback')
  @ApiOperation({ summary: 'Microsoft OAuth callback endpoint' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated with Microsoft' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthCallback(@Req() req: Request, @Res() res: Response) {
    this.logger.log('Microsoft OAuth callback received');

    try {
      const profile = req.user as OAuthProfile;
      const authResponse = await this.oauthService.handleOAuthCallback(profile);

      // In production, redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${authResponse.token}`;

      this.logger.log(`Redirecting to frontend: ${redirectUrl}`);

      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error(`Microsoft OAuth callback error: ${error.message}`, error.stack);

      // Redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // TESTING / DEVELOPMENT ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  @Get('google/callback/json')
  @ApiOperation({ summary: 'Google OAuth callback (JSON response for testing)' })
  @UseGuards(AuthGuard('google'))
  async googleAuthCallbackJson(@Req() req: Request): Promise<AuthResponseDto> {
    const profile = req.user as OAuthProfile;
    return this.oauthService.handleOAuthCallback(profile);
  }

  @Get('microsoft/callback/json')
  @ApiOperation({ summary: 'Microsoft OAuth callback (JSON response for testing)' })
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthCallbackJson(@Req() req: Request): Promise<AuthResponseDto> {
    const profile = req.user as OAuthProfile;
    return this.oauthService.handleOAuthCallback(profile);
  }
}
