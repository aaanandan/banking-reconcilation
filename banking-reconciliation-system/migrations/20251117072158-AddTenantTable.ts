import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantTable20251117072158 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migration code will be added in Step 17
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback code will be added in Step 17
  }
}
