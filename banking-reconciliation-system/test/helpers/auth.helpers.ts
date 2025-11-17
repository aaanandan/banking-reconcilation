// test/helpers/auth.helpers.ts
import { JwtService } from '@nestjs/jwt';
import { AppDataSource } from '../../data-source';
import { User } from '../../libs/shared/src/entities/user.entity';
import { Tenant } from '../../libs/shared/src/entities/tenant.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

let userRepository: Repository<User>;
let tenantRepository: Repository<Tenant>;
let jwtService: JwtService;

/**
 * Initialize JWT service for auth tests
 */
export async function initializeAuthService() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  userRepository = AppDataSource.getRepository(User);
  tenantRepository = AppDataSource.getRepository(Tenant);

  // Initialize JWT service with test secret
  jwtService = new JwtService({
    secret: process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only-not-for-production',
    signOptions: {
      expiresIn: '7d',
    },
  });
}

/**
 * Login user and return JWT token
 */
export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: any }> {
  const user = await userRepository.findOne({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  const tenant = await tenantRepository.findOne({
    where: { tenantId: user.tenantId },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Check if user/tenant is active
  if (!user.isActive || tenant.status === 'suspended') {
    throw new Error('Account is not active');
  }

  // Generate JWT with tenantId
  const token = jwtService.sign({
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      companyName: tenant.companyName,
    },
  };
}

/**
 * Decode JWT token without verification (for testing)
 */
export function decodeToken(token: string): any {
  return jwtService.decode(token);
}

/**
 * Verify JWT token and return payload
 */
export async function verifyToken(token: string): Promise<any> {
  try {
    return jwtService.verify(token);
  } catch (error) {
    throw new Error('Invalid token');
  }
}
