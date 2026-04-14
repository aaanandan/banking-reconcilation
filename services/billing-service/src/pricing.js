// Step 242: Pricing Plans — copied exactly from Document 7
// libs/shared/src/constants/pricing.ts (adapted to JS)

const PRICING_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    interval: 'month',
    features: {
      maxBankAccounts: 1,
      maxTransactionsPerMonth: 100,
      maxStorageMB: 10,
      maxUsers: 1,
      historyDays: 7,
      support: 'community',
      advancedMatching: false,
      apiAccess: false,
    },
  },
  starter: {
    name: 'Starter',
    price: 49,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_STARTER || 'price_starter_monthly',
    features: {
      maxBankAccounts: 3,
      maxTransactionsPerMonth: 1000,
      maxStorageMB: 100,
      maxUsers: 5,
      historyDays: 90,
      support: 'email',
      advancedMatching: false,
      apiAccess: false,
    },
  },
  professional: {
    name: 'Professional',
    price: 199,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional_monthly',
    features: {
      maxBankAccounts: 10,
      maxTransactionsPerMonth: 10000,
      maxStorageMB: 1000,
      maxUsers: 20,
      historyDays: 365,
      support: 'priority',
      advancedMatching: true,
      apiAccess: true,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: null, // Custom pricing
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || null,
    features: {
      maxBankAccounts: -1,   // Unlimited
      maxTransactionsPerMonth: -1,
      maxStorageMB: -1,
      maxUsers: -1,
      historyDays: -1,
      support: 'dedicated',
      advancedMatching: true,
      apiAccess: true,
      sla: true,
      customIntegrations: true,
    },
  },
};

function getPlanByPriceId(priceId) {
  return Object.entries(PRICING_TIERS).find(
    ([, tier]) => tier.stripePriceId === priceId,
  )?.[0] || null;
}

function getPlanFeatures(planName) {
  return PRICING_TIERS[planName]?.features || PRICING_TIERS.free.features;
}

module.exports = { PRICING_TIERS, getPlanByPriceId, getPlanFeatures };
