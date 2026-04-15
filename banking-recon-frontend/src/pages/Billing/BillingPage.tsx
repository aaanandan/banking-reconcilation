// Step 249: Billing UI — React component
// Banking Reconciliation SaaS Platform

import React, { useState } from 'react';

interface PricingTier {
  name: string;
  price: number | null;
  interval: string;
  features: Record<string, string | number | boolean>;
  stripePriceId?: string;
  highlight?: boolean;
}

const PRICING_TIERS: Record<string, PricingTier> = {
  free: {
    name: 'Free',
    price: 0,
    interval: 'month',
    features: {
      'Bank Accounts': 1,
      'Transactions/month': 100,
      'Storage': '10 MB',
      'Users': 1,
      'History': '7 days',
      'Support': 'Community',
      'Advanced Matching': false,
      'API Access': false,
    },
  },
  starter: {
    name: 'Starter',
    price: 49,
    interval: 'month',
    stripePriceId: 'price_starter_monthly',
    features: {
      'Bank Accounts': 3,
      'Transactions/month': '1,000',
      'Storage': '100 MB',
      'Users': 5,
      'History': '90 days',
      'Support': 'Email',
      'Advanced Matching': false,
      'API Access': false,
    },
  },
  professional: {
    name: 'Professional',
    price: 199,
    interval: 'month',
    stripePriceId: 'price_professional_monthly',
    highlight: true,
    features: {
      'Bank Accounts': 10,
      'Transactions/month': '10,000',
      'Storage': '1 GB',
      'Users': 20,
      'History': '365 days',
      'Support': 'Priority',
      'Advanced Matching': true,
      'API Access': true,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: null,
    interval: 'month',
    features: {
      'Bank Accounts': 'Unlimited',
      'Transactions/month': 'Unlimited',
      'Storage': 'Unlimited',
      'Users': 'Unlimited',
      'History': 'Unlimited',
      'Support': 'Dedicated',
      'Advanced Matching': true,
      'API Access': true,
    },
  },
};

interface UsageSummary {
  plan: string;
  usage: {
    transactionsThisMonth: number;
    bankAccounts: number;
    storageMB: number;
  };
  quotas: {
    maxTransactionsPerMonth: number;
    maxBankAccounts: number;
    maxStorageMB: number;
  };
}

const UsageBar: React.FC<{ used: number; max: number; label: string }> = ({ used, max, label }) => {
  if (max === -1) return <div style={{ color: '#52c41a' }}>{label}: Unlimited</div>;
  const pct = Math.min((used / max) * 100, 100);
  const color = pct > 90 ? '#ff4d4f' : pct > 70 ? '#faad14' : '#52c41a';
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ color }}>{used.toLocaleString()} / {max.toLocaleString()}</span>
      </div>
      <div style={{ background: '#f0f0f0', borderRadius: 4, height: 8 }}>
        <div style={{ width: `${pct}%`, background: color, borderRadius: 4, height: 8, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
};

const BillingPage: React.FC = () => {
  const [currentPlan] = useState<string>('starter');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Mock usage for Step 250-255 tests
  const usage: UsageSummary = {
    plan: currentPlan,
    usage: { transactionsThisMonth: 342, bankAccounts: 2, storageMB: 28 },
    quotas: { maxTransactionsPerMonth: 1000, maxBankAccounts: 3, maxStorageMB: 100 },
  };

  const handleSelectPlan = (planKey: string) => {
    if (planKey === currentPlan) return;
    setSelectedPlan(planKey);
  };

  const handleConfirmChange = () => {
    if (!selectedPlan) return;
    const tier = PRICING_TIERS[selectedPlan];
    alert(`Redirecting to Stripe checkout for ${tier.name} plan ($${tier.price}/month)`);
    setSelectedPlan(null);
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Billing & Subscription</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Manage your plan and usage</p>

      {/* Current Usage — Step 247/248 */}
      <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, padding: 24, marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          Current Plan: <span style={{ color: '#1890ff' }}>{PRICING_TIERS[currentPlan].name}</span>
          {' '}— ${PRICING_TIERS[currentPlan].price}/month
        </h2>
        <UsageBar used={usage.usage.transactionsThisMonth} max={usage.quotas.maxTransactionsPerMonth} label="Transactions this month" />
        <UsageBar used={usage.usage.bankAccounts} max={usage.quotas.maxBankAccounts} label="Bank accounts" />
        <UsageBar used={usage.usage.storageMB} max={usage.quotas.maxStorageMB} label="Storage (MB)" />
      </div>

      {/* Pricing Plans — Step 242 */}
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Change Plan</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {Object.entries(PRICING_TIERS).map(([key, tier]) => {
          const isActive = key === currentPlan;
          const isSelected = key === selectedPlan;
          const highlight = tier.highlight;

          return (
            <div
              key={key}
              onClick={() => handleSelectPlan(key)}
              style={{
                border: isSelected ? '2px solid #1890ff' : highlight ? '2px solid #722ed1' : '1px solid #e8e8e8',
                borderRadius: 8,
                padding: 20,
                cursor: isActive ? 'default' : 'pointer',
                background: isActive ? '#f6ffed' : '#fff',
                position: 'relative',
                transition: 'box-shadow 0.2s',
              }}
            >
              {highlight && (
                <div style={{ position: 'absolute', top: -1, right: 16, background: '#722ed1', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: '0 0 4px 4px' }}>
                  POPULAR
                </div>
              )}
              {isActive && (
                <div style={{ position: 'absolute', top: 8, right: 8, background: '#52c41a', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>
                  CURRENT
                </div>
              )}
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{tier.name}</h3>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#1890ff', marginBottom: 16 }}>
                {tier.price === null ? 'Custom' : tier.price === 0 ? 'Free' : `$${tier.price}`}
                {tier.price !== null && tier.price > 0 && <span style={{ fontSize: 14, fontWeight: 400, color: '#666' }}>/mo</span>}
              </div>
              {Object.entries(tier.features).map(([feat, val]) => (
                <div key={feat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#666' }}>{feat}</span>
                  <span style={{ fontWeight: 500 }}>
                    {typeof val === 'boolean' ? (val ? '✓' : '—') : val}
                  </span>
                </div>
              ))}
              {!isActive && tier.price !== null && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleSelectPlan(key); }}
                  style={{
                    marginTop: 16, width: '100%', padding: '8px 0',
                    background: isSelected ? '#1890ff' : '#f0f0f0',
                    color: isSelected ? '#fff' : '#333',
                    border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  {key === 'free' ? 'Downgrade' : parseInt(PRICING_TIERS[currentPlan].price as any) > (tier.price || 0) ? 'Downgrade' : 'Upgrade'}
                </button>
              )}
              {!isActive && tier.price === null && (
                <button style={{ marginTop: 16, width: '100%', padding: '8px 0', background: '#722ed1', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
                  Contact Sales
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm Plan Change */}
      {selectedPlan && (
        <div style={{ background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 8, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Change to <strong>{PRICING_TIERS[selectedPlan].name}</strong> — ${PRICING_TIERS[selectedPlan].price}/month?</span>
          <div>
            <button onClick={() => setSelectedPlan(null)} style={{ marginRight: 8, padding: '6px 16px', border: '1px solid #d9d9d9', borderRadius: 4, cursor: 'pointer', background: '#fff' }}>Cancel</button>
            <button onClick={handleConfirmChange} style={{ padding: '6px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Confirm Change</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
