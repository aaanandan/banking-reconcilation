// migrations/20251118105500-AddOAuthFields.ts

import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOAuthFields20251118105500 implements MigrationInterface {
  name = 'AddOAuthFields20251118105500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make passwordHash nullable for OAuth users
    await queryRunner.changeColumn(
      'users',
      'passwordHash',
      new TableColumn({
        name: 'passwordHash',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // Add OAuth provider fields
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'googleId',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'microsoftId',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'authProvider',
        type: 'varchar',
        length: '50',
        default: "'local'",
      }),
    );

    // Create indexes for OAuth provider IDs
    await queryRunner.query(
      `CREATE INDEX "IDX_users_googleId" ON "users" ("googleId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_users_microsoftId" ON "users" ("microsoftId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_users_microsoftId"`);
    await queryRunner.query(`DROP INDEX "IDX_users_googleId"`);

    // Remove columns
    await queryRunner.dropColumn('users', 'authProvider');
    await queryRunner.dropColumn('users', 'microsoftId');
    await queryRunner.dropColumn('users', 'googleId');

    // Restore passwordHash to NOT NULL (note: this may fail if OAuth users exist)
    await queryRunner.changeColumn(
      'users',
      'passwordHash',
      new TableColumn({
        name: 'passwordHash',
        type: 'varchar',
        length: '255',
        isNullable: false,
      }),
    );
  }
}
