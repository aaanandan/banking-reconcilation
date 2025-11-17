// test/tenant-isolation.test.ts
import { config } from 'dotenv';
import {
  initializeDatabase,
  closeDatabase,
  createReconciliation,
  createReconciliations,
  getReconciliation,
  getReconciliations,
  cleanupReconciliations,
} from './helpers/reconciliation.helpers';

// Load test environment variables
config({ path: '.env.test' });

describe('Tenant Isolation', () => {
  const tenant1Id = 'tenant_test_1';
  const tenant2Id = 'tenant_test_2';

  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up reconciliations before each test
    await cleanupReconciliations();
  });

  describe('Cross-tenant data access', () => {
    it('should not allow cross-tenant data access', async () => {
      // Create reconciliation for tenant1
      const recon1 = await createReconciliation(tenant1Id);

      // Try to access from tenant2 (should fail)
      await expect(
        getReconciliation(recon1.id, tenant2Id),
      ).rejects.toThrow('Not Found');
    });

    it('should allow access within same tenant', async () => {
      // Create reconciliation for tenant1
      const recon1 = await createReconciliation(tenant1Id);

      // Access from same tenant (should succeed)
      const result = await getReconciliation(recon1.id, tenant1Id);

      expect(result).toBeDefined();
      expect(result.id).toBe(recon1.id);
      expect(result.tenantId).toBe(tenant1Id);
    });
  });

  describe('Query filtering by tenantId', () => {
    it('should filter queries by tenantId', async () => {
      // Create data for both tenants
      await createReconciliations(tenant1Id, 5);
      await createReconciliations(tenant2Id, 3);

      // Query for tenant1
      const results1 = await getReconciliations(tenant1Id);
      expect(results1.length).toBe(5);
      expect(results1.every((r) => r.tenantId === tenant1Id)).toBe(true);

      // Query for tenant2
      const results2 = await getReconciliations(tenant2Id);
      expect(results2.length).toBe(3);
      expect(results2.every((r) => r.tenantId === tenant2Id)).toBe(true);
    });

    it('should return empty array when tenant has no data', async () => {
      // Create data for tenant1 only
      await createReconciliations(tenant1Id, 3);

      // Query for tenant2 (no data)
      const results = await getReconciliations(tenant2Id);
      expect(results.length).toBe(0);
    });

    it('should maintain isolation with large datasets', async () => {
      // Create larger datasets for both tenants
      const tenant1Recons = await createReconciliations(tenant1Id, 50);
      const tenant2Recons = await createReconciliations(tenant2Id, 30);

      // Verify tenant1 data
      const results1 = await getReconciliations(tenant1Id);
      expect(results1.length).toBe(50);
      expect(results1.every((r) => r.tenantId === tenant1Id)).toBe(true);

      // Verify tenant2 data
      const results2 = await getReconciliations(tenant2Id);
      expect(results2.length).toBe(30);
      expect(results2.every((r) => r.tenantId === tenant2Id)).toBe(true);

      // Verify no overlap
      const tenant1Ids = new Set(tenant1Recons.map((r) => r.id));
      const tenant2Ids = new Set(tenant2Recons.map((r) => r.id));

      results1.forEach((r) => {
        expect(tenant1Ids.has(r.id)).toBe(true);
        expect(tenant2Ids.has(r.id)).toBe(false);
      });

      results2.forEach((r) => {
        expect(tenant2Ids.has(r.id)).toBe(true);
        expect(tenant1Ids.has(r.id)).toBe(false);
      });
    });
  });

  describe('Tenant data integrity', () => {
    it('should preserve tenantId through updates', async () => {
      // Create reconciliation for tenant1
      const recon = await createReconciliation(tenant1Id);

      // Attempt to access from tenant2
      await expect(getReconciliation(recon.id, tenant2Id)).rejects.toThrow(
        'Not Found',
      );

      // Verify tenant1 can still access
      const result = await getReconciliation(recon.id, tenant1Id);
      expect(result.tenantId).toBe(tenant1Id);
    });

    it('should enforce tenantId in all queries', async () => {
      // Create mixed data
      const tenant1Recons = await createReconciliations(tenant1Id, 10);
      const tenant2Recons = await createReconciliations(tenant2Id, 10);

      // Each tenant should only see their own data
      const results1 = await getReconciliations(tenant1Id);
      const results2 = await getReconciliations(tenant2Id);

      expect(results1.length).toBe(10);
      expect(results2.length).toBe(10);

      // Verify complete isolation
      const allTenant1Ids = tenant1Recons.map((r) => r.id);
      const allTenant2Ids = tenant2Recons.map((r) => r.id);

      results1.forEach((r) => {
        expect(allTenant1Ids).toContain(r.id);
        expect(allTenant2Ids).not.toContain(r.id);
      });

      results2.forEach((r) => {
        expect(allTenant2Ids).toContain(r.id);
        expect(allTenant1Ids).not.toContain(r.id);
      });
    });
  });
});
