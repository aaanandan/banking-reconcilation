import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddTenantTable20251117072158 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tenants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenantId',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'companyName',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'domain',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'active'",
          },
          {
            name: 'plan',
            type: 'varchar',
            default: "'free'",
          },
          {
            name: 'trialEndsAt',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'subscriptionEndsAt',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'stripeCustomerId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'stripeSubscriptionId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'quotas',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'currentUsage',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'settings',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create index on tenantId
    await queryRunner.query(
      `CREATE INDEX "IDX_tenants_tenantId" ON "tenants" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tenants');
  }
}
