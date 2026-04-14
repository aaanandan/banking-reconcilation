import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPasswordResetFields20251118115500 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add resetPasswordToken column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'resetPasswordToken',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // Add resetPasswordExpires column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'resetPasswordExpires',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns in reverse order
    await queryRunner.dropColumn('users', 'resetPasswordExpires');
    await queryRunner.dropColumn('users', 'resetPasswordToken');
  }
}
