import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'test_user',
  password: process.env.DB_PASSWORD || 'test_password',
  database: process.env.DB_DATABASE || 'banking_recon_test',
  entities: ['libs/shared/src/entities/**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: false,
});

async function seedData() {
  console.log('🌱 Starting database seeding...\n');

  await AppDataSource.initialize();
  console.log('✅ Database connection established\n');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Hash password for all users
    const passwordHash = await bcrypt.hash('password', 10);

    // Create 3 tenants
    console.log('Creating tenants...');
    const tenants = await queryRunner.query(`
      INSERT INTO tenants (id, "tenantId", "companyName", email, status, plan, "createdAt", "updatedAt")
      VALUES
        ('00000000-0000-0000-0000-000000000001', 'tenant-acme', 'Acme Corporation', 'contact@acme.com', 'active', 'enterprise', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000002', 'tenant-techstart', 'TechStart Inc', 'contact@techstart.com', 'active', 'professional', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000003', 'tenant-smallbiz', 'Small Business LLC', 'contact@smallbiz.com', 'active', 'basic', NOW(), NOW())
      RETURNING id, "companyName"
    `);
    console.log(`✅ Created ${tenants.length} tenants\n`);

    // Create users for each tenant
    console.log('Creating users...');
    const users = await queryRunner.query(`
      INSERT INTO users (
        id, "tenantId", email, "passwordHash", "firstName", "lastName",
        role, "isActive", "emailVerified", "authProvider",
        "createdAt", "updatedAt"
      )
      VALUES
        -- Tenant 1 (Acme Corporation) users
        ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
         'admin@acme.com', $1, 'Admin', 'User', 'admin', true, true, 'local', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001',
         'user@acme.com', $1, 'Regular', 'User', 'user', true, true, 'local', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001',
         'viewer@acme.com', $1, 'View', 'Only', 'viewer', true, true, 'local', NOW(), NOW()),

        -- Tenant 2 (TechStart) users
        ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002',
         'admin@techstart.com', $1, 'Tech', 'Admin', 'admin', true, true, 'local', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000002',
         'user@techstart.com', $1, 'Tech', 'User', 'user', true, true, 'local', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000002',
         'analyst@techstart.com', $1, 'Data', 'Analyst', 'user', true, true, 'local', NOW(), NOW()),

        -- Tenant 3 (Small Business) users
        ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000003',
         'owner@smallbiz.com', $1, 'Business', 'Owner', 'admin', true, true, 'local', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000003',
         'accountant@smallbiz.com', $1, 'Company', 'Accountant', 'user', true, true, 'local', NOW(), NOW()),

        -- Additional test users (unverified, suspended, etc.)
        ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001',
         'unverified@acme.com', $1, 'Not', 'Verified', 'user', true, false, 'local', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001',
         'suspended@acme.com', $1, 'Suspended', 'User', 'user', false, true, 'local', NOW(), NOW())
      RETURNING id, email, "firstName", "lastName"
    `, [passwordHash]);
    console.log(`✅ Created ${users.length} users\n`);

    await queryRunner.commitTransaction();
    console.log('✅ Transaction committed\n');

    // Display created accounts
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📋 TEST ACCOUNTS CREATED:\n');

    console.log('🏢 TENANT 1: Acme Corporation (Enterprise)');
    console.log('   👤 admin@acme.com / password (Admin, Verified)');
    console.log('   👤 user@acme.com / password (User, Verified)');
    console.log('   👤 viewer@acme.com / password (Viewer, Verified)');
    console.log('   👤 unverified@acme.com / password (User, Not Verified)');
    console.log('   👤 suspended@acme.com / password (User, Suspended)\n');

    console.log('🏢 TENANT 2: TechStart Inc (Professional)');
    console.log('   👤 admin@techstart.com / password (Admin, Verified)');
    console.log('   👤 user@techstart.com / password (User, Verified)');
    console.log('   👤 analyst@techstart.com / password (User, Verified)\n');

    console.log('🏢 TENANT 3: Small Business LLC (Basic)');
    console.log('   👤 owner@smallbiz.com / password (Admin, Verified)');
    console.log('   👤 accountant@smallbiz.com / password (User, Verified)\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('ℹ️  All passwords: "password"');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seedData()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
