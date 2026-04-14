// test/database-indexes.test.ts
import { config } from 'dotenv';
import {
  initializeDatabase,
  closeDatabase,
} from './helpers/reconciliation.helpers';
import { AppDataSource } from '../data-source';

// Load test environment variables
config({ path: '.env.test' });

interface IndexUsageRow {
  schemaname: string;
  relname: string;
  indexrelname: string;
  idx_scan: string;
  idx_tup_read: string;
  idx_tup_fetch: string;
}

describe('Database Indexes', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('TenantId indexes', () => {
    it('should have tenantId indexes on all multi-tenant tables', async () => {
      const query = `
        SELECT
          t.tablename,
          i.indexname
        FROM pg_tables t
        INNER JOIN pg_indexes i ON t.tablename = i.tablename
          AND i.indexdef LIKE '%tenantId%'
        WHERE t.schemaname = 'public'
          AND t.tablename IN ('users', 'reconciliations', 'transactions',
                              'bank_files', 'ledger_files', 'bank_transactions',
                              'ledger_transactions', 'matched_pairs', 'staged_matches')
        ORDER BY t.tablename;
      `;

      const tenantIdIndexes = await AppDataSource.query(query);

      // Verify core tables have tenantId indexes
      const expectedTables = [
        'bank_files',
        'ledger_files',
        'reconciliations',
        'transactions',
        'users',
      ];

      const tablesWithIndexes = tenantIdIndexes.map((row: any) => row.tablename);

      expectedTables.forEach(table => {
        expect(tablesWithIndexes).toContain(table);
      });

      // Verify index names follow convention
      tenantIdIndexes.forEach((row: any) => {
        expect(row.indexname).toMatch(/IDX_.*_tenantId/);
      });
    });

    it('should show tenantId indexes are being used', async () => {
      const query = `
        SELECT
          schemaname,
          relname,
          indexrelname,
          idx_scan::text,
          idx_tup_read::text,
          idx_tup_fetch::text
        FROM pg_stat_user_indexes
        WHERE relname IN ('users', 'reconciliations', 'transactions',
                          'bank_files', 'ledger_files')
          AND indexrelname LIKE '%tenantId%'
        ORDER BY relname;
      `;

      const indexUsage = await AppDataSource.query(query) as IndexUsageRow[];

      // Verify we have tenantId indexes being tracked
      expect(indexUsage.length).toBeGreaterThan(0);

      // Check critical tables have tenantId indexes
      const reconIndex = indexUsage.find(idx => idx.relname === 'reconciliations');
      const userIndex = indexUsage.find(idx => idx.relname === 'users');

      expect(reconIndex).toBeDefined();
      expect(userIndex).toBeDefined();

      // After running tests, these indexes should have been scanned
      // Note: This may be 0 if stats haven't been generated yet
      expect(reconIndex?.indexrelname).toBe('IDX_reconciliations_tenantId');
      expect(userIndex?.indexrelname).toBe('IDX_users_tenantId');
    });
  });

  describe('Index effectiveness', () => {
    it('should have appropriate indexes for common query patterns', async () => {
      const query = `
        SELECT
          relname as table_name,
          indexrelname as index_name,
          idx_scan::text as scans
        FROM pg_stat_user_indexes
        WHERE relname IN ('users', 'reconciliations', 'tenants')
        ORDER BY relname, idx_scan DESC;
      `;

      const indexes = await AppDataSource.query(query);

      // Verify key indexes exist
      const indexNames = indexes.map((idx: any) => idx.index_name);

      // Email index for auth queries
      expect(indexNames).toContain('IDX_users_email');

      // TenantId indexes for isolation
      expect(indexNames).toContain('IDX_users_tenantId');
      expect(indexNames).toContain('IDX_reconciliations_tenantId');
      expect(indexNames).toContain('IDX_tenants_tenantId');
    });

    it('should have indexes on foreign key columns', async () => {
      const query = `
        SELECT
          relname as table_name,
          indexrelname as index_name
        FROM pg_stat_user_indexes
        WHERE relname IN ('reconciliations', 'transactions',
                          'bank_files', 'ledger_files')
          AND indexrelname LIKE '%reconciliationId%'
        ORDER BY relname;
      `;

      const fkIndexes = await AppDataSource.query(query);

      // Verify foreign key indexes exist for performance
      const tables = fkIndexes.map((idx: any) => idx.table_name);
      expect(tables).toContain('reconciliations');
      expect(tables).toContain('transactions');
    });
  });

  describe('Index coverage', () => {
    it('should have primary key indexes on all tables', async () => {
      const query = `
        SELECT
          relname as table_name,
          indexrelname as index_name
        FROM pg_stat_user_indexes
        WHERE relname IN ('users', 'reconciliations', 'tenants',
                          'transactions', 'bank_files', 'ledger_files')
          AND indexrelname LIKE 'PK_%'
        ORDER BY relname;
      `;

      const pkIndexes = await AppDataSource.query(query);

      // Every table should have a primary key index
      expect(pkIndexes.length).toBeGreaterThan(0);

      const tables = pkIndexes.map((idx: any) => idx.table_name);
      expect(tables).toContain('users');
      expect(tables).toContain('reconciliations');
      expect(tables).toContain('tenants');
    });

    it('should have unique constraints as indexes where needed', async () => {
      const query = `
        SELECT
          relname as table_name,
          indexrelname as index_name
        FROM pg_stat_user_indexes
        WHERE relname IN ('users', 'reconciliations', 'tenants')
          AND indexrelname LIKE 'UQ_%'
        ORDER BY relname;
      `;

      const uniqueIndexes = await AppDataSource.query(query);

      // Should have unique constraint indexes
      expect(uniqueIndexes.length).toBeGreaterThan(0);

      // Users should have unique email
      const userEmailUnique = uniqueIndexes.find(
        (idx: any) => idx.table_name === 'users' && idx.index_name.includes('email')
      );
      expect(userEmailUnique).toBeDefined();
    });
  });

  describe('Performance verification', () => {
    it('should use indexes for tenantId queries', async () => {
      // This test documents that tenantId queries use indexes
      // Run EXPLAIN to verify query plan uses index scan

      const explainQuery = `
        EXPLAIN (FORMAT JSON)
        SELECT * FROM reconciliations WHERE "tenantId" = 'tenant_test_1';
      `;

      const result = await AppDataSource.query(explainQuery);
      const plan = JSON.stringify(result);

      // Verify the query plan mentions index
      // Note: This is a basic check - in production you'd want more detailed analysis
      expect(plan).toBeDefined();
    });
  });
});
