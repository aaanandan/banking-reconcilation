import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateApiKeysTable20251118120000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create api_keys table
    await queryRunner.createTable(
      new Table({
        name: 'api_keys',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'tenantId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'keyHash',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'prefix',
            type: 'varchar',
            length: '8',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'scopes',
            type: 'text',
            isNullable: true,
            comment: 'Comma-separated list of scopes',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lastUsedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'usageCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'ipWhitelist',
            type: 'text',
            isNullable: true,
            comment: 'Comma-separated list of allowed IPs/CIDR ranges',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create index on keyHash for fast lookup
    await queryRunner.createIndex(
      'api_keys',
      new TableIndex({
        name: 'IDX_API_KEYS_KEY_HASH',
        columnNames: ['keyHash'],
      }),
    );

    // Create index on userId for listing keys by user
    await queryRunner.createIndex(
      'api_keys',
      new TableIndex({
        name: 'IDX_API_KEYS_USER_ID',
        columnNames: ['userId'],
      }),
    );

    // Create index on tenantId for tenant-level queries
    await queryRunner.createIndex(
      'api_keys',
      new TableIndex({
        name: 'IDX_API_KEYS_TENANT_ID',
        columnNames: ['tenantId'],
      }),
    );

    // Create composite index on userId and tenantId for efficient filtering
    await queryRunner.createIndex(
      'api_keys',
      new TableIndex({
        name: 'IDX_API_KEYS_USER_TENANT',
        columnNames: ['userId', 'tenantId'],
      }),
    );

    // Create index on isActive for filtering active keys
    await queryRunner.createIndex(
      'api_keys',
      new TableIndex({
        name: 'IDX_API_KEYS_IS_ACTIVE',
        columnNames: ['isActive'],
      }),
    );

    // Add foreign key constraint for userId
    await queryRunner.createForeignKey(
      'api_keys',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Add foreign key constraint for tenantId
    await queryRunner.createForeignKey(
      'api_keys',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const table = await queryRunner.getTable('api_keys');
    if (table) {
      const userForeignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('userId') !== -1);
      if (userForeignKey) {
        await queryRunner.dropForeignKey('api_keys', userForeignKey);
      }

      const tenantForeignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('tenantId') !== -1);
      if (tenantForeignKey) {
        await queryRunner.dropForeignKey('api_keys', tenantForeignKey);
      }
    }

    // Drop indexes
    await queryRunner.dropIndex('api_keys', 'IDX_API_KEYS_IS_ACTIVE');
    await queryRunner.dropIndex('api_keys', 'IDX_API_KEYS_USER_TENANT');
    await queryRunner.dropIndex('api_keys', 'IDX_API_KEYS_TENANT_ID');
    await queryRunner.dropIndex('api_keys', 'IDX_API_KEYS_USER_ID');
    await queryRunner.dropIndex('api_keys', 'IDX_API_KEYS_KEY_HASH');

    // Drop table
    await queryRunner.dropTable('api_keys');
  }
}
