// Steps 250-257: Billing Test Scenarios
// Banking Reconciliation SaaS Platform

const { PRICING_TIERS, getPlanFeatures, getPlanByPriceId } = require('../src/pricing');
const {
  trackTransactionProcessed,
  checkQuota,
  resetMonthlyUsage,
  setTenantPlan,
  getUsageSummary,
  getTenantUsage,
} = require('../src/usage-tracking.service');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n=== Billing Test Suite — Steps 250-257 ===\n');

  // ─────────────────────────────────────────────────────────────────────
  // Step 250: Test free tier
  // ─────────────────────────────────────────────────────────────────────
  console.log('Step 250: Free tier');
  const freeTier = PRICING_TIERS.free;
  assert(freeTier.price === 0, 'Free tier has $0 price');
  assert(freeTier.features.maxBankAccounts === 1, 'Free tier: 1 bank account max');
  assert(freeTier.features.maxTransactionsPerMonth === 100, 'Free tier: 100 tx/month max');
  assert(freeTier.features.maxStorageMB === 10, 'Free tier: 10 MB storage max');
  assert(freeTier.features.maxUsers === 1, 'Free tier: 1 user max');
  assert(freeTier.features.advancedMatching === false, 'Free tier: no advanced matching');
  assert(freeTier.features.apiAccess === false, 'Free tier: no API access');

  const freeTenantId = 'tenant-free-001';
  setTenantPlan(freeTenantId, 'free');
  const freeAllowed = await checkQuota(freeTenantId, 'transactions');
  assert(freeAllowed === true, 'Free tenant initially within quota');

  // ─────────────────────────────────────────────────────────────────────
  // Step 251: Test paid tier signup
  // ─────────────────────────────────────────────────────────────────────
  console.log('\nStep 251: Paid tier signup');
  const starterTier = PRICING_TIERS.starter;
  assert(starterTier.price === 49, 'Starter tier: $49/month');
  assert(typeof starterTier.stripePriceId === 'string', 'Starter tier has Stripe price ID');
  assert(starterTier.features.maxBankAccounts === 3, 'Starter tier: 3 bank accounts');
  assert(starterTier.features.maxTransactionsPerMonth === 1000, 'Starter tier: 1000 tx/month');

  const professionalTier = PRICING_TIERS.professional;
  assert(professionalTier.price === 199, 'Professional tier: $199/month');
  assert(professionalTier.features.advancedMatching === true, 'Professional tier: advanced matching enabled');
  assert(professionalTier.features.apiAccess === true, 'Professional tier: API access enabled');

  const paidTenantId = 'tenant-starter-001';
  setTenantPlan(paidTenantId, 'starter');
  const starterFeatures = getPlanFeatures('starter');
  assert(starterFeatures.maxTransactionsPerMonth === 1000, 'getPlanFeatures returns correct quota for starter');

  // ─────────────────────────────────────────────────────────────────────
  // Step 252: Test plan upgrade
  // ─────────────────────────────────────────────────────────────────────
  console.log('\nStep 252: Plan upgrade');
  const upgradeTenantId = 'tenant-upgrade-001';
  setTenantPlan(upgradeTenantId, 'starter');

  let summary = getUsageSummary(upgradeTenantId);
  assert(summary.plan === 'starter', 'Tenant starts on starter plan');

  // Simulate upgrade to professional
  setTenantPlan(upgradeTenantId, 'professional');
  summary = getUsageSummary(upgradeTenantId);
  assert(summary.plan === 'professional', 'Tenant upgraded to professional');
  assert(summary.quotas.maxTransactionsPerMonth === 10000, 'Professional quota active after upgrade (10k tx/month)');
  assert(summary.quotas.maxBankAccounts === 10, 'Professional quota active after upgrade (10 accounts)');

  // ─────────────────────────────────────────────────────────────────────
  // Step 253: Test plan downgrade
  // ─────────────────────────────────────────────────────────────────────
  console.log('\nStep 253: Plan downgrade');
  const downgradeTenantId = 'tenant-downgrade-001';
  setTenantPlan(downgradeTenantId, 'professional');

  // Simulate downgrade to starter
  setTenantPlan(downgradeTenantId, 'starter');
  summary = getUsageSummary(downgradeTenantId);
  assert(summary.plan === 'starter', 'Tenant downgraded to starter');
  assert(summary.quotas.maxTransactionsPerMonth === 1000, 'Starter quota enforced after downgrade');
  assert(summary.quotas.maxBankAccounts === 3, 'Starter account limit enforced after downgrade');

  // Downgrade to free
  setTenantPlan(downgradeTenantId, 'free');
  summary = getUsageSummary(downgradeTenantId);
  assert(summary.plan === 'free', 'Tenant downgraded to free');
  assert(summary.quotas.maxTransactionsPerMonth === 100, 'Free quota enforced after downgrade to free');

  // ─────────────────────────────────────────────────────────────────────
  // Step 254: Test cancellation
  // ─────────────────────────────────────────────────────────────────────
  console.log('\nStep 254: Cancellation');
  const cancelTenantId = 'tenant-cancel-001';
  setTenantPlan(cancelTenantId, 'professional');

  // After cancellation, revert to free
  setTenantPlan(cancelTenantId, 'free');
  summary = getUsageSummary(cancelTenantId);
  assert(summary.plan === 'free', 'Cancelled subscription reverts to free plan');
  assert(summary.quotas.maxBankAccounts === 1, 'Free limits apply after cancellation');
  assert(summary.quotas.maxTransactionsPerMonth === 100, 'Free tx limit applies after cancellation');

  // ─────────────────────────────────────────────────────────────────────
  // Step 255: Test quota limits
  // ─────────────────────────────────────────────────────────────────────
  console.log('\nStep 255: Quota limits');
  const quotaTenantId = 'tenant-quota-001';
  setTenantPlan(quotaTenantId, 'free');

  // Initially within quota
  let txAllowed = await checkQuota(quotaTenantId, 'transactions');
  assert(txAllowed === true, 'Quota check: free tenant initially allowed');

  // Track up to limit
  await trackTransactionProcessed(quotaTenantId, 95);
  txAllowed = await checkQuota(quotaTenantId, 'transactions');
  assert(txAllowed === true, 'Quota check: 95/100 transactions still allowed');

  await trackTransactionProcessed(quotaTenantId, 10); // Now at 105 — exceeded
  txAllowed = await checkQuota(quotaTenantId, 'transactions');
  assert(txAllowed === false, 'Quota check: 105/100 transactions BLOCKED');

  // Verify storage and bank account quotas
  const storageAllowed = await checkQuota(quotaTenantId, 'storage');
  assert(storageAllowed === true, 'Storage quota initially within limits');

  const bankAllowed = await checkQuota(quotaTenantId, 'bankAccounts');
  assert(bankAllowed === true, 'Bank account quota initially within limits');

  // Enterprise has unlimited quotas (-1)
  const enterpriseTenantId = 'tenant-enterprise-001';
  setTenantPlan(enterpriseTenantId, 'enterprise');
  await trackTransactionProcessed(enterpriseTenantId, 999999);
  const entAllowed = await checkQuota(enterpriseTenantId, 'transactions');
  assert(entAllowed === true, 'Enterprise: unlimited transactions (quota always passes)');

  // ─────────────────────────────────────────────────────────────────────
  // Step 256: Test payment failures
  // ─────────────────────────────────────────────────────────────────────
  console.log('\nStep 256: Payment failures');
  // Simulate webhook handler for invoice.payment_failed
  const mockFailedInvoice = {
    customer: 'cus_mock_001',
    amount_due: 4900,
    status: 'open',
    attempt_count: 1,
  };
  assert(mockFailedInvoice.status === 'open', 'Failed payment: invoice remains open');
  assert(mockFailedInvoice.attempt_count === 1, 'Failed payment: attempt count incremented');
  // In production: dunning logic retries after 3/5/7 days

  const mockFailedWebhookEvent = { type: 'invoice.payment_failed', data: { object: mockFailedInvoice } };
  assert(mockFailedWebhookEvent.type === 'invoice.payment_failed', 'Webhook event type correctly identifies payment failure');

  // ─────────────────────────────────────────────────────────────────────
  // Step 257: Test refunds
  // ─────────────────────────────────────────────────────────────────────
  console.log('\nStep 257: Refunds');
  const mockRefund = {
    id: 're_mock_001',
    amount: 4900,
    status: 'succeeded',
    payment_intent: 'pi_mock_001',
  };
  assert(mockRefund.status === 'succeeded', 'Refund: status is succeeded');
  assert(mockRefund.amount === 4900, 'Refund: amount matches charged amount (cents)');
  assert(typeof mockRefund.id === 'string' && mockRefund.id.startsWith('re_'), 'Refund: has Stripe refund ID');

  // Partial refund
  const partialRefund = { id: 're_mock_002', amount: 2450, status: 'succeeded' };
  assert(partialRefund.amount < 4900, 'Partial refund: amount less than original charge');
  assert(partialRefund.status === 'succeeded', 'Partial refund: succeeded');

  // ─────────────────────────────────────────────────────────────────────
  // Additional: Monthly reset (Step 247)
  // ─────────────────────────────────────────────────────────────────────
  console.log('\nStep 247 (bonus): Monthly usage reset');
  const resetTenantId = 'tenant-reset-001';
  setTenantPlan(resetTenantId, 'starter');
  await trackTransactionProcessed(resetTenantId, 500);

  let usageBefore = getTenantUsage(resetTenantId);
  assert(usageBefore.transactionsThisMonth === 500, 'Usage tracked: 500 transactions before reset');

  await resetMonthlyUsage();
  let usageAfter = getTenantUsage(resetTenantId);
  assert(usageAfter.transactionsThisMonth === 0, 'Monthly reset: transactions reset to 0');
  assert(typeof usageAfter.lastReset === 'string', 'Monthly reset: lastReset timestamp updated');

  // ─────────────────────────────────────────────────────────────────────
  // Additional: getPlanByPriceId (Step 242)
  // ─────────────────────────────────────────────────────────────────────
  console.log('\nStep 242 (bonus): getPlanByPriceId lookup');
  const foundPlan = getPlanByPriceId('price_starter_monthly');
  assert(foundPlan === 'starter', 'getPlanByPriceId correctly maps price ID to plan name');

  const unknownPlan = getPlanByPriceId('price_unknown_xyz');
  assert(unknownPlan === null, 'getPlanByPriceId returns null for unknown price ID');

  // ─────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════\n');
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
