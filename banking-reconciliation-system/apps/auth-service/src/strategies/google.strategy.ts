// apps/auth-service/src/strategies/google.strategy.ts

import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { OAuthProfile } from '../oauth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3000/auth/oauth/google/callback',
      ),
      scope: ['email', 'profile'],
      passReqToCallback: false,
    } as any); // Type assertion for passport strategy options

    this.logger.log('Google OAuth Strategy initialized');
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    this.logger.log(`Google OAuth validate called for user: ${profile.id}`);

    const { id, emails, name, displayName } = profile;

    if (!emails || emails.length === 0) {
      this.logger.error('No email provided by Google OAuth');
      return done(new Error('No email provided by Google'), false);
    }

    const oauthProfile: OAuthProfile = {
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      firstName: name?.givenName || displayName.split(' ')[0] || 'User',
      lastName: name?.familyName || displayName.split(' ')[1] || '',
      displayName: displayName || emails[0].value,
    };

    this.logger.log(`Google profile validated: ${oauthProfile.email}`);

    done(null, oauthProfile);
  }
}
