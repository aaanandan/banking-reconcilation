// migrations/20251118104500-AddTwoFactorAuthFields.ts

import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTwoFactorAuthFields20251118104500 implements MigrationInterface {
  name = 'AddTwoFactorAuthFields20251118104500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 2FA columns to users table
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'twoFactorEnabled',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'twoFactorSecret',
        type: 'varchar',
        length: '500', // Encrypted secret will be longer than raw secret
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns
    await queryRunner.dropColumn('users', 'twoFactorSecret');
    await queryRunner.dropColumn('users', 'twoFactorEnabled');
  }
}
