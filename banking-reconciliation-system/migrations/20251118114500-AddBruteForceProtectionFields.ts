import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBruteForceProtectionFields20251118114500 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add failedLoginAttempts column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'failedLoginAttempts',
        type: 'integer',
        default: 0,
      }),
    );

    // Add lastFailedLoginAt column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'lastFailedLoginAt',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Add accountLockedUntil column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'accountLockedUntil',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns in reverse order
    await queryRunner.dropColumn('users', 'accountLockedUntil');
    await queryRunner.dropColumn('users', 'lastFailedLoginAt');
    await queryRunner.dropColumn('users', 'failedLoginAttempts');
  }
}
