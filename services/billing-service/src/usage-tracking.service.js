// Step 247: Usage Tracking — copied exactly from Document 7
// Step 248: Quota Enforcement
// apps/billing-service/src/usage-tracking.service.ts (adapted to JS)

const { getPlanFeatures } = require('./pricing');
const logger = require('./logger');

// In-memory store (replace with DB in production)
const usageStore = new Map();

function getTenantUsage(tenantId) {
  if (!usageStore.has(tenantId)) {
    usageStore.set(tenantId, {
      transactionsThisMonth: 0,
      bankAccounts: 0,
      storageMB: 0,
      users: 0,
      lastReset: new Date().toISOString(),
    });
  }
  return usageStore.get(tenantId);
}

// Step 247: Track transaction processed — copied exactly from Document 7
async function trackTransactionProcessed(tenantId, count) {
  const usage = getTenantUsage(tenantId);
  usage.transactionsThisMonth += count;
  usageStore.set(tenantId, usage);

  const plan = tenantPlanStore.get(tenantId) || 'free';
  const quotas = getPlanFeatures(plan);

  // Check quota — from Document 7
  if (quotas.maxTransactionsPerMonth !== -1 &&
      usage.transactionsThisMonth > quotas.maxTransactionsPerMonth) {
    await notifyQuotaExceeded(tenantId, 'transactions');
  }

  logger.info('Transaction usage tracked', { tenantId, count, total: usage.transactionsThisMonth });
}

// Step 248: Check quota — copied exactly from Document 7
async function checkQuota(tenantId, resource) {
  const usage = getTenantUsage(tenantId);
  const plan = tenantPlanStore.get(tenantId) || 'free';
  const quotas = getPlanFeatures(plan);

  switch (resource) {
    case 'transactions':
      if (quotas.maxTransactionsPerMonth === -1) return true;
      return usage.transactionsThisMonth < quotas.maxTransactionsPerMonth;
    case 'bankAccounts':
      if (quotas.maxBankAccounts === -1) return true;
      return usage.bankAccounts < quotas.maxBankAccounts;
    case 'storage':
      if (quotas.maxStorageMB === -1) return true;
      return usage.storageMB < quotas.maxStorageMB;
    case 'users':
      if (quotas.maxUsers === -1) return true;
      return usage.users < quotas.maxUsers;
    default:
      return true;
  }
}

// Quota exceeded notification
async function notifyQuotaExceeded(tenantId, resource) {
  logger.warn('Quota exceeded', { tenantId, resource });
  // In production: send email via Step 259, update Prometheus metric
}

// Step 247: Reset monthly usage — cron job on 1st of month (from Document 7)
async function resetMonthlyUsage() {
  for (const [tenantId, usage] of usageStore.entries()) {
    usageStore.set(tenantId, {
      ...usage,
      transactionsThisMonth: 0,
      lastReset: new Date().toISOString(),
    });
  }
  logger.info('Monthly usage reset complete', { tenantsReset: usageStore.size });
}

// Tenant plan store (replace with DB in production)
const tenantPlanStore = new Map();

function setTenantPlan(tenantId, plan) {
  tenantPlanStore.set(tenantId, plan);
}

function getUsageSummary(tenantId) {
  const usage = getTenantUsage(tenantId);
  const plan = tenantPlanStore.get(tenantId) || 'free';
  const quotas = getPlanFeatures(plan);
  return { plan, usage, quotas };
}

module.exports = {
  trackTransactionProcessed,
  checkQuota,
  resetMonthlyUsage,
  setTenantPlan,
  getUsageSummary,
  getTenantUsage,
};
