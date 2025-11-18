// migrations/20251118103000-AddEmailVerificationFields.ts

import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEmailVerificationFields20251118103000 implements MigrationInterface {
  name = 'AddEmailVerificationFields20251118103000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add email verification columns to users table
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'emailVerified',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'emailVerificationToken',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'emailVerificationExpires',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Create index on emailVerificationToken for faster lookups
    await queryRunner.query(
      `CREATE INDEX "IDX_users_emailVerificationToken" ON "users" ("emailVerificationToken")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(
      `DROP INDEX "IDX_users_emailVerificationToken"`,
    );

    // Remove columns
    await queryRunner.dropColumn('users', 'emailVerificationExpires');
    await queryRunner.dropColumn('users', 'emailVerificationToken');
    await queryRunner.dropColumn('users', 'emailVerified');
  }
}
