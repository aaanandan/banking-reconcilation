// test/helpers/reconciliation.helpers.ts
import { AppDataSource } from '../../data-source';
import { Reconciliation } from '../../libs/shared/src/entities/reconciliation.entity';
import { Repository } from 'typeorm';

let reconciliationRepo: Repository<Reconciliation>;

/**
 * Initialize database connection for tests
 */
export async function initializeDatabase() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  reconciliationRepo = AppDataSource.getRepository(Reconciliation);
}

/**
 * Close database connection after tests
 */
export async function closeDatabase() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}

/**
 * Create a single reconciliation for a tenant
 */
export async function createReconciliation(
  tenantId: string,
  userId: string = '550e8400-e29b-41d4-a716-446655440000', // UUID format
): Promise<Reconciliation> {
  // Use raw SQL to insert only the columns that exist in the database
  const reconciliationId = `RECON-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const name = `Test Reconciliation ${Date.now()}`;

  const result = await AppDataSource.query(
    `
    INSERT INTO reconciliations (
      "reconciliationId", "userId", "name", "description",
      "status", "currentStep", "totalSteps", "dateRangeIncludeAll",
      "totalBankTransactions", "totalLedgerTransactions", "matchedCount",
      "unmatchedBankCount", "unmatchedLedgerCount", "stagedMatchesCount",
      "convergenceRate", "tenantId"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
    `,
    [
      reconciliationId,
      userId,
      name,
      'Test reconciliation for tenant isolation testing',
      'created',
      0,
      16,
      true,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      tenantId,
    ],
  );

  return result[0] as Reconciliation;
}

/**
 * Create multiple reconciliations for a tenant
 */
export async function createReconciliations(
  tenantId: string,
  count: number,
  userId: string = '550e8400-e29b-41d4-a716-446655440000', // UUID format
): Promise<Reconciliation[]> {
  const reconciliations: Reconciliation[] = [];

  for (let i = 0; i < count; i++) {
    const reconciliation = await createReconciliation(tenantId, userId);
    reconciliations.push(reconciliation);
  }

  return reconciliations;
}

/**
 * Get a reconciliation by ID, filtered by tenantId
 * Throws error if not found or tenant mismatch
 */
export async function getReconciliation(
  id: string,
  tenantId: string,
): Promise<Reconciliation> {
  const reconciliation = await reconciliationRepo.findOne({
    where: {
      id,
      tenantId,
    },
  });

  if (!reconciliation) {
    throw new Error('Not Found');
  }

  return reconciliation;
}

/**
 * Get all reconciliations for a tenant
 */
export async function getReconciliations(
  tenantId: string,
): Promise<Reconciliation[]> {
  const reconciliations = await reconciliationRepo.find({
    where: {
      tenantId,
    },
  });

  return reconciliations;
}

/**
 * Clean up all reconciliations (for test cleanup)
 */
export async function cleanupReconciliations(): Promise<void> {
  await reconciliationRepo.clear();
}
