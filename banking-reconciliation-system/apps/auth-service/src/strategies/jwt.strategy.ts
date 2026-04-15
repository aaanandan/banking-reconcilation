import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/shared/entities/user.entity';

/**
 * JWT Strategy
 *
 * Validates JWT tokens and retrieves user information
 * Uses passport-jwt for token extraction and validation
 *
 * Token payload structure:
 * {
 *   sub: userId,
 *   email: user.email,
 *   tenantId: user.tenantId,
 *   iat: issuedAt,
 *   exp: expiresAt
 * }
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'your-secret-key-change-in-production'),
    });
  }

  /**
   * Validate JWT payload and return user object
   *
   * This method is called automatically by Passport after token validation
   * The returned user object is attached to req.user
   */
  async validate(payload: any) {
    // Verify user still exists and is active
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['tenant'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    if (user.isSuspended) {
      throw new UnauthorizedException('User account is suspended');
    }

    // Return user object to be attached to request
    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      isAdmin: user.isAdmin,
      tenant: user.tenant,
    };
  }
}
