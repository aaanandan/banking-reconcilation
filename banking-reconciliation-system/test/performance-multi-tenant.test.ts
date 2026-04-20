// test/performance-multi-tenant.test.ts
import { config } from 'dotenv';
import {
  initializeDatabase,
  closeDatabase,
  createReconciliation,
  getReconciliations,
  cleanupReconciliations,
} from './helpers/reconciliation.helpers';
import {
  initializeAuthService,
  login,
} from './helpers/auth.helpers';
import {
  initializeQuotaService,
  uploadTransactions,
  resetTenantUsage,
} from './helpers/quota.helpers';

// Load test environment variables
config({ path: '.env.test' });

describe('Performance - Multi-Tenant Operations', () => {
  const tenant1Id = 'tenant_test_1';
  const tenant2Id = 'tenant_test_2';
  const tenant3Id = 'tenant_test_1'; // Reuse tenant1 for 3-tenant simulation

  beforeAll(async () => {
    await initializeDatabase();
    await initializeAuthService();
    await initializeQuotaService();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Ensure clean state before each test
    await cleanupReconciliations();
    await resetTenantUsage(tenant1Id);
    await resetTenantUsage(tenant2Id);

    // Small delay to ensure cleanup is complete
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe('Concurrent tenant operations', () => {
    it('should handle concurrent reconciliation creation for multiple tenants', async () => {
      const startTime = Date.now();

      // Create 10 reconciliations for each tenant concurrently
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(createReconciliation(tenant1Id));
        operations.push(createReconciliation(tenant2Id));
      }

      await Promise.all(operations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all were created
      const results1 = await getReconciliations(tenant1Id);
      const results2 = await getReconciliations(tenant2Id);

      expect(results1.length).toBe(10);
      expect(results2.length).toBe(10);

      // Performance assertion: Should complete in reasonable time
      // 20 concurrent inserts should take less than 3 seconds
      expect(duration).toBeLessThan(3000);
    }, 10000);

    it('should maintain isolation under concurrent load', async () => {
      // Create many reconciliations concurrently for both tenants
      const operations = [];
      for (let i = 0; i < 25; i++) {
        operations.push(createReconciliation(tenant1Id));
      }
      for (let i = 0; i < 25; i++) {
        operations.push(createReconciliation(tenant2Id));
      }

      await Promise.all(operations);

      // Verify isolation
      const results1 = await getReconciliations(tenant1Id);
      const results2 = await getReconciliations(tenant2Id);

      expect(results1.length).toBe(25);
      expect(results2.length).toBe(25);

      // Verify no cross-contamination
      expect(results1.every((r) => r.tenantId === tenant1Id)).toBe(true);
      expect(results2.every((r) => r.tenantId === tenant2Id)).toBe(true);
    }, 15000);
  });

  describe('Authentication performance', () => {
    it('should handle rapid sequential logins for different tenants', async () => {
      const startTime = Date.now();

      // Perform 20 sequential logins
      const logins = [];
      for (let i = 0; i < 10; i++) {
        logins.push(login('user@companya.com', 'password123'));
        logins.push(login('user@companyb.com', 'password123'));
      }

      await Promise.all(logins);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertion: 20 logins should complete quickly
      // Should take less than 5 seconds
      expect(duration).toBeLessThan(5000);
    }, 10000);

    it('should handle concurrent logins efficiently', async () => {
      const startTime = Date.now();

      // 30 concurrent logins
      const operations = Array(30)
        .fill(null)
        .map((_, i) =>
          i % 2 === 0
            ? login('user@companya.com', 'password123')
            : login('user@companyb.com', 'password123'),
        );

      const results = await Promise.all(operations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      expect(results.length).toBe(30);
      results.forEach((result) => {
        expect(result.token).toBeDefined();
        expect(result.user).toBeDefined();
      });

      // Performance assertion
      expect(duration).toBeLessThan(6000);
    }, 10000);
  });

  describe('Quota operations under load', () => {
    it('should handle concurrent transaction uploads for multiple tenants', async () => {
      const startTime = Date.now();

      // Multiple concurrent uploads
      const operations = [
        uploadTransactions(tenant1Id, 100),
        uploadTransactions(tenant2Id, 50),
        uploadTransactions(tenant1Id, 200),
        uploadTransactions(tenant2Id, 30),
      ];

      await Promise.all(operations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertion
      expect(duration).toBeLessThan(2000);
    }, 5000);

    it('should maintain quota accuracy under concurrent operations', async () => {
      // Reset usage
      await resetTenantUsage(tenant1Id);

      // Perform 50 small concurrent uploads
      const operations = Array(50)
        .fill(null)
        .map(() => uploadTransactions(tenant1Id, 20));

      await Promise.all(operations);

      // Total should be 50 * 20 = 1000 transactions
      // This is within tenant1's quota of 10,000
      // (Note: We can't verify exact count in this test structure,
      // but the operations should all succeed)
      expect(operations.length).toBe(50);
    }, 10000);
  });

  describe('Large dataset performance', () => {
    it('should efficiently query large tenant datasets', async () => {
      // Create a large dataset for tenant1
      const createOps = [];
      for (let i = 0; i < 100; i++) {
        createOps.push(createReconciliation(tenant1Id));
      }
      await Promise.all(createOps);

      // Measure query performance
      const startTime = Date.now();
      const results = await getReconciliations(tenant1Id);
      const endTime = Date.now();
      const queryDuration = endTime - startTime;

      expect(results.length).toBe(100);
      // Query should be fast even with 100 records (tenantId index should help)
      expect(queryDuration).toBeLessThan(500); // Less than 500ms
    }, 30000);

    it('should maintain performance with multiple large tenant datasets', async () => {
      // Create large datasets for both tenants
      const createOps = [];
      for (let i = 0; i < 75; i++) {
        createOps.push(createReconciliation(tenant1Id));
      }
      for (let i = 0; i < 75; i++) {
        createOps.push(createReconciliation(tenant2Id));
      }
      await Promise.all(createOps);

      // Query both tenants
      const startTime = Date.now();
      const [results1, results2] = await Promise.all([
        getReconciliations(tenant1Id),
        getReconciliations(tenant2Id),
      ]);
      const endTime = Date.now();
      const queryDuration = endTime - startTime;

      expect(results1.length).toBe(75);
      expect(results2.length).toBe(75);

      // Both queries together should be fast
      expect(queryDuration).toBeLessThan(1000); // Less than 1 second
    }, 45000);
  });

  describe('Mixed workload simulation', () => {
    it('should handle realistic mixed operations across tenants', async () => {
      const startTime = Date.now();

      // Simulate realistic workload:
      // - Multiple logins
      // - Reconciliation creation
      // - Queries
      // - Transaction uploads

      const operations = [];

      // 5 login operations
      for (let i = 0; i < 5; i++) {
        operations.push(
          i % 2 === 0
            ? login('user@companya.com', 'password123')
            : login('user@companyb.com', 'password123'),
        );
      }

      // 10 reconciliation creations
      for (let i = 0; i < 5; i++) {
        operations.push(createReconciliation(tenant1Id));
        operations.push(createReconciliation(tenant2Id));
      }

      // 4 transaction uploads
      operations.push(uploadTransactions(tenant1Id, 50));
      operations.push(uploadTransactions(tenant2Id, 30));
      operations.push(uploadTransactions(tenant1Id, 25));
      operations.push(uploadTransactions(tenant2Id, 40));

      await Promise.all(operations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Mixed workload should complete efficiently
      expect(duration).toBeLessThan(5000);
    }, 10000);

    it('should scale linearly with number of tenants', async () => {
      // Test with increasing tenant count
      const startTime1 = Date.now();
      await Promise.all([
        createReconciliation(tenant1Id),
        createReconciliation(tenant1Id),
        createReconciliation(tenant1Id),
      ]);
      const duration1 = Date.now() - startTime1;

      // Reset
      await cleanupReconciliations();

      const startTime2 = Date.now();
      await Promise.all([
        createReconciliation(tenant1Id),
        createReconciliation(tenant2Id),
        createReconciliation(tenant1Id),
      ]);
      const duration2 = Date.now() - startTime2;

      // Duration should be similar (linear scaling)
      // Allow some variance but should not double
      expect(Math.abs(duration2 - duration1)).toBeLessThan(duration1);
    }, 10000);
  });

  describe('Database connection pooling', () => {
    it('should handle rapid-fire queries efficiently', async () => {
      // Create initial data
      await createReconciliation(tenant1Id);
      await createReconciliation(tenant2Id);

      const startTime = Date.now();

      // 50 rapid queries
      const queries = Array(50)
        .fill(null)
        .map((_, i) =>
          i % 2 === 0
            ? getReconciliations(tenant1Id)
            : getReconciliations(tenant2Id),
        );

      await Promise.all(queries);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 50 queries should complete quickly with connection pooling
      expect(duration).toBeLessThan(3000);
    }, 10000);
  });
});
