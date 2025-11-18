// apps/auth-service/src/auth.service.ts

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/shared/entities/user.entity';
import { Tenant } from '@app/shared/entities/tenant.entity';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { EmailVerificationService } from './email-verification.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private jwtService: JwtService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if tenant exists
    let tenant = await this.tenantRepository.findOne({
      where: { email: dto.companyEmail },
    });

    // Create tenant if new registration
    if (!tenant) {
      tenant = this.tenantRepository.create({
        tenantId: `tenant_${this.generateId()}`,
        companyName: dto.companyName,
        email: dto.companyEmail,
        status: 'trial',
        plan: 'free',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        quotas: {
          maxBankAccounts: 1,
          maxTransactionsPerMonth: 100,
          maxStorageMB: 10,
          maxUsers: 1,
        },
        currentUsage: {
          bankAccounts: 0,
          transactionsThisMonth: 0,
          storageMB: 0,
          users: 0,
        },
      });
      await this.tenantRepository.save(tenant);
    }

    // Create user
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      tenantId: tenant.tenantId,
      email: dto.email,
      passwordHash: hashedPassword,
      name: dto.name,
      role: 'tenant_admin', // First user is admin
      isActive: true,
      emailVerified: false, // User needs to verify email
    });
    await this.userRepository.save(user);

    // Send email verification (async, don't wait)
    this.emailVerificationService.sendVerificationEmail(user.id)
      .catch(err => this.logger.error(`Failed to send verification email: ${err.message}`));

    // Generate JWT with tenantId
    const token = this.jwtService.sign({
      userId: user.id,
      tenantId: tenant.tenantId,  // CRITICAL
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: tenant.tenantId,
        companyName: tenant.companyName,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      relations: ['tenant'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user/tenant is active
    if (!user.isActive || user.tenant.status === 'suspended') {
      throw new UnauthorizedException('Account is not active');
    }

    // Generate JWT with tenantId
    const token = this.jwtService.sign({
      userId: user.id,
      tenantId: user.tenantId,  // CRITICAL
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        companyName: user.tenant.companyName,
      },
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}
