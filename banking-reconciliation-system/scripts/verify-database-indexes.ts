// scripts/verify-database-indexes.ts
import { config } from 'dotenv';
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

interface TableSizeRow {
  tablename: string;
  size_pretty: string;
  row_estimate: string;
}

async function verifyDatabaseIndexes() {
  console.log('='.repeat(80));
  console.log('DATABASE INDEX VERIFICATION');
  console.log('='.repeat(80));
  console.log();

  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('✓ Database connection established');
    console.log();

    // Check index usage statistics
    console.log('INDEX USAGE STATISTICS:');
    console.log('-'.repeat(80));

    const indexUsageQuery = `
      SELECT
        schemaname,
        relname,
        indexrelname,
        idx_scan::text,
        idx_tup_read::text,
        idx_tup_fetch::text
      FROM pg_stat_user_indexes
      WHERE relname IN ('users', 'reconciliations', 'transactions', 'tenants',
                        'bank_files', 'ledger_files', 'bank_transactions',
                        'ledger_transactions', 'matched_pairs', 'staged_matches')
      ORDER BY relname, idx_scan DESC;
    `;

    const indexUsage = await AppDataSource.query(indexUsageQuery) as IndexUsageRow[];

    if (indexUsage.length === 0) {
      console.log('⚠️  No index usage statistics found. Run some queries first.');
    } else {
      console.log(`Found ${indexUsage.length} indexes:\n`);

      const groupedByTable: Record<string, IndexUsageRow[]> = {};
      indexUsage.forEach(row => {
        if (!groupedByTable[row.relname]) {
          groupedByTable[row.relname] = [];
        }
        groupedByTable[row.relname].push(row);
      });

      for (const [tablename, indexes] of Object.entries(groupedByTable)) {
        console.log(`\n📊 Table: ${tablename}`);
        indexes.forEach(idx => {
          const scanCount = parseInt(idx.idx_scan) || 0;
          const icon = scanCount > 0 ? '✓' : '⚠️';
          console.log(`  ${icon} ${idx.indexrelname}`);
          console.log(`     Scans: ${idx.idx_scan}, Tuples read: ${idx.idx_tup_read}, Tuples fetched: ${idx.idx_tup_fetch}`);
        });
      }
    }

    console.log();
    console.log('-'.repeat(80));
    console.log();

    // Check for missing indexes on tenantId
    console.log('TENANT ID INDEX VERIFICATION:');
    console.log('-'.repeat(80));

    const tenantIdIndexQuery = `
      SELECT
        t.tablename,
        i.indexname
      FROM pg_tables t
      LEFT JOIN pg_indexes i ON t.tablename = i.tablename
        AND i.indexdef LIKE '%tenantId%'
      WHERE t.schemaname = 'public'
        AND t.tablename IN ('users', 'reconciliations', 'transactions', 'bank_files',
                            'ledger_files', 'bank_transactions', 'ledger_transactions',
                            'matched_pairs', 'staged_matches')
      ORDER BY t.tablename;
    `;

    const tenantIdIndexes = await AppDataSource.query(tenantIdIndexQuery);

    const tablesWithTenantId = [...new Set(tenantIdIndexes.map((r: any) => r.tablename))];
    const tablesWithIndex = tenantIdIndexes.filter((r: any) => r.indexname).map((r: any) => r.tablename);
    const tablesWithoutIndex = tablesWithTenantId.filter(t => !tablesWithIndex.includes(t));

    console.log(`\nTables with tenantId indexes: ${tablesWithIndex.length}`);
    tablesWithIndex.forEach(table => {
      const indexName = tenantIdIndexes.find((r: any) => r.tablename === table && r.indexname)?.indexname;
      console.log(`  ✓ ${table} - ${indexName}`);
    });

    if (tablesWithoutIndex.length > 0) {
      console.log(`\n⚠️  Tables WITHOUT tenantId indexes: ${tablesWithoutIndex.length}`);
      tablesWithoutIndex.forEach(table => {
        console.log(`  ⚠️  ${table}`);
      });
    } else {
      console.log(`\n✓ All multi-tenant tables have tenantId indexes`);
    }

    console.log();
    console.log('-'.repeat(80));
    console.log();

    // Check table sizes
    console.log('TABLE SIZE INFORMATION:');
    console.log('-'.repeat(80));

    const tableSizeQuery = `
      SELECT
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size_pretty,
        pg_total_relation_size(schemaname||'.'||tablename)::text as size_bytes,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = t.tablename)::text as row_estimate
      FROM pg_tables t
      WHERE schemaname = 'public'
        AND tablename IN ('users', 'reconciliations', 'transactions', 'tenants',
                          'bank_files', 'ledger_files', 'bank_transactions',
                          'ledger_transactions', 'matched_pairs', 'staged_matches')
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;

    const tableSizes = await AppDataSource.query(tableSizeQuery) as TableSizeRow[];

    console.log();
    tableSizes.forEach(row => {
      console.log(`  📦 ${row.tablename.padEnd(25)} - ${row.size_pretty}`);
    });

    console.log();
    console.log('-'.repeat(80));
    console.log();

    // Performance recommendations
    console.log('RECOMMENDATIONS:');
    console.log('-'.repeat(80));
    console.log();

    const unusedIndexes = indexUsage.filter(idx => parseInt(idx.idx_scan) === 0);
    if (unusedIndexes.length > 0) {
      console.log('⚠️  Unused indexes detected:');
      unusedIndexes.forEach(idx => {
        console.log(`  - ${idx.relname}.${idx.indexrelname} (0 scans)`);
      });
      console.log('  Consider running more queries or investigating if these indexes are needed.');
      console.log();
    }

    const wellUsedIndexes = indexUsage.filter(idx => parseInt(idx.idx_scan) > 100);
    if (wellUsedIndexes.length > 0) {
      console.log('✓ Well-utilized indexes:');
      wellUsedIndexes.forEach(idx => {
        console.log(`  - ${idx.relname}.${idx.indexrelname} (${idx.idx_scan} scans)`);
      });
      console.log();
    }

    console.log('💡 Tips:');
    console.log('  - Run the test suite to generate index usage statistics');
    console.log('  - TenantId indexes are critical for multi-tenant data isolation');
    console.log('  - Monitor idx_scan counts to verify indexes are being used');
    console.log('  - High idx_tup_read with low idx_tup_fetch may indicate inefficient queries');

    console.log();
    console.log('='.repeat(80));
    console.log('✓ Index verification complete');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error verifying indexes:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run verification
verifyDatabaseIndexes()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
