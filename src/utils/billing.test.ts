import { describe, expect, it } from 'vitest';
import { BillingAccount, formatListPrice, listPrice, normalizeTier, summarizeBilling } from './billing';

function account(id: string, tier: BillingAccount['tier'], status: string): BillingAccount {
  return { id, email: `${id}@example.com`, full_name: id, tier, status, created_at: '2026-01-01T00:00:00.000Z' };
}

describe('billing utils', () => {
  it('parses configured list prices', () => {
    expect(listPrice('basic')).toBe(0);
    expect(listPrice('pro')).toBe(9);
    expect(listPrice('enterprise')).toBeNull();
  });

  it('treats unknown tiers as basic', () => {
    expect(normalizeTier('gold')).toBe('basic');
    expect(normalizeTier(null)).toBe('basic');
    expect(normalizeTier('enterprise')).toBe('enterprise');
  });

  it('formats list prices', () => {
    expect(formatListPrice(0)).toBe('Free');
    expect(formatListPrice(9)).toBe('$9/mo');
    expect(formatListPrice(null)).toBe('Custom');
  });

  it('estimates MRR from active accounts with a numeric price only', () => {
    const summary = summarizeBilling([
      account('a', 'pro', 'active'),
      account('b', 'pro', 'active'),
      account('c', 'pro', 'churned'),
      account('d', 'enterprise', 'active'),
      account('e', 'basic', 'active'),
      account('f', 'basic', 'inactive'),
    ]);

    expect(summary.estimatedMrr).toBe(18);
    expect(summary.customPricedAccounts).toBe(1);
    expect(summary.paidAccounts).toBe(3);
    expect(summary.activeAccounts).toBe(4);
    expect(summary.paidShare).toBe(75);
    expect(summary.churnedPaidAccounts).toBe(1);

    const pro = summary.plans.find((plan) => plan.tier === 'pro');
    expect(pro).toMatchObject({ accounts: 3, activeAccounts: 2, share: 50, estimatedMonthly: 18 });
    expect(summary.plans.find((plan) => plan.tier === 'enterprise')?.estimatedMonthly).toBeNull();
  });

  it('returns zeros for no accounts', () => {
    const summary = summarizeBilling([]);
    expect(summary.paidShare).toBe(0);
    expect(summary.plans.every((plan) => plan.share === 0)).toBe(true);
  });
});
