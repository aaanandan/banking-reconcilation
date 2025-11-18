// apps/auth-service/src/strategies/microsoft.strategy.ts

import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';
import { OAuthProfile } from '../oauth.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  private readonly logger = new Logger(MicrosoftStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('MICROSOFT_CLIENT_ID'),
      clientSecret: configService.get<string>('MICROSOFT_CLIENT_SECRET'),
      callbackURL: configService.get<string>(
        'MICROSOFT_CALLBACK_URL',
        'http://localhost:3000/auth/oauth/microsoft/callback',
      ),
      scope: ['user.read'],
      tenant: 'common', // Supports both personal and work accounts
    });

    this.logger.log('Microsoft OAuth Strategy initialized');
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    this.logger.log(`Microsoft OAuth validate called for user: ${profile.id}`);

    const { id, emails, displayName, name } = profile;

    if (!emails || emails.length === 0) {
      this.logger.error('No email provided by Microsoft OAuth');
      return done(new Error('No email provided by Microsoft'), null);
    }

    const oauthProfile: OAuthProfile = {
      provider: 'microsoft',
      providerId: id,
      email: emails[0].value,
      firstName: name?.givenName || displayName.split(' ')[0] || 'User',
      lastName: name?.familyName || displayName.split(' ')[1] || '',
      displayName: displayName || emails[0].value,
    };

    this.logger.log(`Microsoft profile validated: ${oauthProfile.email}`);

    done(null, oauthProfile);
  }
}
