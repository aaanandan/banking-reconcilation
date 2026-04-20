import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddTenantIdToAllTables20251117073152 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'users',
      'reconciliations',
      'bank_files',
      'ledger_files',
      'transactions',
      'match_candidates',
      'entity_profiles',
      'learning_questions',
      'convergence_metrics',
      'user_feedback',
    ];

    for (const tableName of tables) {
      // Add tenantId column
      await queryRunner.addColumn(
        tableName,
        new TableColumn({
          name: 'tenantId',
          type: 'varchar',
          isNullable: true, // Initially nullable for migration
        }),
      );

      // Create index on tenantId
      await queryRunner.createIndex(
        tableName,
        new TableIndex({
          name: `IDX_${tableName}_tenantId`,
          columnNames: ['tenantId'],
        }),
      );
    }

    // CRITICAL: Set default tenant for existing data
    // Create a default tenant for migration
    await queryRunner.query(`
      INSERT INTO tenants (id, "tenantId", "companyName", email, status, plan, "createdAt", "updatedAt")
      VALUES (
        uuid_generate_v4(),
        'tenant_default',
        'Default Tenant (Migration)',
        'admin@example.com',
        'active',
        'enterprise',
        NOW(),
        NOW()
      )
    `);

    // Update all existing records with default tenant
    for (const tableName of tables) {
      await queryRunner.query(`
        UPDATE "${tableName}"
        SET "tenantId" = 'tenant_default'
        WHERE "tenantId" IS NULL
      `);

      // Make tenantId NOT NULL after populating
      await queryRunner.query(`
        ALTER TABLE "${tableName}"
        ALTER COLUMN "tenantId" SET NOT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'users',
      'reconciliations',
      'bank_files',
      'ledger_files',
      'transactions',
      'match_candidates',
      'entity_profiles',
      'learning_questions',
      'convergence_metrics',
      'user_feedback',
    ];

    for (const tableName of tables) {
      await queryRunner.dropIndex(tableName, `IDX_${tableName}_tenantId`);
      await queryRunner.dropColumn(tableName, 'tenantId');
    }

    await queryRunner.query(`DELETE FROM tenants WHERE "tenantId" = 'tenant_default'`);
  }
}
