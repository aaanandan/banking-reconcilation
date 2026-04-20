// test/jwt-authentication.test.ts
import { config } from 'dotenv';
import {
  initializeDatabase,
  closeDatabase,
} from './helpers/reconciliation.helpers';
import {
  initializeAuthService,
  login,
  decodeToken,
  verifyToken,
} from './helpers/auth.helpers';

// Load test environment variables
config({ path: '.env.test' });

describe('JWT Authentication', () => {
  beforeAll(async () => {
    await initializeDatabase();
    await initializeAuthService();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Token generation and structure', () => {
    it('should include tenantId in JWT for Company A user', async () => {
      const { token } = await login('user@companya.com', 'password123');
      const decoded = decodeToken(token);

      expect(decoded.tenantId).toBe('tenant_test_1');
      expect(decoded.userId).toBeDefined();
      expect(decoded.email).toBe('user@companya.com');
      expect(decoded.role).toBe('admin');
    });

    it('should include tenantId in JWT for Company B user', async () => {
      const { token } = await login('user@companyb.com', 'password123');
      const decoded = decodeToken(token);

      expect(decoded.tenantId).toBe('tenant_test_2');
      expect(decoded.userId).toBeDefined();
      expect(decoded.email).toBe('user@companyb.com');
      expect(decoded.role).toBe('user');
    });

    it('should generate valid JWT that can be verified', async () => {
      const { token } = await login('user@companya.com', 'password123');
      const verified = await verifyToken(token);

      expect(verified).toBeDefined();
      expect(verified.tenantId).toBe('tenant_test_1');
      expect(verified.userId).toBeDefined();
    });
  });

  describe('Tenant isolation via JWT', () => {
    it('should have different tenantIds for different companies', async () => {
      const { token: token1 } = await login('user@companya.com', 'password123');
      const { token: token2 } = await login('user@companyb.com', 'password123');

      const decoded1 = decodeToken(token1);
      const decoded2 = decodeToken(token2);

      expect(decoded1.tenantId).toBe('tenant_test_1');
      expect(decoded2.tenantId).toBe('tenant_test_2');
      expect(decoded1.tenantId).not.toBe(decoded2.tenantId);
    });

    it('should include userId that differs between users', async () => {
      const { token: token1 } = await login('user@companya.com', 'password123');
      const { token: token2 } = await login('user@companyb.com', 'password123');

      const decoded1 = decodeToken(token1);
      const decoded2 = decodeToken(token2);

      expect(decoded1.userId).toBeDefined();
      expect(decoded2.userId).toBeDefined();
      expect(decoded1.userId).not.toBe(decoded2.userId);
    });

    it('should include expiration time', async () => {
      const { token } = await login('user@companya.com', 'password123');
      const decoded = decodeToken(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('Authentication errors', () => {
    it('should reject login with wrong password', async () => {
      await expect(
        login('user@companya.com', 'wrongpassword'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      await expect(
        login('nonexistent@example.com', 'password123'),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Token payload completeness', () => {
    it('should include all required fields in token', async () => {
      const { token, user } = await login('user@companya.com', 'password123');
      const decoded = decodeToken(token);

      // Required JWT fields
      expect(decoded.userId).toBeDefined();
      expect(decoded.tenantId).toBe('tenant_test_1');
      expect(decoded.email).toBe('user@companya.com');
      expect(decoded.role).toBe('admin');

      // User object should match
      expect(user.tenantId).toBe('tenant_test_1');
      expect(user.email).toBe('user@companya.com');
      expect(user.companyName).toBe('Company A');
    });

    it('should return correct user details', async () => {
      const { user } = await login('user@companyb.com', 'password123');

      expect(user.email).toBe('user@companyb.com');
      expect(user.firstName).toBe('Jane');
      expect(user.lastName).toBe('Smith');
      expect(user.role).toBe('user');
      expect(user.tenantId).toBe('tenant_test_2');
      expect(user.companyName).toBe('Company B');
    });
  });

  describe('Multi-tenant JWT scenarios', () => {
    it('should maintain tenant context across multiple logins', async () => {
      // Login user 1
      const { token: token1a } = await login('user@companya.com', 'password123');
      const decoded1a = decodeToken(token1a);

      // Login user 2
      const { token: token2 } = await login('user@companyb.com', 'password123');
      const decoded2 = decodeToken(token2);

      // Login user 1 again
      const { token: token1b } = await login('user@companya.com', 'password123');
      const decoded1b = decodeToken(token1b);

      // Verify tenant IDs remain consistent
      expect(decoded1a.tenantId).toBe('tenant_test_1');
      expect(decoded2.tenantId).toBe('tenant_test_2');
      expect(decoded1b.tenantId).toBe('tenant_test_1');

      // Verify all tokens for same user have same tenantId
      expect(decoded1a.tenantId).toBe(decoded1b.tenantId);
    });
  });
});
