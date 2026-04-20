// test/setup/create-test-data.ts
import { AppDataSource } from '../../data-source';
import { Tenant } from '../../libs/shared/src/entities/tenant.entity';
import { User } from '../../libs/shared/src/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function createTestData() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const userRepo = AppDataSource.getRepository(User);

    // Hash password for test users
    const passwordHash = await bcrypt.hash('password123', 10);

    // ═══════════════════════════════════════════════════════════
    // TENANT 1: Company A
    // ═══════════════════════════════════════════════════════════
    console.log('\n📊 Creating Tenant 1: Company A...');
    const tenant1 = await tenantRepo.save({
      tenantId: 'tenant_test_1',
      companyName: 'Company A',
      email: 'admin@companya.com',
      status: 'active',
      plan: 'professional',
      quotas: {
        maxBankAccounts: 10,
        maxTransactionsPerMonth: 10000,
        maxStorageMB: 500,
        maxUsers: 10,
      },
      currentUsage: {
        bankAccounts: 0,
        transactionsThisMonth: 0,
        storageMB: 0,
        users: 0,
      },
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        allowMultipleBanks: true,
        features: ['advanced_matching', 'api_access'],
      },
    });
    console.log(`✅ Tenant 1 created: ${tenant1.tenantId} (${tenant1.companyName})`);

    // User 1 for Tenant 1
    console.log('👤 Creating User 1 for Company A...');
    const user1 = await userRepo.save({
      tenantId: tenant1.tenantId,
      email: 'user@companya.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Doe',
      role: 'admin',
      isActive: true,
    });
    console.log(`✅ User 1 created: ${user1.email}`);

    // ═══════════════════════════════════════════════════════════
    // TENANT 2: Company B
    // ═══════════════════════════════════════════════════════════
    console.log('\n📊 Creating Tenant 2: Company B...');
    const tenant2 = await tenantRepo.save({
      tenantId: 'tenant_test_2',
      companyName: 'Company B',
      email: 'admin@companyb.com',
      status: 'active',
      plan: 'starter',
      quotas: {
        maxBankAccounts: 3,
        maxTransactionsPerMonth: 1000,
        maxStorageMB: 100,
        maxUsers: 5,
      },
      currentUsage: {
        bankAccounts: 0,
        transactionsThisMonth: 0,
        storageMB: 0,
        users: 0,
      },
      settings: {
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        dateFormat: 'YYYY-MM-DD',
        allowMultipleBanks: false,
        features: [],
      },
    });
    console.log(`✅ Tenant 2 created: ${tenant2.tenantId} (${tenant2.companyName})`);

    // User 2 for Tenant 2
    console.log('👤 Creating User 2 for Company B...');
    const user2 = await userRepo.save({
      tenantId: tenant2.tenantId,
      email: 'user@companyb.com',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'user',
      isActive: true,
    });
    console.log(`✅ User 2 created: ${user2.email}`);

    // ═══════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST DATA CREATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`
📊 Tenants Created: 2
   • ${tenant1.tenantId} - ${tenant1.companyName} (${tenant1.plan})
   • ${tenant2.tenantId} - ${tenant2.companyName} (${tenant2.plan})

👤 Users Created: 2
   • ${user1.email} (Tenant: ${tenant1.companyName})
   • ${user2.email} (Tenant: ${tenant2.companyName})

🔑 Default Password: password123
`);

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

// Run the function
createTestData();
