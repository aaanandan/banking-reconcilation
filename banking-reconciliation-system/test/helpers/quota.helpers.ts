// test/helpers/quota.helpers.ts
import { AppDataSource } from '../../data-source';
import { Tenant } from '../../libs/shared/src/entities/tenant.entity';
import { Transaction } from '../../libs/shared/src/entities/transaction.entity';
import { Repository } from 'typeorm';

let tenantRepository: Repository<Tenant>;
let transactionRepository: Repository<Transaction>;

/**
 * Initialize quota helpers
 */
export async function initializeQuotaService() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  tenantRepository = AppDataSource.getRepository(Tenant);
  transactionRepository = AppDataSource.getRepository(Transaction);
}

/**
 * Update tenant quotas
 */
export async function updateTenantQuota(
  tenantId: string,
  quotas: {
    maxBankAccounts?: number;
    maxTransactionsPerMonth?: number;
    maxStorageMB?: number;
    maxUsers?: number;
  },
): Promise<void> {
  const tenant = await tenantRepository.findOne({
    where: { tenantId },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Merge new quotas with existing ones
  tenant.quotas = {
    ...tenant.quotas,
    ...quotas,
  };

  await tenantRepository.save(tenant);
}

/**
 * Update tenant current usage
 */
export async function updateTenantUsage(
  tenantId: string,
  usage: {
    bankAccounts?: number;
    transactionsThisMonth?: number;
    storageMB?: number;
    users?: number;
  },
): Promise<void> {
  const tenant = await tenantRepository.findOne({
    where: { tenantId },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Merge new usage with existing
  tenant.currentUsage = {
    ...tenant.currentUsage,
    ...usage,
  };

  await tenantRepository.save(tenant);
}

/**
 * Get tenant quotas and usage
 */
export async function getTenantQuotaInfo(tenantId: string): Promise<{
  quotas: any;
  currentUsage: any;
}> {
  const tenant = await tenantRepository.findOne({
    where: { tenantId },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  return {
    quotas: tenant.quotas,
    currentUsage: tenant.currentUsage,
  };
}

/**
 * Check if tenant has exceeded quota
 */
export async function checkQuotaExceeded(
  tenantId: string,
  quotaType: 'maxBankAccounts' | 'maxTransactionsPerMonth' | 'maxStorageMB' | 'maxUsers',
): Promise<boolean> {
  const tenant = await tenantRepository.findOne({
    where: { tenantId },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const quota = tenant.quotas?.[quotaType] || 0;
  let currentUsage = 0;

  switch (quotaType) {
    case 'maxBankAccounts':
      currentUsage = tenant.currentUsage?.bankAccounts || 0;
      break;
    case 'maxTransactionsPerMonth':
      currentUsage = tenant.currentUsage?.transactionsThisMonth || 0;
      break;
    case 'maxStorageMB':
      currentUsage = tenant.currentUsage?.storageMB || 0;
      break;
    case 'maxUsers':
      currentUsage = tenant.currentUsage?.users || 0;
      break;
  }

  return currentUsage >= quota;
}

/**
 * Simulate uploading transactions and check quota
 */
export async function uploadTransactions(
  tenantId: string,
  count: number,
): Promise<void> {
  // Check quota before upload
  const tenant = await tenantRepository.findOne({
    where: { tenantId },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const currentTransactions = tenant.currentUsage?.transactionsThisMonth || 0;
  const maxTransactions = tenant.quotas?.maxTransactionsPerMonth || 0;

  if (currentTransactions + count > maxTransactions) {
    throw new Error('Quota exceeded');
  }

  // Simulate successful upload by updating usage
  await updateTenantUsage(tenantId, {
    transactionsThisMonth: currentTransactions + count,
  });
}

/**
 * Simulate adding a bank account and check quota
 */
export async function addBankAccount(tenantId: string): Promise<void> {
  const tenant = await tenantRepository.findOne({
    where: { tenantId },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const currentAccounts = tenant.currentUsage?.bankAccounts || 0;
  const maxAccounts = tenant.quotas?.maxBankAccounts || 0;

  if (currentAccounts >= maxAccounts) {
    throw new Error('Quota exceeded');
  }

  // Simulate successful addition by updating usage
  await updateTenantUsage(tenantId, {
    bankAccounts: currentAccounts + 1,
  });
}

/**
 * Simulate adding storage and check quota
 */
export async function addStorage(tenantId: string, sizeMB: number): Promise<void> {
  const tenant = await tenantRepository.findOne({
    where: { tenantId },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const currentStorage = tenant.currentUsage?.storageMB || 0;
  const maxStorage = tenant.quotas?.maxStorageMB || 0;

  if (currentStorage + sizeMB > maxStorage) {
    throw new Error('Quota exceeded');
  }

  // Simulate successful storage addition
  await updateTenantUsage(tenantId, {
    storageMB: currentStorage + sizeMB,
  });
}

/**
 * Simulate adding a user and check quota
 */
export async function addUser(tenantId: string): Promise<void> {
  const tenant = await tenantRepository.findOne({
    where: { tenantId },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const currentUsers = tenant.currentUsage?.users || 0;
  const maxUsers = tenant.quotas?.maxUsers || 0;

  if (currentUsers >= maxUsers) {
    throw new Error('Quota exceeded');
  }

  // Simulate successful user addition
  await updateTenantUsage(tenantId, {
    users: currentUsers + 1,
  });
}

/**
 * Reset tenant usage (for testing)
 */
export async function resetTenantUsage(tenantId: string): Promise<void> {
  await updateTenantUsage(tenantId, {
    bankAccounts: 0,
    transactionsThisMonth: 0,
    storageMB: 0,
    users: 0,
  });
}
