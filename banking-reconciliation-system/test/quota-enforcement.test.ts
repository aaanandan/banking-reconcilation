// test/quota-enforcement.test.ts
import { config } from 'dotenv';
import {
  initializeDatabase,
  closeDatabase,
} from './helpers/reconciliation.helpers';
import {
  initializeQuotaService,
  updateTenantQuota,
  updateTenantUsage,
  getTenantQuotaInfo,
  checkQuotaExceeded,
  uploadTransactions,
  addBankAccount,
  addStorage,
  addUser,
  resetTenantUsage,
} from './helpers/quota.helpers';

// Load test environment variables
config({ path: '.env.test' });

describe('Quota Enforcement', () => {
  const tenant1Id = 'tenant_test_1';
  const tenant2Id = 'tenant_test_2';

  beforeAll(async () => {
    await initializeDatabase();
    await initializeQuotaService();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Reset usage before each test
    await resetTenantUsage(tenant1Id);
    await resetTenantUsage(tenant2Id);
  });

  describe('Transaction quota enforcement', () => {
    it('should block uploads when transaction quota exceeded', async () => {
      // Set tenant quota to 100 transactions
      await updateTenantQuota(tenant1Id, { maxTransactionsPerMonth: 100 });

      // Try to upload 101 transactions (should fail)
      await expect(
        uploadTransactions(tenant1Id, 101),
      ).rejects.toThrow('Quota exceeded');
    });

    it('should allow uploads within quota limit', async () => {
      // Set tenant quota to 100 transactions
      await updateTenantQuota(tenant1Id, { maxTransactionsPerMonth: 100 });

      // Upload 50 transactions (should succeed)
      await uploadTransactions(tenant1Id, 50);

      const info = await getTenantQuotaInfo(tenant1Id);
      expect(info.currentUsage.transactionsThisMonth).toBe(50);
    });

    it('should block uploads when cumulative count exceeds quota', async () => {
      // Set tenant quota to 100 transactions
      await updateTenantQuota(tenant1Id, { maxTransactionsPerMonth: 100 });

      // Upload 60 transactions
      await uploadTransactions(tenant1Id, 60);

      // Try to upload 50 more (total would be 110, exceeds quota)
      await expect(
        uploadTransactions(tenant1Id, 50),
      ).rejects.toThrow('Quota exceeded');
    });

    it('should allow exact quota limit', async () => {
      // Set tenant quota to 100 transactions
      await updateTenantQuota(tenant1Id, { maxTransactionsPerMonth: 100 });

      // Upload exactly 100 transactions (should succeed)
      await uploadTransactions(tenant1Id, 100);

      const info = await getTenantQuotaInfo(tenant1Id);
      expect(info.currentUsage.transactionsThisMonth).toBe(100);
    });
  });

  describe('Bank account quota enforcement', () => {
    it('should block adding bank account when quota exceeded', async () => {
      // Set tenant quota to 3 bank accounts
      await updateTenantQuota(tenant2Id, { maxBankAccounts: 3 });

      // Add 3 accounts (should succeed)
      await addBankAccount(tenant2Id);
      await addBankAccount(tenant2Id);
      await addBankAccount(tenant2Id);

      // Try to add 4th account (should fail)
      await expect(addBankAccount(tenant2Id)).rejects.toThrow('Quota exceeded');
    });

    it('should allow adding bank accounts within quota', async () => {
      // Set tenant quota to 10 bank accounts
      await updateTenantQuota(tenant1Id, { maxBankAccounts: 10 });

      // Add 5 accounts (should succeed)
      await addBankAccount(tenant1Id);
      await addBankAccount(tenant1Id);
      await addBankAccount(tenant1Id);
      await addBankAccount(tenant1Id);
      await addBankAccount(tenant1Id);

      const info = await getTenantQuotaInfo(tenant1Id);
      expect(info.currentUsage.bankAccounts).toBe(5);
    });
  });

  describe('Storage quota enforcement', () => {
    it('should block storage upload when quota exceeded', async () => {
      // Set tenant quota to 100 MB
      await updateTenantQuota(tenant2Id, { maxStorageMB: 100 });

      // Try to upload 150 MB (should fail)
      await expect(addStorage(tenant2Id, 150)).rejects.toThrow('Quota exceeded');
    });

    it('should allow storage within quota limit', async () => {
      // Set tenant quota to 500 MB
      await updateTenantQuota(tenant1Id, { maxStorageMB: 500 });

      // Upload 250 MB (should succeed)
      await addStorage(tenant1Id, 250);

      const info = await getTenantQuotaInfo(tenant1Id);
      expect(info.currentUsage.storageMB).toBe(250);
    });

    it('should block storage when cumulative size exceeds quota', async () => {
      // Set tenant quota to 100 MB
      await updateTenantQuota(tenant2Id, { maxStorageMB: 100 });

      // Upload 70 MB
      await addStorage(tenant2Id, 70);

      // Try to upload 40 more MB (total 110, exceeds quota)
      await expect(addStorage(tenant2Id, 40)).rejects.toThrow('Quota exceeded');
    });
  });

  describe('User quota enforcement', () => {
    it('should block adding users when quota exceeded', async () => {
      // Set tenant quota to 5 users
      await updateTenantQuota(tenant2Id, { maxUsers: 5 });

      // Add 5 users
      await addUser(tenant2Id);
      await addUser(tenant2Id);
      await addUser(tenant2Id);
      await addUser(tenant2Id);
      await addUser(tenant2Id);

      // Try to add 6th user (should fail)
      await expect(addUser(tenant2Id)).rejects.toThrow('Quota exceeded');
    });

    it('should allow adding users within quota', async () => {
      // Set tenant quota to 10 users
      await updateTenantQuota(tenant1Id, { maxUsers: 10 });

      // Add 3 users (should succeed)
      await addUser(tenant1Id);
      await addUser(tenant1Id);
      await addUser(tenant1Id);

      const info = await getTenantQuotaInfo(tenant1Id);
      expect(info.currentUsage.users).toBe(3);
    });
  });

  describe('Multi-tenant quota isolation', () => {
    it('should enforce quotas independently per tenant', async () => {
      // Set different quotas for each tenant
      await updateTenantQuota(tenant1Id, { maxTransactionsPerMonth: 1000 });
      await updateTenantQuota(tenant2Id, { maxTransactionsPerMonth: 100 });

      // Tenant 1 can upload 500 (within 1000 limit)
      await uploadTransactions(tenant1Id, 500);
      const info1 = await getTenantQuotaInfo(tenant1Id);
      expect(info1.currentUsage.transactionsThisMonth).toBe(500);

      // Tenant 2 cannot upload 500 (exceeds 100 limit)
      await expect(
        uploadTransactions(tenant2Id, 500),
      ).rejects.toThrow('Quota exceeded');

      // Tenant 2 can upload 50 (within 100 limit)
      await uploadTransactions(tenant2Id, 50);
      const info2 = await getTenantQuotaInfo(tenant2Id);
      expect(info2.currentUsage.transactionsThisMonth).toBe(50);
    });

    it('should not affect other tenants when one exceeds quota', async () => {
      // Set same quota for both tenants
      await updateTenantQuota(tenant1Id, { maxBankAccounts: 3 });
      await updateTenantQuota(tenant2Id, { maxBankAccounts: 3 });

      // Tenant 1 reaches quota
      await addBankAccount(tenant1Id);
      await addBankAccount(tenant1Id);
      await addBankAccount(tenant1Id);

      // Tenant 1 exceeds quota
      await expect(addBankAccount(tenant1Id)).rejects.toThrow('Quota exceeded');

      // Tenant 2 can still add accounts (independent quota)
      await addBankAccount(tenant2Id);
      await addBankAccount(tenant2Id);

      const info2 = await getTenantQuotaInfo(tenant2Id);
      expect(info2.currentUsage.bankAccounts).toBe(2);
    });
  });

  describe('Quota check helper', () => {
    it('should correctly identify when quota is exceeded', async () => {
      // Set quota and usage
      await updateTenantQuota(tenant1Id, { maxTransactionsPerMonth: 100 });
      await updateTenantUsage(tenant1Id, { transactionsThisMonth: 100 });

      const exceeded = await checkQuotaExceeded(
        tenant1Id,
        'maxTransactionsPerMonth',
      );
      expect(exceeded).toBe(true);
    });

    it('should correctly identify when quota is not exceeded', async () => {
      // Set quota and usage
      await updateTenantQuota(tenant1Id, { maxTransactionsPerMonth: 100 });
      await updateTenantUsage(tenant1Id, { transactionsThisMonth: 50 });

      const exceeded = await checkQuotaExceeded(
        tenant1Id,
        'maxTransactionsPerMonth',
      );
      expect(exceeded).toBe(false);
    });
  });

  describe('Different plan quotas', () => {
    it('should respect different quota limits for different plans', async () => {
      // Professional plan (tenant1) - high quotas
      await updateTenantQuota(tenant1Id, {
        maxBankAccounts: 10,
        maxTransactionsPerMonth: 10000,
        maxStorageMB: 500,
        maxUsers: 10,
      });

      // Starter plan (tenant2) - low quotas
      await updateTenantQuota(tenant2Id, {
        maxBankAccounts: 3,
        maxTransactionsPerMonth: 1000,
        maxStorageMB: 100,
        maxUsers: 5,
      });

      // Professional tenant can do more
      await uploadTransactions(tenant1Id, 5000);
      await addBankAccount(tenant1Id);
      await addBankAccount(tenant1Id);
      await addBankAccount(tenant1Id);
      await addBankAccount(tenant1Id);

      const info1 = await getTenantQuotaInfo(tenant1Id);
      expect(info1.currentUsage.transactionsThisMonth).toBe(5000);
      expect(info1.currentUsage.bankAccounts).toBe(4);

      // Starter tenant has lower limits
      await uploadTransactions(tenant2Id, 500);
      await addBankAccount(tenant2Id);
      await addBankAccount(tenant2Id);

      const info2 = await getTenantQuotaInfo(tenant2Id);
      expect(info2.currentUsage.transactionsThisMonth).toBe(500);
      expect(info2.currentUsage.bankAccounts).toBe(2);

      // Starter tenant cannot exceed limits
      await expect(
        uploadTransactions(tenant2Id, 600),
      ).rejects.toThrow('Quota exceeded');
    });
  });
});
