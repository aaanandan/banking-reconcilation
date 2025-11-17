import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantIdToAllTables20251117073152 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migration code will be added in Step 19
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback code will be added in Step 19
  }
}
