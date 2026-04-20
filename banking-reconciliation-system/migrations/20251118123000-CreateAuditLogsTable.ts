import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateAuditLogsTable20251118123000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create audit_logs table
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
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
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'eventType',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'eventCategory',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'severity',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'httpMethod',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'httpPath',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'httpStatusCode',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'responseTime',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'deviceId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'country',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'isSuspicious',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isSuccessful',
            type: 'boolean',
            default: false,
          },
          {
            name: 'failureReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'resourceType',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'resourceId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'oldValues',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'newValues',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'sessionId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'isArchived',
            type: 'boolean',
            default: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for efficient querying
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_LOGS_TENANT_CREATED',
        columnNames: ['tenantId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_LOGS_USER_CREATED',
        columnNames: ['userId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_LOGS_EVENT_TYPE_CREATED',
        columnNames: ['eventType', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_LOGS_IP_CREATED',
        columnNames: ['ipAddress', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_LOGS_TENANT_ID',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_LOGS_USER_ID',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_LOGS_EVENT_TYPE',
        columnNames: ['eventType'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_LOGS_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );

    // Add foreign key for userId (SET NULL on delete to preserve audit trail)
    await queryRunner.createForeignKey(
      'audit_logs',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    // Add foreign key for tenantId (CASCADE delete for tenant deletion)
    await queryRunner.createForeignKey(
      'audit_logs',
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
    const table = await queryRunner.getTable('audit_logs');
    if (table) {
      const userForeignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('userId') !== -1);
      if (userForeignKey) {
        await queryRunner.dropForeignKey('audit_logs', userForeignKey);
      }

      const tenantForeignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('tenantId') !== -1);
      if (tenantForeignKey) {
        await queryRunner.dropForeignKey('audit_logs', tenantForeignKey);
      }
    }

    // Drop indexes
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_LOGS_CREATED_AT');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_LOGS_EVENT_TYPE');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_LOGS_USER_ID');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_LOGS_TENANT_ID');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_LOGS_IP_CREATED');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_LOGS_EVENT_TYPE_CREATED');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_LOGS_USER_CREATED');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_LOGS_TENANT_CREATED');

    // Drop table
    await queryRunner.dropTable('audit_logs');
  }
}
